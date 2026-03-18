import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InstallAppBanner = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Détection si l'app est ouverte en mode standalone (PWA, TWA, ou WebView app mobile)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone
            || document.referrer.includes('android-app://');

        // Vérifier si l'utilisateur a déjà fermé la bannière
        const hasDismissed = localStorage.getItem('hideAppInstallPrompt');

        // Afficher seulement si c'est sur le navigateur web classique et non fermé
        if (!isStandalone && !hasDismissed) {
            setIsVisible(true);
        }
    }, []);

    if (!isVisible) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('hideAppInstallPrompt', 'true');
    };

    return (
        <div style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 99999,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '16px', boxShadow: 'var(--shadow-lg)',
            display: 'flex', alignItems: 'center', gap: 16, maxWidth: 360,
            animation: 'slideUp 0.4s ease-out'
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'var(--brand-orange-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                <Smartphone size={24} color="var(--brand-orange)" />
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('app.install_prompt.title')}
                </h4>
                <p style={{ margin: '4px 0 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {t('app.install_prompt.desc')}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 6, display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => alert(t('landing.app_download_alert'))}>
                        <Download size={14} /> {t('app.install_prompt.btn')}
                    </button>
                </div>
            </div>

            <button onClick={handleDismiss} title={t('app.install_prompt.close')} style={{
                position: 'absolute', top: 10, right: 10, background: 'transparent',
                border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4
            }}>
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default InstallAppBanner;
