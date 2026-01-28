from flask import Flask, send_from_directory, render_template, redirect, request, jsonify
from waitress import serve
import socket
import os
import sys
import importlib.util
import json
import hashlib
import time
from jinja2 import ChoiceLoader, FileSystemLoader

# Create the main Flask app with multiple template folders
app = Flask(__name__,
            static_folder='website/static')

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
    """Serve the main landing page"""
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

# ==================== SOCIAL MEDIA SAVER APP INTEGRATION ====================

# Load Social Media Saver blueprint using importlib
social_blueprint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apps', 'social-media-saver', 'app_blueprint.py')
spec_social = importlib.util.spec_from_file_location("social_blueprint", social_blueprint_path)
social_module = importlib.util.module_from_spec(spec_social)
spec_social.loader.exec_module(social_module)
app.register_blueprint(social_module.social_media_bp, url_prefix='/apps/social-media-saver')

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

    # Run production server with Waitress
    serve(app, host='0.0.0.0', port=3000, threads=4)
