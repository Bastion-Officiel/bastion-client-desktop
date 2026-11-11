// =============================================================================
// BASTION Desktop — Real-Time Activity & Rich Presence Engine (Discord-like)
// Detects active games and developer IDEs on Windows/macOS/Linux
// =============================================================================

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Extensive catalog of recognized Games & Developer IDEs
const KNOWN_APPLICATIONS = {
    // -------------------------------------------------------------
    // JEUX VIDÉO (Type: 'game')
    // -------------------------------------------------------------
    'javaw.exe': { name: 'Minecraft', type: 'game', category: 'Sandbox / Aventure', icon: 'cube' },
    'minecraft.exe': { name: 'Minecraft', type: 'game', category: 'Sandbox / Aventure', icon: 'cube' },
    'minecraftlauncher.exe': { name: 'Minecraft Launcher', type: 'game', category: 'Launcher', icon: 'cube' },
    'leagueclientux.exe': { name: 'League of Legends', type: 'game', category: 'MOBA', icon: 'gamepad' },
    'league of legends.exe': { name: 'League of Legends', type: 'game', category: 'MOBA', icon: 'gamepad' },
    'valorant-win64-shipping.exe': { name: 'VALORANT', type: 'game', category: 'FPS Tactique', icon: 'crosshair' },
    'valorant.exe': { name: 'VALORANT', type: 'game', category: 'FPS Tactique', icon: 'crosshair' },
    'cs2.exe': { name: 'Counter-Strike 2', type: 'game', category: 'FPS Compétitif', icon: 'crosshair' },
    'csgo.exe': { name: 'Counter-Strike: Global Offensive', type: 'game', category: 'FPS Compétitif', icon: 'crosshair' },
    'gta5.exe': { name: 'Grand Theft Auto V', type: 'game', category: 'Action / Monde Ouvert', icon: 'car' },
    'fivem_b2699_gtaprocess.exe': { name: 'FiveM (GTA RP)', type: 'game', category: 'Roleplay GTA V', icon: 'car' },
    'fivem.exe': { name: 'FiveM (GTA RP)', type: 'game', category: 'Roleplay GTA V', icon: 'car' },
    'fortniteclient-win64-shipping.exe': { name: 'Fortnite', type: 'game', category: 'Battle Royale', icon: 'gamepad' },
    'robloxplayerbeta.exe': { name: 'Roblox', type: 'game', category: 'Plateforme de Jeux', icon: 'gamepad' },
    'rocketleague.exe': { name: 'Rocket League', type: 'game', category: 'Sport / Véhicule', icon: 'car' },
    'r5apex.exe': { name: 'Apex Legends', type: 'game', category: 'Battle Royale FPS', icon: 'crosshair' },
    'overwatch.exe': { name: 'Overwatch 2', type: 'game', category: 'Hero Shooter', icon: 'gamepad' },
    'cyberpunk2077.exe': { name: 'Cyberpunk 2077', type: 'game', category: 'RPG Cyberpunk', icon: 'zap' },
    'genshinimpact.exe': { name: 'Genshin Impact', type: 'game', category: 'Action RPG', icon: 'sparkles' },
    'eldenring.exe': { name: 'Elden Ring', type: 'game', category: 'Action RPG / Souls', icon: 'sword' },
    'rustclient.exe': { name: 'Rust', type: 'game', category: 'Survie Multijoueur', icon: 'shield' },
    'wow.exe': { name: 'World of Warcraft', type: 'game', category: 'MMORPG', icon: 'crown' },
    'osu!.exe': { name: 'osu!', type: 'game', category: 'Jeu de Rythme', icon: 'music' },
    'terraria.exe': { name: 'Terraria', type: 'game', category: 'Aventure 2D', icon: 'pickaxe' },
    'lethal company.exe': { name: 'Lethal Company', type: 'game', category: 'Horreur Coopérative', icon: 'ghost' },
    'among us.exe': { name: 'Among Us', type: 'game', category: 'Déduction Sociale', icon: 'user-check' },
    'fc24.exe': { name: 'EA SPORTS FC 24', type: 'game', category: 'Sport / Football', icon: 'trophy' },
    'fifa23.exe': { name: 'FIFA 23', type: 'game', category: 'Sport / Football', icon: 'trophy' },
    'brawlhalla.exe': { name: 'Brawlhalla', type: 'game', category: 'Combat / Plateforme', icon: 'swords' },
    'seaofthieves.exe': { name: 'Sea of Thieves', type: 'game', category: 'Aventure Pirate', icon: 'anchor' },
    'rainbowsix.exe': { name: 'Tom Clancy\'s Rainbow Six Siege', type: 'game', category: 'FPS Tactique', icon: 'crosshair' },

    // -------------------------------------------------------------
    // DÉVELOPPEMENT & CRÉATION (Type: 'dev')
    // -------------------------------------------------------------
    'antigravity ide.exe': { name: 'AntiGravity IDE', type: 'dev', category: 'IDE IA Avancé', icon: 'sparkles' },
    'antigravity.exe': { name: 'AntiGravity IDE', type: 'dev', category: 'IDE IA Avancé', icon: 'sparkles' },
    'agy.exe': { name: 'AntiGravity IDE', type: 'dev', category: 'IDE IA Avancé', icon: 'sparkles' },
    'code.exe': { name: 'Visual Studio Code', type: 'dev', category: 'Éditeur de Code', icon: 'code' },
    'devenv.exe': { name: 'Visual Studio', type: 'dev', category: 'IDE Professionnel', icon: 'code' },
    'idea64.exe': { name: 'IntelliJ IDEA', type: 'dev', category: 'IDE Java / Kotlin', icon: 'terminal' },
    'pycharm64.exe': { name: 'PyCharm', type: 'dev', category: 'IDE Python', icon: 'terminal' },
    'webstorm64.exe': { name: 'WebStorm', type: 'dev', category: 'IDE JavaScript / Web', icon: 'code' },
    'studio64.exe': { name: 'Android Studio', type: 'dev', category: 'Développement Mobile', icon: 'smartphone' },
    'clion64.exe': { name: 'CLion', type: 'dev', category: 'IDE C / C++', icon: 'code' },
    'phpstorm64.exe': { name: 'PhpStorm', type: 'dev', category: 'IDE PHP & Web', icon: 'code' },
    'cursor.exe': { name: 'Cursor AI', type: 'dev', category: 'Éditeur de Code IA', icon: 'code' },
    'sublime_text.exe': { name: 'Sublime Text', type: 'dev', category: 'Éditeur de Texte', icon: 'file-text' },
    'unity.exe': { name: 'Unity Editor', type: 'dev', category: 'Moteur de Jeu 3D/2D', icon: 'box' },
    'unrealeditor.exe': { name: 'Unreal Engine', type: 'dev', category: 'Moteur 3D Next-Gen', icon: 'cpu' },
    'blender.exe': { name: 'Blender 3D', type: 'dev', category: 'Modélisation & Animation 3D', icon: 'layers' },
    'godot.exe': { name: 'Godot Engine', type: 'dev', category: 'Moteur de Jeu Libre', icon: 'cpu' }
};

class ActivityMonitor {
    constructor(userDataPath, onActivityChange) {
        this.userDataPath = userDataPath;
        this.onActivityChange = onActivityChange;
        this.dataFile = path.join(userDataPath, 'bastion_activity_stats.json');

        this.currentActivity = null;
        this.manualActivity = null;
        this.lastRunningProcesses = [];
        this.stats = this.loadStats();
        this.scanInterval = null;
        this.isScanning = false;
    }

    loadStats() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                return {
                    unique_games: Array.isArray(data.unique_games) ? data.unique_games : [],
                    unique_dev_apps: Array.isArray(data.unique_dev_apps) ? data.unique_dev_apps : [],
                    custom_games: Array.isArray(data.custom_games) ? data.custom_games : [],
                    total_gaming_seconds: Number(data.total_gaming_seconds) || 0,
                    total_dev_seconds: Number(data.total_dev_seconds) || 0,
                    app_usage: data.app_usage || {},
                    activity_enabled: data.activity_enabled !== false
                };
            }
        } catch (e) {
            console.error('[ActivityMonitor] Erreur chargement stats:', e.message);
        }

        return {
            unique_games: [],
            unique_dev_apps: [],
            custom_games: [],
            total_gaming_seconds: 0,
            total_dev_seconds: 0,
            app_usage: {},
            activity_enabled: true
        };
    }

    saveStats() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.stats, null, 2), 'utf8');
        } catch (e) {
            console.error('[ActivityMonitor] Erreur sauvegarde stats:', e.message);
        }
    }

    start() {
        console.log('[ActivityMonitor] Démarrage de la détection d\'activité Discord-like...');
        this.scan();
        // Scanner les processus toutes les 3.5 secondes
        this.scanInterval = setInterval(() => this.scan(), 3500);
    }

    stop() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    scan() {
        if (this.isScanning) return;
        this.isScanning = true;

        if (process.platform === 'win32') {
            exec('tasklist /FO CSV /NH', { maxBuffer: 1024 * 1024 * 2 }, (error, stdout) => {
                this.isScanning = false;
                if (error || !stdout) return;
                this.processProcessList(stdout);
            });
        } else {
            exec('ps -A -o comm', (error, stdout) => {
                this.isScanning = false;
                if (error || !stdout) return;
                this.processProcessList(stdout);
            });
        }
    }

    processProcessList(rawOutput) {
        const lines = rawOutput.split(/\r?\n/);
        const runningSet = new Set();
        const procList = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            let procName = '';
            if (process.platform === 'win32') {
                const parts = line.split('","');
                procName = parts[0].replace(/^"/, '').toLowerCase();
            } else {
                procName = path.basename(line.trim()).toLowerCase();
            }
            if (procName) {
                runningSet.add(procName);
                if (!procList.includes(procName)) procList.push(procName);
            }
        }
        this.lastRunningProcesses = procList;

        if (!this.stats.activity_enabled) {
            if (this.currentActivity) {
                this.currentActivity = null;
                this.notify();
            }
            return;
        }

        // 1. Détection prioritaire : Recherche AntiGravity (insensible à la casse / exécutables multiples)
        let detected = null;
        for (const proc of runningSet) {
            if (proc.includes('antigravity') || proc === 'agy.exe' || proc.startsWith('agy')) {
                detected = {
                    name: 'AntiGravity IDE',
                    type: 'dev',
                    category: 'IDE IA & Agentic Coding',
                    icon: 'sparkles',
                    process: proc
                };
                break;
            }
        }

        // 2. Détection parmi les jeux personnalisés ajoutés par l'utilisateur
        if (!detected && Array.isArray(this.stats.custom_games)) {
            for (const cg of this.stats.custom_games) {
                const matchTarget = (cg.process || cg.name || '').toLowerCase();
                for (const proc of runningSet) {
                    if (proc === matchTarget || proc.includes(matchTarget)) {
                        detected = {
                            name: cg.name,
                            type: cg.type || 'game',
                            category: cg.category || 'Jeu Personnalisé',
                            icon: cg.icon || 'gamepad',
                            process: proc
                        };
                        break;
                    }
                }
                if (detected) break;
            }
        }

        // 3. Détection des Jeux Vidéo reconnus
        if (!detected) {
            for (const [procKey, appInfo] of Object.entries(KNOWN_APPLICATIONS)) {
                if (appInfo.type === 'game' && runningSet.has(procKey.toLowerCase())) {
                    detected = { ...appInfo, process: procKey };
                    break;
                }
            }
        }

        // 4. Détection des IDEs & Logiciels de dev reconnus
        if (!detected) {
            for (const [procKey, appInfo] of Object.entries(KNOWN_APPLICATIONS)) {
                if (appInfo.type === 'dev' && runningSet.has(procKey.toLowerCase())) {
                    detected = { ...appInfo, process: procKey };
                    break;
                }
            }
        }

        // 5. Fallback activité manuelle si définie
        if (!detected && this.manualActivity) {
            detected = this.manualActivity;
        }

        const now = Date.now();

        if (detected) {
            if (!this.currentActivity || this.currentActivity.name !== detected.name) {
                this.currentActivity = {
                    name: detected.name,
                    type: detected.type,
                    category: detected.category,
                    icon: detected.icon,
                    started_at: now
                };

                // Enregistrer dans les apps uniques pour les badges
                if (detected.type === 'game') {
                    if (!this.stats.unique_games.includes(detected.name)) {
                        this.stats.unique_games.push(detected.name);
                    }
                } else if (detected.type === 'dev') {
                    if (!this.stats.unique_dev_apps.includes(detected.name)) {
                        this.stats.unique_dev_apps.push(detected.name);
                    }
                }

                this.saveStats();
                this.notify();
            } else {
                // Incrémentation du temps cumulé
                if (detected.type === 'game') {
                    this.stats.total_gaming_seconds += 4;
                } else if (detected.type === 'dev') {
                    this.stats.total_dev_seconds += 4;
                }

                if (!this.stats.app_usage[detected.name]) {
                    this.stats.app_usage[detected.name] = 0;
                }
                this.stats.app_usage[detected.name] += 4;

                if (this.stats.total_gaming_seconds % 20 < 4 || this.stats.total_dev_seconds % 20 < 4) {
                    this.saveStats();
                }
            }
        } else {
            if (this.currentActivity) {
                this.currentActivity = null;
                this.saveStats();
                this.notify();
            }
        }
    }

    addCustomGame(name, type = 'game', category = 'Jeu Personnalisé') {
        if (!name || !name.trim()) return false;
        const cleanName = name.trim();
        if (!Array.isArray(this.stats.custom_games)) this.stats.custom_games = [];
        
        const existingIdx = this.stats.custom_games.findIndex(g => g.name.toLowerCase() === cleanName.toLowerCase());
        if (existingIdx >= 0) {
            this.stats.custom_games[existingIdx] = { name: cleanName, type, category };
        } else {
            this.stats.custom_games.push({ name: cleanName, type, category });
        }

        if (type === 'game' && !this.stats.unique_games.includes(cleanName)) {
            this.stats.unique_games.push(cleanName);
        } else if (type === 'dev' && !this.stats.unique_dev_apps.includes(cleanName)) {
            this.stats.unique_dev_apps.push(cleanName);
        }

        this.saveStats();
        this.scan();
        return true;
    }

    removeCustomGame(name) {
        if (!name || !Array.isArray(this.stats.custom_games)) return false;
        this.stats.custom_games = this.stats.custom_games.filter(g => g.name !== name);
        this.saveStats();
        this.scan();
        return true;
    }

    setActivityEnabled(enabled) {
        this.stats.activity_enabled = !!enabled;
        this.saveStats();
        this.scan();
        this.notify();
    }

    getRunningProcesses() {
        return this.lastRunningProcesses || [];
    }

    notify() {
        if (typeof this.onActivityChange === 'function') {
            this.onActivityChange(this.getPayload());
        }
    }

    getPayload() {
        return {
            current: this.currentActivity ? {
                ...this.currentActivity,
                elapsed_seconds: Math.floor((Date.now() - this.currentActivity.started_at) / 1000)
            } : null,
            stats: {
                unique_games: this.stats.unique_games,
                unique_games_count: this.stats.unique_games.length,
                unique_dev_apps: this.stats.unique_dev_apps,
                unique_dev_count: this.stats.unique_dev_apps.length,
                custom_games: this.stats.custom_games || [],
                total_gaming_seconds: this.stats.total_gaming_seconds,
                total_gaming_hours: Math.floor(this.stats.total_gaming_seconds / 3600),
                total_dev_seconds: this.stats.total_dev_seconds,
                total_dev_hours: Math.floor(this.stats.total_dev_seconds / 3600),
                app_usage: this.stats.app_usage,
                activity_enabled: this.stats.activity_enabled !== false
            }
        };
    }
}

module.exports = ActivityMonitor;
