// frontend/src/pages/admin/AdminIncidentsPage.js — Card layout v2
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CAT_LABELS = { theft: 'Vol', assault: 'Sécurité', vandalism: 'Vandalisme', suspicious_activity: 'Suspect', fire: 'Incendie', accident: 'Accident', other: 'Autre' };
const CAT_ICONS = { theft: '💰', assault: '🛡️', vandalism: '🔨', suspicious_activity: '👁️', fire: '🔥', accident: '🚗', other: '⚠️' };
const STATUS_MAP = { pending: 'EN ATTENTE', approved: 'APPROUVÉ', rejected: 'REJETÉ', resolved: 'RÉSOLU' };

function timeAgo(date) {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60) return `Il y a ${min} min`;
    return `Il y a ${Math.floor(min / 60)}h`;
}

const AdminIncidentsPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, resolved: 0 });
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchAdminIncidents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/incidents/admin?status=${activeTab}&limit=50`);
            if (data.success) { setIncidents(data.incidents); setCounts(data.statusCounts); }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAdminIncidents(); }, [activeTab]);

    const handleModerate = async (id, status) => {
        setActionLoading(`${id}-${status}`);
        try {
            const { data } = await axios.put(`/api/incidents/${id}/moderate`, { status });
            if (data.success) fetchAdminIncidents();
        } catch (err) { alert(err.response?.data?.message || 'Erreur.'); }
        finally { setActionLoading(null); }
    };

    const displayed = incidents.filter(inc =>
        !search ||
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.location?.address?.toLowerCase().includes(search.toLowerCase())
    );

    const TABS = [
        { v: 'pending', l: 'En attente', c: counts.pending },
        { v: 'approved', l: 'Approuvés', c: counts.approved },
        { v: 'rejected', l: 'Rejetés', c: counts.rejected },
        { v: 'resolved', l: 'Résolus', c: counts.resolved },
    ];

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Modération</h1>
                    <span style={{ background: 'var(--brand-orange)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                        {counts.pending + counts.approved} incidents
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
                        <input placeholder="Rechercher un signalement..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 32, padding: '8px 14px 8px 32px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', minWidth: 240 }} />
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={fetchAdminIncidents}>⟳ Actualiser</button>
                </div>
            </div>

            {/* Underline tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.v} onClick={() => setActiveTab(t.v)} style={{
                        padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: '0.875rem', fontWeight: activeTab === t.v ? 700 : 500,
                        color: activeTab === t.v ? 'var(--brand-orange)' : 'var(--text-muted)',
                        borderBottom: `2px solid ${activeTab === t.v ? 'var(--brand-orange)' : 'transparent'}`,
                        marginBottom: -2, transition: 'all 0.2s'
                    }}>
                        {t.l} {t.c > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, marginLeft: 4, background: activeTab === t.v ? 'var(--brand-orange-pale)' : 'var(--bg-secondary)', color: activeTab === t.v ? 'var(--brand-orange)' : 'var(--text-muted)', padding: '1px 6px', borderRadius: 10 }}>{t.c}</span>}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>Chargement des dossiers...</p></div>
            ) : displayed.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {displayed.map(inc => (
                        <div key={inc._id} className="mod-card fade-in">
                            {/* Mini thumbnail — placeholder colored block */}
                            <div className="mod-card-thumb" style={{ background: `linear-gradient(135deg, ${inc.severity === 'critical' ? '#EF4444' : inc.severity === 'high' ? '#F97316' : inc.severity === 'medium' ? '#EAB308' : '#22C55E'}22, var(--bg-secondary))` }}>
                                <span style={{ fontSize: '2rem' }}>{CAT_ICONS[inc.category] || '⚠️'}</span>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                                    {inc.location?.coordinates?.lat ? `${inc.location.coordinates.lat.toFixed(4)}, ${inc.location.coordinates.lng.toFixed(4)}` : 'GPS N/A'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mod-card-body">
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <span className={`badge badge-${inc.category}`}>{CAT_LABELS[inc.category]}</span>
                                    {inc.status === 'pending' && <span style={{ background: 'rgba(234,179,8,0.15)', color: '#92610A', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(234,179,8,0.3)' }}>EN ATTENTE</span>}
                                    {inc.autoValidated && <span style={{ background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.2)' }}>✚ AUTO-VALIDÉ</span>}
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: 'var(--text-primary)' }}>{inc.title}</h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {inc.description}
                                </p>
                                <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>🕒 {timeAgo(inc.createdAt)}</span>
                                    {inc.location?.coordinates?.lat && (
                                        <span>📍 {inc.location.coordinates.lat.toFixed(4)}, {inc.location.coordinates.lng.toFixed(4)}</span>
                                    )}
                                    {inc.upvoteCount > 0 && (
                                        <span style={{ color: 'var(--brand-orange)', fontWeight: 600 }}>👍 {inc.upvoteCount} Upvotes</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mod-card-actions">
                                {activeTab === 'pending' && (
                                    <>
                                        <button className="btn-mod-approve"
                                            disabled={actionLoading === `${inc._id}-approved`}
                                            onClick={() => handleModerate(inc._id, 'approved')}>
                                            {actionLoading === `${inc._id}-approved` ? '...' : '✓ Approuver'}
                                        </button>
                                        <button className="btn-mod-reject"
                                            disabled={actionLoading === `${inc._id}-rejected`}
                                            onClick={() => handleModerate(inc._id, 'rejected')}>
                                            {actionLoading === `${inc._id}-rejected` ? '...' : '✕ Rejeter'}
                                        </button>
                                    </>
                                )}
                                {activeTab === 'approved' && (
                                    <>
                                        <button className="btn-mod-approve btn-mod-done" disabled>✓ Approuvé</button>
                                        <button className="btn-mod-resolve" onClick={() => handleModerate(inc._id, 'resolved')}>🏆 Résolu</button>
                                    </>
                                )}
                                {(activeTab === 'rejected' || activeTab === 'resolved') && (
                                    <div style={{ padding: '8px 0', textAlign: 'center' }}>
                                        <span className={`badge badge-${inc.status}`}>{STATUS_MAP[inc.status]}</span>
                                    </div>
                                )}
                                <Link to={`/incidents/${inc._id}`} className="btn-mod-detail">Voir détail</Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">✅</div>
                    <p className="empty-state-title">Tout est traité !</p>
                    <p className="empty-state-desc">Aucun signalement à modérer dans cet onglet.</p>
                </div>
            )}
        </div>
    );
};

export default AdminIncidentsPage;
