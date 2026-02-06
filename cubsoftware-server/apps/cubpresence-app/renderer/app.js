// CubPresence App - Renderer Script

let isConnected = false;

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const updateBtn = document.getElementById('updateBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Display version
    const version = await window.cubpresence.getVersion();
    document.getElementById('appVersion').textContent = 'v' + version;

    // Get initial status
    const status = await window.cubpresence.getStatus();
    if (status.connected) {
        setConnectedUI();
        if (status.activity) {
            populateFields(status.activity);
        }
    }

    // Listen for status updates from main process
    window.cubpresence.onStatus((data) => {
        updateStatus(data.state, data.message);
    });

    // Listen for update status
    window.cubpresence.onUpdateStatus((data) => {
        handleUpdateStatus(data);
    });

    // Setup event listeners
    setupEventListeners();
    updatePreview();
});

// Handle update status
function handleUpdateStatus(data) {
    const banner = document.getElementById('updateBanner');
    const text = document.getElementById('updateText');
    const btn = document.getElementById('updateAction');

    banner.className = 'update-banner';
    btn.style.display = 'none';

    switch (data.status) {
        case 'checking':
            banner.style.display = 'flex';
            text.textContent = 'Checking for updates...';
            break;
        case 'available':
            banner.style.display = 'flex';
            text.textContent = `Update available: v${data.version}`;
            break;
        case 'downloading':
            banner.style.display = 'flex';
            banner.classList.add('downloading');
            text.textContent = data.percent
                ? `Downloading update... ${data.percent}%`
                : 'Downloading update...';
            break;
        case 'ready':
            banner.style.display = 'flex';
            banner.classList.add('ready');
            text.textContent = 'Update ready! Restart to apply.';
            btn.textContent = 'Restart';
            btn.style.display = '';
            btn.onclick = () => window.cubpresence.checkForUpdates(); // Triggers restart dialog
            break;
        case 'up-to-date':
            banner.style.display = 'none';
            break;
        case 'error':
            banner.style.display = 'none';
            console.error('Update error:', data.message);
            break;
        default:
            banner.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Connect button
    connectBtn.addEventListener('click', connect);

    // Disconnect button
    disconnectBtn.addEventListener('click', disconnect);

    // Update button
    updateBtn.addEventListener('click', updateActivity);

    // Timestamp radio buttons
    document.querySelectorAll('input[name="timestampType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('active'));
            e.target.closest('.radio-option').classList.add('active');
            document.getElementById('customTimestamps').style.display =
                e.target.value === 'custom' ? 'block' : 'none';
            updatePreview();
        });
    });

    // Live preview on input changes
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Open external links in default browser
    document.getElementById('devPortalLink').addEventListener('click', (e) => {
        e.preventDefault();
        require('electron').shell.openExternal('https://discord.com/developers/applications');
    });
}

// Connect to Discord
async function connect() {
    const clientId = document.getElementById('clientId').value.trim();

    if (!clientId) {
        updateStatus('error', 'Please enter a Discord Application ID');
        return;
    }

    if (!/^\d+$/.test(clientId)) {
        updateStatus('error', 'Application ID should be a number');
        return;
    }

    const activity = buildActivity();
    await window.cubpresence.connect(clientId, activity);
}

// Disconnect from Discord
async function disconnect() {
    await window.cubpresence.disconnect();
    setDisconnectedUI();
}

// Update activity
async function updateActivity() {
    const activity = buildActivity();
    await window.cubpresence.updateActivity(activity);
    updateStatus('connected', 'Presence updated!');
}

// Build activity object from form
function buildActivity() {
    return {
        details: document.getElementById('details').value,
        state: document.getElementById('state').value,
        timestamps_type: document.querySelector('input[name="timestampType"]:checked').value,
        start_timestamp: parseInt(document.getElementById('startTimestamp').value) || null,
        end_timestamp: parseInt(document.getElementById('endTimestamp').value) || null,
        large_image_key: document.getElementById('largeImageKey').value,
        large_image_text: document.getElementById('largeImageText').value,
        small_image_key: document.getElementById('smallImageKey').value,
        small_image_text: document.getElementById('smallImageText').value,
        button1_label: document.getElementById('btn1Label').value,
        button1_url: document.getElementById('btn1Url').value,
        button2_label: document.getElementById('btn2Label').value,
        button2_url: document.getElementById('btn2Url').value,
        party_size: parseInt(document.getElementById('partySize').value) || 0,
        party_max: parseInt(document.getElementById('partyMax').value) || 0
    };
}

// Populate form fields
function populateFields(activity) {
    if (activity.details) document.getElementById('details').value = activity.details;
    if (activity.state) document.getElementById('state').value = activity.state;
    if (activity.large_image_key) document.getElementById('largeImageKey').value = activity.large_image_key;
    if (activity.large_image_text) document.getElementById('largeImageText').value = activity.large_image_text;
    if (activity.small_image_key) document.getElementById('smallImageKey').value = activity.small_image_key;
    if (activity.small_image_text) document.getElementById('smallImageText').value = activity.small_image_text;
    if (activity.button1_label) document.getElementById('btn1Label').value = activity.button1_label;
    if (activity.button1_url) document.getElementById('btn1Url').value = activity.button1_url;
    if (activity.button2_label) document.getElementById('btn2Label').value = activity.button2_label;
    if (activity.button2_url) document.getElementById('btn2Url').value = activity.button2_url;
    if (activity.party_size) document.getElementById('partySize').value = activity.party_size;
    if (activity.party_max) document.getElementById('partyMax').value = activity.party_max;
}

// Update status display
function updateStatus(state, message) {
    statusDot.className = 'status-dot ' + state;
    statusText.textContent = message;

    if (state === 'connected') {
        setConnectedUI();
    } else if (state === 'disconnected' || state === 'error') {
        setDisconnectedUI();
    }
}

// Set connected UI state
function setConnectedUI() {
    isConnected = true;
    connectBtn.style.display = 'none';
    disconnectBtn.style.display = '';
    updateBtn.style.display = '';
}

// Set disconnected UI state
function setDisconnectedUI() {
    isConnected = false;
    connectBtn.style.display = '';
    disconnectBtn.style.display = 'none';
    updateBtn.style.display = 'none';
}

// Update preview
function updatePreview() {
    const details = document.getElementById('details').value;
    const state = document.getElementById('state').value;
    const largeKey = document.getElementById('largeImageKey').value;
    const smallKey = document.getElementById('smallImageKey').value;
    const btn1Label = document.getElementById('btn1Label').value;
    const btn2Label = document.getElementById('btn2Label').value;
    const tsType = document.querySelector('input[name="timestampType"]:checked').value;
    const partySize = parseInt(document.getElementById('partySize').value) || 0;
    const partyMax = parseInt(document.getElementById('partyMax').value) || 0;

    // Details
    const previewDetails = document.getElementById('previewDetails');
    previewDetails.textContent = details || '';
    previewDetails.style.display = details ? '' : 'none';

    // State
    const previewState = document.getElementById('previewState');
    let stateText = state || '';
    if (partySize > 0 && partyMax > 0) {
        stateText += (stateText ? ' ' : '') + '(' + partySize + ' of ' + partyMax + ')';
    }
    previewState.textContent = stateText;
    previewState.style.display = stateText ? '' : 'none';

    // Timestamp
    const previewTs = document.getElementById('previewTimestamp');
    if (tsType === 'elapsed') {
        previewTs.textContent = '00:01:23 elapsed';
        previewTs.style.display = '';
    } else if (tsType === 'countdown') {
        previewTs.textContent = '01:00:00 left';
        previewTs.style.display = '';
    } else if (tsType === 'custom') {
        previewTs.textContent = 'custom timestamp';
        previewTs.style.display = '';
    } else {
        previewTs.style.display = 'none';
    }

    // Large image
    const previewLarge = document.getElementById('previewLarge');
    if (largeKey && (largeKey.startsWith('http://') || largeKey.startsWith('https://'))) {
        previewLarge.innerHTML = '<img src="' + escapeHtml(largeKey) + '" alt="">';
    } else if (largeKey) {
        previewLarge.innerHTML = '<span style="font-size:0.6rem;color:#72767d;">' + escapeHtml(largeKey.substring(0, 6)) + '</span>';
    } else {
        previewLarge.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    }

    // Small image
    const previewSmall = document.getElementById('previewSmall');
    if (smallKey) {
        previewSmall.style.display = '';
        if (smallKey.startsWith('http://') || smallKey.startsWith('https://')) {
            previewSmall.innerHTML = '<img src="' + escapeHtml(smallKey) + '" alt="">';
        } else {
            previewSmall.innerHTML = '';
            previewSmall.style.background = '#4f545c';
        }
    } else {
        previewSmall.style.display = 'none';
    }

    // Buttons
    const previewButtons = document.getElementById('previewButtons');
    let btnsHtml = '';
    if (btn1Label) btnsHtml += '<div class="preview-btn">' + escapeHtml(btn1Label) + '</div>';
    if (btn2Label) btnsHtml += '<div class="preview-btn">' + escapeHtml(btn2Label) + '</div>';
    previewButtons.innerHTML = btnsHtml;
    previewButtons.style.display = btnsHtml ? '' : 'none';
}

// Escape HTML
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
