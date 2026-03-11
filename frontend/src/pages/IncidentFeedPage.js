// frontend/src/pages/IncidentFeedPage.js
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

const IncidentFeedPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ category: '', severity: '' });
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                category: filters.category,
                severity: filters.severity,
                search: search
            };
            const { data } = await axios.get('/api/incidents', { params });
            if (data.success) {
                setIncidents(data.incidents);
                setPagination({ page: data.page, pages: data.pages });
            }
        } catch (err) {
            console.error('Erreur feed :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [pagination.page, filters, search]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPagination({ ...pagination, page: 1 });
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Fil d'actualité 📢</h1>
                    <p className="page-subtitle">Rapport d'incidents signalés et approuvés.</p>
                </div>
                <Link to="/report" className="btn btn-primary">
                    ➕ Signaler un Incident
                </Link>
            </div>

            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="Rechercher (titre, lieu, description)..."
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select name="category" value={filters.category} onChange={handleFilterChange}>
                    <option value="">Toutes les catégories</option>
                    {Object.entries(CAT_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
                <select name="severity" value={filters.severity} onChange={handleFilterChange}>
                    <option value="">Toutes les gravités</option>
                    {Object.entries(SEV_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="page-loader">
                    <div className="spinner"></div>
                    <p>Récupération des alertes...</p>
                </div>
            ) : incidents.length > 0 ? (
                <>
                    <div className="grid-3">
                        {incidents.map((inc) => (
                            <div key={inc._id} className={`incident-card severity-${inc.severity} fade-in`}>
                                <div className="incident-card-content">
                                    <div className="incident-card-header">
                                        <h3 className="incident-card-title">{inc.title}</h3>
                                        <span className={`badge badge-${inc.severity}`}>
                                            {SEV_LABELS[inc.severity]}
                                        </span>
                                    </div>

                                    <div className="incident-card-meta">
                                        <span title="Catégorie">🏷️ {CAT_LABELS[inc.category] || inc.category}</span>
                                        <span title="Localisation">📍 {inc.location.address}</span>
                                    </div>

                                    <p className="incident-card-desc">{inc.description}</p>

                                    <div className="incident-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            🕒 {new Date(inc.createdAt).toLocaleDateString()}
                                        </div>
                                        <Link to={`/incidents/${inc._id}`} className="btn btn-sm btn-ghost">Voir détails →</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.pages > 1 && (
                        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', gap: '8px' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            >
                                Précédent
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem' }}>
                                Page {pagination.page} sur {pagination.pages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">🛡️</div>
                    <p className="empty-state-title">Aucun incident trouvé</p>
                    <p className="empty-state-desc">Aucune alerte correspondante à vos critères n'a été signalée récemment.</p>
                </div>
            )}
        </div>
    );
};

export default IncidentFeedPage;
