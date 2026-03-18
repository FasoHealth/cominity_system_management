/**
 * Formate une date relative (ex: "Il y a 5 min", "Just now").
 * 
 * @param {Date|string} date - La date à formater.
 * @param {Function} t - La fonction de traduction t de i18next.
 * @param {string} language - La langue actuelle (i18n.language).
 * @returns {string} - La chaîne formatée.
 */
export const timeAgo = (date, t, language = 'fr') => {
    if (!date) return '';
    const dateObj = new Date(date);
    const sec = Math.floor((Date.now() - dateObj) / 1000);

    if (sec < 60) return t('feed.time.now');

    const min = Math.floor(sec / 60);
    if (min < 60) return t('feed.time.min', { count: min });

    const h = Math.floor(min / 60);
    if (h < 24) return t('feed.time.hour', { count: h });

    const d = Math.floor(h / 24);
    if (d < 7) return t('feed.time.day', { count: d });

    return dateObj.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
};

/**
 * Formate une date de manière localisée.
 * 
 * @param {Date|string} date - La date à formater.
 * @param {string} language - La langue actuelle.
 * @returns {string} - La date localisée.
 */
export const formatDate = (date, language = 'fr') => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
