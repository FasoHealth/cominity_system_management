const admin = require('firebase-admin');

// Configuration Firebase pour le backend
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialiser Firebase Admin SDK
if (admin.apps.length === 0) {
  try {
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId
      });
    } else {
      // Initialiser sans credential pour les autres fonctionnalités
      admin.initializeApp({
        projectId: serviceAccount.projectId
      });
    }
  } catch (error) {
    // Erreur silencieuse
  }
}

module.exports = admin;
