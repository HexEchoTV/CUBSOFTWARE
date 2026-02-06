const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('cubpresence', {
    // Connect to Discord
    connect: (clientId, activity) => ipcRenderer.invoke('connect', { clientId, activity }),

    // Disconnect from Discord
    disconnect: () => ipcRenderer.invoke('disconnect'),

    // Update current activity
    updateActivity: (activity) => ipcRenderer.invoke('update-activity', activity),

    // Get current status
    getStatus: () => ipcRenderer.invoke('get-status'),

    // Listen for status updates
    onStatus: (callback) => {
        ipcRenderer.on('status', (event, data) => callback(data));
    },

    // Get app version
    getVersion: () => ipcRenderer.invoke('get-version'),

    // Check for updates manually
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Listen for update status
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (event, data) => callback(data));
    }
});
