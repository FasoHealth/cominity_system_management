import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import {
    ShieldCheck,
    Zap,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Trophy,
    LifeBuoy,
    BarChart3,
    PieChart as PieChartIcon,
    Users,
    Download,
    TrendingUp,
    UserCircle,
    ArrowRight
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

const AdminDashboardPage = () => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get('/api/users/stats');
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error('Erreur stats admin :', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const exportToCSV = () => {
        if (!stats) return;

        // Simple CSV generation for incidents
        const headers = ["ID", "Count", "Type"];
        const rows = stats.byCategory.map(c => [c._id, c.count, "Category"]);
        stats.bySeverity.forEach(s => rows.push([s._id, s.count, "Severity"]));

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `csa_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>{t('admin.dashboard.loading')}</p>
            </div>
        );
    }

    const pieData = stats?.byCategory?.map(c => ({
        name: t(`feed.categories.${c._id}`) || c._id || t('feed.categories.other'),
        value: c.count
    })) || [];

    const trendData = stats?.monthlyTrend?.map(m => {
        const [year, month] = m._id.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return {
            month: date.toLocaleString(i18n.language, { month: 'short' }),
            count: m.count
        };
    }) || [];

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

    return (
        <div className="page-container fade-in">
            {/* Header with Actions */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
                        <ShieldCheck size={28} color="var(--brand-orange)" /> {t('admin.dashboard.title')}
                    </h1>
                    <p className="page-subtitle" style={{ marginTop: 4 }}>{t('admin.dashboard.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={exportToCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
                        <Download size={18} /> {t('admin.dashboard.export')}
                    </button>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))',
                        color: '#fff', padding: '0 16px', borderRadius: 10, fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', gap: 8, height: 42, border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <Zap size={14} fill="currentColor" /> {t('admin.dashboard.admin_mode')}
                    </div>
                </div>
            </div>

            {/* Stat Cards Row */}
            <div className="grid-5" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <a href="/admin/incidents" className="stat-card hover-lift">
                    <div className="stat-icon" style={{ background: 'rgba(232,84,26,0.1)', color: 'var(--brand-orange)' }}><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.incidents?.total}</div>
                        <div className="stat-label">{t('admin.dashboard.stats.total')}</div>
                    </div>
                </a>
                <a href="/admin/incidents?status=pending" className="stat-card hover-lift">
                    <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--yellow)' }}><Clock size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.incidents?.pending}</div>
                        <div className="stat-label">{t('admin.dashboard.stats.pending')}</div>
                    </div>
                </a>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}><CheckCircle2 size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.incidents?.approved}</div>
                        <div className="stat-label">{t('admin.dashboard.stats.approved')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)' }}><Trophy size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.incidents?.resolved}</div>
                        <div className="stat-label">{t('admin.dashboard.stats.resolved')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--purple)' }}><Users size={22} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.users?.total}</div>
                        <div className="stat-label">{t('admin.dashboard.stats.total_users')}</div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '24px', marginBottom: 24 }}>
                {/* Trend Chart */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 24 }}>
                    <div className="card-header" style={{ marginBottom: 24 }}>
                        <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={20} color="var(--brand-orange)" /> {t('admin.dashboard.charts.monthly_trend')}
                        </h3>
                    </div>
                    <div style={{ flex: 1, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'var(--brand-orange-pale)' }}
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}
                                />
                                <Bar dataKey="count" fill="var(--brand-orange)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories Pie */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 24 }}>
                    <div className="card-header" style={{ marginBottom: 24 }}>
                        <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PieChartIcon size={20} color="var(--brand-orange)" /> {t('admin.dashboard.charts.category_title')}
                        </h3>
                    </div>
                    <div style={{ flex: 1, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="45%"
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)' }} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Resolution + Top Reporters */}
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Resolution Rates Table */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrendingUp size={18} color="var(--brand-orange)" /> {t('admin.dashboard.resolution_rate')}
                    </h3>
                    <div className="table-wrapper">
                        <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: 'none', border: 'none' }}>{t('admin.dashboard.table.category')}</th>
                                    <th style={{ background: 'none', border: 'none' }}>{t('admin.dashboard.table.total')}</th>
                                    <th style={{ background: 'none', border: 'none' }}>{t('admin.dashboard.table.rate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.resolutionRateByCategory?.map(cat => (
                                    <tr key={cat._id}>
                                        <td style={{ fontWeight: 600 }}>{t(`feed.categories.${cat._id}`)}</td>
                                        <td>{cat.total}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${cat.rate}%`, background: 'var(--brand-orange)', borderRadius: 3 }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 35 }}>{Math.round(cat.rate)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Reporters */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserCircle size={18} color="var(--brand-orange)" /> {t('admin.dashboard.top_reporters')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {stats?.topReporters?.map((rep, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                background: 'var(--bg-secondary)', borderRadius: 12, transition: 'transform 0.2s'
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-navy)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{rep.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.email}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-orange)' }}>{rep.count}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('dashboard.recent.incident')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/admin/users" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, fontSize: '0.85rem', color: 'var(--brand-orange)', fontWeight: 600, textDecoration: 'none' }}>
                        {t('admin.dashboard.manage_users')} <ArrowRight size={14} />
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboardPage;
