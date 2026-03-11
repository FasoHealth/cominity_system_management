// frontend/src/pages/admin/AdminUsersPage.js — v2 with avatars+toggles
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#E8541A', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'];
function avatarColor(name = '') {
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/users', { params: { search, limit: 100 } });
            if (data.success) setUsers(data.users);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [search]);

    const toggleUserStatus = async (id) => {
        setActionLoading(id);
        try {
            const { data } = await axios.put(`/api/users/${id}/toggle`);
            if (data.success) setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.user.isActive } : u));
        } catch (err) { alert(err.response?.data?.message || 'Erreur.'); }
        finally { setActionLoading(null); }
    };

    const activeCnt = users.filter(u => u.isActive).length;
    const bannedCnt = users.filter(u => !u.isActive).length;

    const totalPages = Math.ceil(users.length / LIMIT);
    const paginated = users.slice((page - 1) * LIMIT, page * LIMIT);

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Utilisateurs</h1>
                    <span style={{ background: 'var(--brand-orange-pale)', color: 'var(--brand-orange)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                        {users.length} au total
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
                        <input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ paddingLeft: 32, padding: '8px 14px 8px 32px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', minWidth: 220 }} />
                    </div>
                    <button className="btn btn-primary btn-sm">+ Nouvel Utilisateur</button>
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>Chargement de l'annuaire...</p></div>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>UTILISATEUR</th>
                                        <th>EMAIL</th>
                                        <th>RÔLE</th>
                                        <th>STATUT</th>
                                        <th>INSCRIT LE</th>
                                        <th>SIGNALEMENTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(u => {
                                        const bg = avatarColor(u.name);
                                        const isLoading = actionLoading === u._id;
                                        return (
                                            <tr key={u._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
                                                            {initials(u.name)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.78rem', fontWeight: 600,
                                                        background: u.role === 'admin' ? 'rgba(232,84,26,0.1)' : 'var(--bg-secondary)',
                                                        color: u.role === 'admin' ? 'var(--brand-orange)' : 'var(--text-secondary)',
                                                        padding: '3px 10px', borderRadius: 20,
                                                        border: `1px solid ${u.role === 'admin' ? 'rgba(232,84,26,0.2)' : 'var(--border)'}`,
                                                    }}>{u.role === 'admin' ? 'Admin' : u.role === 'guide' ? 'Modérateur' : 'Citoyen'}</span>
                                                </td>
                                                <td>
                                                    {/* Toggle switch */}
                                                    <label className="toggle-label" style={{ margin: 0 }} title={isLoading ? 'Traitement...' : (u.isActive ? 'Désactiver' : 'Activer')}>
                                                        <input type="checkbox" className="toggle-input"
                                                            checked={u.isActive}
                                                            onChange={() => toggleUserStatus(u._id)}
                                                            disabled={isLoading} />
                                                        <div className="toggle-switch" style={{ opacity: isLoading ? 0.5 : 1 }} />
                                                    </label>
                                                </td>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ fontWeight: 700, color: u.incidentsReported > 5 ? 'var(--brand-orange)' : 'var(--text-primary)' }}>
                                                        {u.incidentsReported || 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Affichage de {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, users.length)} sur {users.length} utilisateurs
                                </span>
                                <div className="pagination">
                                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {[
                            { icon: '👤', label: 'Comptes Actifs', value: activeCnt, color: 'var(--green)', bg: 'var(--green-bg)' },
                            { icon: '🚫', label: 'Bannis', value: bannedCnt, color: 'var(--red)', bg: 'var(--red-bg)' },
                            { icon: '🛡️', label: 'Nouveaux ce mois', value: users.filter(u => { const d = new Date(u.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: 'var(--blue)', bg: 'var(--blue-bg)' },
                        ].map((s, i) => (
                            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                                    {s.icon}
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminUsersPage;
