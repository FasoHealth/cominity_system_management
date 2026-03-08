# 🛡️ Community Security Alert (CSA)

**Projet CS27 - Groupe 16**  
Une plateforme communautaire de vigilance citoyenne permettant de signaler les incidents de sécurité en temps réel.

---

## 🚀 Fonctionnalités Clés

### 👤 Citoyens (Users)
- **Inscription & Connexion Sécurisée** : Protection par JWT et bcrypt.
- **Signalement d'incident** : Formulaire complet avec photos (Multer), catégorie, gravité et géolocalisation.
- **Anonymat** : Possibilité de signaler sans divulguer son identité.
- **Fil d'actualité public** : Consultation des alertes approuvées par la modération.
- **Confirmation (Upvote)** : Les citoyens peuvent confirmer la véracité d'une alerte.
- **Notifications** : Alertes en temps réel sur le statut des signalements (Approuvé/Rejeté/Résolu).

### 🛡️ Administration (Admins)
- **Tableau de bord Statistique** : Visualisation globale via graphiques dynamiques (Recharts).
- **Centre de Modération** : Interface de gestion des flux (En attente, Approuvés, Rejetés, Résolus).
- **Gestion des Utilisateurs** : Possibilité de désactiver/activer les comptes citoyens.
- **Notes de Modération** : Communication directe avec l'auteur du signalement.

---

## 🛠️ Stack Technique

- **Backend** : Node.js, Express.js, MongoDB (Mongoose), JWT, Bcryptjs, Multer.
- **Frontend** : React.js (Hooks & Context API), Axios, React Router v6, Recharts.
- **Design** : CSS Personnalisé (Thème sombre "Professional Blue & Danger Red").

---

## 🚦 Installation et Lancement Rapide

Pour aider les membres du groupe à démarrer rapidement, vous pouvez utiliser les commandes suivantes depuis la **racine du projet** :

### 1. Installation de toutes les dépendances
```bash
npm run install-all
```
*Cette commande installe automatiquement les dépendances du frontend et du backend.*

### 2. Configuration des variables d'environnement
Il est **crucial** de créer les fichiers `.env` pour que le projet fonctionne :

**Dans le dossier `backend/` :**
Créez un fichier `.env` avec :
```env
PORT=5000
MONGO_URI=votre_lien_mongodb
JWT_SECRET=votre_cle_secrete_super_complexe
CLIENT_URL=http://localhost:3000
```

**Dans le dossier `frontend/` :**
Créez un fichier `.env` avec :
```env
PORT=3000
SKIP_PREFLIGHT_CHECK=true
```

### 3. Lancement du projet
Toujours à la racine du projet, lancez le frontend et le backend simultanément :
```bash
npm run dev
```
*Le backend sera sur le port 5000 et le frontend sur le port 3000.*

---

## 📂 Gestion du projet (Git)
Avant de pousser vos modifications, assurez-vous d'avoir bien configuré votre `.gitignore` (déjà présent à la racine) pour ne pas envoyer vos dossiers `node_modules` et vos secrets `.env`.

---

## 📂 Structure du Projet

```text
community-security-alert/
├── backend/
│   ├── middleware/        # Protection JWT & Admin guards
│   ├── models/            # Schémas Mongoose (User, Incident, Notification)
│   ├── routes/            # API REST endpoints
│   ├── uploads/           # Stockage des images d'incidents
│   └── server.js          # Configuration globale Express & MongoDB
└── frontend/
    ├── public/
    └── src/
        ├── components/    # Composants réutilisables (Layout, Sidebar)
        ├── context/       # AuthContext pour l'état global
        ├── pages/         # Pages Citoyens & Admin
        ├── App.js         # Routage principal
        └── index.css      # Design System & Thème sombre
```

## 🔒 Sécurité & Performance
- **Validation** : Toutes les entrées API sont validées via `express-validator`.
- **Uploads** : Limite de 4 fichiers par signalement, max 5Mo par image.
- **Optimisation** : Indexation MongoDB sur les champs de recherche fréquents.
- **UX** : Animations fluides (Fade-in) et feedback visuel sur toutes les actions.

---

**Développé avec ❤️ pour la sécurité de la communauté.**
