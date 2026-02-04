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

# Secret key for sessions
app.secret_key = os.environ.get('FLASK_SECRET_KEY', secrets.token_hex(32))

# Configure Jinja to look in multiple template directories
app.jinja_loader = ChoiceLoader([
    FileSystemLoader('website'),
    FileSystemLoader('website/includes'),
    FileSystemLoader('apps/social-media-saver/templates')
])

# StreamerBot docs path (relative to main.py)
STREAMERBOT_DOCS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'streamerbot-docs')

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

# Storage for shortened links (in production, use a database)
LINKS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'shortened_links.json')

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

    # Save the link
    links[short_code] = {
        'url': original_url,
        'created': time.time(),
        'clicks': 0
    }
    save_links(links)

    # Return the shortened URL using the short domain
    short_url = f"https://cubsw.link/{short_code}"
    return jsonify({
        'shortUrl': short_url,
        'shortCode': short_code,
        'originalUrl': original_url
    })

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

@app.route('/apps/pm2-dashboard')
@app.route('/apps/pm2-dashboard/')
@pm2_auth_required
def pm2_dashboard():
    """PM2 Dashboard - Process Monitor & Management"""
    return render_template('pm2-dashboard.html', user=session['pm2_user'])

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
    params = {
        'client_id': config['discord_client_id'],
        'redirect_uri': config['discord_redirect_uri'],
        'response_type': 'code',
        'scope': 'identify',
        'state': secrets.token_urlsafe(16)
    }
    session['oauth_state'] = params['state']
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

    # Verify state
    if state != session.get('oauth_state'):
        return redirect(url_for('pm2_login', error='invalid_state'))

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
