// frontend/src/pages/LandingPage.js
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, BellRing, MapPin, Users, ArrowRight, ShieldCheck, Zap, Download, X } from 'lucide-react';

const LandingPage = () => {
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
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>CS Alert Mobile</div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>Plus rapide, notifications push</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-sm" style={{ background: '#fff', color: 'var(--brand-navy)', borderRadius: 20, padding: '6px 16px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}
                                onClick={() => alert("Le lien de téléchargement (Play Store / App Store) sera ajouté ici !")}>
                            <Download size={14} /> Installer
                        </button>
                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: 4, cursor: 'pointer' }} onClick={() => setShowAppBanner(false)}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Navbar simplifié pour le landing */}
            <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(232,84,26,0.3)' }}>
                        <ShieldAlert size={20} color="#fff" />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                        CS Alert
                    </span>
                </div>
                <div>
                    <Link to="/login" className="btn btn-secondary" style={{ borderRadius: 20, padding: '8px 20px', fontWeight: 600 }}>
                        Se connecter
                    </Link>
                </div>
            </nav>

            {/* Arrière-plan décoratif (blob/glow) */}
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(232,84,26,0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />

            {/* Hero Section */}
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(232,84,26,0.1)', color: 'var(--brand-orange)', borderRadius: 30, fontSize: '0.85rem', fontWeight: 700, marginBottom: 32, border: '1px solid rgba(232,84,26,0.2)' }}>
                    <Zap size={14} /> Plateforme citoyenne de sécurité
                </div>
                
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.04em', maxWidth: 800 }}>
                    Ensemble, rendons notre <span style={{ color: 'var(--brand-orange)' }}>communauté plus sûre.</span>
                </h1>
                
                <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.6, marginBottom: 48 }}>
                    Community Security Alert vous permet de signaler instantanément des incidents de sécurité, d'être alerté en temps réel et de protéger vos proches.
                </p>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/report" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 32px', height: 56, borderRadius: 28, fontSize: '1.05rem', boxShadow: '0 8px 24px rgba(232,84,26,0.3)' }}>
                        <BellRing size={20} /> Signaler un incident
                    </Link>
                    <Link to="/register" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 32px', height: 56, borderRadius: 28, fontSize: '1.05rem' }}>
                        Rejoindre la communauté <ArrowRight size={20} />
                    </Link>
                </div>
            </main>

            {/* Features Section */}
            <section style={{ maxWidth: 1200, margin: '60px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
                    
                    <div className="card fade-in" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-card)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <BellRing size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Alertes en temps réel</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>Soyez informé instantanément des incidents signalés dans votre zone géographique pour rester en sécurité.</p>
                    </div>

                    <div className="card fade-in" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-card)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', animationDelay: '0.1s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <MapPin size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Cartographie précise</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>Visualisez les zones à risque sur une carte interactive mise à jour par les citoyens et modérée par nos équipes.</p>
                    </div>

                    <div className="card fade-in" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-card)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', animationDelay: '0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <ShieldCheck size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Modération fiable</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>Un système de validation par la communauté garantit la fiabilité des alertes pour éviter les fausses informations.</p>
                    </div>

                </div>
            </section>
            
            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center', marginTop: 80, position: 'relative', zIndex: 10 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    &copy; {new Date().getFullYear()} Community Security Alert - CS27 Groupe 16. Tous droits réservés.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
