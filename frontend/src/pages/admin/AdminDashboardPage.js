// frontend/src/pages/admin/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

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

    // Pre-process chart data
    const pieData = stats?.byCategory?.map(c => ({
        name: c._id || 'Autre',
        value: c.count
    })) || [];

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Administration 🛡️</h1>
                <p className="page-subtitle">Vue d'ensemble de l'activité du système.</p>
            </div>

            <div className="grid-4" style={{ marginBottom: '32px' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--red-glow)', color: 'var(--red)' }}>🚨</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.incidents?.total}</div>
                        <div className="stat-label">Total Incidents</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>⌛</div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: '#eab308' }}>{stats?.incidents?.pending}</div>
                        <div className="stat-label">À Modérer</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>✔️</div>
                    <div className="stat-info">
                        <div className="stat-value" style={{ color: '#3b82f6' }}>{stats?.incidents?.approved}</div>
                        <div className="stat-label">Affaires Approuvées</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>🤝</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.incidents?.resolved}</div>
                        <div className="stat-label">Cas Résolus</div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '24px' }}>
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="card-title" style={{ marginBottom: '24px' }}>Incidents des 7 derniers jours</h3>
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
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ color: 'var(--red)' }}
                                />
                                <Bar dataKey="count" fill="var(--red)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="card-title" style={{ marginBottom: '24px' }}>Répartition par Catégorie</h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
