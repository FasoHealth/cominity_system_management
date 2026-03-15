// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Zap, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ShieldAlert, 
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(t('auth.login.error_invalid_email'));
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            if (data.success) {
                login(data.user, data.token);
                navigate('/feed');
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setError(err.response.data.errors.map(e => e.message).join(' '));
            } else {
                setError(err.response?.data?.message || t('auth.login.error_login'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split">
            {/* ── Panneau gauche ── */}
            <div className="auth-left" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(232,84,26,0.12) 0%, transparent 60%)' }}>
                <div className="auth-left-logo">
                    <div className="auth-left-logo-icon">
                        <Zap size={24} fill="var(--brand-orange)" color="var(--brand-orange)" />
                    </div>
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>CS Alert</span>

                </div>

                <div className="auth-left-art">
                    <img 
                        src="/memorial.jpg" 
                        alt="Memorial" 
                        style={{
                            width: '100%',
                            maxWidth: '320px',
                            borderRadius: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            display: 'block',
                            margin: '0 auto'
                        }} 
                    />
                </div>

                <div className="auth-left-tagline" style={{ color: '#222' }}>
                    {t('auth.login.tagline_1','Votre sécurité,')}<br />
                    <span style={{ color: '#222', opacity: 0.7 }}>{t('auth.login.tagline_2','notre communauté.')}</span>
                </div>
            </div>

            {/* ── Panneau droit ── */}
            <div className="auth-right">
                <div className="auth-form-card fade-in">
                    <LanguageSwitcher />
                    <h1 className="auth-title" style={{ color: '#222', display: 'flex', alignItems: 'center', gap: 12 }}>
                        {t('auth.login.title')} <span style={{ color: 'var(--brand-orange)', fontSize: '1.5rem' }}>•</span>
                    </h1>
                    <p className="auth-subtitle" style={{ color: '#666' }}>{t('auth.login.subtitle')}</p>

                    {error && (
                        <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertCircle size={18} /> {error}
                            </div>
                            {(error.includes('désactivé') || error.includes('disabled')) && (
                                <Link to="/support-appeal" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ShieldAlert size={16} /> {t('auth.login.contact_admin','Contacter un administrateur')}
                                </Link>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email" style={{ color: '#222' }}>{t('auth.login.email')}</label>
                            <div className="input-group">
                                <span className="input-icon">
                                    <Mail size={18} opacity={0.5} />
                                </span>
                                <input
                                    className="form-control"
                                    type="email" id="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email" required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password" style={{ color: '#222' }}>
                                {t('auth.login.password')}
                                <Link to="/forgot-password" style={{ color: 'var(--brand-orange)', fontSize: '0.78rem', fontWeight: 600 }}>
                                    {t('auth.login.forgot_password')}
                                </Link>
                            </label>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <span className="input-icon">
                                    <Lock size={18} opacity={0.5} />
                                </span>
                                <input
                                    className="form-control"
                                    type={showPwd ? 'text' : 'password'}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password" required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-full btn-lg"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                        >
                            {loading ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t('auth.login.submit')}...</>
                            ) : (
                                <>{t('auth.login.submit')} <ChevronRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.875rem', color: '#666' }}>
                        {t('auth.login.no_account')}{' '}
                        <Link to="/register" style={{ color: 'var(--brand-orange)', fontWeight: 700 }}>
                            {t('auth.login.create_account')}
                        </Link>
                    </div>
                </div>

                <div className="auth-footer-links">
                    <a href="#aide">{t('nav.help')}</a>
                    <a href="#confidentialite">{t('nav.privacy')}</a>
                    <a href="#conditions">{t('nav.terms')}</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
