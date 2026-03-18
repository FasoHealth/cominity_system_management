// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Zap,
    User,
    Mail,
    Phone,
    Lock,
    ShieldAlert,
    Users,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

const RegisterPage = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        isAnonymous: false, role: 'citizen'
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation du nom
        if (form.name.trim().length < 2) {
            setError(t('auth.register.error_name_short'));
            return;
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError(t('auth.register.error_invalid_email'));
            return;
        }

        if (form.password.length < 8 || !/\d/.test(form.password)) {
            setError(t('auth.register.error_password_requirement'));
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError(t('auth.register.error_password_mismatch'));
            return;
        }
        setLoading(true);
        try {
            const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
            if (form.phone) payload.phone = form.phone;
            const { data } = await axios.post('/api/auth/register', payload);
            if (data.success) {
                login(data.user, data.token);
                navigate('/feed');
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setError(err.response.data.errors.map(e => e.message).join('. '));
            } else {
                setError(err.response?.data?.message || t('auth.register.error_signup', 'Erreur lors de l\'inscription.'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split">
            {/* ── Panneau gauche ── */}
            <div className="auth-left" style={{ backgroundImage: 'radial-gradient(ellipse at 70% 30%, rgba(232,84,26,0.18) 0%, transparent 60%)' }}>
                <div className="auth-left-logo">
                    <div className="auth-left-logo-icon">
                        <Zap size={24} fill="var(--brand-orange)" color="var(--brand-orange)" />
                    </div>
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>{t('nav.brand_name')}</span>

                </div>

                <div className="auth-left-art">
                    {/* Panel épuré */}
                </div>

                <div className="auth-left-tagline" style={{ color: '#222' }}>
                    {t('auth.login.tagline_1', 'Votre sécurité,')}<br />
                    <span style={{ color: '#222', opacity: 0.7 }}>{t('auth.login.tagline_2', 'notre communauté.')}</span>
                </div>
            </div>

            {/* ── Panneau droit ── */}
            <div className="auth-right">
                <div className="auth-form-card fade-in" style={{ maxWidth: 520 }}>
                    <LanguageSwitcher />
                    <h1 className="auth-title" style={{ color: '#222' }}>{t('auth.register.title')}</h1>
                    <p className="auth-subtitle" style={{ color: '#666' }}>{t('auth.register.subtitle')}</p>

                    {error && (
                        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="name" style={{ color: '#222' }}>
                                    {t('auth.register.full_name')}
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 8 }}>
                                        {t('auth.register.name_hint', { count: form.name.length })}
                                    </span>
                                </label>
                                <div className="input-group">
                                    <span className="input-icon"><User size={18} opacity={0.5} /></span>
                                    <input className="form-control" type="text" id="name" name="name"
                                        placeholder={t('auth.register.placeholders.name')} value={form.name}
                                        onChange={handleChange} required minLength={2} maxLength={50} />

                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone" style={{ color: '#222' }}>{t('auth.register.phone')} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>{t('auth.register.phone_hint')}</span></label>
                                <div className="input-group">
                                    <span className="input-icon"><Phone size={18} opacity={0.5} /></span>
                                    <input className="form-control" type="tel" id="phone" name="phone"
                                        placeholder={t('auth.register.placeholders.phone')} value={form.phone}
                                        onChange={handleChange} />

                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email" style={{ color: '#222' }}>{t('auth.register.email')}</label>
                            <div className="input-group">
                                <span className="input-icon"><Mail size={18} opacity={0.5} /></span>
                                <input className="form-control" type="email" id="email" name="email"
                                    placeholder={t('auth.register.placeholders.email')} value={form.email}
                                    onChange={handleChange} required />

                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="password" style={{ color: '#222' }}>{t('auth.register.password')}</label>
                                <div className="input-group">
                                    <span className="input-icon"><Lock size={18} opacity={0.5} /></span>
                                    <input className="form-control" type="password" id="password" name="password"
                                        placeholder="••••••••" value={form.password}
                                        onChange={handleChange} required minLength={8} />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                    {t('auth.register.min_chars_prompt')}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword" style={{ color: '#222' }}>{t('auth.register.confirm_password')}</label>
                                <div className="input-group">
                                    <span className="input-icon"><Lock size={18} opacity={0.5} /></span>
                                    <input className="form-control" type="password" id="confirmPassword" name="confirmPassword"
                                        placeholder="••••••••" value={form.confirmPassword}
                                        onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Rôle */}
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#222' }}>{t('auth.register.role')}</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <label style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 10, padding: '12px', borderRadius: 12, cursor: 'pointer',
                                    border: `2px solid ${form.role === 'citizen' ? 'var(--brand-orange)' : 'var(--border)'}`,
                                    background: form.role === 'citizen' ? 'var(--brand-orange-pale)' : 'var(--bg-primary)',
                                    fontSize: '0.875rem', fontWeight: 600,
                                    color: form.role === 'citizen' ? 'var(--brand-orange)' : '#222',
                                    transition: 'all 0.2s',
                                }}>
                                    <input type="radio" name="role" value="citizen"
                                        checked={form.role === 'citizen'} onChange={handleChange}
                                        style={{ display: 'none' }} />
                                    <User size={18} /> {t('auth.register.citizen')}
                                </label>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            {loading ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t('auth.register.creating')}</>
                            ) : (
                                <>{t('auth.register.submit')} <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: '#666' }}>
                        {t('auth.register.already_registered')}{' '}
                        <Link to="/login" style={{ color: 'var(--brand-orange)', fontWeight: 700 }}>{t('auth.register.sign_in')}</Link>
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

export default RegisterPage;
