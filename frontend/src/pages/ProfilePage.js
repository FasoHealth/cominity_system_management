// frontend/src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', phone: '', city: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ incidents: 0, upvotes: 0, confirmed: 0, guides: 0 });
    const [history, setHistory] = useState([]);
    const [alertRadius, setAlertRadius] = useState(5);
    const [notifPrefs, setNotifPrefs] = useState({ fire: true, flood: true, civil: false });

    useEffect(() => {
        if (user) {
            setForm({ name: user.name || '', phone: user.phone || '', city: user.city || '' });
        }
        // Fetch user stats
        axios.get('/api/incidents/my').then(({ data }) => {
            if (data.success) {
                const incs = data.incidents;
                setStats({
                    incidents: incs.length,
                    upvotes: incs.reduce((s, i) => s + (i.upvoteCount || 0), 0),
                    confirmed: incs.filter(i => i.status === 'approved' || i.status === 'resolved').length,
                    guides: 0,
                });
                setHistory(incs.slice(0, 10));
            }
        }).catch(console.error);
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError(null); setSaved(false);
        try {
            await axios.put('/api/users/profile', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
        } finally { setSaving(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const STATUS_LABELS = { pending: 'En attente', approved: 'Confirmé', resolved: 'Clôturé', rejected: 'Rejeté' };
    const STATUS_COLORS = { pending: '#EAB308', approved: '#22C55E', resolved: '#6B7280', rejected: '#EF4444' };

    return (
        <div className="page-container fade-in" style={{ maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
                {/* Left panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ textAlign: 'center', padding: 28 }}>
                        {/* Avatar */}
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-orange)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 700 }}>
                            {initials(user?.name || 'U')}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{user?.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--brand-orange)', fontWeight: 600, marginBottom: 6 }}>
                            {user?.role === 'admin' ? 'Administrateur' : user?.role === 'guide' ? 'Guide Local' : 'Citoyen'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>{user?.email}</div>
                        <button className="btn btn-secondary btn-full btn-sm" style={{ marginBottom: 8 }}>
                            ✏️ Modifier la photo
                        </button>
                        <button className="btn btn-full btn-sm" style={{ color: 'var(--red)', background: 'var(--red-bg)', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }} onClick={handleLogout}>
                            ↩ Déconnexion
                        </button>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                            { label: 'Signalements', value: stats.incidents },
                            { label: 'Upvotes', value: stats.upvotes },
                            { label: 'Confirmées', value: stats.confirmed },
                            { label: 'Guides', value: stats.guides },
                        ].map(s => (
                            <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Personal info */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 className="card-title">Informations personnelles</h3>
                            {saved && <span style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 600 }}>✓ Sauvegardé</span>}
                        </div>
                        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                        <form onSubmit={handleSave}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Nom</label>
                                    <input className="form-control" value={form.name.split(' ')[0] || ''} onChange={e => setForm(p => ({ ...p, name: `${e.target.value} ${p.name.split(' ').slice(1).join(' ')}`.trim() }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Prénom</label>
                                    <input className="form-control" value={form.name.split(' ').slice(1).join(' ') || ''} onChange={e => setForm(p => ({ ...p, name: `${p.name.split(' ')[0] || ''} ${e.target.value}`.trim() }))} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+226 XX XX XX XX" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ville</label>
                                    <input className="form-control" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Ouagadougou" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Alert preferences */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 20 }}>Préférences alertes</h3>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Rayon d'alerte automatique</span>
                                <span style={{ color: 'var(--brand-orange)', fontWeight: 700 }}>{alertRadius}.0 km</span>
                            </div>
                            <input type="range" min="0.5" max="10" step="0.5" value={alertRadius} onChange={e => setAlertRadius(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--brand-orange)', cursor: 'pointer' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                <span>500m</span><span>10km</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                            Types d'incidents notifiés
                        </p>
                        {[
                            { key: 'fire', icon: '🔥', label: 'Incendies & Feux de brousse' },
                            { key: 'flood', icon: '💧', label: 'Inondations' },
                            { key: 'civil', icon: '⚠️', label: 'Manifestations & Troubles' },
                        ].map(pref => (
                            <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem' }}>
                                    <span>{pref.icon}</span> {pref.label}
                                </div>
                                <label className="toggle-label" style={{ margin: 0 }}>
                                    <input type="checkbox" className="toggle-input"
                                        checked={notifPrefs[pref.key]}
                                        onChange={e => setNotifPrefs(p => ({ ...p, [pref.key]: e.target.checked }))} />
                                    <div className="toggle-switch" />
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: 20 }}>Historique des alertes</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Incident</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.slice(0, 5).map(inc => (
                                            <tr key={inc._id}>
                                                <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                                    {new Date(inc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[inc.status] || '#6B7280', flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{inc.title}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLORS[inc.status] || '#6B7280' }}>
                                                        {STATUS_LABELS[inc.status] || inc.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <a href={`/incidents/${inc._id}`} style={{ fontSize: '0.75rem', color: 'var(--brand-orange)', fontWeight: 600, textDecoration: 'none' }}>
                                                        Détails
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ textAlign: 'center', padding: '10px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Affichage de {Math.min(5, history.length)} sur {history.length} signalements
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
