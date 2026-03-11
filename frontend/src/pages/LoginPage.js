// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
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
                setError(err.response?.data?.message || 'Erreur lors de la connexion.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split">
            {/* ── Panneau gauche ── */}
            <div className="auth-left" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(232,84,26,0.18) 0%, transparent 60%)' }}>
                <div className="auth-left-logo">
                    <div className="auth-left-logo-icon">⚡</div>
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1rem' }}>Flash Alerte</span>
                </div>

                <div className="auth-left-art">
                    {/* Illustration ville stylisée */}
                    <div style={{
                        width: '100%', maxWidth: 300,
                        background: 'linear-gradient(160deg, #1e3a5f 0%, #0f2442 100%)',
                        borderRadius: 16, padding: '32px 24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Sky */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                            {[40, 70, 55, 80, 45, 65].map((h, i) => (
                                <div key={i} style={{
                                    width: 28, height: h,
                                    background: i % 2 === 0 ? '#2d5986' : '#234870',
                                    borderRadius: '4px 4px 0 0', position: 'relative',
                                    display: 'flex', flexDirection: 'column', gap: 4,
                                    padding: 4, alignItems: 'center',
                                }}>
                                    {Array.from({ length: Math.floor(h / 16) }).map((_, j) => (
                                        <div key={j} style={{
                                            width: 6, height: 5,
                                            background: Math.random() > 0.5 ? '#f6c90e' : 'rgba(255,255,255,0.1)',
                                            borderRadius: 1
                                        }} />
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Ground */}
                        <div style={{ height: 4, background: '#1a4a7a', borderRadius: 2, marginBottom: 8 }} />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                            {[14, 20, 14, 20, 14].map((w, i) => (
                                <div key={i} style={{ width: w, height: 10, background: '#1e5e8f', borderRadius: '2px 2px 0 0' }} />
                            ))}
                        </div>

                        {/* Alerte badge */}
                        <div style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'var(--brand-orange)', color: '#fff',
                            padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            boxShadow: '0 2px 8px rgba(232,84,26,0.5)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}>
                            <span style={{ animation: 'pulse-badge 1.5s infinite', display: 'inline-block', width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />
                            EN DIRECT
                        </div>
                    </div>
                </div>

                <div className="auth-left-tagline" style={{ color: '#222' }}>
                    Votre sécurité,<br />
                    <span style={{ color: '#222' }}>notre communauté.</span>
                </div>
            </div>

            {/* ── Panneau droit ── */}
            <div className="auth-right">
                <div className="auth-form-card fade-in">
                    <h1 className="auth-title" style={{ color: '#222' }}>Bon retour 👋</h1>
                    <p className="auth-subtitle" style={{ color: '#222' }}>Veuillez entrer vos coordonnées pour vous connecter.</p>

                    {error && <div className="alert alert-error" style={{ color: '#222' }}>⚠️ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email" style={{ color: '#222' }}>Adresse e-mail</label>
                            <div className="input-group">
                                <span className="input-icon">📧</span>
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
                                Mot de passe
                                <a href="#reset" style={{ color: 'var(--brand-orange)', fontSize: '0.78rem' }}>
                                    Mot de passe oublié ?
                                </a>
                            </label>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <span className="input-icon">🔒</span>
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
                                        color: 'var(--text-muted)', fontSize: '1rem'
                                    }}
                                >
                                    {showPwd ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-full btn-lg"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: 8 }}
                        >
                            {loading ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Connexion...</>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: '#222' }}>
                        Nouveau ici ?{' '}
                        <Link to="/register" style={{ color: 'var(--brand-orange)', fontWeight: 600 }}>
                            Créer un compte
                        </Link>
                    </div>
                </div>

                <div className="auth-footer-links">
                    <a href="#aide">Aide</a>
                    <a href="#confidentialite">Confidentialité</a>
                    <a href="#conditions">Conditions</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
