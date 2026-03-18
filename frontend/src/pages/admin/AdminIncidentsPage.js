import { useTranslation } from 'react-i18next';

// frontend/src/pages/admin/AdminIncidentsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { timeAgo } from '../../utils/dateUtils';

import {
    ShieldAlert,
    Hammer,
    Eye,
    Flame,
    Car,
    AlertTriangle,
    Search,
    RefreshCw,
    Clock,
    MapPin,
    ThumbsUp,
    Check,
    X,
    Trophy,
    CheckCircle2,
    Calendar,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';


const AdminIncidentsPage = () => {
    const { t, i18n } = useTranslation();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, resolved: 0 });
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const CAT_LABELS = {
        theft: t('feed.categories.theft'),
        assault: t('feed.categories.assault'),
        vandalism: t('feed.categories.vandalism'),
        suspicious_activity: t('feed.categories.suspicious_activity'),
        fire: t('feed.categories.fire'),
        kidnapping: t('feed.categories.kidnapping'),
        other: t('feed.categories.other')
    };

    const CAT_ICONS = {
        theft: ShieldAlert,
        assault: ShieldAlert,
        vandalism: Hammer,
        suspicious_activity: Eye,
        fire: Flame,
        kidnapping: ShieldAlert,
        other: AlertTriangle
    };


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
        } catch (err) { alert(err.response?.data?.message || t('profile.fields.error_save')); }
        finally { setActionLoading(null); }
    };

    const handleNotifyService = async (id, service) => {
        setActionLoading(`${id}-${service}`);
        try {
            const { data } = await axios.post(`/api/incidents/${id}/notify-services`, { service });
            if (data.success) {
                alert(data.message);
                fetchAdminIncidents();
            }
        } catch (err) { alert(err.response?.data?.message || t('admin.incidents.error_notify')); }
        finally { setActionLoading(null); }
    };

    const displayed = incidents.filter(inc =>
        !search ||
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.location?.address?.toLowerCase().includes(search.toLowerCase())
    );

    const TABS = [
        { v: 'pending', l: t('feed.status.pending'), c: counts.pending, icon: Clock },
        { v: 'approved', l: t('feed.status.approved'), c: counts.approved, icon: CheckCircle2 },
        { v: 'rejected', l: t('feed.status.rejected'), c: counts.rejected, icon: X },
        { v: 'resolved', l: t('feed.status.resolved'), c: counts.resolved, icon: Trophy },
    ];

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ShieldAlert size={28} color="var(--brand-orange)" /> {t('admin.incidents.title')}
                    </h1>
                    <span style={{ background: 'var(--brand-orange)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20, boxShadow: '0 2px 8px rgba(232,84,26,0.2)' }}>
                        {counts.pending + counts.approved} {t('admin.incidents.incidents_count')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input placeholder={t('admin.incidents.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
                            style={{ padding: '10px 14px 10px 38px', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', minWidth: 260, transition: 'all 0.2s' }} />
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, height: 42 }} onClick={fetchAdminIncidents}>
                        <RefreshCw size={16} /> {t('admin.incidents.refresh')}
                    </button>
                </div>
            </div>

            {/* Underline tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
                {TABS.map(t_tab => {
                    const TabIcon = t_tab.icon;
                    return (
                        <button key={t_tab.v} onClick={() => setActiveTab(t_tab.v)} style={{
                            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '0.875rem', fontWeight: activeTab === t_tab.v ? 700 : 500,
                            color: activeTab === t_tab.v ? 'var(--brand-orange)' : 'var(--text-muted)',
                            borderBottom: `2.5px solid ${activeTab === t_tab.v ? 'var(--brand-orange)' : 'transparent'}`,
                            marginBottom: -1, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <TabIcon size={16} />
                            {t_tab.l}
                            {t_tab.c > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, marginLeft: 4, background: activeTab === t_tab.v ? 'rgba(232,84,26,0.1)' : 'var(--bg-secondary)', color: activeTab === t_tab.v ? 'var(--brand-orange)' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 20 }}>{t_tab.c}</span>}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>{t('admin.incidents.loading')}</p></div>
            ) : displayed.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {displayed.map(inc => {
                        const IconComponent = CAT_ICONS[inc.category] || AlertTriangle;
                        const iconBg = inc.severity === 'critical' ? 'rgba(239,68,68,0.1)' : inc.severity === 'high' ? 'rgba(249,115,22,0.1)' : inc.severity === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)';
                        const iconColor = inc.severity === 'critical' ? '#EF4444' : inc.severity === 'high' ? '#F97316' : inc.severity === 'medium' ? '#EAB308' : '#22C55E';

                        return (
                            <div key={inc._id} className="mod-card fade-in" style={{ borderRadius: 16, border: '1px solid var(--border)', padding: 16, background: 'var(--bg-primary)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', transition: 'all 0.2s' }}>
                                {/* Mini thumbnail */}
                                <div className="mod-card-thumb" style={{ background: iconBg, width: 80, height: 80, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <IconComponent size={32} color={iconColor} />
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, letterSpacing: '0.05em' }}>
                                        {t(`feed.severities.${inc.severity}`).toUpperCase()}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mod-card-body" style={{ flex: 1, minWidth: 'min(100%, 250px)' }}>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <span className={`badge badge-${inc.category}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {CAT_LABELS[inc.category]}
                                        </span>
                                        {inc.status === 'pending' && <span style={{ background: 'rgba(234,179,8,0.1)', color: '#b45309', fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(234,179,8,0.2)' }}>{t('feed.status.pending').toUpperCase()}</span>}
                                        {inc.upvotes?.length >= 5 && inc.status === 'approved' && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>{t('admin.incidents.community_validated')}</span>}
                                    </div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, color: 'var(--text-primary)' }}>{inc.title}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {inc.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12} /> {timeAgo(inc.createdAt, t, i18n.language)}</div>
                                        {inc.location?.address && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} /> {inc.location.address}</div>
                                        )}
                                        {inc.upvoteCount > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-orange)', fontWeight: 700 }}><ThumbsUp size={12} /> {t('admin.incidents.votes', { count: inc.upvoteCount })}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mod-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240, flexShrink: 0 }}>
                                    {activeTab === 'pending' && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-sm btn-success" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8 }}
                                                disabled={actionLoading === `${inc._id}-approved`}
                                                onClick={() => handleModerate(inc._id, 'approved')}>
                                                {actionLoading === `${inc._id}-approved` ? <RefreshCw size={14} className="spin" /> : <Check size={14} />} {t('admin.incidents.approve')}
                                            </button>
                                            <button className="btn btn-sm btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8 }}
                                                disabled={actionLoading === `${inc._id}-rejected`}
                                                onClick={() => handleModerate(inc._id, 'rejected')}>
                                                {actionLoading === `${inc._id}-rejected` ? <RefreshCw size={14} className="spin" /> : <X size={14} />} {t('admin.incidents.reject')}
                                            </button>
                                        </div>
                                    )}
                                    {activeTab === 'approved' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 36, borderRadius: 8 }} onClick={() => handleModerate(inc._id, 'resolved')}>
                                                <Trophy size={14} /> {t('admin.incidents.mark_resolved')}
                                            </button>
                                        </div>
                                    )}
                                    <Link to={`/incidents/${inc._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 8, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--border)' }}>
                                        <Eye size={14} /> {t('admin.incidents.details')}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div className="empty-state-icon" style={{ marginBottom: 20 }}>
                        <CheckCircle2 size={64} opacity={0.1} />
                    </div>
                    <p className="empty-state-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('admin.incidents.empty_title')}</p>
                    <p className="empty-state-desc" style={{ color: 'var(--text-muted)', marginTop: 8 }}>{t('admin.incidents.empty_desc')}</p>
                </div>
            )}
        </div>
    );
};

export default AdminIncidentsPage;

