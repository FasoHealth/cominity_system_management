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
            <div className="auth-left" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(232,84,26,0.12) 0%, transparent 60%)' }}>
                <div className="auth-left-logo">
                    <div className="auth-left-logo-icon">
                        <Zap size={24} fill="var(--brand-orange)" color="var(--brand-orange)" />
                    </div>
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>Flash Alerte</span>
                </div>

                <div className="auth-left-art">
                    <img 
                        src="/memorial.jpg" 
                        alt="Mémorial aux Héros Nationaux" 
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
                    Votre sécurité,<br />
                    <span style={{ color: '#222', opacity: 0.7 }}>notre communauté.</span>
                </div>
            </div>

            {/* ── Panneau droit ── */}
            <div className="auth-right">
                <div className="auth-form-card fade-in">
                    <h1 className="auth-title" style={{ color: '#222', display: 'flex', alignItems: 'center', gap: 12 }}>
                        Bon retour <span style={{ color: 'var(--brand-orange)', fontSize: '1.5rem' }}>•</span>
                    </h1>
                    <p className="auth-subtitle" style={{ color: '#666' }}>Veuillez entrer vos coordonnées pour vous connecter.</p>

                    {error && (
                        <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertCircle size={18} /> {error}
                            </div>
                            {error.includes('désactivé') && (
                                <Link to="/support-appeal" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ShieldAlert size={16} /> Contacter un administrateur
                                </Link>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email" style={{ color: '#222' }}>Adresse e-mail</label>
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
                                Mot de passe
                                <Link to="/forgot-password" style={{ color: 'var(--brand-orange)', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Mot de passe oublié ?
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
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Connexion...</>
                            ) : (
                                <>Se connecter <ChevronRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.875rem', color: '#666' }}>
                        Nouveau ici ?{' '}
                        <Link to="/register" style={{ color: 'var(--brand-orange)', fontWeight: 700 }}>
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
