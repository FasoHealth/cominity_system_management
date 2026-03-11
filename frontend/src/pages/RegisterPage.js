// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);

        try {
            const { data } = await axios.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
            });

            if (data.success) {
                login(data.user, data.token);
                navigate('/feed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l’inscription.');
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

                <h1 className="auth-title">Inscription</h1>
                <p className="auth-subtitle">Créez votre compte citoyen dès maintenant.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Nom complet</label>
                        <input
                            className="form-control"
                            type="text"
                            id="name"
                            placeholder="Votre nom"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Adresse E-mail</label>
                        <input
                            className="form-control"
                            type="email"
                            id="email"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="phone">Téléphone (Optionnel)</label>
                        <input
                            className="form-control"
                            type="tel"
                            id="phone"
                            placeholder="+226 00 00 00 00"
                            value={formData.phone}
                            onChange={handleChange}
                            autoComplete="tel"
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Mot de passe</label>
                            <input
                                className="form-control"
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirmer</label>
                            <input
                                className="form-control"
                                type="password"
                                id="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                        {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OU</span>
                </div>

                <div className="auth-footer">
                    Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
