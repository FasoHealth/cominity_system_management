// frontend/src/pages/admin/AdminUsersPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, 
    Search, 
    UserPlus, 
    User, 
    Mail, 
    Shield, 
    Activity, 
    Calendar, 
    AlertTriangle, 
    ChevronLeft, 
    ChevronRight,
    UserCheck,
    Ban,
    MoreHorizontal
} from 'lucide-react';

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#E8541A', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'];
function avatarColor(name = '') {
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

import { useTranslation } from 'react-i18next';

const AdminUsersPage = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/users', { params: { search, limit: 100 } });
            if (data.success) setUsers(data.users);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [search]);

    const toggleUserStatus = async (id) => {
        setActionLoading(id);
        try {
            const { data } = await axios.put(`/api/users/${id}/toggle`);
            if (data.success) setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.user.isActive } : u));
        } catch (err) { alert(err.response?.data?.message || t('profile.fields.error_save')); }
        finally { setActionLoading(null); }
    };

    const activeCnt = users.filter(u => u.isActive).length;
    const bannedCnt = users.filter(u => !u.isActive).length;

    const totalPages = Math.ceil(users.length / LIMIT);
    const paginated = users.slice((page - 1) * LIMIT, page * LIMIT);

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Users size={28} color="var(--brand-orange)" /> {t('admin.users.title')}
                    </h1>
                    <span style={{ background: 'rgba(232,84,26,0.1)', color: 'var(--brand-orange)', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
                        {t('admin.users.total_hint', { count: users.length })}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input placeholder={t('admin.incidents.search_placeholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ padding: '10px 14px 10px 38px', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', minWidth: 240 }} />
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10 }}>
                        <UserPlus size={16} /> {t('admin.users.new_btn')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>{t('admin.users.loading')}</p></div>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> {t('admin.users.table.user')}</th>
                                        <th><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> {t('admin.users.table.email')}</div></th>
                                        <th><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={14} /> {t('admin.users.table.role')}</div></th>
                                        <th><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={14} /> {t('admin.users.table.status')}</div></th>
                                        <th><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={14} /> {t('admin.users.table.date')}</div></th>
                                        <th><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={14} /> {t('admin.users.table.reports')}</div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(u => {
                                        const bg = avatarColor(u.name);
                                        const isLoading = actionLoading === u._id;
                                        return (
                                            <tr key={u._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                            {initials(u.name)}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{u.name}</div>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.72rem', fontWeight: 700,
                                                        background: u.role === 'admin' ? 'rgba(232,84,26,0.1)' : 'var(--bg-secondary)',
                                                        color: u.role === 'admin' ? 'var(--brand-orange)' : 'var(--text-secondary)',
                                                        padding: '4px 10px', borderRadius: 6,
                                                        border: `1px solid ${u.role === 'admin' ? 'rgba(232,84,26,0.2)' : 'var(--border)'}`,
                                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                                    }}>{u.role === 'admin' ? t('admin.users.roles.admin') : u.role === 'guide' ? t('admin.users.roles.moderator') : t('admin.users.roles.citizen')}</span>
                                                </td>
                                                <td>
                                                    <label className="toggle-label" style={{ margin: 0 }} title={isLoading ? '...' : (u.isActive ? t('profile.notifications.status_on') : t('profile.notifications.status_off'))}>
                                                        <input type="checkbox" className="toggle-input"
                                                            checked={u.isActive}
                                                            onChange={() => toggleUserStatus(u._id)}
                                                            disabled={isLoading} />
                                                        <div className="toggle-switch" style={{ opacity: isLoading ? 0.5 : 1 }} />
                                                    </label>
                                                </td>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ 
                                                        fontWeight: 800, 
                                                        color: u.incidentsReported > 5 ? 'var(--brand-orange)' : 'var(--text-primary)',
                                                        background: u.incidentsReported > 0 ? 'var(--bg-secondary)' : 'transparent',
                                                        padding: '2px 8px', borderRadius: 4
                                                    }}>
                                                        {u.incidentsReported || 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {t('admin.users.pagination_hint', { start: (page - 1) * LIMIT + 1, end: Math.min(page * LIMIT, users.length), total: users.length })}
                                </span>
                                <div className="pagination" style={{ display: 'flex', gap: 6 }}>
                                    <button className="page-btn" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={`page-btn${page === p ? ' active' : ''}`} style={{ width: 32, height: 32, padding: 0 }} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="page-btn" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                        {[
                            { icon: UserCheck, label: t('admin.users.stats.active'), value: activeCnt, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                            { icon: Ban, label: t('admin.users.stats.banned'), value: bannedCnt, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                            { icon: UserPlus, label: t('admin.users.stats.new_month'), value: users.filter(u => { const d = new Date(u.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                        ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px', borderRadius: 16 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={28} color={s.color} />
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s.label}</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>{s.value.toLocaleString()}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminUsersPage;
