// frontend/src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NOTIF_ICONS = {
    incident_approved: '✅',
    incident_rejected: '❌',
    incident_resolved: '🏆',
    new_incident_nearby: '🚨',
    default: '🔔',
};

function timeAgo(date) {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    const d = Math.floor(h / 24);
    return `Il y a ${d}j`;
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/api/notifications');
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) { console.error('Erreur notifications :', err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAsRead = async (id, incidentId) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (incidentId) navigate(`/incidents/${incidentId}`);
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await axios.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        🔔 Notifications
                        {unreadCount > 0 && (
                            <span className="sidebar-link-badge" style={{ marginLeft: 10, fontSize: '0.8rem', verticalAlign: 'middle' }}>
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="page-subtitle">Restez informé de l'évolution de vos signalements.</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                        ✓ Tout marquer comme lu
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>Chargement des notifications...</p></div>
            ) : notifications.length > 0 ? (
                <div className="notif-list">
                    {notifications.map(notif => {
                        const icon = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
                        const iconBg = notif.type === 'incident_approved' ? 'var(--green-bg)'
                            : notif.type === 'incident_rejected' ? 'var(--red-bg)'
                                : notif.type === 'incident_resolved' ? 'var(--blue-bg)'
                                    : notif.type === 'new_incident_nearby' ? 'rgba(232,84,26,0.12)'
                                        : 'rgba(107,114,128,0.1)';

                        return (
                            <div
                                key={notif._id}
                                className={`notif-item${!notif.isRead ? ' unread' : ''} fade-in`}
                                onClick={() => markAsRead(notif._id, notif.incident?._id)}
                            >
                                <div className="notif-icon" style={{ background: iconBg }}>{icon}</div>
                                <div className="notif-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <span className="notif-title">{notif.title}</span>
                                        {!notif.isRead && (
                                            <span style={{
                                                fontSize: '0.65rem', fontWeight: 700, color: 'var(--brand-orange)',
                                                background: 'rgba(232,84,26,0.1)', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0
                                            }}>Nouveau</span>
                                        )}
                                    </div>
                                    <p className="notif-body">{notif.message}</p>
                                    {notif.incident && (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📂 Incident :</span>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: 600, color: 'var(--brand-orange)',
                                                background: 'var(--brand-orange-pale)', padding: '2px 8px', borderRadius: 10
                                            }}>
                                                {notif.incident.title}
                                            </span>
                                        </div>
                                    )}
                                    <div className="notif-time">🕒 {timeAgo(notif.createdAt)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">🔕</div>
                    <p className="empty-state-title">Tout est calme</p>
                    <p className="empty-state-desc">Vous n'avez aucune notification récente.<br />Signaler des incidents pour rester informé !</p>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
