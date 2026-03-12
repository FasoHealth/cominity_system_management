// frontend/src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Zap, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const { data } = await axios.post('/api/auth/forgot-password', { email });
            setMessage(data.message);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
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
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1.1rem' }}>Flash Alerte</span>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-card fade-in">
                    <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: 24, fontWeight: 600 }}>
                        <ChevronLeft size={16} /> Retour à la connexion
                    </Link>

                    {!submitted ? (
                        <>
                            <h1 className="auth-title">Mot de passe oublié ?</h1>
                            <p className="auth-subtitle">Entrez votre adresse mail pour recevoir un lien de réinitialisation.</p>

                            {error && (
                                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="email">Adresse e-mail</label>
                                    <div className="input-group">
                                        <span className="input-icon"><Mail size={18} opacity={0.5} /></span>
                                        <input
                                            className="form-control"
                                            type="email" id="email"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
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
                                    {loading ? <span className="spinner" /> : 'Envoyer le lien'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle2 size={32} color="#10b981" />
                            </div>
                            <h1 className="auth-title" style={{ fontSize: '1.5rem', marginBottom: 12 }}>Vérifiez vos emails</h1>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                                {message}
                            </p>
                            <Link to="/login" className="btn btn-secondary btn-full">
                                Retour à la connexion
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
