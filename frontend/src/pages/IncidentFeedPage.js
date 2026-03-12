// frontend/src/pages/IncidentFeedPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Search, 
    Layout, 
    ShieldCheck, 
    ThumbsUp, 
    MessageSquare, 
    MapPin, 
    Clock, 
    Flame,
    Car,
    Hammer,
    Eye,
    ShieldAlert,
    AlertTriangle,
    FileText,
    Zap,
    ChevronLeft,
    ChevronRight,
    Filter,
    Ghost
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CAT_LABELS = { theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme', suspicious_activity: 'Suspect', fire: 'Incendie', kidnapping: 'Enlèvement', other: 'Autre' };

const CATEGORY_ICONS = {
    theft: ShieldAlert,
    assault: ShieldAlert,
    vandalism: Hammer,
    suspicious_activity: Eye,
    fire: Flame,
    kidnapping: Ghost,
    other: AlertTriangle
};

const SEV_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };

const timeAgo = (date) => {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    return new Date(date).toLocaleDateString('fr-FR');
};

const IncidentFeedPage = () => {
    const { user } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/incidents', {
                params: { page, category, severity, search }
            });
            if (data.success) {
                // Filter incidents older than 48 hours
                const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
                const filtered = data.incidents.filter(inc => new Date(inc.createdAt).getTime() > fortyEightHoursAgo);
                setIncidents(filtered);
                setTotalPages(data.pages || 1);
            }
        } catch (err) {
            console.error('Erreur feed :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIncidents(); }, [page, category, severity, search]);

    const handleUpvote = async (id) => {
        try {
            const { data } = await axios.put(`/api/incidents/${id}/upvote`);
            if (data.success) {
                setIncidents(prev => prev.map(inc => (inc && inc._id === id) ? data.incident : inc));
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="feed-header" style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layout size={24} color="var(--brand-orange)" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Fil d'Actualité</h1>
                        <p className="page-subtitle" style={{ margin: 0 }}>Dernières alertes communautaires</p>
                    </div>
                </div>
                
                <div className="search-bar-container" style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ flex: 1, minWidth: 260 }}>
                        <span className="input-icon"><Search size={18} opacity={0.6} /></span>
                        <input 
                            type="text" className="form-control" 
                            placeholder="Rechercher par titre, description, lieu..." 
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <select 
                            className="form-control" style={{ width: 160 }}
                            value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
                        >
                            <option value="">Toutes catégories</option>
                            {Object.entries(CAT_LABELS).map(([val, lab]) => (
                                <option key={val} value={val}>{lab}</option>
                            ))}
                        </select>
                        <select 
                            className="form-control" style={{ width: 160 }}
                            value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
                        >
                            <option value="">Toutes gravités</option>
                            {Object.entries(SEV_LABELS).map(([val, lab]) => (
                                <option key={val} value={val}>{lab}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /><p>Chargement des alertes...</p></div>
            ) : incidents.length > 0 ? (
                <>
                    <div className="grid-3" style={{ gap: 24 }}>
                        {incidents.map(inc => {
                            if (!inc) return null;
                            const Icon = CATEGORY_ICONS[inc.category] || AlertTriangle;
                            const isUpvoted = inc.upvotes?.includes(user?._id);
                            const isPending = inc.status === 'pending';
                            const canVote = user?.role !== 'admin' && isPending;
                            
                            return (
                                <div 
                                    key={inc._id} 
                                    className={`incident-card card glass-hover fade-in ${isPending ? 'pending-bright' : ''}`} 
                                    style={{ 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        opacity: inc.status === 'approved' ? 0.95 : 1,
                                        border: isPending ? '2px solid var(--brand-orange)' : '1px solid var(--border)',
                                        boxShadow: isPending ? '0 8px 30px rgba(232,84,26,0.15)' : 'var(--shadow-sm)'
                                    }}
                                >
                                    <div className="incident-card-header" style={{ padding: '20px 20px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <div className={`cat-icon-box ${inc.category}`} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                                                <Icon size={18} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 className="incident-card-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc.title}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {inc.location?.address?.split(',')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span className={`badge badge-${inc.category}`} style={{ fontSize: '0.65rem' }}>{CAT_LABELS[inc.category]}</span>
                                            <span className={`badge badge-${inc.severity}`} style={{ fontSize: '0.65rem' }}>{SEV_LABELS[inc.severity]}</span>
                                            {inc.status === 'pending' && (
                                                <span className="badge" style={{ 
                                                    fontSize: '0.65rem', 
                                                    background: 'var(--brand-orange)', 
                                                    color: 'white', 
                                                    border: 'none',
                                                    fontWeight: 800,
                                                    padding: '4px 8px',
                                                    boxShadow: '0 2px 4px rgba(232,84,26,0.2)'
                                                }}>
                                                    EN ATTENTE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={{ padding: '0 20px 16px', flex: 1 }}>
                                        <p className="incident-card-desc" style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {inc.description}
                                        </p>
                                    </div>

                                    {inc.images && inc.images.length > 0 && (
                                        <div style={{ padding: '0 20px 16px' }}>
                                            <img src={inc.images[0]} alt="Incident" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
                                        </div>
                                    )}

                                    <div className="incident-card-footer" style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '0 0 16px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button 
                                                    className={`action-btn ${isUpvoted ? 'active' : ''}`}
                                                    onClick={(e) => { e.preventDefault(); if (canVote) handleUpvote(inc._id); }}
                                                    disabled={!canVote}
                                                    style={{ 
                                                        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', 
                                                        cursor: canVote ? 'pointer' : 'not-allowed', 
                                                        color: isUpvoted ? 'var(--brand-orange)' : 'var(--text-muted)', 
                                                        fontSize: '0.75rem', fontWeight: 600,
                                                        opacity: canVote ? 1 : 0.5
                                                    }}
                                                    title={!canVote ? (user?.role === 'admin' ? "L'admin ne peut pas voter" : "Incident déjà approuvé") : "Confirmer"}
                                                >
                                                    <ThumbsUp size={14} fill={isUpvoted ? 'currentColor' : 'none'} />
                                                    <span>{inc.upvotes?.length || 0}</span>
                                                </button>
                                                <Link to={`/incidents/${inc._id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    <MessageSquare size={14} />
                                                    <span>{inc.comments?.length || 0}</span>
                                                </Link>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                <Clock size={10} /> {timeAgo(inc.createdAt)}
                                            </div>
                                        </div>
                                        {inc.status === 'approved' ? (
                                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: 8 }}>
                                                <ShieldCheck size={12} /> Officiellement Vérifié
                                            </div>
                                        ) : (
                                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-orange)', fontSize: '0.65rem', fontWeight: 700 }}>
                                                <Zap size={12} fill="var(--brand-orange)" /> {inc.upvotes?.length || 0}/5 confirmations
                                                <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginLeft: 8 }}>
                                                    <div style={{ width: `${Math.min((inc.upvotes?.length || 0) * 20, 100)}%`, height: '100%', background: 'var(--brand-orange)' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination" style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 8 }}>
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                                <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)} style={{ 
                                    padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--border)', 
                                    background: page === p ? 'var(--brand-orange)' : 'var(--bg-primary)',
                                    color: page === p ? 'white' : 'var(--text-primary)',
                                    fontWeight: 700, cursor: 'pointer'
                                }}>
                                    {p}
                                </button>
                            ))}
                            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card empty-state" style={{ padding: '80px 20px', textAlign: 'center' }}>
                    <div className="empty-state-icon" style={{ marginBottom: 20 }}>
                        <FileText size={64} opacity={0.1} />
                    </div>
                    <h3 className="empty-state-title">Aucun incident trouvé</h3>
                    <p className="empty-state-desc" style={{ color: 'var(--text-muted)' }}>Essayez de modifier vos filtres ou effectuez une nouvelle recherche.</p>
                    <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => { setSearch(''); setCategory(''); setSeverity(''); setPage(1); }}>
                        Réinitialiser les filtres
                    </button>
                </div>
            )}
            
            <Link to="/report" className="fab-button" title="Signaler un incident" style={{ position: 'fixed', bottom: 32, right: 32, width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(232,84,26,0.4)', transition: 'transform 0.2s' }}>
                <Zap size={24} fill="white" />
            </Link>
        </div>
    );
};

export default IncidentFeedPage;
