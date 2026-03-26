# 🛡️ Community Security Alert (CSA)

**Projet CS27 - Groupe 16**  
Une plateforme communautaire web et mobile de vigilance citoyenne permettant de signaler les incidents de sécurité en temps réel.

---

## 🚀 Fonctionnalités Clés

### 👤 Citoyens (Users)
- **Inscription & Vérification par E-mail** : Sécurisée par JWT et bcrypt, avec envoi d'un e-mail réel (via **EmailJS**) contenant un lien de vérification unique.
- **Affichage du Mot de Passe** : Option de visibilité ajoutée lors de la création de compte pour une meilleure expérience utilisateur.
- **Signalement d'incident** : Formulaire complet avec photos/vidéos (Upload Cloudinary), catégorie, gravité et géolocalisation.
- **Fil d'actualité public** : Consultation des alertes approuvées par la modération (UI optimisée contre les débordements).
- **Messagerie Multimédia Intégrée** : Discussion directe avec l'administration sur chaque incident. Support des **Messages Vocaux (Microphone intégré)**, de l'envoi d'images et de vidéos.
- **Gestion de Profil** : Mise à jour des informations personnelles et de l'avatar (hébergé sur le Cloud).
- **Anonymat & Upvote** : Possibilité de signaler sans divulguer son identité et de confirmer les alertes d'autres citoyens.

### 🛡️ Administration (Admins)
- **📊 Dashboard Admin Optimisé** : Statistiques en temps réel avec graphiques adaptatifs (Bar Charts/Pie Charts) corrigés pour tout type d'écran.
- **📍 Carte Interactive (Live Map)** : Visualisation en temps réel via Leaflet avec **clustering intelligent** pour les zones denses et filtres temporels.
- **⚡ Notifications Temps Réel** : Architecture **SSE (Server-Sent Events)** pour des alertes instantanées avec interface anti-débordement.
- **Centre de Modération** : Interface de gestion des flux (En attente, Approuvés, Rejetés, Résolus).
- **📱 Support Mobile** : Bouton de téléchargement direct pour l'application Android (APK Flutter) depuis le panneau de navigation.
- **🌍 Internationalisation** : Support multi-langue intégral (Français / Anglais) propulsé par `i18next`.

---

## 🛠️ Stack Technique & Infrastructure

- **Backend** : Node.js, Express.js.
- **Base de données** : MongoDB (Mongoose) / MongoDB Atlas.
- **Frontend** : React.js (Hooks & Context API), Axios, React Router v6.
- **Gestion des Fichiers (Cloud)** : **Cloudinary** (Sert au stockage des preuves d'incidents, des médias de la messagerie et des avatars). Supprime les dépendances au stockage local du serveur.
- **Service d'E-mail** : **EmailJS** (Intégration Frontend pour l'envoi de l'e-mail de confirmation à l'inscription).
- **Design & UI** : Vanilla CSS complet. Design System "Premium" avec mockups interactifs CSS, thèmes sombres et animations fluides (glassmorphism, mesh-gradients).

---

## 🚦 Installation et Lancement Rapide

Pour tester le projet localement, clonez le dépôt et suivez ces instructions depuis la **racine du projet** :

### 1. Installation des dépendances
```bash
npm run install-all
```
*Cette commande racine installe automatiquement les paquets du répertoire `frontend` et du répertoire `backend`.*

### 2. Configuration des variables d'environnement (`.env`)

**Dans le dossier `backend/` :**
Créez un fichier `.env` avec ces clés :
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/community_security_alert
# Configuration EmailJS (Backend)
EMAILJS_SERVICE_ID=service_8fox4fq
EMAILJS_TEMPLATE_ID=template_eeznyk4
EMAILJS_PUBLIC_KEY=rHLfamwAfwAgHZm4W
# URL de Base (IP locale pour tests mobiles)
BASE_URL=http://192.168.100.237:5000
# Clés Secrètes
JWT_SECRET=votre_cle_secrete_jwt
JWT_EXPIRE=7d
# Identifiants Cloudinary (Essentiel pour l'envoi d'images/audios)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
# URL du Front
CLIENT_URL=http://localhost:3000
```

**Dans le dossier `frontend/` :**
Créez un fichier `.env` avec :
```env
PORT=3000
SKIP_PREFLIGHT_CHECK=true
```
*(Assurez-vous également d'avoir configuré vos clés de modèle EmailJS dans `RegisterPage.js`).*


### 3. Lancement du projet (Dev)

**Important (Mobile) :** Pour connecter l'application Flutter au backend local, assurez-vous que votre téléphone est sur le même Wi-Fi et que l'IP dans `ApiService.dart` (Flutter) et `.env` (Backend) correspond à celle de votre machine (actuellement `192.168.100.237`).

Toujours à la racine du projet, lancez le frontend et le backend simultanément :
```bash
npm run dev
```
* Le serveur Backend écoutera sur le port `5000`.
* L'application web React s'ouvrira sur `http://localhost:3000`.

---

## 📂 Structure du Projet

```text
community-security-alert/
├── backend/
│   ├── config/            # Configurations externes (Cloudinary, Swagger)
│   ├── middleware/        # Protection JWT, Upload Multer & Admin guards
│   ├── models/            # Schémas Mongoose (User, Incident, Message, Notification)
│   ├── routes/            # Points d'accès API REST
│   └── server.js          # Point d'entrée Express
└── frontend/
    ├── public/            # Fichiers statiques et assets graphiques
    └── src/
        ├── components/    # Composants (ChatBox Multi-média, Navbars, Map)
        ├── context/       # AuthContext, NotificationContext
        ├── pages/         # Vues Principales (Landing, Dashboard, Reporting)
        ├── locales/       # Fichiers de traduction (en.json, fr.json)
        └── index.css      # Feuille de style globale (Mockups & UI Premium)
```

---

## 🔒 Sécurité & Performance
- **Validation** : Entrées validées via `express-validator` protégeant contre l'injection.
- **Stockage Délégué** : Plus de problème de mémoire disque grâce à l'envoi direct des flux Multer vers les serveurs Cloudinary (`multer-storage-cloudinary`).
- **Limites d'Upload** : Protection contre les spams avec des limites de poids (10Mo) et de nombre (4 max par incident).
- **Mots de passe** : Hachage fort par `bcryptjs`.

---

**Développé avec ❤️ pour la sécurité de la communauté.**
