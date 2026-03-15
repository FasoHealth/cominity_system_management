import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const LanguageSwitcher = () => {
    const { t } = useTranslation();
    const currentLang = i18n.language;

    const changeLang = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="lang-switcher-floating">
            <button 
                className={`lang-btn ${currentLang === 'fr' ? 'active' : ''}`}
                onClick={() => changeLang('fr')}
                aria-label="Français"
            >
                <span className="lang-flag">🇫🇷</span>
                <span>FR</span>
            </button>
            <button 
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                onClick={() => changeLang('en')}
                aria-label="English"
            >
                <span className="lang-flag">🇺🇸</span>
                <span>EN</span>
            </button>
        </div>
    );
};

export default LanguageSwitcher;
