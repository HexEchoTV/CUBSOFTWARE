// CubPresence App - Renderer Script

let isConnected = false;
let settings = {};
let profiles = {};
let previewTimer = null;

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

    // Load settings
    settings = await window.cubpresence.getSettings();
    applySettingsToUI();

    // Load profiles
    profiles = await window.cubpresence.getProfiles();
    updateProfilesList();

    // Load saved presence
    const savedPresence = await window.cubpresence.getSavedPresence();
    if (savedPresence) {
        if (savedPresence.clientId) {
            document.getElementById('clientId').value = savedPresence.clientId;
        }
        if (savedPresence.activity) {
            populateFields(savedPresence.activity);
        }
    }

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

    // Listen for quick connect from tray
    window.cubpresence.onQuickConnect(() => {
        if (!isConnected && settings.savedClientId) {
            connect();
        }
    });

    // Setup event listeners
    setupEventListeners();
    updatePreview();
});

// Apply settings to UI
function applySettingsToUI() {
    document.getElementById('settingRunOnStartup').checked = settings.runOnStartup;
    document.getElementById('settingStartMinimized').checked = settings.startMinimized;
    document.getElementById('settingAutoConnect').checked = settings.autoConnect;
    document.getElementById('settingMinimizeToTray').checked = settings.minimizeToTray;
    document.getElementById('settingShowNotifications').checked = settings.showNotifications;
    document.getElementById('settingSavePresence').checked = settings.savePresenceOnClose;
    document.getElementById('settingCheckUpdates').checked = settings.checkUpdatesOnStartup;
    document.getElementById('settingAutoDownload').checked = settings.autoDownloadUpdates;
}

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
            btn.onclick = () => window.cubpresence.checkForUpdates();
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

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            applyPreset(preset);
        });
    });

    // Activity type selector
    const activityType = document.getElementById('activityType');
    if (activityType) {
        activityType.addEventListener('change', () => {
            // Show/hide stream URL field
            const streamUrlField = document.getElementById('streamUrlField');
            if (streamUrlField) {
                streamUrlField.style.display = activityType.value === '1' ? 'block' : 'none';
            }
            updatePreview();
        });
    }

    // Wiki link
    const wikiLink = document.getElementById('wikiLink');
    if (wikiLink) {
        wikiLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.cubpresence.openExternal('https://cubsoftware.site/cubpresence-wiki');
        });
    }

    // Profile buttons
    document.getElementById('saveProfileBtn').addEventListener('click', saveCurrentProfile);
    document.getElementById('loadProfileBtn').addEventListener('click', loadSelectedProfile);
    document.getElementById('deleteProfileBtn').addEventListener('click', deleteSelectedProfile);

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

    // Open external links
    document.getElementById('devPortalLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.cubpresence.openExternal('https://discord.com/developers/applications');
    });

    // Guide links
    document.querySelectorAll('.guide-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = e.target.dataset.url;
            if (url) window.cubpresence.openExternal(url);
        });
    });

    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('active');
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });

    // Guide modal
    document.getElementById('guideBtn').addEventListener('click', () => {
        document.getElementById('guideModal').classList.add('active');
    });

    document.getElementById('closeGuide').addEventListener('click', () => {
        document.getElementById('guideModal').classList.remove('active');
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Settings toggles
    document.getElementById('settingRunOnStartup').addEventListener('change', (e) => {
        settings.runOnStartup = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingStartMinimized').addEventListener('change', (e) => {
        settings.startMinimized = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingAutoConnect').addEventListener('change', (e) => {
        settings.autoConnect = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingMinimizeToTray').addEventListener('change', (e) => {
        settings.minimizeToTray = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingShowNotifications').addEventListener('change', (e) => {
        settings.showNotifications = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingSavePresence').addEventListener('change', (e) => {
        settings.savePresenceOnClose = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingCheckUpdates').addEventListener('change', (e) => {
        settings.checkUpdatesOnStartup = e.target.checked;
        saveSettings();
    });

    document.getElementById('settingAutoDownload').addEventListener('change', (e) => {
        settings.autoDownloadUpdates = e.target.checked;
        saveSettings();
    });

    // Check updates button
    document.getElementById('checkUpdatesBtn').addEventListener('click', () => {
        window.cubpresence.checkForUpdates();
    });

    // Clear data button
    document.getElementById('clearDataBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all saved data? This will reset your settings and saved presence.')) {
            settings = {
                runOnStartup: false,
                startMinimized: false,
                autoConnect: false,
                checkUpdatesOnStartup: true,
                minimizeToTray: true,
                showNotifications: true,
                savePresenceOnClose: true,
                savedClientId: '',
                theme: 'dark'
            };
            await window.cubpresence.saveSettings(settings);
            applySettingsToUI();

            // Clear form
            document.getElementById('clientId').value = '';
            document.getElementById('details').value = '';
            document.getElementById('state').value = '';
            document.getElementById('largeImageKey').value = '';
            document.getElementById('largeImageText').value = '';
            document.getElementById('smallImageKey').value = '';
            document.getElementById('smallImageText').value = '';
            document.getElementById('btn1Label').value = '';
            document.getElementById('btn1Url').value = '';
            document.getElementById('btn2Label').value = '';
            document.getElementById('btn2Url').value = '';
            document.getElementById('partySize').value = '';
            document.getElementById('partyMax').value = '';

            updatePreview();
            alert('Data cleared successfully!');
        }
    });
}

// Save settings
async function saveSettings() {
    await window.cubpresence.saveSettings(settings);
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

// Apply preset
function applyPreset(preset) {
    const presets = {
        gaming: {
            details: 'In Game',
            state: 'Playing',
            activityType: '0',
            timestampType: 'since_update'
        },
        streaming: {
            details: 'Live Now',
            state: 'Streaming',
            activityType: '1',
            timestampType: 'since_connection'
        },
        coding: {
            details: 'Writing Code',
            state: 'In IDE',
            activityType: '0',
            timestampType: 'since_app_start'
        },
        music: {
            details: 'Listening to Music',
            state: 'Vibing',
            activityType: '2',
            timestampType: 'none'
        },
        chilling: {
            details: 'Taking a Break',
            state: 'AFK',
            activityType: '0',
            timestampType: 'none'
        },
        clear: {
            details: '',
            state: '',
            activityType: '0',
            timestampType: 'none',
            clearAll: true
        }
    };

    const p = presets[preset];
    if (!p) return;

    // Apply preset values
    document.getElementById('details').value = p.details || '';
    document.getElementById('state').value = p.state || '';
    document.getElementById('activityType').value = p.activityType || '0';

    // Set timestamp type
    const tsRadio = document.querySelector(`input[name="timestampType"][value="${p.timestampType}"]`);
    if (tsRadio) {
        tsRadio.checked = true;
        document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('active'));
        tsRadio.closest('.radio-option').classList.add('active');
        document.getElementById('customTimestamps').style.display =
            p.timestampType === 'custom' ? 'block' : 'none';
    }

    // Clear all fields if clear preset
    if (p.clearAll) {
        document.getElementById('largeImageKey').value = '';
        document.getElementById('largeImageText').value = '';
        document.getElementById('smallImageKey').value = '';
        document.getElementById('smallImageText').value = '';
        document.getElementById('btn1Label').value = '';
        document.getElementById('btn1Url').value = '';
        document.getElementById('btn2Label').value = '';
        document.getElementById('btn2Url').value = '';
        document.getElementById('partySize').value = '';
        document.getElementById('partyMax').value = '';
        document.getElementById('startDateTime').value = '';
        document.getElementById('endDateTime').value = '';
    }

    updatePreview();
}

// Build activity object from form
function buildActivity() {
    const tsType = document.querySelector('input[name="timestampType"]:checked').value;
    const activityType = parseInt(document.getElementById('activityType').value) || 0;

    // Parse custom datetime values
    let startTimestamp = null;
    let endTimestamp = null;

    if (tsType === 'custom') {
        const startDateTime = document.getElementById('startDateTime').value;
        const endDateTime = document.getElementById('endDateTime').value;

        if (startDateTime) {
            startTimestamp = Math.floor(new Date(startDateTime).getTime() / 1000);
        }
        if (endDateTime) {
            endTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);
        }
    }

    return {
        type: activityType,
        stream_url: document.getElementById('streamUrl').value,
        details: document.getElementById('details').value,
        state: document.getElementById('state').value,
        timestamps_type: tsType,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
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

    // Set activity type
    if (activity.type !== undefined) {
        document.getElementById('activityType').value = activity.type.toString();
        // Show stream URL field if streaming
        const streamUrlField = document.getElementById('streamUrlField');
        if (streamUrlField) {
            streamUrlField.style.display = activity.type === 1 ? 'block' : 'none';
        }
    }

    // Set stream URL
    if (activity.stream_url) {
        document.getElementById('streamUrl').value = activity.stream_url;
    }

    // Set timestamp type
    if (activity.timestamps_type) {
        const radio = document.querySelector(`input[name="timestampType"][value="${activity.timestamps_type}"]`);
        if (radio) {
            radio.checked = true;
            document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('active'));
            radio.closest('.radio-option').classList.add('active');
            document.getElementById('customTimestamps').style.display =
                activity.timestamps_type === 'custom' ? 'block' : 'none';
        }
    }

    // Set custom timestamps if present
    if (activity.start_timestamp) {
        const date = new Date(activity.start_timestamp * 1000);
        document.getElementById('startDateTime').value = formatDateTimeLocal(date);
    }
    if (activity.end_timestamp) {
        const date = new Date(activity.end_timestamp * 1000);
        document.getElementById('endDateTime').value = formatDateTimeLocal(date);
    }

    updatePreview();
}

// Format date for datetime-local input
function formatDateTimeLocal(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    const activityType = document.getElementById('activityType').value;

    // Activity type labels
    const activityLabels = {
        '0': 'Playing',
        '1': 'Streaming',
        '2': 'Listening to',
        '3': 'Watching',
        '5': 'Competing in'
    };

    // Update activity type in preview
    const previewActivityType = document.getElementById('previewActivityType');
    if (previewActivityType) {
        previewActivityType.textContent = activityLabels[activityType] || 'Playing';
    }

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
    const previewTimeText = document.getElementById('previewTimeText');

    // Clear existing timer
    if (previewTimer) {
        clearInterval(previewTimer);
        previewTimer = null;
    }

    if (tsType === 'none') {
        previewTs.style.display = 'none';
    } else if (tsType === 'local_time') {
        previewTs.style.display = '';
        // Update immediately and then every second
        const updateLocalTime = () => {
            if (previewTimeText) {
                previewTimeText.textContent = formatLocalTime() + ' elapsed';
            } else {
                previewTs.textContent = formatLocalTime() + ' elapsed';
            }
        };
        updateLocalTime();
        previewTimer = setInterval(updateLocalTime, 1000);
    } else {
        previewTs.style.display = '';
        const timestampLabels = {
            'since_update': '00:01:23 elapsed',
            'since_connection': '00:05:30 elapsed',
            'since_app_start': '00:15:42 elapsed',
            'custom': 'custom time',
            'countdown': '01:00:00 left'
        };
        if (previewTimeText) {
            previewTimeText.textContent = timestampLabels[tsType] || '';
        } else {
            previewTs.textContent = timestampLabels[tsType] || '';
        }
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

// Format local time for preview
function formatLocalTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const secs = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
}

// Escape HTML
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Update profiles dropdown
function updateProfilesList() {
    const select = document.getElementById('profileSelect');
    select.innerHTML = '<option value="">-- Select Profile --</option>';

    Object.keys(profiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

// Save current settings as a profile
async function saveCurrentProfile() {
    const nameInput = document.getElementById('profileName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Please enter a profile name');
        return;
    }

    const data = {
        clientId: document.getElementById('clientId').value,
        activity: buildActivity()
    };

    profiles = await window.cubpresence.saveProfile(name, data);
    updateProfilesList();

    // Select the saved profile
    document.getElementById('profileSelect').value = name;
    nameInput.value = '';
}

// Load selected profile
function loadSelectedProfile() {
    const select = document.getElementById('profileSelect');
    const name = select.value;

    if (!name || !profiles[name]) {
        alert('Please select a profile to load');
        return;
    }

    const data = profiles[name];

    if (data.clientId) {
        document.getElementById('clientId').value = data.clientId;
    }

    if (data.activity) {
        populateFields(data.activity);
    }

    updatePreview();
}

// Delete selected profile
async function deleteSelectedProfile() {
    const select = document.getElementById('profileSelect');
    const name = select.value;

    if (!name) {
        alert('Please select a profile to delete');
        return;
    }

    if (!confirm(`Delete profile "${name}"?`)) {
        return;
    }

    profiles = await window.cubpresence.deleteProfile(name);
    updateProfilesList();
}
