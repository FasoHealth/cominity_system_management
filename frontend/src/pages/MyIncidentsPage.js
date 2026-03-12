// frontend/src/pages/MyIncidentsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Folder, 
    Zap, 
    Clock, 
    CheckCircle2, 
    Trophy, 
    XCircle, 
    MapPin, 
    Edit3, 
    ChevronRight,
    Search,
    Flame,
    Car,
    Hammer,
    Eye,
    ShieldAlert,
    AlertTriangle
} from 'lucide-react';

const CAT_LABELS = { theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme', suspicious_activity: 'Suspect', fire: 'Incendie', kidnapping: 'Enlèvement', other: 'Autre' };

const CATEGORY_ICONS = {
    theft: ShieldAlert,
    assault: ShieldAlert,
    vandalism: Hammer,
    suspicious_activity: Eye,
    fire: Flame,
    kidnapping: ShieldAlert,
    other: AlertTriangle
};

const SEV_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };
const STATUS_LABELS = { pending: 'En attente', approved: 'Approuvé', resolved: 'Résolu', rejected: 'Rejeté' };

const STATUS_FILTERS = [
    { value: '', label: 'Tous', icon: null },
    { value: 'pending', label: 'En attente', icon: <Clock size={14} /> },
    { value: 'approved', label: 'Approuvés', icon: <CheckCircle2 size={14} /> },
    { value: 'resolved', label: 'Résolus', icon: <Trophy size={14} /> },
    { value: 'rejected', label: 'Rejetés', icon: <XCircle size={14} /> },
];

function timeAgo(date) {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    return new Date(date).toLocaleDateString('fr-FR');
}

const MyIncidentsPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        axios.get('/api/incidents/my').then(({ data }) => {
            if (data.success) setIncidents(data.incidents);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const filtered = statusFilter ? incidents.filter(i => i.status === statusFilter) : incidents;

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Folder size={28} color="var(--brand-orange)" /> Mes Signalements
                    </h1>
                    <p className="page-subtitle">Suivez le statut de toutes vos alertes envoyées.</p>
                </div>
                <Link to="/report" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={18} /> Nouveau signalement
                </Link>
            </div>

            {/* Summary mini-cards */}
            {!loading && incidents.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total', value: incidents.length, color: 'var(--brand-orange)', bg: 'rgba(232,84,26,0.1)' },
                        { label: 'Approuvés', value: incidents.filter(i => i.status === 'approved').length, color: 'var(--green)', bg: 'var(--green-bg)' },
                        { label: 'En attente', value: incidents.filter(i => i.status === 'pending').length, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
                        { label: 'Résolus', value: incidents.filter(i => i.status === 'resolved').length, color: 'var(--blue)', bg: 'var(--blue-bg)' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: s.bg, border: `1px solid ${s.color}33`,
                            borderRadius: 12, padding: '10px 20px', display: 'flex', gap: 12, alignItems: 'center',
                            minWidth: 140
                        }}>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Status filter pills */}
            <div className="pill-filter" style={{ marginBottom: 24 }}>
                {STATUS_FILTERS.map(f => (
                    <button key={f.value} className={`pill${statusFilter === f.value ? ' active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={() => setStatusFilter(f.value)}>
                        {f.icon} {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>Chargement de vos signalements...</p></div>
            ) : filtered.length > 0 ? (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Incident</th>
                                    <th>Catégorie</th>
                                    <th>Lieu</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inc => {
                                    const Icon = CATEGORY_ICONS[inc.category] || AlertTriangle;
                                    return (
                                        <tr key={inc._id} onClick={() => window.location.href = `/incidents/${inc._id}`}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div className={`cat-icon-mini ${inc.category}`} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inc.title}</div>
                                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {inc.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    <span className={`badge badge-${inc.category}`}>{CAT_LABELS[inc.category]}</span>
                                                    <span className={`badge badge-${inc.severity}`}>{SEV_LABELS[inc.severity]}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <MapPin size={14} opacity={0.6} /> {inc.location?.address}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={14} opacity={0.6} /> {timeAgo(inc.createdAt)}
                                                </div>
                                            </td>
                                            <td><span className={`badge badge-${inc.status}`}>{STATUS_LABELS[inc.status] || inc.status}</span></td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <Link to={`/incidents/${inc._id}`} className="btn btn-sm btn-ghost">Détails</Link>
                                                    {inc.status === 'pending' && (
                                                        <Link to={`/incidents/edit/${inc._id}`} className="btn btn-sm btn-secondary" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Edit3 size={14} /> Modif
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <Folder size={48} opacity={0.2} />
                    </div>
                    <p className="empty-state-title">
                        {statusFilter ? 'Aucun signalement dans cette catégorie' : 'Aucun signalement envoyé'}
                    </p>
                    <p className="empty-state-desc">
                        {statusFilter ? 'Essayez un autre filtre.' : "Vous n'avez pas encore signalé d'incident."}
                    </p>
                    {!statusFilter && (
                        <Link to="/report" className="btn btn-primary" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={18} /> Signaler maintenant
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyIncidentsPage;
