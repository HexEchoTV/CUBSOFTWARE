const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cubpresence', {
    // Connection
    connect: (clientId, activity) => ipcRenderer.invoke('connect', { clientId, activity }),
    disconnect: () => ipcRenderer.invoke('disconnect'),
    updateActivity: (activity) => ipcRenderer.invoke('update-activity', activity),
    getStatus: () => ipcRenderer.invoke('get-status'),

    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getSavedPresence: () => ipcRenderer.invoke('get-saved-presence'),
    getTimestamps: () => ipcRenderer.invoke('get-timestamps'),

    // Profiles
    getProfiles: () => ipcRenderer.invoke('get-profiles'),
    saveProfile: (name, data) => ipcRenderer.invoke('save-profile', { name, data }),
    deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),

    // Updates
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    getVersion: () => ipcRenderer.invoke('get-version'),

    // External links
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Event listeners
    onStatus: (callback) => ipcRenderer.on('status', (event, data) => callback(data)),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
    onTimestamps: (callback) => ipcRenderer.on('timestamps', (event, data) => callback(data)),
    onQuickConnect: (callback) => ipcRenderer.on('quick-connect', (event, data) => callback(data))
});
