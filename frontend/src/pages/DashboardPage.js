// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Megaphone, 
    CheckCircle2, 
    Clock, 
    Trophy, 
    BarChart3, 
    FileText, 
    PlusCircle, 
    Bell, 
    Map as MapIcon, 
    Layout as FeedIcon, 
    Lightbulb,
    ChevronRight,
    Search,
    Flame,
    Car,
    Hammer,
    Eye,
    ShieldAlert,
    AlertTriangle,
    Zap,
    Frown
} from 'lucide-react';

const STATUS_LABELS = (t) => ({ 
    pending: t('dashboard.status.pending'), 
    approved: t('dashboard.status.approved'), 
    resolved: t('dashboard.status.resolved'), 
    rejected: t('dashboard.status.rejected') 
});

const CAT_LABELS = (t) => ({
    theft: t('feed.categories.theft'), 
    assault: t('feed.categories.assault'), 
    vandalism: t('feed.categories.vandalism'),
    suspicious_activity: t('feed.categories.suspicious_activity'), 
    fire: t('feed.categories.fire'), 
    kidnapping: t('feed.categories.kidnapping'), 
    other: t('feed.categories.other')
});

const CAT_ICONS = {
    theft: <ShieldAlert size={16} />,
    assault: <ShieldAlert size={16} />, // Changed Frown to ShieldAlert as it's more appropriate and already imported
    vandalism: <Hammer size={16} />,
    suspicious_activity: <Eye size={16} />,
    fire: <Flame size={16} />,
    kidnapping: <ShieldAlert size={16} />,
    other: <AlertTriangle size={16} />
};

// Re-defining for consistency with other pages
const CATEGORY_ICONS = {
    theft: ShieldAlert,
    assault: ShieldAlert, // Using ShieldAlert for general security if Frown is not ideal
    vandalism: Hammer,
    suspicious_activity: Eye,
    fire: Flame,
    kidnapping: ShieldAlert,
    other: AlertTriangle
};

function buildMonthlyChart(incidents) {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const count = incidents.filter(inc => {
            const incDate = new Date(inc.createdAt);
            return incDate.getMonth() === d.getMonth() && incDate.getFullYear() === d.getFullYear();
        }).length;
        return { month: months[d.getMonth()], total: count };
    });
}

const DashboardPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, resolved: 0, recent: [], chartData: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/incidents/my').then(({ data }) => {
            if (data.success) {
                const incidents = data.incidents;
                setStats({
                    total: incidents.length,
                    approved: incidents.filter(i => i.status === 'approved').length,
                    pending: incidents.filter(i => i.status === 'pending').length,
                    resolved: incidents.filter(i => i.status === 'resolved').length,
                    recent: incidents.slice(0, 6),
                    chartData: buildMonthlyChart(incidents),
                });
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="page-loader"><div className="spinner" /><p>{t('dashboard.loading') || 'Chargement...'}</p></div>
    );


    const statCards = [

        { icon: <Megaphone size={20} />, label: t('dashboard.stats.total'), value: stats.total, bg: 'rgba(232,84,26,0.12)', color: 'var(--brand-orange)' },
        { icon: <CheckCircle2 size={20} />, label: t('dashboard.stats.approved'), value: stats.approved, bg: 'var(--green-bg)', color: 'var(--green)' },
        { icon: <Clock size={20} />, label: t('dashboard.stats.pending'), value: stats.pending, bg: 'var(--yellow-bg)', color: 'var(--yellow)' },
        { icon: <Trophy size={20} />, label: t('dashboard.stats.resolved'), value: stats.resolved, bg: 'var(--blue-bg)', color: 'var(--blue)' },
    ];
    
    const currentStatusLabels = STATUS_LABELS(t);
    const currentCatLabels = CAT_LABELS(t);

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {t('dashboard.greeting', { name: user?.name?.split(' ')[0] })} <Zap size={24} fill="var(--brand-orange)" color="var(--brand-orange)" />
                </h1>
                <p className="page-subtitle">{t('dashboard.subtitle')}</p>
            </div>

            {/* Stat cards */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                {/* Chart + Recent */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Bar chart */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <BarChart3 size={18} color="var(--brand-orange)" /> {t('dashboard.chart.title')}
                            </h3>
                        </div>
                        {stats.chartData.some(d => d.total > 0) ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={stats.chartData} barCategoryGap="35%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                                        cursor={{ fill: 'var(--brand-orange-pale)' }}
                                    />
                                    <Bar dataKey="total" fill="var(--brand-orange)" radius={[4, 4, 0, 0]} name={t('dashboard.recent.incident')} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state" style={{ padding: '24px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('dashboard.chart.empty')}</p>
                            </div>
                        )}
                    </div>

                    {/* Recent incidents table */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('dashboard.recent.title')}</h3>
                            <Link to="/my-incidents" className="btn btn-sm btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {t('dashboard.recent.view_all')} <ChevronRight size={14} />
                            </Link>
                        </div>
                        {stats.recent.length > 0 ? (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>{t('dashboard.recent.incident')}</th>
                                            <th>{t('dashboard.recent.category')}</th>
                                            <th>{t('dashboard.recent.date')}</th>
                                            <th>{t('dashboard.recent.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent.map(inc => {
                                            const Icon = CATEGORY_ICONS[inc.category] || AlertTriangle;
                                            return (
                                                <tr key={inc._id} onClick={() => window.location.href = `/incidents/${inc._id}`}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div className={`cat-icon-mini ${inc.category}`} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                                                                <Icon size={14} />
                                                            </div>
                                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inc.title}</span>
                                                        </div>
                                                    </td>
                                                    <td><span className={`badge badge-${inc.category}`}>{currentCatLabels[inc.category] || inc.category}</span></td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Clock size={12} /> {new Date(inc.createdAt).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                                                        </div>
                                                    </td>
                                                    <td><span className={`badge badge-${inc.status}`}>{currentStatusLabels[inc.status] || inc.status}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <FileText size={48} opacity={0.2} />
                                </div>
                                <p className="empty-state-title">{t('dashboard.recent.empty_title')}</p>
                                <p className="empty-state-desc">{t('dashboard.recent.empty_desc')}</p>
                                <Link to="/report" className="btn btn-primary" style={{ marginTop: 16 }}>{t('dashboard.recent.report_now')}</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: quick actions + tip */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Zap size={18} color="var(--brand-orange)" /> {t('dashboard.actions.title')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Link to="/report" className="btn btn-primary btn-full" style={{ padding: '13px 16px', justifyContent: 'flex-start', gap: 12 }}>
                                <PlusCircle size={20} /> <span>{t('dashboard.actions.new')}</span>
                            </Link>
                            <Link to="/notifications" className="btn btn-secondary btn-full" style={{ padding: '13px 16px', justifyContent: 'flex-start', gap: 12 }}>
                                <Bell size={20} /> <span>{t('dashboard.actions.notifications')}</span>
                            </Link>
                            <Link to="/map" className="btn btn-secondary btn-full" style={{ padding: '13px 16px', justifyContent: 'flex-start', gap: 12 }}>
                                <MapIcon size={20} /> <span>{t('dashboard.actions.map')}</span>
                            </Link>
                            <Link to="/feed" className="btn btn-secondary btn-full" style={{ padding: '13px 16px', justifyContent: 'flex-start', gap: 12 }}>
                                <FeedIcon size={20} /> <span>{t('dashboard.actions.feed')}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Progression */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-navy-light) 100%)', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Lightbulb size={16} color="var(--brand-orange-light)" />
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('dashboard.tip.title')}
                            </p>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                            {t('dashboard.tip.desc')}
                        </p>
                        <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3,
                                background: 'linear-gradient(90deg, var(--brand-orange), var(--brand-orange-light))',
                                width: stats.total > 0 ? `${Math.min((stats.resolved / stats.total) * 100, 100)}%` : '0%',
                                transition: 'width 1s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{t('dashboard.tip.resolution_rate')}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--brand-orange-light)', fontWeight: 700 }}>
                                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
