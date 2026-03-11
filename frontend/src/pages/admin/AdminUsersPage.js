// frontend/src/pages/admin/AdminUsersPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { search, role: 'citizen', limit: 100 };
            const { data } = await axios.get('/api/users', { params });
            if (data.success) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Erreur users admin :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const toggleUserStatus = async (id) => {
        setActionLoading(id);
        try {
            const { data } = await axios.put(`/api/users/${id}/toggle`);
            if (data.success) {
                setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.user.isActive } : u));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la modification du statut.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Gestion des Citoyens 👥</h1>
                <p className="page-subtitle">Modérez les comptes et suivez l'activité des utilisateurs.</p>
            </div>

            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Total citoyens: <strong>{users.length}</strong>
                </div>
            </div>

            {loading ? (
                <div className="page-loader">
                    <div className="spinner"></div>
                    <p>Chargement de l'annuaire...</p>
                </div>
            ) : users.length > 0 ? (
                <div className="card fade-in" style={{ padding: '0' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Contact</th>
                                    <th>Incidents Signalés</th>
                                    <th>Date d'inscription</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone || 'Non spécifié'}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: '700' }}>{u.incidentsReported}</span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                                                {u.isActive ? 'Actif' : 'Désactivé'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                                                onClick={() => toggleUserStatus(u._id)}
                                                disabled={actionLoading === u._id}
                                            >
                                                {actionLoading === u._id ? 'Traitement...' : (u.isActive ? 'Désactiver' : 'Activer')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p className="empty-state-title">Aucun utilisateur trouvé</p>
                    <p className="empty-state-desc">Essayez d'ajuster vos critères de recherche.</p>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
