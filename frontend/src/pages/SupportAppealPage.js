import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldAlert, 
    Search, 
    ArrowLeft, 
    AlertCircle, 
    CheckCircle,
    MessageSquare,
    Clock
} from 'lucide-react';
import axios from 'axios';

const SupportAppealPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });
    
    // Status Check State
    const [checkEmail, setCheckEmail] = useState('');
    const [appeals, setAppeals] = useState(null);
    const [checking, setChecking] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            const { data } = await axios.post('/api/support/appeal', { email, message });
            if (data.success) {
                setStatus({ type: 'success', text: data.message });
                setEmail('');
                setMessage('');
            }
        } catch (err) {
            setStatus({ 
                type: 'error', 
                text: err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStatus = async (e) => {
        e.preventDefault();
        if (!checkEmail) return;
        setChecking(true);
        try {
            const { data } = await axios.get(`/api/support/appeal-status/${checkEmail}`);
            if (data.success) {
                setAppeals(data.appeals);
            }
        } catch (err) {
            alert('Erreur lors de la vérification.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="page-container fade-in" style={{ maxWidth: 800, margin: '40px auto' }}>
            <div className="grid-2-support" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                
                {/* Section Formulaire */}
                <div className="card">
                    <div style={{ padding: 24 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ShieldAlert size={22} color="var(--brand-orange)" /> Envoyer un Recours
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.85rem' }}>
                            Votre compte est désactivé ? Expliquez-nous pourquoi il devrait être réactivé.
                        </p>

                        {status.text && (
                            <div className={`alert alert-${status.type}`} style={{ marginBottom: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} 
                                {status.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email du compte</label>
                                <input 
                                    className="form-control" type="email" 
                                    placeholder="votre@email.com" value={email} 
                                    onChange={e => setEmail(e.target.value)} required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea 
                                    className="form-control" rows="4" 
                                    placeholder="Détails de votre demande..." 
                                    value={message} onChange={e => setMessage(e.target.value)} required
                                />
                            </div>
                            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                                {loading ? 'Envoi...' : 'Envoyer la demande'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Section Vérification */}
                <div className="card" style={{ background: 'var(--bg-primary)' }}>
                    <div style={{ padding: 24 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Search size={22} color="var(--brand-orange)" /> Vérifier l'état
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.85rem' }}>
                            Saisissez votre email pour voir si un administrateur vous a répondu.
                        </p>

                        <form onSubmit={handleCheckStatus} style={{ marginBottom: 20 }}>
                            <div className="input-group-custom" style={{ display: 'flex', gap: 8 }}>
                                <input 
                                    className="form-control" type="email" 
                                    placeholder="Votre email" value={checkEmail} 
                                    onChange={e => setCheckEmail(e.target.value)} required 
                                />
                                <button className="btn btn-secondary" type="submit" disabled={checking}>
                                    {checking ? '...' : 'Vérifier'}
                                </button>
                            </div>
                        </form>

                        <div className="status-results" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {!appeals ? (
                                <div style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>
                                    <Search size={32} style={{ marginBottom: 8 }} />
                                    <p style={{ fontSize: '0.8rem' }}>Entrez votre email ci-dessus</p>
                                </div>
                            ) : appeals.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--red)' }}>
                                    <AlertCircle size={32} style={{ marginBottom: 8 }} />
                                    <p style={{ fontSize: '0.8rem' }}>Aucune demande trouvée pour cet email.</p>
                                </div>
                            ) : (
                                appeals.map((a, i) => (
                                    <div key={i} className="status-item" style={{ 
                                        padding: 12, borderRadius: 8, background: 'white', 
                                        marginBottom: 10, border: '1px solid var(--border)' 
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} /> {new Date(a.createdAt).toLocaleDateString()}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4,
                                                background: a.status === 'pending' ? 'var(--yellow-bg)' : 'var(--green-bg)',
                                                color: a.status === 'pending' ? 'var(--yellow)' : 'var(--green)'
                                            }}>
                                                {a.status === 'pending' ? 'En attente' : 'Répondu'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.8 }}><strong>Demande:</strong> {a.message.substring(0, 50)}...</p>
                                        {a.adminReply && (
                                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)', display: 'flex', gap: 8 }}>
                                                <MessageSquare size={14} color="var(--brand-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                                                <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--brand-orange)' }}>
                                                    <strong>Admin:</strong> {a.adminReply}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Link to="/login" style={{ color: 'var(--brand-orange)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ArrowLeft size={18} /> Retour à la connexion
                </Link>
            </div>
        </div>
    );
};

export default SupportAppealPage;
