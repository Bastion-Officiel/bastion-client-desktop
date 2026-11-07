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
    'code.exe': { name: 'Visual Studio Code', type: 'dev', category: 'Éditeur de Code', icon: 'code' },
    'devenv.exe': { name: 'Visual Studio', type: 'dev', category: 'IDE Professionnel', icon: 'code' },
    'idea64.exe': { name: 'IntelliJ IDEA', type: 'dev', category: 'IDE Java / Kotlin', icon: 'terminal' },
    'pycharm64.exe': { name: 'PyCharm', type: 'dev', category: 'IDE Python', icon: 'terminal' },
    'webstorm64.exe': { name: 'WebStorm', type: 'dev', category: 'IDE JavaScript / Web', icon: 'code' },
    'studio64.exe': { name: 'Android Studio', type: 'dev', category: 'Développement Mobile', icon: 'smartphone' },
    'clion64.exe': { name: 'CLion', type: 'dev', category: 'IDE C / C++', icon: 'code' },
    'phpstorm64.exe': { name: 'PhpStorm', type: 'dev', category: 'IDE PHP & Web', icon: 'code' },
    'antigravity ide.exe': { name: 'Antigravity IDE', type: 'dev', category: 'IDE IA Avancé', icon: 'sparkles' },
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
                    total_gaming_seconds: Number(data.total_gaming_seconds) || 0,
                    total_dev_seconds: Number(data.total_dev_seconds) || 0,
                    app_usage: data.app_usage || {}
                };
            }
        } catch (e) {
            console.error('[ActivityMonitor] Erreur chargement stats:', e.message);
        }

        return {
            unique_games: [],
            unique_dev_apps: [],
            total_gaming_seconds: 0,
            total_dev_seconds: 0,
            app_usage: {}
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
        // Scanner les processus toutes les 4 secondes
        this.scanInterval = setInterval(() => this.scan(), 4000);
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
            // tasklist rapide sous Windows
            exec('tasklist /FO CSV /NH', { maxBuffer: 1024 * 1024 * 2 }, (error, stdout) => {
                this.isScanning = false;
                if (error || !stdout) return;
                this.processProcessList(stdout);
            });
        } else {
            // macOS / Linux (ps -A -o comm)
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

        for (const line of lines) {
            if (!line.trim()) continue;
            // Extraire le premier champ (ex: "Code.exe" ou /path/to/app)
            let procName = '';
            if (process.platform === 'win32') {
                const parts = line.split('","');
                procName = parts[0].replace(/^"/, '').toLowerCase();
            } else {
                procName = path.basename(line.trim()).toLowerCase();
            }
            if (procName) runningSet.add(procName);
        }

        // Trouver la meilleure application active
        let detected = null;

        // Priorité 1: Jeux vidéo
        for (const [procKey, appInfo] of Object.entries(KNOWN_APPLICATIONS)) {
            if (appInfo.type === 'game' && runningSet.has(procKey.toLowerCase())) {
                detected = { ...appInfo, process: procKey };
                break;
            }
        }

        // Priorité 2: Outils de développement si aucun jeu n'est en cours
        if (!detected) {
            for (const [procKey, appInfo] of Object.entries(KNOWN_APPLICATIONS)) {
                if (appInfo.type === 'dev' && runningSet.has(procKey.toLowerCase())) {
                    detected = { ...appInfo, process: procKey };
                    break;
                }
            }
        }

        const now = Date.now();

        if (detected) {
            if (!this.currentActivity || this.currentActivity.name !== detected.name) {
                // Nouvelle activité détectée
                this.currentActivity = {
                    name: detected.name,
                    type: detected.type,
                    category: detected.category,
                    icon: detected.icon,
                    started_at: now
                };

                // Enregistrer dans les apps uniques
                if (detected.type === 'game' && !this.stats.unique_games.includes(detected.name)) {
                    this.stats.unique_games.push(detected.name);
                } else if (detected.type === 'dev' && !this.stats.unique_dev_apps.includes(detected.name)) {
                    this.stats.unique_dev_apps.push(detected.name);
                }

                this.saveStats();
                this.notify();
            } else {
                // Activité en cours : incrémenter 4 secondes de temps
                if (detected.type === 'game') {
                    this.stats.total_gaming_seconds += 4;
                } else if (detected.type === 'dev') {
                    this.stats.total_dev_seconds += 4;
                }

                if (!this.stats.app_usage[detected.name]) {
                    this.stats.app_usage[detected.name] = 0;
                }
                this.stats.app_usage[detected.name] += 4;

                // Sauvegarder périodiquement toutes les ~20 secondes
                if (this.stats.total_gaming_seconds % 20 < 4 || this.stats.total_dev_seconds % 20 < 4) {
                    this.saveStats();
                }
            }
        } else {
            if (this.currentActivity) {
                // L'utilisateur a quitté le jeu / l'IDE
                this.currentActivity = null;
                this.saveStats();
                this.notify();
            }
        }
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
                total_gaming_seconds: this.stats.total_gaming_seconds,
                total_gaming_hours: Math.floor(this.stats.total_gaming_seconds / 3600),
                total_dev_seconds: this.stats.total_dev_seconds,
                total_dev_hours: Math.floor(this.stats.total_dev_seconds / 3600),
                app_usage: this.stats.app_usage
            }
        };
    }
}

module.exports = ActivityMonitor;

