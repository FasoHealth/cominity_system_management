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
    AlertTriangle,
    Ghost
} from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { timeAgo } from '../utils/dateUtils';

const MyIncidentsPage = () => {
    const { t, i18n } = useTranslation();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const CAT_LABELS = {
        theft: t('feed.categories.theft'),
        assault: t('feed.categories.assault'),
        vandalism: t('feed.categories.vandalism'),
        suspicious_activity: t('feed.categories.suspicious_activity'),
        fire: t('feed.categories.fire'),
        kidnapping: t('feed.categories.kidnapping'),
        other: t('feed.categories.other')
    };

    const CATEGORY_ICONS = {
        theft: ShieldAlert,
        assault: ShieldAlert,
        vandalism: Hammer,
        suspicious_activity: Eye,
        fire: Flame,
        kidnapping: Ghost,
        other: AlertTriangle
    };

    const SEV_LABELS = {
        low: t('feed.severities.low'),
        medium: t('feed.severities.medium'),
        high: t('feed.severities.high'),
        critical: t('feed.severities.critical')
    };

    const STATUS_LABELS = {
        pending: t('feed.status.pending'),
        approved: t('feed.status.approved'),
        resolved: t('feed.status.resolved'),
        rejected: t('feed.status.rejected')
    };

    const STATUS_FILTERS = [
        { value: '', label: t('feed.filters.all'), icon: null },
        { value: 'pending', label: t('feed.status.pending'), icon: <Clock size={14} /> },
        { value: 'approved', label: t('feed.status.approved'), icon: <CheckCircle2 size={14} /> },
        { value: 'resolved', label: t('feed.status.resolved'), icon: <Trophy size={14} /> },
        { value: 'rejected', label: t('feed.status.rejected'), icon: <XCircle size={14} /> },
    ];


    useEffect(() => {
        axios.get('/api/incidents/mes-signalements').then(({ data }) => {
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
                        <Folder size={28} color="var(--brand-orange)" /> {t('my_incidents.title')}
                    </h1>
                    <p className="page-subtitle">{t('my_incidents.subtitle')}</p>
                </div>
                <Link to="/report" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={18} /> {t('my_incidents.new_btn')}
                </Link>
            </div>

            {/* Summary mini-cards */}
            {!loading && incidents.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {[
                        { label: t('my_incidents.stats.total'), value: incidents.length, color: 'var(--brand-orange)', bg: 'rgba(232,84,26,0.1)' },
                        { label: t('feed.status.approved'), value: incidents.filter(i => i.status === 'approved').length, color: 'var(--green)', bg: 'var(--green-bg)' },
                        { label: t('feed.status.pending'), value: incidents.filter(i => i.status === 'pending').length, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
                        { label: t('feed.status.resolved'), value: incidents.filter(i => i.status === 'resolved').length, color: 'var(--blue)', bg: 'var(--blue-bg)' },
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
                <div className="page-loader"><div className="spinner" /><p>{t('my_incidents.loading')}</p></div>
            ) : filtered.length > 0 ? (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t('my_incidents.table.incident')}</th>
                                    <th>{t('my_incidents.table.category')}</th>
                                    <th>{t('my_incidents.table.location')}</th>
                                    <th>{t('my_incidents.table.date')}</th>
                                    <th>{t('my_incidents.table.status')}</th>
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
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                                                    <span className={`badge badge-${inc.category}`}>{CAT_LABELS[inc.category]}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                                                            {i18n.language === 'fr' ? 'Niveau :' : 'Level :'}
                                                        </span>
                                                        <span className={`badge badge-${inc.severity}`}>{SEV_LABELS[inc.severity]}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <MapPin size={14} opacity={0.6} /> {inc.location?.address}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={14} opacity={0.6} /> {timeAgo(inc.createdAt, t, i18n.language)}
                                                </div>
                                            </td>
                                            <td><span className={`badge badge-${inc.status}`}>{STATUS_LABELS[inc.status] || inc.status}</span></td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <Link to={`/incidents/${inc._id}`} className="btn btn-sm btn-ghost">{t('my_incidents.table.details')}</Link>
                                                    {inc.status === 'pending' && (
                                                        <Link to={`/incidents/edit/${inc._id}`} className="btn btn-sm btn-secondary" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Edit3 size={14} /> {t('my_incidents.table.edit')}
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
                        {statusFilter ? t('my_incidents.empty_filter') : t('my_incidents.empty_title')}
                    </p>
                    <p className="empty-state-desc">
                        {statusFilter ? t('my_incidents.empty_filter_desc') : t('my_incidents.empty_desc')}
                    </p>
                    {!statusFilter && (
                        <Link to="/report" className="btn btn-primary" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={18} /> {t('my_incidents.empty_btn')}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};


export default MyIncidentsPage;

