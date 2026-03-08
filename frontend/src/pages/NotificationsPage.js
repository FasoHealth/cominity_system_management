// frontend/src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        } catch (err) {
            console.error('Erreur notifications :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id, incidentId) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            // Update local state if successful
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Navigate to incident if associated
            if (incidentId) {
                navigate(`/incidents/${incidentId}`);
            }
        } catch (err) {
            console.error('Erreur mark read :', err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Erreur mark all read :', err);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Notifications 🔔</h1>
                    <p className="page-subtitle">Restez informé de l'évolution de vos signalements.</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                        Marquer tout comme lu
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loader">
                    <div className="spinner"></div>
                    <p>Chargement des notifications...</p>
                </div>
            ) : notifications.length > 0 ? (
                <div className="card fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                    {notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => markAsRead(notif._id, notif.incident?._id)}
                        >
                            {!notif.isRead && <div className="notif-dot"></div>}
                            <div className="notif-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <h4 className="notif-title">{notif.title}</h4>
                                    <span className="notif-time">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="notif-message">{notif.message}</p>
                                {notif.incident && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📂 Lié à :</span>
                                        <span className="badge badge-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>{notif.incident.title}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">🔕</div>
                    <p className="empty-state-title">Aucune notification</p>
                    <p className="empty-state-desc">Vous n'avez pas de notifications récentes.</p>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
