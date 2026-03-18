// frontend/src/pages/ResetPasswordPage.js
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Zap, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

import { useTranslation } from 'react-i18next';

const ResetPasswordPage = () => {
    const { t } = useTranslation();
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError(t('auth.register.error_mismatch'));
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post(`/api/auth/reset-password/${token}`, { password });
            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('profile.fields.error_save'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split">
            <div className="auth-left" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(232,84,26,0.18) 0%, transparent 60%)' }}>
                <div className="auth-left-logo">
                    <div className="auth-left-logo-icon">
                        <Zap size={24} fill="var(--brand-orange)" color="var(--brand-orange)" />
                    </div>
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1.1rem' }}>{t('nav.brand_name')}</span>

                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-card fade-in">
                    {!success ? (
                        <>
                            <h1 className="auth-title">{t('auth.reset.title')}</h1>
                            <p className="auth-subtitle">{t('auth.reset.subtitle')}</p>

                            {error && (
                                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="password">{t('auth.reset.title')}</label>
                                    <div className="input-group" style={{ position: 'relative' }}>
                                        <span className="input-icon"><Lock size={18} opacity={0.5} /></span>
                                        <input
                                            className="form-control"
                                            type={showPwd ? 'text' : 'password'}
                                            id="password"
                                            placeholder={t('auth.register.min_chars')}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd(!showPwd)}
                                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                        >
                                            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="confirmPassword">{t('auth.register.confirm_password')}</label>
                                    <div className="input-group">
                                        <span className="input-icon"><Lock size={18} opacity={0.5} /></span>
                                        <input
                                            className="form-control"
                                            type="password"
                                            id="confirmPassword"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-full btn-lg"
                                    type="submit"
                                    disabled={loading}
                                    style={{ marginTop: 12 }}
                                >
                                    {loading ? <span className="spinner" /> : t('auth.reset.submit')}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle2 size={32} color="#10b981" />
                            </div>
                            <h1 className="auth-title" style={{ fontSize: '1.5rem', marginBottom: 12 }}>{t('auth.reset.success_title')}</h1>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                                {t('auth.reset.success_desc')}
                            </p>
                            <Link to="/login" className="btn btn-primary btn-full">
                                {t('auth.reset.login_btn')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
