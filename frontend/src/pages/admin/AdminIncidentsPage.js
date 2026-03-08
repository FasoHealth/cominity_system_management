// frontend/src/pages/admin/AdminIncidentsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CAT_LABELS = {
    theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme',
    suspicious_activity: 'Activité suspecte', fire: 'Incendie',
    accident: 'Accident', other: 'Autre'
};

const AdminIncidentsPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, resolved: 0 });
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [moderationNote, setModerationNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAdminIncidents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/incidents/admin?status=${activeTab}&limit=50`);
            if (data.success) {
                setIncidents(data.incidents);
                setCounts(data.statusCounts);
            }
        } catch (err) {
            console.error('Erreur admin incidents :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminIncidents();
    }, [activeTab]);

    const handleModerate = async (id, status) => {
        setActionLoading(true);
        try {
            const { data } = await axios.put(`/api/incidents/${id}/moderate`, {
                status,
                moderationNote
            });
            if (data.success) {
                setSelectedIncident(null);
                setModerationNote('');
                fetchAdminIncidents();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la modération.');
        } finally {
            setActionLoading(false);
        }
    };

    const openGoogleMaps = (lat, lng) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Centre de Modération 🛠️</h1>
                <p className="page-subtitle">Examinez et gérez les signalements de la communauté.</p>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    ⏳ En attente ({counts.pending || 0})
                </button>
                <button className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
                    ✅ Approuvés ({counts.approved || 0})
                </button>
                <button className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
                    ❌ Rejetés ({counts.rejected || 0})
                </button>
                <button className={`tab-btn ${activeTab === 'resolved' ? 'active' : ''}`} onClick={() => setActiveTab('resolved')}>
                    🤝 Résolus ({counts.resolved || 0})
                </button>
            </div>

            {loading ? (
                <div className="page-loader">
                    <div className="spinner"></div>
                    <p>Chargement des dossiers...</p>
                </div>
            ) : incidents.length > 0 ? (
                <div className="card" style={{ padding: '0' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Incident</th>
                                    <th>Catégorie</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((inc) => (
                                    <tr key={inc._id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{inc.reportedBy?.name || 'Inconnu'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.reportedBy?.email}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{inc.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {inc.location.address}</div>
                                            {inc.location.coordinates?.lat && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: '#3b82f6', marginTop: '4px', padding: '0' }}
                                                    onClick={() => openGoogleMaps(inc.location.coordinates.lat, inc.location.coordinates.lng)}
                                                >
                                                    📍 Voir sur la carte
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${inc.category}`}>{CAT_LABELS[inc.category]}</span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIncident(inc)}>Examiner</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">✅</div>
                    <p className="empty-state-title">Rien à afficher</p>
                </div>
            )}

            {selectedIncident && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card fade-in" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 className="card-title">Dossier #{selectedIncident._id.slice(-6)}</h2>
                            <button className="btn btn-ghost" onClick={() => setSelectedIncident(null)}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            <div>
                                <h4 className="form-label">Titre</h4>
                                <p style={{ fontWeight: '600', marginBottom: '16px' }}>{selectedIncident.title}</p>
                                <h4 className="form-label">Description</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedIncident.description}</p>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>📍 {selectedIncident.location.address}</p>
                                {selectedIncident.location.coordinates?.lat && (
                                    <button
                                        className="btn btn-secondary btn-sm btn-full"
                                        style={{ marginBottom: '10px' }}
                                        onClick={() => openGoogleMaps(selectedIncident.location.coordinates.lat, selectedIncident.location.coordinates.lng)}
                                    >
                                        🌐 Voir sur Google Maps
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span className={`badge badge-${selectedIncident.severity}`}>{selectedIncident.severity}</span>
                                    <span className={`badge badge-${selectedIncident.category}`}>{selectedIncident.category}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Note de modération</label>
                            <textarea
                                className="form-control"
                                placeholder="..."
                                value={moderationNote}
                                onChange={(e) => setModerationNote(e.target.value)}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            {activeTab === 'pending' && (
                                <>
                                    <button className="btn btn-success btn-full" onClick={() => handleModerate(selectedIncident._id, 'approved')} disabled={actionLoading}>Approuver</button>
                                    <button className="btn btn-danger btn-full" onClick={() => handleModerate(selectedIncident._id, 'rejected')} disabled={actionLoading}>Rejeter</button>
                                </>
                            )}
                            {activeTab === 'approved' && (
                                <button className="btn btn-secondary btn-full" onClick={() => handleModerate(selectedIncident._id, 'resolved')} disabled={actionLoading}>🤝 Résolu</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIncidentsPage;
