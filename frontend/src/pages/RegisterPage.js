// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
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
        if (form.password !== form.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
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
                setError(err.response?.data?.message || "Erreur lors de l'inscription.");
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
                    <div className="auth-left-logo-icon">⚡</div>
                    <span style={{ fontWeight: 700, color: '#222', fontSize: '1rem' }}>Flash Alerte</span>
                </div>

                <div className="auth-left-art">
                    <div style={{ textAlign: 'center', padding: '0 24px' }}>
                        {/* Stats visuelles */}
                        {[
                            { icon: '🚨', label: 'Incidents signalés', value: '1 247', color: '#E8541A' },
                            { icon: '👥', label: 'Citoyens actifs', value: '3 891', color: '#22C55E' },
                            { icon: '⚡', label: 'Alertes résolues', value: '89%', color: '#EAB308' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                background: 'rgba(255,255,255,0.06)', borderRadius: 12,
                                padding: '14px 18px', marginBottom: 12,
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 10,
                                    background: `${s.color}22`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                }}>{s.icon}</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#222' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#222' }}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="auth-left-tagline" style={{ color: '#222' }}>
                    Rejoignez la<br />
                    <span style={{ color: '#222' }}>communauté vigilante.</span>
                </div>
            </div>

            {/* ── Panneau droit ── */}
            <div className="auth-right">
                <div className="auth-form-card fade-in" style={{ maxWidth: 480 }}>
                    <h1 className="auth-title" style={{ color: '#222' }}>Créer un compte</h1>
                    <p className="auth-subtitle" style={{ color: '#222' }}>Rejoignez des milliers de citoyens qui protègent leur quartier.</p>

                    {error && <div className="alert alert-error" style={{ color: '#222' }}>⚠️ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="name" style={{ color: '#222' }}>Nom complet</label>
                                <div className="input-group">
                                    <span className="input-icon">👤</span>
                                    <input className="form-control" type="text" id="name" name="name"
                                        placeholder="Jean Dupont" value={form.name}
                                        onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone" style={{ color: '#222' }}>Téléphone <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
                                <div className="input-group">
                                    <span className="input-icon">📱</span>
                                    <input className="form-control" type="tel" id="phone" name="phone"
                                        placeholder="+225 07 00 00 00" value={form.phone}
                                        onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email" style={{ color: '#222' }}>Adresse e-mail</label>
                            <div className="input-group">
                                <span className="input-icon">📧</span>
                                <input className="form-control" type="email" id="email" name="email"
                                    placeholder="votre@email.com" value={form.email}
                                    onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="password" style={{ color: '#222' }}>Mot de passe</label>
                                <div className="input-group">
                                    <span className="input-icon">🔒</span>
                                    <input className="form-control" type="password" id="password" name="password"
                                        placeholder="••••••••" value={form.password}
                                        onChange={handleChange} required minLength={6} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword" style={{ color: '#222' }}>Confirmer</label>
                                <div className="input-group">
                                    <span className="input-icon">🔒</span>
                                    <input className="form-control" type="password" id="confirmPassword" name="confirmPassword"
                                        placeholder="••••••••" value={form.confirmPassword}
                                        onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Rôle */}
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#222' }}>Vous êtes</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <label style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, padding: '10px', borderRadius: 8, cursor: 'pointer',
                                    border: `2px solid ${form.role === 'citizen' ? 'var(--brand-orange)' : 'var(--border)'}`,
                                    background: form.role === 'citizen' ? 'var(--brand-orange-pale)' : 'var(--bg-primary)',
                                    fontSize: '0.85rem', fontWeight: 600,
                                    color: form.role === 'citizen' ? 'var(--brand-orange)' : '#222',
                                    transition: 'all 0.2s',
                                }}>
                                    <input type="radio" name="role" value="citizen"
                                        checked={form.role === 'citizen'} onChange={handleChange}
                                        style={{ display: 'none' }} />
                                    👤 Citoyen
                                </label>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                            {loading ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Création en cours...</>
                            ) : '⚡ Créer mon compte'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: '#222' }}>
                        Déjà inscrit ?{' '}
                        <Link to="/login" style={{ color: 'var(--brand-orange)', fontWeight: 600 }}>Se connecter</Link>
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

export default RegisterPage;
