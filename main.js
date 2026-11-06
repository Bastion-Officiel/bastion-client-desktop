const { app, BrowserWindow, shell, ipcMain, Menu, Tray, nativeImage, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execSync } = require('child_process');

// AutoUpdater (mises à jour automatiques comme Discord)
let autoUpdater = null;
try {
    const updaterModule = require('electron-updater');
    autoUpdater = updaterModule.autoUpdater;
} catch (e) {
    console.log("[Updater] electron-updater non chargé ou en dev:", e.message);
}

let mainWindow = null;
let splashWindow = null;
let tray = null;
let serverProcess = null;

// Vérifier si le serveur local répond sur le port 8080
function isServerReachable(url = 'http://127.0.0.1:8080/') {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            resolve(res.statusCode < 500);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1200, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Démarrer automatiquement le serveur BASTION embarqué
async function ensureServerStarted() {
    const alreadyRunning = await isServerReachable();
    if (alreadyRunning) {
        console.log("[Serveur] Moteur BASTION déjà actif.");
        return true;
    }

    // Recherche de l'emplacement de server.py (dev ou compilé)
    let serverDir = path.join(__dirname, '..', 'bastion-core');
    let serverScript = path.join(serverDir, 'server.py');

    if (!fs.existsSync(serverScript)) {
        serverDir = path.join(process.resourcesPath, 'bastion-core');
        serverScript = path.join(serverDir, 'server.py');
    }

    if (!fs.existsSync(serverScript)) {
        console.error("[Serveur] Fichier server.py introuvable à :", serverScript);
        return false;
    }

    sendSplashMessage("Démarrage du moteur BASTION...", null, true);

    const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
    console.log(`[Serveur] Lancement automatique : ${pythonBin} ${serverScript}`);

    try {
        serverProcess = spawn(pythonBin, ['server.py'], {
            cwd: serverDir,
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        serverProcess.stdout.on('data', (d) => {
            console.log(`[BASTION Server] ${d.toString().trim()}`);
        });

        serverProcess.stderr.on('data', (d) => {
            console.error(`[BASTION Server Log] ${d.toString().trim()}`);
        });

        serverProcess.on('exit', (code) => {
            console.log(`[BASTION Server] Processus arrêté avec le code ${code}`);
            serverProcess = null;
        });

        // Attente active jusqu'à ce que le serveur soit prêt (max 15 secondes)
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 500));
            const ready = await isServerReachable();
            if (ready) {
                console.log("[Serveur] Moteur BASTION connecté avec succès !");
                sendSplashMessage("Moteur prêt ! Connexion...", 100, false);
                return true;
            }
        }
    } catch (err) {
        console.error("[Serveur] Erreur au lancement du processus :", err);
    }

    return false;
}

// Instance unique (Single Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(initApp);
}

async function initApp() {
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.bastion.desktop');
    }
    createSplashWindow();
    const serverOk = await ensureServerStarted();
    if (!serverOk) {
        sendSplashMessage("Serveur non détecté — lancement quand même...", null, true);
    }
    setupAutoUpdater();
}

function getAppIcon() {
    const icoPath = path.join(__dirname, 'assets', 'icon.ico');
    const pngPath = path.join(__dirname, 'assets', 'icon.png');
    if (process.platform === 'win32' && fs.existsSync(icoPath)) {
        return nativeImage.createFromPath(icoPath);
    }
    if (fs.existsSync(pngPath)) {
        return nativeImage.createFromPath(pngPath);
    }
    return null;
}

// ─── Écran de Démarrage Splash (comme Discord) ───────────────────────────
function createSplashWindow() {
    const appIcon = getAppIcon();

    splashWindow = new BrowserWindow({
        width: 320,
        height: 380,
        frame: false,
        resizable: false,
        center: true,
        show: true,
        backgroundColor: '#1e1f22',
        icon: appIcon,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function sendSplashMessage(text, progress = null, indeterminate = true) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('updater-message', { text, progress, indeterminate });
    }
}

function notifyMainWindowUpdate(status, data = {}) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', { status, ...data });
    }
}

function setupAutoUpdater() {
    if (!autoUpdater || process.env.NODE_ENV === 'development' || !app.isPackaged) {
        sendSplashMessage("Lancement de BASTION...", 100, false);
        setTimeout(launchMainWindow, 1000);
        return;
    }

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
        sendSplashMessage("Recherche de mises à jour...", null, true);
        notifyMainWindowUpdate('checking');
    });

    autoUpdater.on('update-available', (info) => {
        sendSplashMessage(`Mise à jour v${info.version} disponible !`, 0, false);
        notifyMainWindowUpdate('available', { version: info.version });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const percent = Math.round(progressObj.percent);
        sendSplashMessage(`Téléchargement : ${percent}%`, percent, false);
        notifyMainWindowUpdate('downloading', { percent });
    });

    autoUpdater.on('update-downloaded', (info) => {
        sendSplashMessage("Mise à jour prête !", 100, false);
        notifyMainWindowUpdate('ready', { version: info.version });
        
        // Si nous sommes encore sur le Splash Screen au tout début, on peut installer direct ou lancer
        if (splashWindow && !splashWindow.isDestroyed()) {
            sendSplashMessage("Installation et redémarrage...", 100, false);
            setTimeout(() => {
                autoUpdater.quitAndInstall(false, true);
            }, 1200);
        }
    });

    autoUpdater.on('update-not-available', () => {
        sendSplashMessage("BASTION est à jour !", 100, false);
        notifyMainWindowUpdate('not-available');
        setTimeout(launchMainWindow, 800);
    });

    autoUpdater.on('error', (err) => {
        console.warn("[Updater] Erreur vérification mise à jour:", err.message);
        sendSplashMessage("Démarrage...", 100, false);
        notifyMainWindowUpdate('error', { error: err.message });
        setTimeout(launchMainWindow, 800);
    });

    autoUpdater.checkForUpdatesAndNotify().catch(() => {
        launchMainWindow();
    });

    // Vérification périodique en arrière-plan toutes les 30 minutes pendant que l'app tourne (comme Discord)
    setInterval(() => {
        if (autoUpdater && app.isPackaged) {
            autoUpdater.checkForUpdates().catch(e => console.log("[Updater background check error]:", e.message));
        }
    }, 30 * 60 * 1000);
}

function launchMainWindow() {
    if (mainWindow) return;
    createMainWindow();
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
    }
}

// ─── Fenêtre Principale de l'Application BASTION ──────────────────────────
function createMainWindow() {
    const appIcon = getAppIcon();

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 940,
        minHeight: 600,
        backgroundColor: '#1e1f22',
        icon: appIcon,
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#1e1f22',
            symbolColor: '#dbdee1',
            height: 32
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: true
        }
    });

    // Permissions WebRTC automatiques (Micro, Caméra, Partage d'écran HD)
    mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
        return ['media', 'notifications', 'pointerLock', 'fullscreen', 'display-capture'].includes(permission);
    });

    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(['media', 'notifications', 'pointerLock', 'fullscreen', 'display-capture'].includes(permission));
    });

    // Support natif de navigator.mediaDevices.getDisplayMedia dans Electron
    mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
            // Sélectionne le premier écran par défaut ou la fenêtre active
            if (sources && sources.length > 0) {
                callback({ video: sources[0] });
            } else {
                callback({});
            }
        }).catch((err) => {
            console.error('[DisplayMedia] Erreur sélection source écran:', err);
            callback({});
        });
    });

    // Page de reconnexion affichée quand le serveur n'est pas joignable
    let loadRetryCount = 0;
    const maxRetries = 30;

    const showReconnectPage = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        const reconnectHTML = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { background:#1e1f22; color:#dbdee1; font-family:'Segoe UI',sans-serif;
                   display:flex; flex-direction:column; align-items:center; justify-content:center;
                   height:100vh; -webkit-app-region:drag; }
            .spinner { width:48px; height:48px; border:4px solid #2b2d31; border-top:4px solid #5865F2;
                       border-radius:50%; animation:spin 1s linear infinite; margin-bottom:24px; }
            @keyframes spin { to { transform:rotate(360deg); } }
            h2 { font-size:18px; font-weight:700; margin-bottom:8px; }
            p { font-size:13px; color:#949ba4; margin-bottom:20px; text-align:center; max-width:320px; }
            button { -webkit-app-region:no-drag; background:#5865F2; color:#fff; border:none; padding:10px 24px;
                     border-radius:4px; font-size:14px; font-weight:600; cursor:pointer; transition:background .15s; }
            button:hover { background:#4752c4; }
        </style></head><body>
            <div class="spinner"></div>
            <h2>Connexion au serveur BASTION...</h2>
            <p>Le moteur BASTION n'est pas encore prêt. Vérifiez que le serveur est lancé (server.py).</p>
            <button onclick="location.reload()">Réessayer</button>
        </body></html>`;
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(reconnectHTML));
    };

    // Chargement direct de l'application BASTION (/app = connexion / inscription / salons)
    const loadApp = async () => {
        const serverReady = await isServerReachable('http://127.0.0.1:8080/');
        if (serverReady) {
            loadRetryCount = 0;
            mainWindow.loadURL("http://127.0.0.1:8080/app").catch((err) => {
                console.warn("[Client] Erreur de chargement :", err);
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) loadApp();
                }, 1500);
            });
        } else {
            loadRetryCount++;
            if (loadRetryCount <= 3) {
                // Premières tentatives silencieuses (le serveur démarre peut-être)
                console.log(`[Client] Serveur non prêt, tentative ${loadRetryCount}/${maxRetries}...`);
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) loadApp();
                }, 1500);
            } else if (loadRetryCount <= maxRetries) {
                // Afficher la page de reconnexion
                showReconnectPage();
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) loadApp();
                }, 3000);
            } else {
                showReconnectPage();
            }
        }
    };

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.warn("[Client] Échec de chargement:", errorCode, errorDescription);
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) loadApp();
        }, 2000);
    });

    loadApp();

    // Ouvrir les liens web externes dans le navigateur de l'utilisateur
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Minimisation dans la barre des tâches
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    createTray(appIcon);
}

function createTray(appIcon) {
    if (tray || !appIcon) return;

    try {
        tray = new Tray(appIcon);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Ouvrir BASTION', click: () => { mainWindow.show(); mainWindow.focus(); } },
            { type: 'separator' },
            {
                label: 'Quitter BASTION', click: () => {
                    app.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('BASTION — Hub');
        tray.setContextMenu(contextMenu);
        tray.on('double-click', () => {
            mainWindow.show();
            mainWindow.focus();
        });
    } catch (e) {
        console.warn("[Tray] Erreur initialisation tray:", e);
    }
}

// ─── Contrôles de la fenêtre & Mises à jour ──────────────────────────────
ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow && mainWindow.close());

// Déclencheur manuel d'installation ou vérification de mise à jour
ipcMain.on('install-update-now', () => {
    if (autoUpdater) {
        console.log("[Updater] Redémarrage immédiat pour installer la mise à jour...");
        autoUpdater.quitAndInstall(false, true);
    }
});

ipcMain.on('check-for-updates-manual', () => {
    if (autoUpdater && app.isPackaged) {
        autoUpdater.checkForUpdates().catch(e => console.log(e.message));
    }
});

// ─── Arrêt propre de l'application et du serveur embarqué ─────────────────
function killEmbeddedServer() {
    if (serverProcess) {
        console.log("[Serveur] Arrêt du processus BASTION...");
        if (process.platform === 'win32') {
            try {
                execSync(`taskkill /pid ${serverProcess.pid} /T /F`);
            } catch (e) {}
        } else {
            serverProcess.kill('SIGTERM');
        }
        serverProcess = null;
    }
}

app.on('before-quit', () => {
    app.isQuitting = true;
    killEmbeddedServer();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
