// frontend/src/pages/admin/AdminAppealsPage.js
import React, { useState, useEffect } from 'react';
import {
    UserCheck,
    Shield,
    MessageSquare,
    Unlock,
    Edit3,
    CheckCircle,
    AlertCircle,
    User,
    Clock,
    Send,
    X,
    ShieldAlert,
    ChevronRight,
    RefreshCw,
    Mail,
    CheckCircle2
} from 'lucide-react';
import axios from 'axios';

import { useTranslation } from 'react-i18next';

const AdminAppealsPage = () => {
    const { t } = useTranslation();
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchAppeals = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/support/appeals');
            if (data.success) setAppeals(data.appeals);
        } catch (err) {
            console.error('Erreur appeals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, []);

    const handleReply = async (id) => {
        try {
            const { data } = await axios.put(`/api/support/appeals/${id}/reply`, {
                adminReply: replyText,
                status: 'replied'
            });
            if (data.success) {
                setReplyingTo(null);
                setReplyText('');
                fetchAppeals();
            }
        } catch (err) {
            alert(t('profile.fields.error_save'));
        }
    };

    const handleReactivate = async (appeal) => {
        if (!window.confirm(t('admin.appeals.confirm_reactivate', { name: appeal.user?.name }))) return;

        try {
            const { data } = await axios.put(`/api/users/${appeal.user?._id}/toggle`);
            if (data.success) {
                await axios.put(`/api/support/appeals/${appeal._id}/reply`, {
                    adminReply: t('admin.appeals.reactivate_msg'),
                    status: 'resolved'
                });
                alert(t('admin.appeals.reactivate_success'));
                fetchAppeals();
            }
        } catch (err) {
            alert(t('profile.fields.error_save'));
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner"></div><p>{t('admin.incidents.loading')}</p></div>;

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ShieldAlert size={28} color="var(--brand-orange)" /> {t('admin.appeals.title')}
                    </h1>
                    <p className="page-subtitle" style={{ margin: '4px 0 0' }}>{t('admin.appeals.subtitle')}</p>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10 }} onClick={fetchAppeals}>
                    <RefreshCw size={16} /> {t('admin.incidents.refresh')}
                </button>
            </div>

            <div className="grid-1" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {appeals.length === 0 ? (
                    <div className="card empty-state" style={{ padding: '80px 24px', textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle2 size={40} color="var(--green)" opacity={0.5} />
                        </div>
                        <p className="empty-state-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('admin.appeals.empty_title')}</p>
                        <p className="empty-state-desc" style={{ color: 'var(--text-muted)', marginTop: 8 }}>{t('admin.appeals.empty_desc')}</p>
                    </div>
                ) : (
                    appeals.map((appeal) => (
                        <div key={appeal._id} className="card appeal-card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
                            <div className="appeal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div className="avatar-small" style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {appeal.user?.avatar ? (
                                            <img src={`${process.env.REACT_APP_API_URL || ''}${appeal.user.avatar}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
                                        ) : (
                                            appeal.user?.name?.charAt(0) || <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {appeal.user?.name || t('admin.appeals.unknown_user')}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                            <Mail size={12} /> {appeal.email}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                    <span className={`badge badge-${appeal.status}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {appeal.status === 'pending' ? <><Clock size={12} /> {t('support.pending').toUpperCase()}</> :
                                         appeal.status === 'replied' ? <><MessageSquare size={12} /> {t('admin.appeals.replied')}</> :
                                         <><CheckCircle size={12} /> {t('admin.appeals.resolved')}</>}
                                    </span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={10} /> {t('admin.users.table.date')} {new Date(appeal.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="appeal-body" style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.appeals.user_msg')}</div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{appeal.message}</p>
                            </div>

                            {appeal.adminReply && (
                                <div className="appeal-reply" style={{ borderLeft: '4px solid var(--brand-orange)', background: 'rgba(232,84,26,0.05)', padding: 16, borderRadius: '0 12px 12px 0', marginBottom: 20 }}>
                                    <h5 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, color: 'var(--brand-orange)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Shield size={14} /> {t('admin.appeals.admin_reply')}
                                    </h5>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{appeal.adminReply}</p>
                                </div>
                            )}

                            <div className="appeal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                {replyingTo === appeal._id ? (
                                    <div style={{ width: '100%' }}>
                                        <textarea
                                            className="form-control"
                                            placeholder={t('admin.appeals.reply_placeholder')}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            style={{ width: '100%', padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', minHeight: 120, marginBottom: 16, fontSize: '0.9rem' }}
                                        />
                                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost" style={{ borderRadius: 10 }} onClick={() => setReplyingTo(null)}>
                                                <X size={16} /> {t('edit.cancel')}
                                            </button>
                                            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', borderRadius: 10 }} onClick={() => handleReply(appeal._id)}>
                                                <Send size={16} /> {t('support.submit')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {appeal.status !== 'resolved' && (
                                            <button className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRadius: 10, height: 40, fontSize: '0.85rem' }} onClick={() => handleReactivate(appeal)}>
                                                <Unlock size={16} /> {t('admin.appeals.reactivate')}
                                            </button>
                                        )}
                                        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRadius: 10, height: 40, fontSize: '0.85rem' }} onClick={() => {
                                            setReplyingTo(appeal._id);
                                            setReplyText(appeal.adminReply || '');
                                        }}>
                                            <Edit3 size={16} /> {appeal.adminReply ? t('admin.appeals.edit_reply') : t('admin.appeals.reply')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .appeal-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .appeal-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                .badge-pending { background: rgba(234,179,8,0.1); color: #b45309; border: 1px solid rgba(234,179,8,0.2); }
                .badge-replied { background: rgba(30,64,175,0.1); color: #1e40af; border: 1px solid rgba(30,64,175,0.2); }
                .badge-resolved { background: rgba(34,197,94,0.1); color: #15803d; border: 1px solid rgba(34,197,94,0.2); }
            `}</style>
        </div>
    );
};

export default AdminAppealsPage;
