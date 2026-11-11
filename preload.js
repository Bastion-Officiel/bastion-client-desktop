const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bastionDesktop', {
    isDesktopApp: true,
    version: '1.0.0',
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveServerUrl: (url) => ipcRenderer.invoke('save-server-url', url),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    installUpdateNow: () => ipcRenderer.send('install-update-now'),
    checkForUpdatesManual: () => ipcRenderer.send('check-for-updates-manual'),
    writeClipboard: (text) => ipcRenderer.invoke('clipboard-write', text),
    saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (event, data) => callback(data));
    },
    onActivityUpdate: (callback) => {
        ipcRenderer.on('user-activity-update', (event, data) => callback(data));
    },
    getUserActivity: () => ipcRenderer.invoke('get-user-activity'),
    addCustomGame: (opts) => ipcRenderer.invoke('add-custom-game', opts),
    removeCustomGame: (name) => ipcRenderer.invoke('remove-custom-game', name),
    toggleActivityEnabled: (enabled) => ipcRenderer.invoke('toggle-activity-enabled', enabled),
    getRunningApps: () => ipcRenderer.invoke('get-running-apps')
});
