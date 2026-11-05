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
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (event, data) => callback(data));
    }
});

