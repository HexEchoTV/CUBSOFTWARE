const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const DiscordRPC = require('discord-rpc');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let tray = null;
let rpcClient = null;
let currentActivity = null;
let isConnected = false;

// Timestamps tracking
const appStartTime = Date.now();
let connectionTime = null;
let lastUpdateTime = null;

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const presencePath = path.join(app.getPath('userData'), 'saved-presence.json');

// Default settings
const defaultSettings = {
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

let settings = { ...defaultSettings };

// Load settings
function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            settings = { ...defaultSettings, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
        settings = { ...defaultSettings };
    }

    // Apply startup setting
    app.setLoginItemSettings({
        openAtLogin: settings.runOnStartup,
        path: app.getPath('exe')
    });

    return settings;
}

// Save settings
function saveSettings() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        // Update startup setting
        app.setLoginItemSettings({
            openAtLogin: settings.runOnStartup,
            path: app.getPath('exe')
        });
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

// Load saved presence
function loadSavedPresence() {
    try {
        if (fs.existsSync(presencePath)) {
            const data = fs.readFileSync(presencePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to load saved presence:', e);
    }
    return null;
}

// Save presence
function savePresence(clientId, activity) {
    try {
        fs.writeFileSync(presencePath, JSON.stringify({ clientId, activity }, null, 2));
    } catch (e) {
        console.error('Failed to save presence:', e);
    }
}

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    sendToRenderer('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    sendToRenderer('update-status', { status: 'available', version: info.version });

    // Show dialog asking to download
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download and install it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
            sendToRenderer('update-status', { status: 'downloading', version: info.version });
        }
    });
});

autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    sendToRenderer('update-status', { status: 'up-to-date' });
});

autoUpdater.on('download-progress', (progress) => {
    console.log('Download progress:', progress.percent);
    sendToRenderer('update-status', {
        status: 'downloading',
        percent: Math.round(progress.percent)
    });
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    sendToRenderer('update-status', { status: 'ready', version: info.version });

    // Show dialog to restart
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded!',
        detail: 'The update will be installed when you restart the app. Restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall(false, true);
        }
    });
});

autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    sendToRenderer('update-status', { status: 'error', message: error.message });
});

// Create the main window
function createWindow() {
    loadSettings();

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        minWidth: 700,
        minHeight: 550,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'CubPresence',
        autoHideMenuBar: true,
        backgroundColor: '#0a0a1a',
        show: !settings.startMinimized
    });

    mainWindow.loadFile('renderer/index.html');

    // Show window when ready if not starting minimized
    mainWindow.once('ready-to-show', () => {
        if (!settings.startMinimized) {
            mainWindow.show();
        }
    });

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            if (settings.minimizeToTray) {
                event.preventDefault();
                mainWindow.hide();
            }

            // Save presence on close if enabled
            if (settings.savePresenceOnClose && currentActivity && settings.savedClientId) {
                savePresence(settings.savedClientId, currentActivity);
            }
        }
    });
}

// Create system tray
function createTray() {
    try {
        tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
    } catch (e) {
        console.log('Tray icon not found, skipping tray');
        return;
    }

    updateTray();
    tray.setToolTip('CubPresence');
    tray.on('click', () => mainWindow.show());
}

// Update tray menu
function updateTray() {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open CubPresence',
            click: () => mainWindow.show()
        },
        { type: 'separator' },
        {
            label: isConnected ? 'Connected to Discord' : 'Not Connected',
            enabled: false,
            icon: null
        },
        { type: 'separator' },
        {
            label: 'Quick Connect',
            click: () => {
                mainWindow.show();
                sendToRenderer('quick-connect', {});
            },
            enabled: !isConnected && settings.savedClientId
        },
        {
            label: 'Disconnect',
            click: () => disconnect(),
            enabled: isConnected
        },
        { type: 'separator' },
        {
            label: 'Check for Updates',
            click: () => autoUpdater.checkForUpdates()
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

// Connect to Discord RPC
async function connect(clientId, activity) {
    try {
        // Disconnect existing client
        if (rpcClient) {
            try {
                await rpcClient.destroy();
            } catch (e) {}
            rpcClient = null;
        }

        // Save client ID for auto-connect
        settings.savedClientId = clientId;
        saveSettings();

        sendToRenderer('status', { state: 'connecting', message: 'Connecting to Discord...' });

        rpcClient = new DiscordRPC.Client({ transport: 'ipc' });

        rpcClient.on('ready', async () => {
            console.log('Discord RPC connected!');
            isConnected = true;
            connectionTime = Date.now();
            currentActivity = activity;

            await setActivity(activity);

            sendToRenderer('status', { state: 'connected', message: 'Connected to Discord!' });
            sendToRenderer('timestamps', { connectionTime, appStartTime });
            updateTray();

            // Show notification
            if (settings.showNotifications && Notification.isSupported()) {
                new Notification({
                    title: 'CubPresence',
                    body: 'Connected to Discord!'
                }).show();
            }
        });

        rpcClient.on('disconnected', () => {
            console.log('Discord RPC disconnected');
            isConnected = false;
            connectionTime = null;
            rpcClient = null;
            sendToRenderer('status', { state: 'disconnected', message: 'Disconnected from Discord' });
            updateTray();
        });

        await rpcClient.login({ clientId });

    } catch (error) {
        console.error('Connection error:', error);
        isConnected = false;
        connectionTime = null;
        rpcClient = null;
        sendToRenderer('status', {
            state: 'error',
            message: error.message || 'Failed to connect to Discord. Make sure Discord is running.'
        });
        updateTray();
    }
}

// Set Discord activity
async function setActivity(activity) {
    if (!rpcClient || !isConnected) return;

    try {
        const rpcActivity = {};

        if (activity.details) rpcActivity.details = activity.details;
        if (activity.state) rpcActivity.state = activity.state;

        // Timestamps based on type
        const tsType = activity.timestamps_type;
        if (tsType === 'elapsed' || tsType === 'since_update') {
            rpcActivity.startTimestamp = Date.now();
        } else if (tsType === 'since_connection' && connectionTime) {
            rpcActivity.startTimestamp = connectionTime;
        } else if (tsType === 'since_app_start') {
            rpcActivity.startTimestamp = appStartTime;
        } else if (tsType === 'local_time') {
            // Show time since midnight today
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            rpcActivity.startTimestamp = midnight.getTime();
        } else if (tsType === 'countdown') {
            rpcActivity.endTimestamp = Date.now() + (60 * 60 * 1000); // 1 hour default
        } else if (tsType === 'custom') {
            if (activity.start_timestamp) rpcActivity.startTimestamp = activity.start_timestamp * 1000;
            if (activity.end_timestamp) rpcActivity.endTimestamp = activity.end_timestamp * 1000;
        }

        // Images
        if (activity.large_image_key) {
            rpcActivity.largeImageKey = activity.large_image_key;
            if (activity.large_image_text) rpcActivity.largeImageText = activity.large_image_text;
        }
        if (activity.small_image_key) {
            rpcActivity.smallImageKey = activity.small_image_key;
            if (activity.small_image_text) rpcActivity.smallImageText = activity.small_image_text;
        }

        // Buttons
        const buttons = [];
        if (activity.button1_label && activity.button1_url) {
            buttons.push({ label: activity.button1_label, url: activity.button1_url });
        }
        if (activity.button2_label && activity.button2_url) {
            buttons.push({ label: activity.button2_label, url: activity.button2_url });
        }
        if (buttons.length > 0) rpcActivity.buttons = buttons;

        // Party
        if (activity.party_size > 0 && activity.party_max > 0) {
            rpcActivity.partyId = 'cubpresence_' + Date.now();
            rpcActivity.partySize = activity.party_size;
            rpcActivity.partyMax = activity.party_max;
        }

        await rpcClient.setActivity(rpcActivity);
        currentActivity = activity;
        lastUpdateTime = Date.now();

        // Save presence if enabled
        if (settings.savePresenceOnClose) {
            savePresence(settings.savedClientId, activity);
        }

        console.log('Activity set:', rpcActivity);

    } catch (error) {
        console.error('Error setting activity:', error);
        sendToRenderer('status', { state: 'error', message: 'Failed to set activity: ' + error.message });
    }
}

// Disconnect from Discord
async function disconnect() {
    if (rpcClient) {
        try {
            await rpcClient.clearActivity();
            await rpcClient.destroy();
        } catch (e) {}
        rpcClient = null;
    }
    isConnected = false;
    connectionTime = null;
    currentActivity = null;
    sendToRenderer('status', { state: 'disconnected', message: 'Disconnected from Discord' });
    updateTray();
}

// Send message to renderer
function sendToRenderer(channel, data) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(channel, data);
    }
}

// IPC Handlers
ipcMain.handle('connect', async (event, { clientId, activity }) => {
    await connect(clientId, activity);
});

ipcMain.handle('disconnect', async () => {
    await disconnect();
});

ipcMain.handle('update-activity', async (event, activity) => {
    if (isConnected) {
        await setActivity(activity);
    }
});

ipcMain.handle('get-status', () => {
    return {
        connected: isConnected,
        activity: currentActivity,
        connectionTime,
        appStartTime,
        lastUpdateTime
    };
});

// Settings IPC handlers
ipcMain.handle('get-settings', () => {
    return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings();
    return settings;
});

ipcMain.handle('get-saved-presence', () => {
    return loadSavedPresence();
});

ipcMain.handle('get-timestamps', () => {
    return {
        appStartTime,
        connectionTime,
        lastUpdateTime
    };
});

// Open external link
ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    createTray();

    // Check for updates after window is ready (if enabled)
    if (settings.checkUpdatesOnStartup) {
        setTimeout(() => {
            autoUpdater.checkForUpdates().catch(err => {
                console.log('Update check failed:', err.message);
            });
        }, 3000);
    }

    // Auto-connect if enabled and we have saved data
    if (settings.autoConnect && settings.savedClientId) {
        const savedPresence = loadSavedPresence();
        if (savedPresence && savedPresence.activity) {
            setTimeout(() => {
                connect(settings.savedClientId, savedPresence.activity);
            }, 2000);
        }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// IPC handler for manual update check
ipcMain.handle('check-for-updates', async () => {
    try {
        await autoUpdater.checkForUpdates();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// IPC handler to get app version
ipcMain.handle('get-version', () => {
    return app.getVersion();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Keep running in tray
    }
});

app.on('before-quit', async () => {
    app.isQuitting = true;
    await disconnect();
});
