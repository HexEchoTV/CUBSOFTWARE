// Countdown Maker JavaScript

// Elements
const eventTitle = document.getElementById('eventTitle');
const eventDate = document.getElementById('eventDate');
const endMessage = document.getElementById('endMessage');
const showDays = document.getElementById('showDays');
const showHours = document.getElementById('showHours');
const showMinutes = document.getElementById('showMinutes');
const showSeconds = document.getElementById('showSeconds');
const countdownPreview = document.getElementById('countdownPreview');
const previewTitle = document.getElementById('previewTitle');
const previewDays = document.getElementById('previewDays');
const previewHours = document.getElementById('previewHours');
const previewMinutes = document.getElementById('previewMinutes');
const previewSeconds = document.getElementById('previewSeconds');
const previewEndMessage = document.getElementById('previewEndMessage');
const daysBlock = document.getElementById('daysBlock');
const hoursBlock = document.getElementById('hoursBlock');
const minutesBlock = document.getElementById('minutesBlock');
const secondsBlock = document.getElementById('secondsBlock');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const saveCountdownBtn = document.getElementById('saveCountdownBtn');
const savedList = document.getElementById('savedList');
const themeBtns = document.querySelectorAll('.theme-btn');

let currentTheme = 'dark';
let countdownInterval = null;

// Initialize
function init() {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    eventDate.value = formatDateTimeLocal(tomorrow);

    // Check for URL params
    loadFromUrl();

    // Setup event listeners
    setupEventListeners();

    // Load saved countdowns
    loadSavedCountdowns();

    // Start countdown
    startCountdown();
    updatePreview();
    updateShareLink();
}

// Format date for datetime-local input
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Setup event listeners
function setupEventListeners() {
    eventTitle.addEventListener('input', () => {
        updatePreview();
        updateShareLink();
    });

    eventDate.addEventListener('change', () => {
        startCountdown();
        updateShareLink();
    });

    endMessage.addEventListener('input', updateShareLink);

    // Theme buttons
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTheme = btn.dataset.theme;
            updatePreviewTheme();
            updateShareLink();
        });
    });

    // Display options
    [showDays, showHours, showMinutes, showSeconds].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateDisplayOptions();
            updateShareLink();
        });
    });

    // Copy link
    copyLinkBtn.addEventListener('click', () => {
        if (shareLink.value) {
            navigator.clipboard.writeText(shareLink.value);
            showToast('Link copied!');
        }
    });

    // Save countdown
    saveCountdownBtn.addEventListener('click', saveCountdown);
}

// Update preview
function updatePreview() {
    previewTitle.textContent = eventTitle.value || 'Your Event';
}

// Update preview theme
function updatePreviewTheme() {
    countdownPreview.className = 'countdown-preview theme-' + currentTheme;
}

// Update display options
function updateDisplayOptions() {
    daysBlock.style.display = showDays.checked ? 'flex' : 'none';
    hoursBlock.style.display = showHours.checked ? 'flex' : 'none';
    minutesBlock.style.display = showMinutes.checked ? 'flex' : 'none';
    secondsBlock.style.display = showSeconds.checked ? 'flex' : 'none';
}

// Start countdown
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Update countdown
function updateCountdown() {
    const targetDate = new Date(eventDate.value);
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        // Countdown finished
        previewDays.textContent = '00';
        previewHours.textContent = '00';
        previewMinutes.textContent = '00';
        previewSeconds.textContent = '00';

        if (endMessage.value) {
            document.querySelector('.preview-timer').style.display = 'none';
            previewEndMessage.textContent = endMessage.value;
            previewEndMessage.style.display = 'block';
        }
        return;
    }

    // Show timer, hide end message
    document.querySelector('.preview-timer').style.display = 'flex';
    previewEndMessage.style.display = 'none';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    previewDays.textContent = String(days).padStart(2, '0');
    previewHours.textContent = String(hours).padStart(2, '0');
    previewMinutes.textContent = String(minutes).padStart(2, '0');
    previewSeconds.textContent = String(seconds).padStart(2, '0');
}

// Update share link
function updateShareLink() {
    const params = new URLSearchParams();

    if (eventTitle.value) params.set('title', eventTitle.value);
    if (eventDate.value) params.set('date', eventDate.value);
    if (endMessage.value) params.set('msg', endMessage.value);
    params.set('theme', currentTheme);

    const display = [];
    if (showDays.checked) display.push('d');
    if (showHours.checked) display.push('h');
    if (showMinutes.checked) display.push('m');
    if (showSeconds.checked) display.push('s');
    params.set('show', display.join(''));

    const baseUrl = window.location.origin + window.location.pathname;
    shareLink.value = baseUrl + '?' + params.toString();
}

// Load from URL
function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('title')) {
        eventTitle.value = params.get('title');
    }

    if (params.has('date')) {
        eventDate.value = params.get('date');
    }

    if (params.has('msg')) {
        endMessage.value = params.get('msg');
    }

    if (params.has('theme')) {
        currentTheme = params.get('theme');
        themeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });
        updatePreviewTheme();
    }

    if (params.has('show')) {
        const show = params.get('show');
        showDays.checked = show.includes('d');
        showHours.checked = show.includes('h');
        showMinutes.checked = show.includes('m');
        showSeconds.checked = show.includes('s');
        updateDisplayOptions();
    }
}

// Save countdown
function saveCountdown() {
    if (!eventTitle.value || !eventDate.value) {
        showToast('Please enter a title and date');
        return;
    }

    const saved = JSON.parse(localStorage.getItem('savedCountdowns') || '[]');

    // No limit - using localStorage

    const countdown = {
        id: Date.now(),
        title: eventTitle.value,
        date: eventDate.value,
        endMessage: endMessage.value,
        theme: currentTheme,
        showDays: showDays.checked,
        showHours: showHours.checked,
        showMinutes: showMinutes.checked,
        showSeconds: showSeconds.checked
    };

    saved.push(countdown);
    localStorage.setItem('savedCountdowns', JSON.stringify(saved));

    loadSavedCountdowns();
    showToast('Countdown saved!');
}

// Load saved countdowns
function loadSavedCountdowns() {
    const saved = JSON.parse(localStorage.getItem('savedCountdowns') || '[]');

    if (saved.length === 0) {
        savedList.innerHTML = '<div class="empty-state">No saved countdowns yet</div>';
        return;
    }

    savedList.innerHTML = saved.map(countdown => `
        <div class="saved-item" data-id="${countdown.id}">
            <div class="saved-item-info">
                <div class="saved-item-title">${escapeHtml(countdown.title)}</div>
                <div class="saved-item-date">${formatReadableDate(countdown.date)}</div>
            </div>
            <div class="saved-item-actions">
                <button onclick="loadCountdown(${countdown.id})">Load</button>
                <button class="delete-btn" onclick="deleteCountdown(${countdown.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load countdown
window.loadCountdown = function(id) {
    const saved = JSON.parse(localStorage.getItem('savedCountdowns') || '[]');
    const countdown = saved.find(c => c.id === id);

    if (!countdown) return;

    eventTitle.value = countdown.title;
    eventDate.value = countdown.date;
    endMessage.value = countdown.endMessage || '';
    currentTheme = countdown.theme;

    themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });

    showDays.checked = countdown.showDays;
    showHours.checked = countdown.showHours;
    showMinutes.checked = countdown.showMinutes;
    showSeconds.checked = countdown.showSeconds;

    updatePreview();
    updatePreviewTheme();
    updateDisplayOptions();
    startCountdown();
    updateShareLink();

    showToast('Countdown loaded!');
};

// Delete countdown
window.deleteCountdown = function(id) {
    let saved = JSON.parse(localStorage.getItem('savedCountdowns') || '[]');
    saved = saved.filter(c => c.id !== id);
    localStorage.setItem('savedCountdowns', JSON.stringify(saved));
    loadSavedCountdowns();
    showToast('Countdown deleted');
};

// Format readable date
function formatReadableDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

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
