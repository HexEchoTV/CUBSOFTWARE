from flask import Flask, send_from_directory, render_template, redirect, request, jsonify, session, url_for
from waitress import serve
import socket
import os
import sys
import importlib.util
import json
import hashlib
import time
import secrets
import subprocess
import requests
import urllib.parse
import atexit
import signal
from functools import wraps
from jinja2 import ChoiceLoader, FileSystemLoader

# Add shared folder to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shared'))
from bot_logger import BotLogger

# Initialize bot logger
logger = BotLogger('cubsoftware-website', os.environ.get('BOT_API_KEY'))

# Create the main Flask app with multiple template folders
app = Flask(__name__,
            static_folder='website/static')

# Secret key for sessions - IMPORTANT: Set FLASK_SECRET_KEY in environment for persistence
app.secret_key = os.environ.get('FLASK_SECRET_KEY', secrets.token_hex(32))

# Session configuration
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True  # Use HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Configure Jinja to look in multiple template directories
app.jinja_loader = ChoiceLoader([
    FileSystemLoader('website'),
    FileSystemLoader('website/includes'),
    FileSystemLoader('apps/social-media-saver/templates')
])

# StreamerBot docs path (relative to main.py)
STREAMERBOT_DOCS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'streamerbot-docs')

# ==================== IP BAN SYSTEM ====================

IP_BANS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'ip_bans.json')

def load_ip_bans():
    """Load IP bans from file"""
    if os.path.exists(IP_BANS_FILE):
        try:
            with open(IP_BANS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'global': [], 'features': {}, 'temp': []}

def save_ip_bans(data):
    """Save IP bans to file"""
    os.makedirs(os.path.dirname(IP_BANS_FILE), exist_ok=True)
    with open(IP_BANS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def check_ip_ban(ip, feature=None):
    """
    Check if an IP is banned
    Returns: (is_banned, ban_type, reason, expires_at)
    """
    bans = load_ip_bans()
    current_time = time.time()

    # Check global bans first
    for ban in bans.get('global', []):
        if ban['ip'] == ip:
            return (True, 'global', ban.get('reason', 'No reason'), None)

    # Check temporary bans
    for ban in bans.get('temp', []):
        if ban['ip'] == ip:
            if current_time < ban.get('expires', 0):
                # Check if temp ban is for specific feature or global
                if ban.get('feature'):
                    if feature and ban['feature'] == feature:
                        return (True, 'temp_feature', ban.get('reason', 'Temporary ban'), ban['expires'])
                else:
                    return (True, 'temp_global', ban.get('reason', 'Temporary ban'), ban['expires'])

    # Check feature-specific bans
    if feature and feature in bans.get('features', {}):
        for ban in bans['features'][feature]:
            if ban['ip'] == ip:
                return (True, 'feature', ban.get('reason', 'Feature ban'), None)

    return (False, None, None, None)

def clean_expired_temp_bans():
    """Remove expired temporary bans"""
    bans = load_ip_bans()
    current_time = time.time()
    original_count = len(bans.get('temp', []))
    bans['temp'] = [b for b in bans.get('temp', []) if b.get('expires', 0) > current_time]
    if len(bans['temp']) != original_count:
        save_ip_bans(bans)

# Clean expired bans periodically (call this in background or on each request)
def maybe_clean_bans():
    """Clean bans occasionally (1 in 100 requests)"""
    if secrets.randbelow(100) == 0:
        clean_expired_temp_bans()

# Decorator to check IP bans before route handlers
def check_ban(feature=None):
    """Decorator to check if IP is banned for a feature or globally"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            maybe_clean_bans()
            ip = get_client_ip()
            is_banned, ban_type, reason, expires = check_ip_ban(ip, feature)

            if is_banned:
                if request.is_json or request.path.startswith('/api/'):
                    return jsonify({
                        'error': 'Access denied',
                        'reason': reason,
                        'ban_type': ban_type,
                        'expires': expires
                    }), 403
                else:
                    return render_template('banned.html',
                                         reason=reason,
                                         ban_type=ban_type,
                                         expires=expires), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ==================== RATE LIMITING ====================

# Global rate limiting storage
rate_limits = {}  # ip -> {feature -> [timestamps]}
RATE_LIMIT_CONFIGS = {
    'default': {'requests': 60, 'window': 60},  # 60 requests per minute
    'api': {'requests': 30, 'window': 60},  # 30 API requests per minute
    'download': {'requests': 10, 'window': 60},  # 10 downloads per minute
    'shorten': {'requests': 10, 'window': 60},  # 10 shortens per minute
    'report': {'requests': 3, 'window': 300},  # 3 reports per 5 minutes to prevent spam
}

def check_rate_limit(ip, feature='default'):
    """Check if IP is rate limited. Returns (allowed, retry_after)"""
    config = RATE_LIMIT_CONFIGS.get(feature, RATE_LIMIT_CONFIGS['default'])
    max_requests = config['requests']
    window = config['window']

    now = time.time()
    key = f"{ip}:{feature}"

    if key not in rate_limits:
        rate_limits[key] = []

    # Clean old timestamps
    rate_limits[key] = [t for t in rate_limits[key] if now - t < window]

    if len(rate_limits[key]) >= max_requests:
        oldest = rate_limits[key][0]
        retry_after = window - (now - oldest)
        return (False, retry_after)

    rate_limits[key].append(now)
    return (True, 0)

def rate_limit(feature='default'):
    """Decorator to apply rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = get_client_ip()
            allowed, retry_after = check_rate_limit(ip, feature)

            if not allowed:
                if request.is_json or request.path.startswith('/api/'):
                    response = jsonify({
                        'error': 'Rate limit exceeded',
                        'retry_after': int(retry_after)
                    })
                    response.status_code = 429
                    response.headers['Retry-After'] = str(int(retry_after))
                    return response
                else:
                    return f'Rate limit exceeded. Please try again in {int(retry_after)} seconds.', 429

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ==================== MAIN WEBSITE ROUTES ====================

@app.route('/')
def index():
    """Serve the main landing page, or redirect if on short link domain"""
    host = request.host.lower()
    if 'cubsw.link' in host:
        return redirect('https://cubsoftware.site')
    return render_template('index.html')

@app.route('/terms')
def terms():
    """Serve the terms of use page"""
    return render_template('terms.html')

@app.route('/privacy')
def privacy():
    """Serve the privacy policy page"""
    return render_template('privacy.html')

@app.route('/copyright')
def copyright_claims():
    """Serve the copyright claims page"""
    return render_template('copyright.html')

@app.route('/contact')
def contact():
    """Serve the contact page"""
    return render_template('contact.html')

@app.route('/static/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files for main website"""
    return send_from_directory('website/static/css', filename)

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files for main website"""
    return send_from_directory('website/static/js', filename)

@app.route('/static/images/<path:filename>')
def serve_images(filename):
    """Serve image files for main website"""
    return send_from_directory('website/static/images', filename)

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    return send_from_directory('website/static/images', 'company-logo.png', mimetype='image/png')

# ==================== STREAMERBOT COMMANDS ====================

@app.route('/apps/streamerbot-commands')
@app.route('/apps/streamerbot-commands/')
def streamerbot_index():
    """Serve the StreamerBot commands index page"""
    return send_from_directory(STREAMERBOT_DOCS_PATH, 'index.html')

@app.route('/apps/streamerbot-commands/<path:filename>')
def streamerbot_files(filename):
    """Serve StreamerBot command files"""
    return send_from_directory(STREAMERBOT_DOCS_PATH, filename)

# ==================== CUBVAULT PASSWORD MANAGER ====================

@app.route('/apps/cubvault')
@app.route('/apps/cubvault/')
def cubvault_index():
    """CubVault - Secure Password Manager"""
    return render_template('cubvault.html')

# ==================== COLOR PICKER ====================

@app.route('/apps/color-picker')
@app.route('/apps/color-picker/')
def color_picker():
    """Color Picker - Pick colors, generate palettes, extract from images"""
    return render_template('color-picker.html')

# ==================== QR CODE GENERATOR ====================

@app.route('/apps/qr-generator')
@app.route('/apps/qr-generator/')
def qr_generator():
    """QR Code Generator - Create custom QR codes for links, text, contacts, and WiFi"""
    return render_template('qr-generator.html')

# ==================== TEXT TOOLS ====================

@app.route('/apps/text-tools')
@app.route('/apps/text-tools/')
def text_tools():
    """Text Tools - Word counter, case converter, lorem ipsum generator, and text formatting"""
    return render_template('text-tools.html')

# ==================== IMAGE EDITOR ====================

@app.route('/apps/image-editor')
@app.route('/apps/image-editor/')
def image_editor():
    """Image Editor - Edit, crop, resize, and enhance images"""
    return render_template('image-editor.html')

# ==================== FILE CONVERTER ====================

@app.route('/apps/file-converter')
@app.route('/apps/file-converter/')
def file_converter():
    """File Converter - Convert images between PNG, JPG, WebP, GIF, BMP formats"""
    return render_template('file-converter.html')

# ==================== PDF TOOLS ====================

@app.route('/apps/pdf-tools')
@app.route('/apps/pdf-tools/')
def pdf_tools():
    """PDF Tools - Merge, split, compress PDFs and convert images to PDF"""
    return render_template('pdf-tools.html')

# ==================== UNIT CONVERTER ====================

@app.route('/apps/unit-converter')
@app.route('/apps/unit-converter/')
def unit_converter():
    """Unit Converter - Convert between different units of measurement"""
    return render_template('unit-converter.html')

# ==================== TIMESTAMP CONVERTER ====================

@app.route('/apps/timestamp-converter')
@app.route('/apps/timestamp-converter/')
def timestamp_converter():
    """Timestamp Converter - Convert Unix timestamps to human readable dates"""
    return render_template('timestamp-converter.html')

# ==================== COUNTDOWN MAKER ====================

# Storage for shared countdowns
COUNTDOWNS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'countdowns.json')

def load_countdowns():
    """Load shared countdowns from file"""
    if os.path.exists(COUNTDOWNS_FILE):
        with open(COUNTDOWNS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_countdowns(countdowns):
    """Save shared countdowns to file"""
    os.makedirs(os.path.dirname(COUNTDOWNS_FILE), exist_ok=True)
    with open(COUNTDOWNS_FILE, 'w') as f:
        json.dump(countdowns, f, indent=2)

def generate_countdown_id():
    """Generate a unique countdown ID"""
    import random
    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))

@app.route('/apps/countdown-maker')
@app.route('/apps/countdown-maker/')
def countdown_maker():
    """Countdown Maker - Create and share countdown timers"""
    return render_template('countdown-maker.html')

@app.route('/apps/countdown-maker/view-<countdown_id>')
def view_countdown(countdown_id):
    """View a shared countdown timer"""
    countdowns = load_countdowns()
    if countdown_id not in countdowns:
        return render_template('404.html'), 404

    # Increment view count
    countdowns[countdown_id]['views'] = countdowns[countdown_id].get('views', 0) + 1
    save_countdowns(countdowns)

    return render_template('countdown-view.html', countdown_id=countdown_id)

@app.route('/api/countdown/create', methods=['POST'])
def create_countdown():
    """API endpoint to create a shareable countdown"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Countdown data is required'}), 400

    countdowns = load_countdowns()

    # Generate unique ID
    countdown_id = generate_countdown_id()
    while countdown_id in countdowns:
        countdown_id = generate_countdown_id()

    # Save the countdown
    countdowns[countdown_id] = {
        'data': data,
        'created': time.time(),
        'views': 0
    }
    save_countdowns(countdowns)

    # Return the share URL
    share_url = f"{request.host_url}apps/countdown-maker/view-{countdown_id}"
    return jsonify({
        'shareUrl': share_url,
        'countdownId': countdown_id
    })

@app.route('/api/countdown/<countdown_id>')
def get_countdown(countdown_id):
    """API endpoint to get countdown data"""
    countdowns = load_countdowns()
    if countdown_id not in countdowns:
        return jsonify({'error': 'Countdown not found'}), 404

    return jsonify(countdowns[countdown_id]['data'])

@app.route('/api/countdown/<countdown_id>', methods=['PUT'])
def update_countdown(countdown_id):
    """API endpoint to update an existing countdown"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Countdown data is required'}), 400

    countdowns = load_countdowns()
    if countdown_id not in countdowns:
        return jsonify({'error': 'Countdown not found'}), 404

    # Update the countdown data
    countdowns[countdown_id]['data'] = data
    countdowns[countdown_id]['updated'] = time.time()
    save_countdowns(countdowns)

    return jsonify({
        'success': True,
        'countdownId': countdown_id,
        'message': 'Countdown updated successfully'
    })

# ==================== LINK SHORTENER ====================

# Storage for shortened links
LINKS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'shortened_links.json')
LINKS_AUDIT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'links_audit.json')
BANNED_IPS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'banned_ips.json')

# Discord webhook for link notifications (set in environment)
LINKS_WEBHOOK_URL = os.environ.get('LINKS_DISCORD_WEBHOOK', '')

# Rate limiting for link creation
link_rate_limits = {}  # IP -> [timestamps]
LINK_RATE_LIMIT = 10  # max links per minute
LINK_RATE_WINDOW = 60  # seconds

def get_client_ip():
    """Get the real client IP address"""
    # Check for Cloudflare header first
    if request.headers.get('CF-Connecting-IP'):
        return request.headers.get('CF-Connecting-IP')
    # Check for X-Forwarded-For (behind proxy)
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    # Check for X-Real-IP
    if request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    return request.remote_addr

def load_links():
    """Load shortened links from file"""
    if os.path.exists(LINKS_FILE):
        with open(LINKS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_links(links):
    """Save shortened links to file"""
    os.makedirs(os.path.dirname(LINKS_FILE), exist_ok=True)
    with open(LINKS_FILE, 'w') as f:
        json.dump(links, f, indent=2)

def load_links_audit():
    """Load links audit log (persists even after deletion)"""
    if os.path.exists(LINKS_AUDIT_FILE):
        with open(LINKS_AUDIT_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_links_audit(audit):
    """Save links audit log"""
    os.makedirs(os.path.dirname(LINKS_AUDIT_FILE), exist_ok=True)
    with open(LINKS_AUDIT_FILE, 'w') as f:
        json.dump(audit, f, indent=2)

def add_to_audit(short_code, original_url, ip_address, action='created'):
    """Add an entry to the audit log"""
    audit = load_links_audit()
    if short_code not in audit:
        audit[short_code] = {
            'original_url': original_url,
            'ip_address': ip_address,
            'created_at': time.time(),
            'history': []
        }
    audit[short_code]['history'].append({
        'action': action,
        'timestamp': time.time(),
        'ip': ip_address
    })
    save_links_audit(audit)

def load_banned_ips():
    """Load banned IPs list"""
    if os.path.exists(BANNED_IPS_FILE):
        with open(BANNED_IPS_FILE, 'r') as f:
            return json.load(f)
    return {'ips': [], 'reasons': {}}

def save_banned_ips(data):
    """Save banned IPs list"""
    os.makedirs(os.path.dirname(BANNED_IPS_FILE), exist_ok=True)
    with open(BANNED_IPS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def is_ip_banned(ip):
    """Check if an IP is banned"""
    banned = load_banned_ips()
    return ip in banned.get('ips', [])

def check_link_rate_limit(ip):
    """Check if IP has exceeded rate limit for link creation"""
    now = time.time()
    if ip not in link_rate_limits:
        link_rate_limits[ip] = []

    # Clean old timestamps
    link_rate_limits[ip] = [t for t in link_rate_limits[ip] if now - t < LINK_RATE_WINDOW]

    if len(link_rate_limits[ip]) >= LINK_RATE_LIMIT:
        return False

    link_rate_limits[ip].append(now)
    return True

def send_link_webhook(short_code, original_url, ip_address, action='created'):
    """Send notification to Discord webhook"""
    if not LINKS_WEBHOOK_URL:
        return

    try:
        color = 0x00FF00 if action == 'created' else 0xFF0000  # Green for create, red for delete
        embed = {
            'title': f'Link {action.title()}',
            'color': color,
            'fields': [
                {'name': 'Short Link', 'value': f'https://cubsw.link/{short_code}', 'inline': True},
                {'name': 'Destination', 'value': original_url[:200] + ('...' if len(original_url) > 200 else ''), 'inline': False},
                {'name': 'IP Address', 'value': f'||{ip_address}||', 'inline': True}
            ],
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        requests.post(LINKS_WEBHOOK_URL, json={'embeds': [embed]}, timeout=5)
    except Exception as e:
        print(f'Failed to send link webhook: {e}')

def generate_short_code(url):
    """Generate a short code for a URL"""
    hash_input = f"{url}{time.time()}"
    return hashlib.md5(hash_input.encode()).hexdigest()[:6]

@app.route('/apps/link-shortener')
@app.route('/apps/link-shortener/')
def link_shortener():
    """Link Shortener - Create short URLs"""
    return render_template('link-shortener.html')

@app.route('/api/shorten', methods=['POST'])
def shorten_url():
    """API endpoint to shorten a URL"""
    ip_address = get_client_ip()

    # Check if IP is banned
    if is_ip_banned(ip_address):
        return jsonify({'error': 'Your IP has been banned from creating links'}), 403

    # Check rate limit
    if not check_link_rate_limit(ip_address):
        return jsonify({'error': 'Rate limit exceeded. Please wait before creating more links.'}), 429

    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400

    original_url = data['url']
    custom_code = data.get('customCode', '').strip()

    # Validate URL
    if not original_url.startswith(('http://', 'https://')):
        original_url = 'https://' + original_url

    # Block URLs pointing to cubsw.link to prevent redirect loops
    if 'cubsw.link' in original_url.lower():
        return jsonify({'error': 'Cannot shorten cubsw.link URLs'}), 400

    links = load_links()

    # Check if custom code is provided and available
    if custom_code:
        if len(custom_code) < 3 or len(custom_code) > 20:
            return jsonify({'error': 'Custom code must be 3-20 characters'}), 400
        if not custom_code.isalnum():
            return jsonify({'error': 'Custom code must be alphanumeric'}), 400
        if custom_code in links:
            return jsonify({'error': 'Custom code already taken'}), 400
        short_code = custom_code
    else:
        # Generate unique short code
        short_code = generate_short_code(original_url)
        while short_code in links:
            short_code = generate_short_code(original_url + str(time.time()))

    # Save the link with IP tracking
    links[short_code] = {
        'url': original_url,
        'created': time.time(),
        'clicks': 0,
        'ip': ip_address
    }
    save_links(links)

    # Add to audit log
    add_to_audit(short_code, original_url, ip_address, 'created')

    # Send Discord notification
    send_link_webhook(short_code, original_url, ip_address, 'created')

    # Return the shortened URL using the short domain
    short_url = f"https://cubsw.link/{short_code}"
    return jsonify({
        'shortUrl': short_url,
        'shortCode': short_code,
        'originalUrl': original_url
    })

@app.route('/api/links', methods=['GET'])
def get_user_links():
    """Get links created by the current user (based on localStorage codes sent)"""
    codes = request.args.get('codes', '').split(',')
    codes = [c.strip() for c in codes if c.strip()]

    if not codes:
        return jsonify({'links': []})

    links = load_links()
    user_links = []

    for code in codes:
        if code in links:
            user_links.append({
                'code': code,
                'url': links[code]['url'],
                'created': links[code]['created'],
                'clicks': links[code].get('clicks', 0)
            })

    return jsonify({'links': user_links})

@app.route('/api/links/<code>', methods=['DELETE'])
def delete_link(code):
    """Delete a specific link"""
    ip_address = get_client_ip()
    links = load_links()

    if code not in links:
        return jsonify({'error': 'Link not found'}), 404

    # Only allow deletion by the creator (same IP) or if IP tracking wasn't available
    link_ip = links[code].get('ip')
    if link_ip and link_ip != ip_address:
        return jsonify({'error': 'You can only delete links you created'}), 403

    original_url = links[code]['url']
    del links[code]
    save_links(links)

    # Add to audit log
    add_to_audit(code, original_url, ip_address, 'deleted')

    # Send Discord notification
    send_link_webhook(code, original_url, ip_address, 'deleted')

    return jsonify({'success': True, 'message': 'Link deleted'})

@app.route('/api/link-info/<code>', methods=['GET'])
def get_link_info(code):
    """Get information about a specific link (for admin purposes)"""
    # This endpoint should be protected - check for admin API key
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', '')

    if not expected_key or api_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check active links
    links = load_links()
    if code in links:
        return jsonify({
            'found': True,
            'active': True,
            'code': code,
            'url': links[code]['url'],
            'created': links[code]['created'],
            'clicks': links[code].get('clicks', 0),
            'ip': links[code].get('ip', 'Unknown')
        })

    # Check audit log for deleted links
    audit = load_links_audit()
    if code in audit:
        return jsonify({
            'found': True,
            'active': False,
            'code': code,
            'url': audit[code]['original_url'],
            'created': audit[code]['created_at'],
            'ip': audit[code]['ip_address'],
            'history': audit[code]['history']
        })

    return jsonify({'found': False, 'error': 'Link not found in any records'}), 404

@app.route('/s/<code>')
def redirect_short_url(code):
    """Redirect from short URL to original URL (legacy route)"""
    links = load_links()
    if code not in links:
        return render_template('404.html'), 404

    # Increment click count
    links[code]['clicks'] = links[code].get('clicks', 0) + 1
    save_links(links)

    return redirect(links[code]['url'])

@app.route('/<code>')
def redirect_short_code(code):
    """Redirect short codes on cubsw.link domain"""
    # Only handle short codes on the short domain
    host = request.host.lower()
    if 'cubsw.link' not in host:
        # Not the short domain, return 404 (let other routes handle it)
        return render_template('404.html'), 404

    links = load_links()
    if code not in links:
        return render_template('404.html'), 404

    # Increment click count
    links[code]['clicks'] = links[code].get('clicks', 0) + 1
    save_links(links)

    return redirect(links[code]['url'])

# ==================== VIDEO COMPRESSOR ====================

@app.route('/apps/video-compressor')
@app.route('/apps/video-compressor/')
def video_compressor():
    """Video Compressor - Compress videos in browser"""
    return render_template('video-compressor.html')

# ==================== RESUME BUILDER ====================

# Storage for shared resumes
RESUMES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'shared_resumes.json')

def load_resumes():
    """Load shared resumes from file"""
    if os.path.exists(RESUMES_FILE):
        with open(RESUMES_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_resumes(resumes):
    """Save shared resumes to file"""
    os.makedirs(os.path.dirname(RESUMES_FILE), exist_ok=True)
    with open(RESUMES_FILE, 'w') as f:
        json.dump(resumes, f, indent=2)

def generate_resume_id():
    """Generate a unique resume ID"""
    import random
    return ''.join(random.choices('0123456789', k=8))

@app.route('/apps/resume-builder')
@app.route('/apps/resume-builder/')
def resume_builder():
    """Resume Builder - Create professional resumes and cover letters"""
    return render_template('resume-builder.html')

@app.route('/apps/resume-builder/cv-<resume_id>')
def view_shared_resume(resume_id):
    """View a shared resume"""
    resumes = load_resumes()
    if resume_id not in resumes:
        return render_template('404.html'), 404

    # Increment view count
    resumes[resume_id]['views'] = resumes[resume_id].get('views', 0) + 1
    save_resumes(resumes)

    return render_template('resume-view.html', resume_id=resume_id)

@app.route('/api/resume/share', methods=['POST'])
def share_resume():
    """API endpoint to share a resume and get a unique link"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Resume data is required'}), 400

    resumes = load_resumes()

    # Generate unique ID
    resume_id = generate_resume_id()
    while resume_id in resumes:
        resume_id = generate_resume_id()

    # Save the resume
    resumes[resume_id] = {
        'data': data,
        'created': time.time(),
        'views': 0
    }
    save_resumes(resumes)

    # Return the share URL
    share_url = f"{request.host_url}apps/resume-builder/cv-{resume_id}"
    return jsonify({
        'shareUrl': share_url,
        'resumeId': resume_id
    })

@app.route('/api/resume/<resume_id>')
def get_resume(resume_id):
    """API endpoint to get resume data"""
    resumes = load_resumes()
    if resume_id not in resumes:
        return jsonify({'error': 'Resume not found'}), 404

    return jsonify(resumes[resume_id]['data'])

# ==================== JSON FORMATTER ====================

@app.route('/apps/json-formatter')
@app.route('/apps/json-formatter/')
def json_formatter():
    """JSON Formatter - Beautify, minify, and validate JSON"""
    return render_template('json-formatter.html')

# ==================== WHEEL SPINNER ====================

@app.route('/apps/wheel-spinner')
@app.route('/apps/wheel-spinner/')
def wheel_spinner():
    """Wheel Spinner - Customizable spinning wheel for giveaways, decisions, and games"""
    return render_template('wheel-spinner.html')

# ==================== RANDOM PICKER ====================

@app.route('/apps/random-picker')
@app.route('/apps/random-picker/')
def random_picker():
    """Random Picker - Coin flip, dice roll, random number, pick from list"""
    return render_template('random-picker.html')

# ==================== CALCULATOR SUITE ====================

@app.route('/apps/calculator-suite')
@app.route('/apps/calculator-suite/')
def calculator_suite():
    """Calculator Suite - Basic, Scientific, Mortgage, Tip, BMI, Age, and Percentage calculators"""
    return render_template('calculator-suite.html')

# ==================== PASSWORD GENERATOR ====================

@app.route('/apps/password-generator')
@app.route('/apps/password-generator/')
def password_generator():
    """Password Generator - Generate strong, secure passwords"""
    return render_template('password-generator.html')

# ==================== TIMER TOOLS ====================

@app.route('/apps/timer-tools')
@app.route('/apps/timer-tools/')
def timer_tools():
    """Timer Tools - Stopwatch, countdown timer, and Pomodoro"""
    return render_template('timer-tools.html')

# ==================== WORLD CLOCK ====================

@app.route('/apps/world-clock')
@app.route('/apps/world-clock/')
def world_clock():
    """World Clock - View current time across multiple time zones"""
    return render_template('world-clock.html')

# ==================== CURRENCY CONVERTER ====================

@app.route('/apps/currency-converter')
@app.route('/apps/currency-converter/')
def currency_converter():
    """Currency Converter - Convert between world currencies with live exchange rates"""
    return render_template('currency-converter.html')

# ==================== ENCODING TOOLS ====================

@app.route('/apps/encoding-tools')
@app.route('/apps/encoding-tools/')
def encoding_tools():
    """Encoding Tools - Hash, Base64, URL encode, HTML entities, encryption"""
    return render_template('encoding-tools.html')

# ==================== DIFF CHECKER ====================

@app.route('/apps/diff-checker')
@app.route('/apps/diff-checker/')
def diff_checker():
    """Diff Checker - Compare two texts and see the differences"""
    return render_template('diff-checker.html')

# ==================== REGEX TESTER ====================

@app.route('/apps/regex-tester')
@app.route('/apps/regex-tester/')
def regex_tester():
    """Regex Tester - Test regular expressions in real-time"""
    return render_template('regex-tester.html')

# ==================== CODE MINIFIER ====================

@app.route('/apps/code-minifier')
@app.route('/apps/code-minifier/')
def code_minifier():
    """Code Minifier - Minify HTML, CSS, and JavaScript"""
    return render_template('code-minifier.html')

# ==================== MARKDOWN EDITOR ====================

@app.route('/apps/markdown-editor')
@app.route('/apps/markdown-editor/')
def markdown_editor():
    """Markdown Editor - Write and preview Markdown in real-time"""
    return render_template('markdown-editor.html')

# ==================== NOTE PAD ====================

@app.route('/apps/notepad')
@app.route('/apps/notepad/')
def notepad():
    """Note Pad - Simple, distraction-free note taking"""
    return render_template('notepad.html')

# ==================== INVOICE GENERATOR ====================

@app.route('/apps/invoice-generator')
@app.route('/apps/invoice-generator/')
def invoice_generator():
    """Invoice Generator - Create professional invoices and export to PDF"""
    return render_template('invoice-generator.html')

# ==================== AUDIO TRIMMER ====================

@app.route('/apps/audio-trimmer')
@app.route('/apps/audio-trimmer/')
def audio_trimmer():
    """Audio Trimmer - Trim, cut, and edit audio files"""
    return render_template('audio-trimmer.html')

# ==================== STICKY BOARD ====================

# Storage for shared sticky boards
STICKY_BOARDS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'sticky_boards.json')

def load_sticky_boards():
    """Load shared sticky boards"""
    if os.path.exists(STICKY_BOARDS_FILE):
        try:
            with open(STICKY_BOARDS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_sticky_boards(boards):
    """Save shared sticky boards"""
    os.makedirs(os.path.dirname(STICKY_BOARDS_FILE), exist_ok=True)
    with open(STICKY_BOARDS_FILE, 'w') as f:
        json.dump(boards, f)

def generate_board_id():
    """Generate a unique board ID"""
    import random
    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))

@app.route('/apps/sticky-board')
@app.route('/apps/sticky-board/')
def sticky_board():
    """Sticky Board - Virtual whiteboard with draggable sticky notes"""
    return render_template('sticky-board.html')

@app.route('/apps/sticky-board/b/<board_id>')
def view_sticky_board(board_id):
    """View a shared sticky board"""
    boards = load_sticky_boards()
    if board_id not in boards:
        return render_template('404.html'), 404
    return render_template('sticky-board.html', board_id=board_id, view_only=True)

@app.route('/api/sticky-board/save', methods=['POST'])
def save_sticky_board():
    """Save a sticky board and get a short link"""
    data = request.get_json()
    if not data or 'notes' not in data:
        return jsonify({'error': 'Board data required'}), 400

    boards = load_sticky_boards()

    # Generate unique ID
    board_id = generate_board_id()
    while board_id in boards:
        board_id = generate_board_id()

    # Save the board
    boards[board_id] = {
        'notes': data['notes'],
        'created': time.time(),
        'views': 0
    }
    save_sticky_boards(boards)

    # Return the share URL
    share_url = f"{request.host_url}apps/sticky-board/b/{board_id}"
    return jsonify({
        'shareUrl': share_url,
        'boardId': board_id
    })

@app.route('/api/sticky-board/<board_id>')
def get_sticky_board(board_id):
    """Get sticky board data"""
    boards = load_sticky_boards()
    if board_id not in boards:
        return jsonify({'error': 'Board not found'}), 404

    # Increment view count
    boards[board_id]['views'] = boards[board_id].get('views', 0) + 1
    save_sticky_boards(boards)

    return jsonify(boards[board_id])

# ==================== FEATURE DISABLE SYSTEM ====================

FEATURES_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'features_config.json')

# Map of feature names to route paths
FEATURE_ROUTES = {
    'social-media-saver': '/apps/social-media-saver',
    'file-converter': '/apps/file-converter',
    'image-editor': '/apps/image-editor',
    'pdf-tools': '/apps/pdf-tools',
    'qr-generator': '/apps/qr-generator',
    'text-tools': '/apps/text-tools',
    'color-picker': '/apps/color-picker',
    'cubvault': '/apps/cubvault',
    'unit-converter': '/apps/unit-converter',
    'timestamp-converter': '/apps/timestamp-converter',
    'countdown-maker': '/apps/countdown-maker',
    'link-shortener': '/apps/link-shortener',
    'video-compressor': '/apps/video-compressor',
    'resume-builder': '/apps/resume-builder',
    'json-formatter': '/apps/json-formatter',
    'wheel-spinner': '/apps/wheel-spinner',
    'random-picker': '/apps/random-picker',
    'calculator-suite': '/apps/calculator-suite',
    'password-generator': '/apps/password-generator',
    'timer-tools': '/apps/timer-tools',
    'world-clock': '/apps/world-clock',
    'currency-converter': '/apps/currency-converter',
    'encoding-tools': '/apps/encoding-tools',
    'diff-checker': '/apps/diff-checker',
    'regex-tester': '/apps/regex-tester',
    'code-minifier': '/apps/code-minifier',
    'markdown-editor': '/apps/markdown-editor',
    'notepad': '/apps/notepad',
    'invoice-generator': '/apps/invoice-generator',
    'audio-trimmer': '/apps/audio-trimmer',
    'sticky-board': '/apps/sticky-board',
    'streamerbot-commands': '/apps/streamerbot-commands',
}

def load_features_config():
    """Load features config"""
    if os.path.exists(FEATURES_CONFIG_FILE):
        try:
            with open(FEATURES_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'disabled': []}

def save_features_config(config):
    """Save features config"""
    os.makedirs(os.path.dirname(FEATURES_CONFIG_FILE), exist_ok=True)
    with open(FEATURES_CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def is_feature_disabled(feature_name):
    """Check if a feature is disabled"""
    config = load_features_config()
    return feature_name in config.get('disabled', [])

# API endpoints for feature management (bot uses these)
@app.route('/api/features/list')
def list_features():
    """List all features and their status"""
    config = load_features_config()
    disabled = config.get('disabled', [])

    features = []
    for name in FEATURE_ROUTES.keys():
        features.append({
            'name': name,
            'path': FEATURE_ROUTES[name],
            'enabled': name not in disabled
        })

    return jsonify({'features': features})

@app.route('/api/features/disable', methods=['POST'])
def disable_feature():
    """Disable a feature (requires API key)"""
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', '')

    if not expected_key or api_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    feature = data.get('feature', '').lower().replace(' ', '-')

    if feature not in FEATURE_ROUTES:
        return jsonify({'error': f'Unknown feature: {feature}', 'available': list(FEATURE_ROUTES.keys())}), 400

    config = load_features_config()
    if feature not in config['disabled']:
        config['disabled'].append(feature)
        save_features_config(config)

    return jsonify({'success': True, 'message': f'{feature} has been disabled'})

@app.route('/api/features/enable', methods=['POST'])
def enable_feature():
    """Enable a feature (requires API key)"""
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', '')

    if not expected_key or api_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    feature = data.get('feature', '').lower().replace(' ', '-')

    if feature not in FEATURE_ROUTES:
        return jsonify({'error': f'Unknown feature: {feature}', 'available': list(FEATURE_ROUTES.keys())}), 400

    config = load_features_config()
    if feature in config['disabled']:
        config['disabled'].remove(feature)
        save_features_config(config)

    return jsonify({'success': True, 'message': f'{feature} has been enabled'})

@app.route('/api/features/status')
def get_features_status():
    """Get disabled features list (for index page)"""
    config = load_features_config()
    return jsonify({'disabled': config.get('disabled', [])})

# ==================== CLEANME WEBSITE ====================

# CleanMe Data Storage
CLEANME_SERVERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'cleanme_servers.json')
CLEANME_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'cleanme_config.json')

# Discord OAuth for CleanMe
CLEANME_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID', '')
CLEANME_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET', '')
CLEANME_REDIRECT_URI = os.environ.get('CLEANME_REDIRECT_URI', 'https://cubsoftware.site/cleanme/auth/callback')

def load_cleanme_servers():
    """Load CleanMe server listings"""
    if os.path.exists(CLEANME_SERVERS_FILE):
        try:
            with open(CLEANME_SERVERS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'servers': {}, 'featured': [], 'votes': {}}

def save_cleanme_servers(data):
    """Save CleanMe server listings"""
    os.makedirs(os.path.dirname(CLEANME_SERVERS_FILE), exist_ok=True)
    with open(CLEANME_SERVERS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def load_cleanme_config():
    """Load CleanMe configuration"""
    if os.path.exists(CLEANME_CONFIG_FILE):
        try:
            with open(CLEANME_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'featured_servers': [], 'bot_token': os.environ.get('CLEANME_BOT_TOKEN', '')}

def save_cleanme_config(config):
    """Save CleanMe configuration"""
    os.makedirs(os.path.dirname(CLEANME_CONFIG_FILE), exist_ok=True)
    with open(CLEANME_CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def cleanme_auth_required(f):
    """Decorator to require CleanMe authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'cleanme_user' not in session:
            if request.is_json or request.path.startswith('/cleanme/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('cleanme_auth'))
        return f(*args, **kwargs)
    return decorated_function

# CleanMe Page Routes
@app.route('/cleanme')
@app.route('/cleanme/')
def cleanme_home():
    """CleanMe - Discord Server Template Sharing"""
    data = load_cleanme_servers()
    config = load_cleanme_config()

    # Calculate stats
    total_servers = len(data.get('servers', {}))
    total_copies = sum(s.get('copies', 0) for s in data.get('servers', {}).values())
    total_votes = sum(s.get('votes', 0) for s in data.get('servers', {}).values())

    # Get featured servers
    featured_ids = config.get('featured_servers', [])
    featured_servers = []
    for server_id in featured_ids[:6]:
        if server_id in data.get('servers', {}):
            server = data['servers'][server_id].copy()
            server['server_id'] = server_id
            server['roles_count'] = server.get('role_count', 0)
            server['channels_count'] = server.get('channel_count', 0)
            featured_servers.append(server)

    # Get popular servers (top 6 by votes)
    all_servers = []
    for server_id, server in data.get('servers', {}).items():
        server_copy = server.copy()
        server_copy['server_id'] = server_id
        server_copy['roles_count'] = server.get('role_count', 0)
        server_copy['channels_count'] = server.get('channel_count', 0)
        all_servers.append(server_copy)

    popular_servers = sorted(all_servers, key=lambda x: x.get('votes', 0), reverse=True)[:6]

    # Get latest servers (6 most recent)
    latest_servers = sorted(all_servers, key=lambda x: x.get('created', 0), reverse=True)[:6]

    # Add "added ago" text for latest
    for server in latest_servers:
        created = server.get('created', 0)
        if created:
            diff = time.time() - created
            if diff < 3600:
                server['added_ago'] = f"{int(diff / 60)} minutes ago"
            elif diff < 86400:
                server['added_ago'] = f"{int(diff / 3600)} hours ago"
            else:
                server['added_ago'] = f"{int(diff / 86400)} days ago"
        else:
            server['added_ago'] = "recently"

    # Get user from session
    cleanme_user = session.get('cleanme_user')

    return render_template('cleanme.html',
        cleanme_user=cleanme_user,
        stats={
            'total_servers': total_servers,
            'total_copies': total_copies,
            'total_votes': total_votes
        },
        featured_servers=featured_servers,
        popular_servers=popular_servers,
        latest_servers=latest_servers,
        bot_client_id=os.environ.get('CLEANME_BOT_CLIENT_ID', '')
    )

@app.route('/cleanme/browse')
@app.route('/cleanme/browse/')
def cleanme_browse():
    """CleanMe - Browse server templates"""
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    sort = request.args.get('sort', 'popular')
    return render_template('cleanme-browse.html', search=search, category=category, sort=sort)

@app.route('/cleanme/server/<server_id>')
def cleanme_server(server_id):
    """CleanMe - View server template details"""
    return render_template('cleanme-server.html', server_id=server_id)

@app.route('/cleanme/submit')
@app.route('/cleanme/submit/')
def cleanme_submit():
    """CleanMe - Submit a server template"""
    return render_template('cleanme-submit.html')

@app.route('/cleanme/dashboard')
@app.route('/cleanme/dashboard/')
def cleanme_dashboard():
    """CleanMe - User dashboard"""
    return render_template('cleanme-dashboard.html')

# CleanMe OAuth Routes
@app.route('/cleanme/auth/discord')
def cleanme_auth():
    """Initiate Discord OAuth for CleanMe"""
    config = load_pm2_config()
    params = {
        'client_id': config.get('discord_client_id', CLEANME_CLIENT_ID),
        'redirect_uri': CLEANME_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'identify guilds',
        'state': secrets.token_urlsafe(16)
    }
    session['cleanme_oauth_state'] = params['state']
    discord_url = f"https://discord.com/api/oauth2/authorize?{urllib.parse.urlencode(params)}"
    return redirect(discord_url)

@app.route('/cleanme/auth/callback')
def cleanme_callback():
    """Discord OAuth callback for CleanMe"""
    error = request.args.get('error')
    if error:
        return redirect('/cleanme?error=auth_failed')

    code = request.args.get('code')
    state = request.args.get('state')

    if state != session.get('cleanme_oauth_state'):
        return redirect('/cleanme?error=invalid_state')

    config = load_pm2_config()

    try:
        # Exchange code for access token
        token_response = requests.post('https://discord.com/api/oauth2/token', data={
            'client_id': config.get('discord_client_id', CLEANME_CLIENT_ID),
            'client_secret': config.get('discord_client_secret', CLEANME_CLIENT_SECRET),
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': CLEANME_REDIRECT_URI
        }, headers={
            'Content-Type': 'application/x-www-form-urlencoded'
        })

        if token_response.status_code != 200:
            return redirect('/cleanme?error=auth_failed')

        token_data = token_response.json()
        access_token = token_data['access_token']

        # Get user info
        user_response = requests.get('https://discord.com/api/users/@me', headers={
            'Authorization': f'Bearer {access_token}'
        })

        if user_response.status_code != 200:
            return redirect('/cleanme?error=auth_failed')

        user_data = user_response.json()

        # Get user's guilds (for ownership verification)
        guilds_response = requests.get('https://discord.com/api/users/@me/guilds', headers={
            'Authorization': f'Bearer {access_token}'
        })

        guilds = []
        if guilds_response.status_code == 200:
            guilds = guilds_response.json()

        # Build avatar URL
        avatar_hash = user_data.get('avatar')
        if avatar_hash:
            avatar_url = f"https://cdn.discordapp.com/avatars/{user_data['id']}/{avatar_hash}.png"
        else:
            avatar_url = "https://cdn.discordapp.com/embed/avatars/0.png"

        # Store user in session
        user_info = {
            'id': user_data['id'],
            'username': user_data['username'],
            'discriminator': user_data.get('discriminator', '0'),
            'avatar': avatar_url,
            'guilds': [g['id'] for g in guilds if (g.get('permissions', 0) & 0x8) == 0x8]  # Admin guilds
        }

        session['cleanme_user'] = user_info
        session['cleanme_token'] = access_token

        # Set cookie for frontend
        response = redirect('/cleanme/dashboard')
        response.set_cookie('cleanme_user', urllib.parse.quote(json.dumps({
            'id': user_info['id'],
            'username': user_info['username'],
            'avatar': user_info['avatar']
        })), max_age=7*24*60*60, httponly=False, samesite='Lax')

        return response

    except Exception as e:
        print(f"CleanMe OAuth error: {e}")
        return redirect('/cleanme?error=auth_failed')

@app.route('/cleanme/auth/logout')
def cleanme_logout():
    """Logout from CleanMe"""
    session.pop('cleanme_user', None)
    session.pop('cleanme_token', None)
    response = redirect('/cleanme')
    response.delete_cookie('cleanme_user')
    response.delete_cookie('cleanme_token')
    return response

# CleanMe API Routes
@app.route('/cleanme/api/servers/featured')
def cleanme_get_featured():
    """Get featured server templates"""
    data = load_cleanme_servers()
    config = load_cleanme_config()
    featured_ids = config.get('featured_servers', [])

    featured = []
    for server_id in featured_ids:
        if server_id in data['servers']:
            server = data['servers'][server_id].copy()
            server['id'] = server_id
            featured.append(server)

    return jsonify(featured[:6])

@app.route('/cleanme/api/servers/popular')
def cleanme_get_popular():
    """Get popular server templates (sorted by votes)"""
    data = load_cleanme_servers()

    servers = []
    for server_id, server in data['servers'].items():
        server_copy = server.copy()
        server_copy['id'] = server_id
        servers.append(server_copy)

    # Sort by votes
    servers.sort(key=lambda x: x.get('votes', 0), reverse=True)

    return jsonify(servers[:6])

@app.route('/cleanme/api/servers/latest')
def cleanme_get_latest():
    """Get latest server templates"""
    data = load_cleanme_servers()

    servers = []
    for server_id, server in data['servers'].items():
        server_copy = server.copy()
        server_copy['id'] = server_id
        servers.append(server_copy)

    # Sort by created time
    servers.sort(key=lambda x: x.get('created', 0), reverse=True)

    return jsonify(servers[:6])

@app.route('/cleanme/api/servers')
def cleanme_get_servers():
    """Get paginated server templates with search/filter"""
    data = load_cleanme_servers()

    search = request.args.get('search', '').lower()
    category = request.args.get('category', '')
    sort = request.args.get('sort', 'popular')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 12))

    servers = []
    for server_id, server in data['servers'].items():
        # Filter by search
        if search and search not in server.get('name', '').lower() and search not in server.get('description', '').lower():
            continue
        # Filter by category
        if category and server.get('category', '') != category:
            continue

        server_copy = server.copy()
        server_copy['id'] = server_id
        servers.append(server_copy)

    # Sort
    if sort == 'popular' or sort == 'votes':
        servers.sort(key=lambda x: x.get('votes', 0), reverse=True)
    elif sort == 'latest':
        servers.sort(key=lambda x: x.get('created', 0), reverse=True)
    elif sort == 'copies':
        servers.sort(key=lambda x: x.get('copies', 0), reverse=True)

    # Paginate
    total = len(servers)
    start = (page - 1) * limit
    end = start + limit
    paginated = servers[start:end]

    return jsonify({
        'servers': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit
    })

@app.route('/cleanme/api/servers/<server_id>')
def cleanme_get_server(server_id):
    """Get a specific server template"""
    data = load_cleanme_servers()

    if server_id not in data['servers']:
        return jsonify({'error': 'Server not found'}), 404

    server = data['servers'][server_id].copy()
    server['id'] = server_id

    return jsonify(server)

@app.route('/cleanme/api/servers', methods=['POST'])
@cleanme_auth_required
def cleanme_create_server():
    """Create a new server listing"""
    user = session.get('cleanme_user')
    req_data = request.get_json()

    if not req_data:
        return jsonify({'error': 'Request data required'}), 400

    server_id = req_data.get('server_id', '').strip()
    description = req_data.get('description', '').strip()
    category = req_data.get('category', 'other')
    tags = req_data.get('tags', '')

    if not server_id or len(server_id) < 17:
        return jsonify({'error': 'Valid server ID required'}), 400

    # Check if server already listed
    data = load_cleanme_servers()
    if server_id in data['servers']:
        return jsonify({'error': 'This server is already listed'}), 400

    # TODO: Fetch server info from Discord API via bot
    # For now, create placeholder entry
    server_entry = {
        'name': f'Server {server_id}',
        'description': description,
        'category': category,
        'tags': [t.strip() for t in tags.split(',')[:5] if t.strip()],
        'icon': None,
        'owner': {
            'id': user['id'],
            'username': user['username'],
            'avatar': user['avatar']
        },
        'channel_count': 0,
        'role_count': 0,
        'category_count': 0,
        'channels': [],
        'roles': [],
        'categories': [],
        'votes': 0,
        'copies': 0,
        'created': time.time()
    }

    data['servers'][server_id] = server_entry
    save_cleanme_servers(data)

    return jsonify({
        'success': True,
        'server_id': server_id,
        'message': 'Server submitted successfully'
    })

@app.route('/cleanme/api/servers/<server_id>', methods=['DELETE'])
@cleanme_auth_required
def cleanme_delete_server(server_id):
    """Delete a server listing"""
    user = session.get('cleanme_user')
    data = load_cleanme_servers()

    if server_id not in data['servers']:
        return jsonify({'error': 'Server not found'}), 404

    # Check ownership
    server = data['servers'][server_id]
    if server['owner']['id'] != user['id']:
        return jsonify({'error': 'You can only delete your own servers'}), 403

    del data['servers'][server_id]
    save_cleanme_servers(data)

    return jsonify({'success': True, 'message': 'Server deleted'})

@app.route('/cleanme/api/servers/<server_id>/vote', methods=['POST'])
@cleanme_auth_required
def cleanme_vote_server(server_id):
    """Vote for a server template"""
    user = session.get('cleanme_user')
    data = load_cleanme_servers()

    if server_id not in data['servers']:
        return jsonify({'error': 'Server not found'}), 404

    # Check if user already voted
    vote_key = f"{user['id']}:{server_id}"
    if vote_key in data.get('votes', {}):
        return jsonify({'error': 'You already voted for this server'}), 400

    # Record vote
    if 'votes' not in data:
        data['votes'] = {}
    data['votes'][vote_key] = time.time()

    # Increment vote count
    data['servers'][server_id]['votes'] = data['servers'][server_id].get('votes', 0) + 1

    save_cleanme_servers(data)

    return jsonify({
        'success': True,
        'votes': data['servers'][server_id]['votes']
    })

@app.route('/cleanme/api/my-servers')
@cleanme_auth_required
def cleanme_my_servers():
    """Get current user's server listings"""
    user = session.get('cleanme_user')
    data = load_cleanme_servers()

    servers = []
    for server_id, server in data['servers'].items():
        if server['owner']['id'] == user['id']:
            server_copy = server.copy()
            server_copy['id'] = server_id
            servers.append(server_copy)

    return jsonify(servers)

@app.route('/cleanme/api/preview/<server_id>')
def cleanme_preview_server(server_id):
    """Preview server info (fetched from Discord via bot)"""
    # This would normally call the Discord API via the bot
    # For now, return placeholder
    return jsonify({
        'error': 'Bot integration required. Make sure CleanMe bot is in the server.'
    })

# Admin API for managing featured servers
@app.route('/cleanme/api/admin/featured', methods=['POST'])
def cleanme_set_featured():
    """Set featured servers (admin only)"""
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', '')

    if not expected_key or api_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    server_ids = data.get('server_ids', [])

    config = load_cleanme_config()
    config['featured_servers'] = server_ids
    save_cleanme_config(config)

    return jsonify({'success': True, 'featured': server_ids})

# Bot API for updating server info
@app.route('/cleanme/api/bot/update-server', methods=['POST'])
def cleanme_bot_update_server():
    """Update server info from bot"""
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', '')

    if not expected_key or api_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    req_data = request.get_json()
    server_id = req_data.get('server_id')

    if not server_id:
        return jsonify({'error': 'Server ID required'}), 400

    data = load_cleanme_servers()

    if server_id not in data['servers']:
        return jsonify({'error': 'Server not found'}), 404

    # Update server info
    update_fields = ['name', 'icon', 'channel_count', 'role_count', 'category_count',
                     'channels', 'roles', 'categories']

    for field in update_fields:
        if field in req_data:
            data['servers'][server_id][field] = req_data[field]

    save_cleanme_servers(data)

    return jsonify({'success': True, 'message': 'Server info updated'})

# Bot API for recording copies
@app.route('/cleanme/api/bot/record-copy', methods=['POST'])
def cleanme_bot_record_copy():
    """Record a server copy from bot"""
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('ADMIN_API_KEY', '')

    if not expected_key or api_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    req_data = request.get_json()
    server_id = req_data.get('server_id')

    if not server_id:
        return jsonify({'error': 'Server ID required'}), 400

    data = load_cleanme_servers()

    if server_id not in data['servers']:
        return jsonify({'error': 'Server not found'}), 404

    data['servers'][server_id]['copies'] = data['servers'][server_id].get('copies', 0) + 1
    save_cleanme_servers(data)

    return jsonify({'success': True, 'copies': data['servers'][server_id]['copies']})

# ==================== REPORT SYSTEM ====================

REPORTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'reports.json')
BOT_REPORT_URL = 'http://127.0.0.1:3847/report'
BOT_API_KEY = os.environ.get('BOT_API_KEY', '')

def load_reports():
    """Load reports from file"""
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_reports(reports):
    """Save reports to file"""
    os.makedirs(os.path.dirname(REPORTS_FILE), exist_ok=True)
    with open(REPORTS_FILE, 'w') as f:
        json.dump(reports, f, indent=2)

@app.route('/report')
@app.route('/report/')
def report_page():
    """Report Page - Report inappropriate content"""
    return render_template('report.html')

@app.route('/api/report', methods=['POST'])
@rate_limit('report')
def submit_report():
    """API endpoint to submit a report"""
    ip_address = get_client_ip()
    user_agent = request.headers.get('User-Agent', 'Unknown')
    accept_language = request.headers.get('Accept-Language', 'Unknown')
    referer = request.headers.get('Referer', 'Direct')

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Report data required'}), 400

    report_type = data.get('type', 'general')
    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    url = data.get('url', '').strip()
    contact = data.get('contact', '').strip()
    # Client-side fingerprint (if provided by frontend)
    fingerprint = data.get('fingerprint', 'N/A')

    if not description:
        return jsonify({'error': 'Description is required'}), 400

    # Create report with tracking info
    report = {
        'id': hashlib.md5(f"{time.time()}{ip_address}".encode()).hexdigest()[:12],
        'type': report_type,
        'subject': subject,
        'description': description,
        'url': url,
        'contact': contact,
        'ip': ip_address,
        'user_agent': user_agent,
        'accept_language': accept_language,
        'referer': referer,
        'fingerprint': fingerprint,
        'timestamp': time.time(),
        'status': 'pending'
    }

    # Save report
    reports = load_reports()
    reports.append(report)
    save_reports(reports)

    # Send to Discord via CubSoftware Bot
    if BOT_API_KEY:
        try:
            requests.post(BOT_REPORT_URL, json={
                'apiKey': BOT_API_KEY,
                'report': report
            }, timeout=5)
        except Exception as e:
            print(f'Failed to send report to bot: {e}')

    return jsonify({'success': True, 'reportId': report['id']})

# ==================== KERAPLAST CALCULATOR ====================

@app.route('/keraplast')
@app.route('/keraplast/')
def keraplast():
    """Keraplast Digestion Calculator - Calculate digestion timing steps"""
    return render_template('keraplast.html')

# ==================== SOCIAL MEDIA SAVER APP INTEGRATION ====================

# Load Social Media Saver blueprint using importlib
social_blueprint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apps', 'social-media-saver', 'app_blueprint.py')
spec_social = importlib.util.spec_from_file_location("social_blueprint", social_blueprint_path)
social_module = importlib.util.module_from_spec(spec_social)
spec_social.loader.exec_module(social_module)
app.register_blueprint(social_module.social_media_bp, url_prefix='/apps/social-media-saver')

# ==================== PM2 DASHBOARD ====================

# PM2 Dashboard Configuration
PM2_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pm2_config.json')
PM2_WHITELIST_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pm2_whitelist.json')

# Discord OAuth Configuration (loaded from config file or environment)
def load_pm2_config():
    """Load PM2 dashboard configuration"""
    if os.path.exists(PM2_CONFIG_FILE):
        with open(PM2_CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {
        'discord_client_id': os.environ.get('DISCORD_CLIENT_ID', ''),
        'discord_client_secret': os.environ.get('DISCORD_CLIENT_SECRET', ''),
        'discord_redirect_uri': os.environ.get('DISCORD_REDIRECT_URI', 'https://cubsoftware.site/apps/pm2-dashboard/callback')
    }

def save_pm2_config(config):
    """Save PM2 dashboard configuration"""
    os.makedirs(os.path.dirname(PM2_CONFIG_FILE), exist_ok=True)
    with open(PM2_CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def load_pm2_whitelist():
    """Load PM2 dashboard whitelist"""
    if os.path.exists(PM2_WHITELIST_FILE):
        with open(PM2_WHITELIST_FILE, 'r') as f:
            return json.load(f)
    return {'allowed_users': ['378501056008683530']}

def save_pm2_whitelist(whitelist):
    """Save PM2 dashboard whitelist"""
    os.makedirs(os.path.dirname(PM2_WHITELIST_FILE), exist_ok=True)
    with open(PM2_WHITELIST_FILE, 'w') as f:
        json.dump(whitelist, f, indent=2)

def is_user_whitelisted(user_id):
    """Check if a user is whitelisted for PM2 dashboard access"""
    whitelist = load_pm2_whitelist()
    return str(user_id) in whitelist.get('allowed_users', [])

def pm2_auth_required(f):
    """Decorator to require PM2 dashboard authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'pm2_user' not in session:
            return redirect(url_for('pm2_login'))
        if not is_user_whitelisted(session['pm2_user']['id']):
            session.pop('pm2_user', None)
            return redirect(url_for('pm2_login', error='not_whitelisted'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin')
@app.route('/admin/')
def admin_redirect():
    """Redirect /admin to PM2 Dashboard"""
    return redirect(url_for('pm2_dashboard'))

@app.route('/apps/pm2-dashboard')
@app.route('/apps/pm2-dashboard/')
@pm2_auth_required
def pm2_dashboard():
    """PM2 Dashboard - Process Monitor & Management"""
    return render_template('pm2-dashboard.html', user=session['pm2_user'])

# OAuth state storage (file-based fallback for session issues)
OAUTH_STATES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'oauth_states.json')

def load_oauth_states():
    """Load valid OAuth states from file"""
    if os.path.exists(OAUTH_STATES_FILE):
        try:
            with open(OAUTH_STATES_FILE, 'r') as f:
                states = json.load(f)
                # Clean up expired states (older than 10 minutes)
                now = time.time()
                states = {k: v for k, v in states.items() if now - v < 600}
                return states
        except:
            pass
    return {}

def save_oauth_state(state):
    """Save OAuth state to file"""
    states = load_oauth_states()
    states[state] = time.time()
    os.makedirs(os.path.dirname(OAUTH_STATES_FILE), exist_ok=True)
    with open(OAUTH_STATES_FILE, 'w') as f:
        json.dump(states, f)

def verify_oauth_state(state):
    """Verify and remove OAuth state"""
    states = load_oauth_states()
    if state in states:
        del states[state]
        with open(OAUTH_STATES_FILE, 'w') as f:
            json.dump(states, f)
        return True
    return False

@app.route('/apps/pm2-dashboard/login')
def pm2_login():
    """PM2 Dashboard Login Page"""
    config = load_pm2_config()
    error = request.args.get('error')
    error_messages = {
        'not_whitelisted': 'Your Discord account is not whitelisted for dashboard access.',
        'auth_failed': 'Discord authentication failed. Please try again.',
        'invalid_state': 'Invalid authentication state. Please try again.'
    }

    # Build Discord OAuth URL
    state = secrets.token_urlsafe(16)
    params = {
        'client_id': config['discord_client_id'],
        'redirect_uri': config['discord_redirect_uri'],
        'response_type': 'code',
        'scope': 'identify',
        'state': state
    }

    # Store state in both session and file (fallback)
    session['oauth_state'] = state
    save_oauth_state(state)

    discord_url = f"https://discord.com/api/oauth2/authorize?{urllib.parse.urlencode(params)}"

    return render_template('pm2-login.html',
                          discord_url=discord_url,
                          error=error_messages.get(error))

@app.route('/apps/pm2-dashboard/callback')
def pm2_callback():
    """Discord OAuth callback for PM2 Dashboard"""
    error = request.args.get('error')
    if error:
        return redirect(url_for('pm2_login', error='auth_failed'))

    code = request.args.get('code')
    state = request.args.get('state')

    # Verify state (check session first, then file-based fallback)
    session_state = session.get('oauth_state')
    if state != session_state and not verify_oauth_state(state):
        return redirect(url_for('pm2_login', error='invalid_state'))

    # Clear session state
    session.pop('oauth_state', None)

    config = load_pm2_config()

    # Exchange code for access token
    try:
        token_response = requests.post('https://discord.com/api/oauth2/token', data={
            'client_id': config['discord_client_id'],
            'client_secret': config['discord_client_secret'],
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': config['discord_redirect_uri']
        }, headers={
            'Content-Type': 'application/x-www-form-urlencoded'
        })

        if token_response.status_code != 200:
            return redirect(url_for('pm2_login', error='auth_failed'))

        token_data = token_response.json()
        access_token = token_data['access_token']

        # Get user info
        user_response = requests.get('https://discord.com/api/users/@me', headers={
            'Authorization': f'Bearer {access_token}'
        })

        if user_response.status_code != 200:
            return redirect(url_for('pm2_login', error='auth_failed'))

        user_data = user_response.json()

        # Check whitelist
        if not is_user_whitelisted(user_data['id']):
            return redirect(url_for('pm2_login', error='not_whitelisted'))

        # Store user in session
        avatar_hash = user_data.get('avatar')
        if avatar_hash:
            avatar_url = f"https://cdn.discordapp.com/avatars/{user_data['id']}/{avatar_hash}.png"
        else:
            avatar_url = "https://cdn.discordapp.com/embed/avatars/0.png"

        session['pm2_user'] = {
            'id': user_data['id'],
            'username': user_data['username'],
            'discriminator': user_data.get('discriminator', '0'),
            'avatar_url': avatar_url
        }

        return redirect(url_for('pm2_dashboard'))

    except Exception as e:
        print(f"PM2 OAuth error: {e}")
        return redirect(url_for('pm2_login', error='auth_failed'))

@app.route('/apps/pm2-dashboard/logout')
def pm2_logout():
    """Logout from PM2 Dashboard"""
    session.pop('pm2_user', None)
    return redirect(url_for('pm2_login'))

# PM2 API Endpoints
@app.route('/api/pm2/processes')
@pm2_auth_required
def pm2_get_processes():
    """Get all PM2 processes with system stats"""
    try:
        # Get PM2 process list in JSON format
        result = subprocess.run(
            ['pm2', 'jlist'],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            return jsonify({'error': 'Failed to get PM2 processes'}), 500

        processes_data = json.loads(result.stdout)

        processes = []
        total_cpu = 0
        total_memory = 0

        for proc in processes_data:
            cpu = proc.get('monit', {}).get('cpu', 0)
            memory = proc.get('monit', {}).get('memory', 0)
            total_cpu += cpu
            total_memory += memory

            pm2_env = proc.get('pm2_env', {})

            processes.append({
                'name': proc.get('name'),
                'pm_id': proc.get('pm_id'),
                'pid': proc.get('pid'),
                'status': pm2_env.get('status', 'unknown'),
                'cpu': cpu,
                'memory': memory,
                'uptime': time.time() * 1000 - pm2_env.get('pm_uptime', time.time() * 1000) if pm2_env.get('status') == 'online' else 0,
                'restarts': pm2_env.get('restart_time', 0),
                'exec_mode': pm2_env.get('exec_mode', 'fork'),
                'instances': pm2_env.get('instances', 1)
            })

        # Get system stats
        try:
            # Try to get system CPU and memory usage
            import psutil
            system_cpu = psutil.cpu_percent(interval=0.1)
            system_memory = psutil.virtual_memory().percent
        except ImportError:
            # Fallback if psutil not installed
            system_cpu = total_cpu
            system_memory = 0

        return jsonify({
            'processes': processes,
            'system': {
                'cpu': system_cpu,
                'memory': system_memory
            }
        })

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'PM2 command timed out'}), 500
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid PM2 response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pm2/logs/<process_name>')
@pm2_auth_required
def pm2_get_logs(process_name):
    """Get logs for a specific PM2 process"""
    try:
        log_type = request.args.get('type', 'out')
        lines = int(request.args.get('lines', 100))

        # Determine log file type
        log_suffix = 'out' if log_type == 'out' else 'error'

        # Get PM2 logs using tail
        result = subprocess.run(
            ['pm2', 'logs', process_name, '--nostream', '--lines', str(lines)],
            capture_output=True,
            text=True,
            timeout=10
        )

        # Parse log output
        logs = []
        for line in result.stdout.split('\n'):
            if line.strip():
                # Try to extract timestamp and content
                parts = line.split('|', 1)
                if len(parts) == 2:
                    logs.append({
                        'timestamp': parts[0].strip(),
                        'content': parts[1].strip()
                    })
                else:
                    logs.append({
                        'timestamp': '',
                        'content': line.strip()
                    })

        return jsonify({'logs': logs[-lines:]})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pm2/start/<process_name>', methods=['POST'])
@pm2_auth_required
def pm2_start_process(process_name):
    """Start a PM2 process"""
    try:
        result = subprocess.run(
            ['pm2', 'start', process_name],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr or 'Failed to start process'}), 500

        return jsonify({'success': True, 'message': f'Process {process_name} started'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pm2/stop/<process_name>', methods=['POST'])
@pm2_auth_required
def pm2_stop_process(process_name):
    """Stop a PM2 process"""
    try:
        result = subprocess.run(
            ['pm2', 'stop', process_name],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr or 'Failed to stop process'}), 500

        return jsonify({'success': True, 'message': f'Process {process_name} stopped'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pm2/restart/<process_name>', methods=['POST'])
@pm2_auth_required
def pm2_restart_process(process_name):
    """Restart a PM2 process"""
    try:
        result = subprocess.run(
            ['pm2', 'restart', process_name],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr or 'Failed to restart process'}), 500

        return jsonify({'success': True, 'message': f'Process {process_name} restarted'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pm2/reset/<process_name>', methods=['POST'])
@pm2_auth_required
def pm2_reset_process(process_name):
    """Reset PM2 process counters (restart count, etc.)"""
    try:
        result = subprocess.run(
            ['pm2', 'reset', process_name],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr or 'Failed to reset process'}), 500

        return jsonify({'success': True, 'message': f'Process {process_name} counters reset'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Whitelist Management API (for Discord bot integration)
@app.route('/api/pm2/whitelist', methods=['GET'])
@pm2_auth_required
def pm2_get_whitelist():
    """Get the current whitelist"""
    whitelist = load_pm2_whitelist()
    return jsonify(whitelist)

@app.route('/api/pm2/whitelist/add', methods=['POST'])
@pm2_auth_required
def pm2_add_to_whitelist():
    """Add a user to the whitelist"""
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID is required'}), 400

    whitelist = load_pm2_whitelist()
    user_id = str(data['user_id'])

    if user_id not in whitelist['allowed_users']:
        whitelist['allowed_users'].append(user_id)
        save_pm2_whitelist(whitelist)

    return jsonify({'success': True, 'message': f'User {user_id} added to whitelist'})

@app.route('/api/pm2/whitelist/remove', methods=['POST'])
@pm2_auth_required
def pm2_remove_from_whitelist():
    """Remove a user from the whitelist"""
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID is required'}), 400

    whitelist = load_pm2_whitelist()
    user_id = str(data['user_id'])

    # Don't allow removing yourself
    if user_id == session['pm2_user']['id']:
        return jsonify({'error': 'Cannot remove yourself from whitelist'}), 400

    if user_id in whitelist['allowed_users']:
        whitelist['allowed_users'].remove(user_id)
        save_pm2_whitelist(whitelist)

    return jsonify({'success': True, 'message': f'User {user_id} removed from whitelist'})

# Bot API endpoint for whitelist management (uses API key)
@app.route('/api/pm2/bot/whitelist/add', methods=['POST'])
def pm2_bot_add_whitelist():
    """Add user to whitelist via bot (requires API key)"""
    api_key = request.headers.get('X-API-Key')
    config = load_pm2_config()

    if not api_key or api_key != config.get('bot_api_key'):
        return jsonify({'error': 'Invalid API key'}), 401

    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID is required'}), 400

    whitelist = load_pm2_whitelist()
    user_id = str(data['user_id'])
    username = data.get('username', 'Unknown')

    if user_id not in whitelist['allowed_users']:
        whitelist['allowed_users'].append(user_id)
        save_pm2_whitelist(whitelist)
        return jsonify({'success': True, 'message': f'User {username} ({user_id}) added to whitelist'})

    return jsonify({'success': True, 'message': f'User {username} ({user_id}) already whitelisted'})

@app.route('/api/pm2/bot/whitelist/remove', methods=['POST'])
def pm2_bot_remove_whitelist():
    """Remove user from whitelist via bot (requires API key)"""
    api_key = request.headers.get('X-API-Key')
    config = load_pm2_config()

    if not api_key or api_key != config.get('bot_api_key'):
        return jsonify({'error': 'Invalid API key'}), 401

    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID is required'}), 400

    whitelist = load_pm2_whitelist()
    user_id = str(data['user_id'])

    if user_id in whitelist['allowed_users']:
        whitelist['allowed_users'].remove(user_id)
        save_pm2_whitelist(whitelist)
        return jsonify({'success': True, 'message': f'User {user_id} removed from whitelist'})

    return jsonify({'success': False, 'message': f'User {user_id} not in whitelist'})

@app.route('/api/pm2/bot/whitelist', methods=['GET'])
def pm2_bot_get_whitelist():
    """Get whitelist via bot (requires API key)"""
    api_key = request.headers.get('X-API-Key')
    config = load_pm2_config()

    if not api_key or api_key != config.get('bot_api_key'):
        return jsonify({'error': 'Invalid API key'}), 401

    whitelist = load_pm2_whitelist()
    return jsonify(whitelist)

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors - serve custom 404 page"""
    return render_template('404.html'), 404

@app.route('/apps/<path:subpath>')
def apps_catch_all(subpath):
    """Catch-all for undefined /apps/* routes - return 404"""
    return render_template('404.html'), 404

# ==================== SERVER STARTUP ====================

if __name__ == '__main__':
    # Get local IP
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = "192.168.1.27"

    print("=" * 70)
    print("                       CUB SOFTWARE")
    print("=" * 70)
    print()
    print("Main Landing Page:")
    print(f"  • Local:       http://localhost:3000")
    print(f"  • Network:     http://{local_ip}:3000")
    print()
    print("Social Media Saver App:")
    print(f"  • Local:       http://localhost:3000/apps/social-media-saver")
    print(f"  • Network:     http://{local_ip}:3000/apps/social-media-saver")
    print()
    print("=" * 70)
    print("Production server running on all network interfaces (0.0.0.0:3000)")
    print("Press Ctrl+C to stop")
    print("=" * 70)
    print()

    # Log startup
    logger.startup()

    # Register shutdown handler
    def shutdown_handler(signum=None, frame=None):
        logger.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    atexit.register(lambda: logger.shutdown())

    # Run production server with Waitress
    serve(app, host='0.0.0.0', port=3000, threads=4)
