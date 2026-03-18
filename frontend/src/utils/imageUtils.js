import axios from 'axios';

/**
 * Construit l'URL complète pour une image d'incident.
 * Gère les URLs Cloudinary (http/https) et les anciens chemins locaux (uploads/).
 * 
 * @param {string} path - Le chemin ou l'URL stocké dans la base de données.
 * @returns {string} - L'URL complète prête à être utilisée dans une balise <img>.
 */
export const getImageUrl = (path) => {
    if (!path) return '';

    // Si le chemin est déjà une URL complète (Cloudinary), la retourner telle quelle.
    if (path.startsWith('http')) {
        return path;
    }

    // Récupérer la base URL de l'API (définie dans index.js via axios.defaults.baseURL)
    // Si non définie, on utilise le domaine actuel par défaut.
    const baseUrl = axios.defaults.baseURL || 'http://localhost:5000';

    // Normalisation pour gérer les backslashes Windows si présents dans d'anciennes données
    const normalizedPath = path.replace(/\\/g, '/');

    // Cas des anciennes images locales stockées sous 'uploads/incidents/...'
    if (normalizedPath.startsWith('uploads/')) {
        const filename = normalizedPath.replace('uploads/incidents/', '');
        // On utilise la route spéciale de compatibilité du backend
        return `${baseUrl}/uploads/incidents/local/${filename}`;
    }

    // Cas général pour tout autre chemin relatif au serveur
    return `${baseUrl}/${normalizedPath}`;
};
