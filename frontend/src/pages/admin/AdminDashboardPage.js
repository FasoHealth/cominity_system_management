// frontend/src/pages/admin/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    Users
} from 'lucide-react';

const AdminDashboardPage = () => {
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

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Génération du rapport statistique...</p>
            </div>
        );
    }

    const pieData = stats?.byCategory?.map(c => ({
        name: c._id || 'Autre',
        value: c.count
    })) || [];

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ShieldCheck size={28} color="var(--brand-orange)" /> Administration
                    </h1>
                    <p className="page-subtitle">Vue d'ensemble de l'activité et des statistiques du système.</p>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))',
                    color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-sm)'
                }}>
                    <Zap size={14} fill="currentColor" /> Mode Administrateur
                </div>
            </div>

            <div className="grid-5" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <a href="/admin/incidents" className="stat-card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
                    <div className="stat-icon" style={{ background: 'rgba(232,84,26,0.1)', color: 'var(--brand-orange)' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: 'var(--brand-orange)' }}>{stats?.incidents?.total}</div>
                        <div className="stat-label">Total Incidents</div>
                    </div>
                </a>
                <a href="/admin/incidents?status=pending" className="stat-card" style={{ textDecoration: 'none' }}>
                    <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--yellow)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: 'var(--yellow)' }}>{stats?.incidents?.pending}</div>
                        <div className="stat-label">À Modérer</div>
                    </div>
                </a>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats?.incidents?.approved}</div>
                        <div className="stat-label">Approuvés</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)' }}>
                        <Trophy size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.incidents?.resolved}</div>
                        <div className="stat-label">Cas Résolus</div>
                    </div>
                </div>
                <a href="/admin/appeals" className="stat-card" style={{ textDecoration: 'none' }}>
                    <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--purple)' }}>
                        <LifeBuoy size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: 'var(--purple)' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700 }}>Gérer</span>
                        </div>
                        <div className="stat-label">Recours Compte</div>
                    </div>
                </a>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '24px' }}>
                <div className="card" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: 24 }}>
                    <h3 className="card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BarChart3 size={20} color="var(--brand-orange)" /> Incidents des 7 derniers jours
                    </h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.last7Days}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                />
                                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
                                    itemStyle={{ color: 'var(--brand-orange)' }}
                                />
                                <Bar dataKey="count" fill="var(--brand-orange)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: 24 }}>
                    <h3 className="card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <PieChartIcon size={20} color="var(--brand-orange)" /> Répartition par Catégorie
                    </h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
