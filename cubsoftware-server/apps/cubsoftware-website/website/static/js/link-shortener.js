// Link Shortener JavaScript

// Elements
const longUrlInput = document.getElementById('longUrl');
const shortenBtn = document.getElementById('shortenBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const resultSection = document.getElementById('resultSection');
const shortUrlInput = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const newLinkBtn = document.getElementById('newLinkBtn');
const visitLink = document.getElementById('visitLink');
const errorMessage = document.getElementById('errorMessage');
const recentList = document.getElementById('recentList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Initialize
function init() {
    loadRecentLinks();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    shortenBtn.addEventListener('click', shortenUrl);
    longUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') shortenUrl();
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shortUrlInput.value);
        showToast('Copied to clipboard!');
    });

    newLinkBtn.addEventListener('click', resetForm);

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('recentLinks');
        loadRecentLinks();
        showToast('History cleared');
    });
}

// Shorten URL
async function shortenUrl() {
    const url = longUrlInput.value.trim();

    // Validate URL
    if (!url) {
        showError('Please enter a URL');
        return;
    }

    if (!isValidUrl(url)) {
        showError('Please enter a valid URL (including http:// or https://)');
        return;
    }

    // Show loading
    setLoading(true);
    hideError();

    try {
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to shorten URL');
        }

        // Show result
        const shortUrl = window.location.origin + '/s/' + data.code;
        shortUrlInput.value = shortUrl;
        visitLink.href = shortUrl;
        resultSection.style.display = 'block';

        // Save to recent
        saveToRecent(url, data.code);

    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

// Validate URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Set loading state
function setLoading(loading) {
    shortenBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoader.style.display = loading ? 'inline-block' : 'none';
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error
function hideError() {
    errorMessage.style.display = 'none';
}

// Reset form
function resetForm() {
    longUrlInput.value = '';
    resultSection.style.display = 'none';
    hideError();
    longUrlInput.focus();
}

// Save to recent
function saveToRecent(longUrl, code) {
    const recent = JSON.parse(localStorage.getItem('recentLinks') || '[]');

    // Remove if already exists
    const filtered = recent.filter(item => item.code !== code);

    // Add to beginning
    filtered.unshift({
        longUrl,
        code,
        createdAt: Date.now()
    });

    // Keep only last 20
    const trimmed = filtered.slice(0, 20);

    localStorage.setItem('recentLinks', JSON.stringify(trimmed));
    loadRecentLinks();
}

// Load recent links
function loadRecentLinks() {
    const recent = JSON.parse(localStorage.getItem('recentLinks') || '[]');

    if (recent.length === 0) {
        recentList.innerHTML = '<div class="empty-state">No links shortened yet</div>';
        return;
    }

    recentList.innerHTML = recent.map(item => {
        const shortUrl = window.location.origin + '/s/' + item.code;
        return `
            <div class="recent-item">
                <div class="recent-item-info">
                    <div class="recent-item-short">${shortUrl}</div>
                    <div class="recent-item-long">${escapeHtml(item.longUrl)}</div>
                </div>
                <div class="recent-item-actions">
                    <button onclick="copyLink('${shortUrl}')">Copy</button>
                    <button onclick="window.open('${shortUrl}', '_blank')">Visit</button>
                </div>
            </div>
        `;
    }).join('');
}

// Copy link
window.copyLink = function(url) {
    navigator.clipboard.writeText(url);
    showToast('Copied!');
};

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
