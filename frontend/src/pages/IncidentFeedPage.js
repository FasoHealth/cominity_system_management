// frontend/src/pages/IncidentFeedPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CAT_LABELS = {
    theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme',
    suspicious_activity: 'Activité suspecte', fire: 'Incendie',
    accident: 'Accident', other: 'Autre'
};
const CAT_ICONS = {
    theft: '💰', assault: '👊', vandalism: '🔨',
    suspicious_activity: '👁️', fire: '🔥', accident: '🚗', other: '⚠️'
};
const SEV_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };
const ALL_CATS = ['', ...Object.keys(CAT_LABELS)];

function timeAgo(date) {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return 'À l\'instant';
    const min = Math.floor(sec / 60);
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    return new Date(date).toLocaleDateString('fr-FR');
}

const IncidentFeedPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/incidents', {
                params: { page, category, severity, search }
            });
            if (data.success) {
                setIncidents(data.incidents);
                setTotalPages(data.pages || 1);
            }
        } catch (err) {
            console.error('Erreur feed :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIncidents(); }, [page, category, severity, search]);

    const handleCatPill = (cat) => { setCategory(cat); setPage(1); };
    const handleSevFilter = (e) => { setSeverity(e.target.value); setPage(1); };

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Fil d'actualité</h1>
                    <p className="page-subtitle">Incidents signalés et approuvés dans votre communauté</p>
                </div>
                <Link to="/report" className="btn btn-primary">
                    ⚡ Signaler un incident
                </Link>
            </div>

            {/* Search + Severity filter */}
            <div className="filter-bar">
                <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text" className="search-input" style={{ width: '100%' }}
                        placeholder="Rechercher un incident, un lieu..."
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select value={severity} onChange={handleSevFilter} style={{
                    padding: '10px 14px', border: '1.5px solid var(--border)',
                    borderRadius: 8, fontSize: '0.875rem',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
                }}>
                    <option value="">Toutes les gravités</option>
                    {Object.entries(SEV_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Category pills */}
            <div className="pill-filter">
                {ALL_CATS.map(cat => (
                    <button
                        key={cat || 'all'}
                        className={`pill${category === cat ? ' active' : ''}`}
                        onClick={() => handleCatPill(cat)}
                    >
                        {cat ? `${CAT_ICONS[cat]} ${CAT_LABELS[cat]}` : 'Tout'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="page-loader">
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-secondary)' }}>Récupération des alertes...</p>
                </div>
            ) : incidents.length > 0 ? (
                <>
                    <div className="grid-3">
                        {incidents.map(inc => (
                            <div key={inc._id} className="incident-card fade-in">
                                {/* Accent bar by severity */}
                                <div className="incident-card-accent" style={{
                                    background: inc.severity === 'critical' ? 'var(--red)'
                                        : inc.severity === 'high' ? '#F97316'
                                            : inc.severity === 'medium' ? 'var(--yellow)'
                                                : 'var(--green)'
                                }} />
                                <div className="incident-card-content">
                                    {/* Header */}
                                    <div className="incident-card-header">
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                                            <div className={`cat-icon ${inc.category}`}>
                                                {CAT_ICONS[inc.category] || '⚠️'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="incident-card-title">{inc.title}</div>
                                                <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    <span className={`badge badge-${inc.category}`}>
                                                        {CAT_LABELS[inc.category] || inc.category}
                                                    </span>
                                                    {inc.severity === 'critical' && (
                                                        <span className="badge badge-urgent">🚨 Urgent</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`badge badge-${inc.severity}`}>
                                            {SEV_LABELS[inc.severity]}
                                        </span>
                                    </div>

                                    {/* Meta */}
                                    <div className="incident-card-meta">
                                        <span>📍 {inc.location?.address}</span>
                                        {inc.location?.city && <span>🏙️ {inc.location.city}</span>}
                                    </div>

                                    {/* Description */}
                                    <p className="incident-card-desc">{inc.description}</p>

                                    {/* Footer */}
                                    <div className="incident-card-footer">
                                        <span className="incident-time">
                                            🕒 {timeAgo(inc.createdAt)}
                                            {inc.upvoteCount > 0 && (
                                                <span style={{ marginLeft: 8 }}>👍 {inc.upvoteCount}</span>
                                            )}
                                        </span>
                                        <Link to={`/incidents/${inc._id}`} className="btn btn-sm btn-ghost">
                                            Voir détails →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">🛡️</div>
                    <p className="empty-state-title">Aucun incident trouvé</p>
                    <p className="empty-state-desc">Aucune alerte ne correspond à vos critères de recherche.</p>
                    <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => { setSearch(''); setCategory(''); setSeverity(''); }}>
                        Réinitialiser les filtres
                    </button>
                </div>
            )}
        </div>
    );
};

export default IncidentFeedPage;
