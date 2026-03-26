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
    ArrowRight,
    Eye,
    EyeOff
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import emailjs from '@emailjs/browser';

const RegisterPage = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        isAnonymous: false, role: 'citizen'
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

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
                const verifLink = `${window.location.origin}/verify-email/${data.verificationToken}`;

                try {
                    await emailjs.send(
                        process.env.REACT_APP_EMAILJS_SERVICE_ID,
                        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
                        {
                            to_name: form.name,
                            to_email: form.email,
                            email: form.email,
                            app_name: 'CS Alert',
                            verification_link: verifLink,
                        },
                        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
                    );

                    setSuccessData({
                        message: "Un email contenant un lien de vérification vous a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams).",
                        email: form.email,
                        token: data.verificationToken // Ajout du token ici
                    });
                } catch (emailError) {
                    console.error("Erreur EmailJS:", emailError);
                    setError("Compte créé, mais l'e-mail n'a pas pu être envoyé. Contactez le support technique.");
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || t('auth.register.error_signup'));
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="auth-split">
                <div className="auth-right" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="auth-form-card fade-in" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-orange-pale)', color: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Mail size={40} />
                        </div>
                        <h2 style={{ marginBottom: 12 }}>{t('auth.register.success_title', 'Vérifiez votre email')}</h2>
                        <p style={{ color: '#666', marginBottom: 32 }}>{successData.message}</p>

                        {successData.token && (
                            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: 12, marginBottom: 32 }}>
                                <p style={{ fontSize: '0.85rem', marginBottom: 12, color: '#475569' }}>
                                    <Zap size={14} style={{ marginRight: 6 }} />
                                    <strong>Mode Développement:</strong> Cliquez ci-dessous pour simuler la vérification.
                                </p>
                                <button
                                    onClick={() => navigate(`/verify-email/${successData.token}`)}
                                    className="btn btn-primary btn-full"
                                >
                                    Simuler la vérification
                                </button>
                            </div>
                        )}

                        <Link to="/login" style={{ color: 'var(--brand-orange)', fontWeight: 700, fontSize: '1rem' }}>
                            {t('auth.register.back_to_login', 'Aller à la page de connexion')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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

                <div className="auth-left-art" />

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
                                </label>
                                <div className="input-group">
                                    <span className="input-icon"><User size={18} opacity={0.5} /></span>
                                    <input className="form-control" type="text" id="name" name="name"
                                        placeholder={t('auth.register.placeholders.name')} value={form.name}
                                        onChange={handleChange} required minLength={2} maxLength={50} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone" style={{ color: '#222' }}>{t('auth.register.phone')}</label>
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
                                <div className="input-group" style={{ position: 'relative' }}>
                                    <span className="input-icon"><Lock size={18} opacity={0.5} /></span>
                                    <input className="form-control" type={showPassword ? "text" : "password"} id="password" name="password"
                                        placeholder="••••••••" value={form.password}
                                        onChange={handleChange} required minLength={6}
                                        style={{ paddingRight: '40px' }} />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword" style={{ color: '#222' }}>{t('auth.register.confirm_password')}</label>
                                <div className="input-group" style={{ position: 'relative' }}>
                                    <span className="input-icon"><Lock size={18} opacity={0.5} /></span>
                                    <input className="form-control" type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword"
                                        placeholder="••••••••" value={form.confirmPassword}
                                        onChange={handleChange} required
                                        style={{ paddingRight: '40px' }} />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
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
            </div>
        </div>
    );
};

export default RegisterPage;
