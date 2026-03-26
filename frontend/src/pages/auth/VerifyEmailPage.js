import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VerifyEmailPage = () => {
    const { token } = useParams();
    const { t } = useTranslation();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const { data } = await axios.get(`/api/auth/verify-email/${token}`);
                if (data.success) {
                    setStatus('success');
                    setMessage(data.message);
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Erreur lors de la vérification du lien.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 24 }}>
            <div className="card fade-in" style={{ maxWidth: 460, width: '100%', padding: 40, textAlign: 'center', borderRadius: 20 }}>
                {status === 'loading' && (
                    <>
                        <Loader className="spin" size={48} color="var(--brand-orange)" style={{ margin: '0 auto 20px' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Vérification en cours...</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Veuillez patienter pendant que nous validons votre accès.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle2 size={40} color="var(--green)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>Email Vérifié !</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{message}</p>
                        <Link to="/login" className="btn btn-primary btn-full">Se connecter</Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <AlertCircle size={40} color="var(--red)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>Lien Invalide</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{message}</p>
                        <Link to="/register" className="btn btn-secondary btn-full" style={{ marginBottom: 12 }}>Retour à l'inscription</Link>
                        <Link to="/login" className="btn btn-ghost btn-full">Se connecter</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
