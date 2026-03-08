// frontend/src/pages/MyIncidentsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CAT_LABELS = {
    theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme',
    suspicious_activity: 'Activité suspecte', fire: 'Incendie',
    accident: 'Accident', other: 'Autre'
};

const SEV_LABELS = {
    low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique'
};

const MyIncidentsPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyIncidents = async () => {
            try {
                const { data } = await axios.get('/api/incidents/my');
                if (data.success) {
                    setIncidents(data.incidents);
                }
            } catch (err) {
                console.error('Erreur my-incidents :', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyIncidents();
    }, []);

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Mes Signalements 👮‍♀️</h1>
                    <p className="page-subtitle">Suivez le statut de vos alertes envoyées.</p>
                </div>
                <Link to="/report" className="btn btn-primary">
                    ➕ Nouveau Signalement
                </Link>
            </div>

            {loading ? (
                <div className="page-loader">
                    <div className="spinner"></div>
                    <p>Chargement des données...</p>
                </div>
            ) : incidents.length > 0 ? (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Incident</th>
                                    <th>Catégorie / Gravité</th>
                                    <th>Lieu</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((inc) => (
                                    <tr key={inc._id}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inc.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{inc.description}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                <span className={`badge badge-${inc.category}`}>{CAT_LABELS[inc.category]}</span>
                                                <span className={`badge badge-${inc.severity}`}>{SEV_LABELS[inc.severity]}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{inc.location.address}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(inc.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge badge-${inc.status}`}>
                                                {inc.status === 'pending' ? 'En attente' :
                                                    inc.status === 'approved' ? 'Approuvé' :
                                                        inc.status === 'rejected' ? 'Rejeté' : 'Résolu'}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/incidents/${inc._id}`} className="btn btn-sm btn-ghost">Détails</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">📝</div>
                    <p className="empty-state-title">Aucun signalement envoyé</p>
                    <p className="empty-state-desc">Vous n'avez pas encore envoyé de signalement d'incident.</p>
                    <Link to="/report" className="btn btn-primary" style={{ marginTop: '20px' }}>Commencer</Link>
                </div>
            )}
        </div>
    );
};

export default MyIncidentsPage;
