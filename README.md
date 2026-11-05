# 🏰 BASTION Desktop — Application Client Officielle

<p align="center">
  <img src="assets/icon.png" width="96" height="96" alt="BASTION Desktop Icon" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-5865F2?style=for-the-badge&logo=windows&logoColor=white" alt="Platform" />
  <a href="https://electronjs.org"><img src="https://img.shields.io/badge/Electron-33.0%2B-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" /></a>
  <img src="https://img.shields.io/badge/License-MIT-23A55A?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>L'application de bureau native pour BASTION — Communication Hub.</strong><br/>
  Salons vocaux à faible latence, conférences Stage, son haute fidélité, partage d'écran HD, intégration barre des tâches (Tray) et notifications de bureau.
</p>

---

## ⚡ Caractéristiques du Client

- 🎨 **Interface Moderne Glassmorphism** : Fenêtre sans bordures avec contrôles personnalisés (Réduire, Agrandir, Fermer).
- 🔄 **Système d'Auto-Update (Style Discord)** : Vérification automatique des mises à jour au lancement et toutes les 30 minutes, avec bouton vert clignotant *"Mise à jour prête"* dans le chat header et installation transparente.
- 🎙️ **Microphone & WebRTC Natifs** : Prise en charge automatique des permissions audio/vidéo sans pop-up de navigateur.
- 🖥️ **Partage d'écran HD 60 FPS** : Capture d'écrans entiers ou fenêtres individuelles.
- 🔔 **Système Tray & Notifications** : Minimisation en arrière-plan dans la barre des tâches de Windows.
- 🌐 **Sélecteur d'Instance** : Connexion à votre propre serveur BASTION en un clic.

---

## 🚀 Installation & Développement

### 1. Prérequis
- [Node.js](https://nodejs.org) (v18 ou supérieur)

### 2. Cloner et installer
```bash
cd bastion-client-desktop
npm install
```

### 3. Lancer en mode développement
```bash
npm start
```

### 4. Compiler l'installateur Windows (.exe)
```bash
npm run build:win
```
L'installateur NSIS `.exe` sera généré dans le sous-dossier `dist/`.

---

## 📄 Licence
Ce projet est sous licence **MIT**.
