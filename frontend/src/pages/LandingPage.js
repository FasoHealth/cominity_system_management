// frontend/src/pages/LandingPage.js
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, BellRing, MapPin, Users, ArrowRight, ShieldCheck, Zap, Download, X } from 'lucide-react';

const LandingPage = () => {
    const { t } = useTranslation();
    const { isLoggedIn, loading } = useAuth();
    const navigate = useNavigate();

    const [showAppBanner, setShowAppBanner] = React.useState(false);

    useEffect(() => {
        // Rediriger automatiquement les utilisateurs connectés vers leur flux
        if (!loading && isLoggedIn) {
            navigate('/feed', { replace: true });
        }

        // Détection mobile basique pour le bouton de téléchargement
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            setShowAppBanner(true);
        }
    }, [isLoggedIn, loading, navigate]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
            {/* Banner Mobile App */}
            {showAppBanner && (
                <div className="fade-in" style={{ background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldAlert size={20} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('landing.app_title')}</div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{t('landing.app_subtitle')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-sm" style={{ background: '#fff', color: 'var(--brand-navy)', borderRadius: 20, padding: '6px 16px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}
                            onClick={() => window.open('https://drive.google.com/file/d/12TuyZplfoGf4QT_kMKFdZr18qW8Bjw6H/view?usp=drive_link', '_blank')}>
                            <Download size={14} /> {t('landing.app_install')}
                        </button>
                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: 4, cursor: 'pointer' }} onClick={() => setShowAppBanner(false)}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}


            {/* Arrière-plan décoratif (Premium Mesh Gradients) */}
            <div className="mesh-gradient-1" />
            <div className="mesh-gradient-2" />
            <div className="mesh-gradient-3" />

            {/* Navbar simplifié pour le landing */}
            <nav className="landing-nav fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="brand-icon">
                        <ShieldAlert size={22} color="#fff" />
                    </div>
                    <span className="brand-name">
                        {t('nav.brand_name')}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Link to="/login" className="nav-link-secondary">
                        {t('landing.nav_login')}
                    </Link>
                    <Link to="/register" className="btn btn-primary" style={{ borderRadius: 24, padding: '10px 24px' }}>
                        {t('landing.hero_join_btn')}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="landing-hero">
                <div className="hero-tag slide-up">
                    <Zap size={14} fill="currentColor" /> {t('landing.hero_tag')}
                </div>

                <h1 className="hero-title slide-up stagger-1">
                    {t('landing.hero_title_1')} <span className="text-gradient">{t('landing.hero_title_2')}</span>
                </h1>

                <p className="hero-desc slide-up stagger-2">
                    {t('landing.hero_desc')}
                </p>

                <div className="hero-actions slide-up stagger-3">
                    <Link to="/report" className="btn btn-primary btn-lg hero-btn">
                        <BellRing size={20} /> {t('landing.hero_report_btn')}
                    </Link>
                    <Link to="/register" className="btn btn-secondary btn-lg hero-btn">
                        {t('landing.hero_join_btn')} <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Mockup removed as per user request */}
            </main>

            {/* Features Section */}
            <section className="landing-features">
                <div className="grid-3" style={{ gap: 32 }}>
                    {[
                        { icon: <BellRing size={28} />, title: t('landing.feature_realtime_title'), desc: t('landing.feature_realtime_desc'), color: '#EF4444', delay: 'stagger-1' },
                        { icon: <MapPin size={28} />, title: t('landing.feature_map_title'), desc: t('landing.feature_map_desc'), color: '#3B82F6', delay: 'stagger-2' },
                        { icon: <ShieldCheck size={28} />, title: t('landing.feature_mod_title'), desc: t('landing.feature_mod_desc'), color: '#10B981', delay: 'stagger-3' }
                    ].map((f, i) => (
                        <div key={i} className={`feature-card card-interactive slide-up ${f.delay}`}>
                            <div className="feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center', marginTop: 80, position: 'relative', zIndex: 10 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {t('landing.footer', { year: new Date().getFullYear() })}
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
