// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            setError(err.response?.data?.message || 'Erreur lors de la connexion.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🛡️</div>
                    <div className="auth-logo-text">
                        Community<br />
                        <span className="auth-logo-sub">Security Alert</span>
                    </div>
                </div>

                <h1 className="auth-title">Connexion</h1>
                <p className="auth-subtitle">Ravi de vous revoir ! Accédez à votre compte.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Adresse E-mail</label>
                        <input
                            className="form-control"
                            type="email"
                            id="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="current-email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Mot de passe</label>
                        <input
                            className="form-control"
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OU</span>
                </div>

                <div className="auth-footer">
                    Pas encore de compte ? <Link to="/register">S'inscrire gratuitement</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
