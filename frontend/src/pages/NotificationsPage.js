// frontend/src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Bell, 
    BellOff, 
    CheckCircle2, 
    XCircle, 
    Trophy, 
    ShieldAlert, 
    Clock, 
    Eye, 
    FileText,
    MessageSquare,
    ChevronRight
} from 'lucide-react';

const NOTIF_ICONS = {
    incident_approved: CheckCircle2,
    incident_rejected: XCircle,
    incident_resolved: Trophy,
    new_incident_nearby: ShieldAlert,
    new_message: MessageSquare,
    default: Bell,
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Bell size={28} color="var(--brand-orange)" /> Notifications
                        {unreadCount > 0 && (
                            <span className="sidebar-link-badge" style={{ fontSize: '0.8rem', verticalAlign: 'middle', padding: '2px 10px', borderRadius: 20 }}>
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="page-subtitle">Restez informé de l'évolution de vos signalements.</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={markAllRead}>
                        <Eye size={16} /> Tout marquer comme lu
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>Chargement des notifications...</p></div>
            ) : notifications.length > 0 ? (
                <div className="notif-list" style={{ marginTop: 24 }}>
                    {notifications.map(notif => {
                        const IconComponent = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
                        const iconColor = notif.type === 'incident_approved' ? '#10b981'
                            : notif.type === 'incident_rejected' ? '#ef4444'
                                : notif.type === 'incident_resolved' ? '#3b82f6'
                                    : notif.type === 'new_incident_nearby' ? 'var(--brand-orange)'
                                        : notif.type === 'new_message' ? '#8b5cf6'
                                            : 'var(--text-secondary)';
                        const iconBg = notif.type === 'incident_approved' ? 'rgba(16, 185, 129, 0.1)'
                            : notif.type === 'incident_rejected' ? 'rgba(239, 68, 68, 0.1)'
                                : notif.type === 'incident_resolved' ? 'rgba(59, 130, 246, 0.1)'
                                    : notif.type === 'new_incident_nearby' ? 'rgba(232, 84, 26, 0.1)'
                                        : notif.type === 'new_message' ? 'rgba(139, 92, 246, 0.1)'
                                            : 'rgba(107, 114, 128, 0.1)';

                        return (
                            <div
                                key={notif._id}
                                className={`notif-item${!notif.isRead ? ' unread' : ''} fade-in`}
                                onClick={() => markAsRead(notif._id, notif.incident?._id)}
                                style={{ borderRadius: 12, marginBottom: 12, padding: 16, border: '1px solid var(--border)', background: 'var(--bg-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div className="notif-icon" style={{ 
                                        background: iconBg, 
                                        width: 48, height: 48, borderRadius: 12, 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <IconComponent size={24} color={iconColor} />
                                    </div>
                                    <div className="notif-content" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <span className="notif-title" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{notif.title}</span>
                                            {!notif.isRead && (
                                                <span style={{
                                                    fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-orange)',
                                                    background: 'rgba(232,84,26,0.1)', padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em'
                                                }}>Nouveau</span>
                                            )}
                                        </div>
                                        <p className="notif-body" style={{ color: 'var(--text-secondary)', margin: '4px 0 12px', lineHeight: 1.5 }}>{notif.message}</p>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                            {notif.incident && (
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <FileText size={12} color="var(--text-muted)" />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-orange)' }}>
                                                        {notif.incident.title}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="notif-time" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {timeAgo(notif.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', opacity: 0.3 }}>
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div className="empty-state-icon" style={{ marginBottom: 20 }}>
                        <BellOff size={64} opacity={0.1} />
                    </div>
                    <p className="empty-state-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tout est calme</p>
                    <p className="empty-state-desc" style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        Vous n'avez aucune notification récente.<br />
                        Signalez des incidents pour rester informé de l'activité dans votre quartier !
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
