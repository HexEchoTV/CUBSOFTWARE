from flask import Flask, send_from_directory, render_template, redirect
from waitress import serve
import socket
import os
import sys
import importlib.util
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
