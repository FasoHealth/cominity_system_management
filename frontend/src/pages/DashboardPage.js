// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalReported: 0,
        approved: 0,
        pending: 0,
        resolved: 0,
        recentIncidents: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await axios.get('/api/incidents/my');
                if (data.success) {
                    const incidents = data.incidents;
                    setStats({
                        totalReported: incidents.length,
                        approved: incidents.filter(i => i.status === 'approved').length,
                        pending: incidents.filter(i => i.status === 'pending').length,
                        resolved: incidents.filter(i => i.status === 'resolved').length,
                        recentIncidents: incidents.slice(0, 5),
                    });
                }
            } catch (err) {
                console.error('Erreur dashboard :', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Chargement de vos statistiques...</p>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Bonjour, {user?.name} 👋</h1>
                <p className="page-subtitle">Bienvenue sur votre tableau de bord citoyen.</p>
            </div>

            <div className="grid-4">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--red-glow)', color: 'var(--red)' }}>📢</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalReported}</div>
                        <div className="stat-label">Total Signalés</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.approved}</div>
                        <div className="stat-label">Approuvés</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">En attente</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>🏆</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.resolved}</div>
                        <div className="stat-label">Résolus</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content" style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 className="card-title">Derniers Signalements</h3>
                        <Link to="/my-incidents" className="btn btn-sm btn-ghost">Voir tout</Link>
                    </div>

                    {stats.recentIncidents.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Titre</th>
                                        <th>Catégorie</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentIncidents.map((inc) => (
                                        <tr key={inc._id} onClick={() => window.location.href = `/incidents/${inc._id}`} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inc.title}</td>
                                            <td>
                                                <span className={`badge badge-${inc.category}`}>
                                                    {inc.category}
                                                </span>
                                            </td>
                                            <td>{new Date(inc.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge badge-${inc.status}`}>
                                                    {inc.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <p className="empty-state-title">Aucun signalement</p>
                            <p className="empty-state-desc">Commencez à aider votre communauté en signalant un incident.</p>
                            <Link to="/report" className="btn btn-primary" style={{ marginTop: '20px' }}>Signaler maintenant</Link>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '20px' }}>Actions Rapides</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/report" className="btn btn-primary btn-full" style={{ padding: '16px' }}>
                            ➕ Nouveau Signalement
                        </Link>
                        <Link to="/notifications" className="btn btn-secondary btn-full" style={{ padding: '16px' }}>
                            🔔 Voir Notifications
                        </Link>
                        <Link to="/feed" className="btn btn-secondary btn-full" style={{ padding: '16px' }}>
                            🔍 Parcourir la carte
                        </Link>
                    </div>

                    <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--red)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            💡 Saviez-vous que ?
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Plus vous apportez de détails et de photos précises, plus vite l'incident sera traité par les autorités.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
