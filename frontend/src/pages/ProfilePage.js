// frontend/src/pages/ProfilePage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera,
    Shield,
    User,
    LogOut,
    Activity,
    TrendingUp,
    Settings,
    Zap,
    Radio,
    Flame,
    Ghost,
    Hammer,
    Eye,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Waves,
    Megaphone,
    FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

import { useTranslation } from 'react-i18next';

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const CATEGORY_ICONS = {
    theft: ShieldAlert,
    assault: ShieldAlert,
    vandalism: Hammer,
    suspicious_activity: Eye,
    fire: Flame,
    kidnapping: Ghost,
    other: AlertTriangle
};

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({ name: '', phone: '', city: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ incidents: 0, upvotes: 0, confirmed: 0, guides: 0 });
    const [history, setHistory] = useState([]);
    const [alertRadius, setAlertRadius] = useState(5);
    const [notifPrefs, setNotifPrefs] = useState({ fire: true, flood: true, civil: false });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                city: user.location?.city || ''
            });
            const avatarUrl = user.avatar
                ? (user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.avatar}`)
                : null;
            setAvatarPreview(avatarUrl);
        }

        axios.get('/api/incidents/mes-signalements').then(({ data }) => {
            if (data.success) {
                const incs = data.incidents;
                setStats({
                    incidents: incs.length,
                    upvotes: incs.reduce((s, i) => s + (i.upvoteCount || 0), 0),
                    confirmed: incs.filter(i => i.status === 'approved' || i.status === 'resolved').length,
                    guides: 0,
                });
                setHistory(incs.slice(0, 10));
            }
        }).catch(console.error);
    }, [user, user?.avatar]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('phone', form.phone);
        formData.append('city', form.city);
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        try {
            const { data } = await axios.put('/api/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                updateUser(data.user);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('profile.fields.error_save'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const STATUS_LABELS = {
        pending: t('feed.status.pending'),
        approved: t('feed.status.approved'),
        resolved: t('feed.status.resolved'),
        rejected: t('feed.status.rejected')
    };
    const STATUS_COLORS = { pending: '#FACC15', approved: '#22C55E', resolved: '#3B82F6', rejected: '#EF4444' };

    return (
        <div className="page-container fade-in" style={{ maxWidth: 1000, paddingBottom: 40 }}>
            {/* Header / Banner area */}
            <div className="profile-banner" style={{
                height: 160, background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))',
                borderRadius: 'var(--radius-lg)', marginBottom: -60, position: 'relative'
            }}></div>

            <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 30, position: 'relative', zIndex: 1 }}>

                {/* Left Column: Avatar & Summary */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card profile-card-main" style={{ textAlign: 'center', paddingTop: 0 }}>
                        <div className="avatar-container" style={{ position: 'relative', marginTop: -60, marginBottom: 16 }}>
                            <div className="avatar-large" style={{
                                width: 120, height: 120, borderRadius: '50%', border: '5px solid white',
                                background: 'var(--brand-orange)', margin: '0 auto', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                boxShadow: 'var(--shadow-lg)'
                            }}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{initials(user?.name)}</span>
                                )}
                            </div>
                            <button
                                className="avatar-edit-btn"
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    position: 'absolute', bottom: 5, right: 'calc(50% - 60px)',
                                    width: 36, height: 36, borderRadius: '50%', background: 'white',
                                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                title={t('edit.add_photos')}
                            >
                                <Camera size={18} />
                            </button>
                            <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                        </div>

                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>{user?.name}</h2>
                        <p style={{
                            fontSize: '0.85rem', color: 'var(--brand-orange)', fontWeight: 700,
                            textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}>
                            {user?.role === 'admin' ? <><Shield size={14} /> {t('profile.roles.admin')}</> : <><User size={14} /> {t('profile.roles.citizen')}</>}
                        </p>

                        <div style={{ padding: '0 10px' }}>
                            <button className="btn btn-ghost btn-full btn-sm" style={{ color: 'var(--red)', marginBottom: 8 }} onClick={handleLogout}>
                                <LogOut size={16} style={{ marginRight: 8 }} /> {t('profile.logout')}
                            </button>
                        </div>
                    </div>

                    <div className="grid-2" style={{ gap: 12 }}>
                        <div className="stat-card-compact card" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('profile.stats.alerts')}</div>
                                <Activity size={14} color="var(--brand-orange)" opacity={0.6} />
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.incidents}</div>
                        </div>
                        <div className="stat-card-compact card" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('profile.stats.impact')}</div>
                                <TrendingUp size={14} color="var(--brand-orange)" opacity={0.6} />
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.upvotes}</div>
                        </div>
                    </div>
                </aside>

                {/* Right Column: Settings & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Settings sections */}
                    <div className="card" style={{ padding: 30 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Settings size={20} color="var(--brand-orange)" /> {t('profile.title')}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{t('profile.subtitle')}</p>
                            </div>
                            {saved && (
                                <span className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                                    <CheckCircle2 size={14} /> {t('profile.saved_success')}
                                </span>
                            )}
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                <div className="form-group">
                                    <label className="form-label">{t('profile.fields.name')}</label>
                                    <input
                                        className="form-control"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('profile.fields.phone')}</label>
                                    <input
                                        className="form-control"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder={t('profile.fields.phone_placeholder')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('profile.fields.email_hint')}</label>
                                    <input className="form-control" value={user?.email} disabled style={{ background: 'var(--bg-primary)', cursor: 'not-allowed' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('profile.fields.city')}</label>
                                    <input
                                        className="form-control"
                                        value={form.city}
                                        onChange={e => setForm({ ...form, city: e.target.value })}
                                        placeholder={t('profile.fields.city_placeholder')}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                                <button className="btn btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {saving ? t('profile.fields.loading') : <><Zap size={18} fill="currentColor" /> {t('profile.fields.save_btn')}</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Alerts Preferences */}
                    <div className="card" style={{ padding: 30 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Radio size={20} color="var(--brand-orange)" /> {t('profile.notifications.title')}
                        </h3>

                        <div style={{ background: 'var(--bg-primary)', padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('profile.notifications.radius_label')}</span>
                                <span style={{ color: 'var(--brand-orange)', fontWeight: 800 }}>{alertRadius} km</span>
                            </div>
                            <input
                                type="range" min="1" max="50" step="1"
                                value={alertRadius} onChange={e => setAlertRadius(e.target.value)}
                                style={{ width: '100%', accentColor: 'var(--brand-orange)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                <span>{t('profile.notifications.radius_local')}</span>
                                <span>{t('profile.notifications.radius_regional')}</span>
                            </div>
                        </div>

                        <div className="pref-list">
                            {[
                                { key: 'fire', icon: <Flame size={20} color="#EF4444" />, label: t('profile.notifications.pref_fire') },
                                { key: 'flood', icon: <Waves size={20} color="#3B82F6" />, label: t('profile.notifications.pref_flood') },
                                { key: 'civil', icon: <Megaphone size={20} color="#F59E0B" />, label: t('profile.notifications.pref_civil') },
                            ].map(pref => (
                                <div key={pref.key} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '16px 0', borderBottom: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                        {pref.icon}
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{pref.label}</span>
                                    </div>
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox" className="toggle-input"
                                            checked={notifPrefs[pref.key]}
                                            onChange={e => setNotifPrefs({ ...notifPrefs, [pref.key]: e.target.checked })}
                                        />
                                        <div className="toggle-switch" />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active History */}
                    {history.length > 0 && (
                        <div className="card" style={{ padding: 30 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <FileText size={20} color="var(--brand-orange)" /> {t('profile.history.title')}
                            </h3>
                            <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {history.map(inc => {
                                    const Icon = CATEGORY_ICONS[inc.category] || AlertTriangle;
                                    const categoryLabel = t(`feed.categories.${inc.category}`) || inc.category;
                                    return (
                                        <div key={inc._id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--border)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 10, background: 'var(--bg-primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Icon size={20} color="var(--brand-orange)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{inc.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <span style={{ color: 'var(--brand-orange)', fontWeight: 600 }}>{categoryLabel}</span> • {new Date(inc.createdAt).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                                                background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status]
                                            }}>
                                                {STATUS_LABELS[inc.status]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .profile-banner { transition: height 0.3s; }
                .card { transition: transform 0.2s; }
                .form-control:focus { border-color: var(--brand-orange); box-shadow: 0 0 0 3px rgba(232,84,26,0.1); }
            `}</style>
        </div>
    );
};


export default ProfilePage;

