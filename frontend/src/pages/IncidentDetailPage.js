// frontend/src/pages/IncidentDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChatBox from '../components/ChatBox';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, 
    CheckCircle2, 
    ThumbsUp, 
    MapPin, 
    Building2, 
    Map, 
    Navigation,
    Clock,
    User,
    ShieldAlert,
    AlertTriangle,
    Flame,
    Car,
    Hammer,
    Eye,
    CheckCircle,
    MessageSquare
} from 'lucide-react';

const CAT_LABELS = { theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme', suspicious_activity: 'Suspect', fire: 'Incendie', kidnapping: 'Enlèvement', other: 'Autre' };

const CATEGORY_ICONS = {
    theft: ShieldAlert,
    assault: ShieldAlert,
    vandalism: Hammer,
    suspicious_activity: Eye,
    fire: Flame,
    kidnapping: ShieldAlert,
    other: AlertTriangle
};

const SEV_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };

const SEV_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

const createColoredMarker = (color) => L.divIcon({
    className: '',
    html: `<div style="width: 16px; height: 16px; border-radius: 50%; background: ${color}; border: 2px solid white; box-shadow: 0 0 6px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
});

const getImageUrl = (path) => {
    return process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/${path}` : `/${path}`;
};

const IncidentDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { theme } = useTheme();
    const [incident, setIncident] = useState(null);

    const mapTileUrl = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upvotes, setUpvotes] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [voting, setVoting] = useState(false);
    const [loadingUpvote, setLoadingUpvote] = useState(false);

    useEffect(() => {
        const fetchIncident = async () => {
            try {
                const { data } = await axios.get(`/api/incidents/${id}`);
                if (data.success) {
                    setIncident(data.incident);
                    setUpvotes(data.incident.upvoteCount);
                    setHasVoted(data.incident.upvotes?.some(v => (v._id || v) === user?._id));
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors du chargement de l’incident.');
            } finally {
                setLoading(false);
            }
        };

        fetchIncident();
    }, [id, user?._id]);

    const handleUpvote = async () => {
        if (!user) return;
        setVoting(true);
        setLoadingUpvote(true); // Set loading for upvote
        try {
            const { data } = await axios.put(`/api/incidents/${id}/upvote`);
            if (data.success) {
                setIncident(data.incident || incident); // Update incident data (status might have changed)
                setHasVoted(data.hasVoted);
                setLoadingUpvote(false);
                
                if (data.autoApproved) {
                    // Optionnel: Petit message de succès pour l'auto-approbation
                    alert("Grâce à votre confirmation, cet incident est maintenant officiellement validé !");
                }
            }
        } catch (err) {
            console.error('Erreur upvote :', err);
        } finally {
            setVoting(false);
            // setLoadingUpvote(false); // Moved inside success block as per instruction, but typically would be here
        }
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Récupération des détails...</p>
            </div>
        );
    }

    if (error || !incident) {
        return (
            <div className="page-container">
                <div className="alert alert-error">{error || 'Incident introuvable.'}</div>
                <Link to="/feed" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ArrowLeft size={18} /> Retour au fil
                </Link>
            </div>
        );
    }

    const isAuthorizedToChat = user && (user.role === 'admin' || (incident && (incident.reportedBy?._id || incident.reportedBy) === user._id));
    const incidentCoords = incident.location?.coordinates?.coordinates;
    const hasCoords = incidentCoords && incidentCoords.length === 2;
    const CatIcon = CATEGORY_ICONS[incident.category] || AlertTriangle;

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Link to="/feed" className="btn btn-sm btn-ghost" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> Retour au fil
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div className="incident-card-badges" style={{ marginBottom: '12px', display: 'flex', gap: 8 }}>
                            <span className={`badge badge-${incident.status}`}>{incident.status}</span>
                            <span className={`badge badge-${incident.severity}`}>{SEV_LABELS[incident.severity]}</span>
                            <span className={`badge badge-${incident.category}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CatIcon size={12} /> {CAT_LABELS[incident.category]}
                            </span>
                        </div>
                        <h1 className="page-title">{incident.title}</h1>
                        <p className="page-subtitle" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={14} /> Signalé le {new Date(incident.createdAt).toLocaleDateString()} par {incident.reportedBy ? incident.reportedBy.name : 'Utilisateur anonyme'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {user?.role === 'admin' && incident.status === 'approved' && (
                            <button className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={async () => {
                                if (window.confirm('Voulez-vous vraiment marquer cette affaire comme résolue ?')) {
                                    try {
                                        const { data } = await axios.put(`/api/incidents/${id}/moderate`, { status: 'resolved' });
                                        if (data.success) setIncident(data.incident);
                                    } catch (err) { alert('Erreur lors de la résolution.'); }
                                }
                            }}>
                                <CheckCircle size={18} /> Marquer comme Résolu
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button 
                                className={`btn ${hasVoted ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={handleUpvote}
                                disabled={loadingUpvote || (incident.status !== 'pending') || (user?.role === 'admin')}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', opacity: (user?.role === 'admin' || incident.status !== 'pending') ? 0.6 : 1, cursor: (user?.role === 'admin' || incident.status !== 'pending') ? 'not-allowed' : 'pointer' }}
                                title={user?.role === 'admin' ? "Les administrateurs ne peuvent pas voter" : incident.status !== 'pending' ? "L'incident n'est plus en attente" : ""}
                            >
                                <ThumbsUp size={18} fill={hasVoted ? 'currentColor' : 'none'} />
                                {hasVoted ? 'Confirmé' : 'Confirmer l\'incident'}
                            </button>
                            
                            {incident.status === 'pending' && (
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-orange)' }}>
                                            {incident.upvotes?.length || 0}/5 confirmations
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {5 - (incident.upvotes?.length || 0)} de plus pour validation
                                        </span>
                                    </div>
                                    <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <div 
                                            style={{ 
                                                width: `${Math.min((incident.upvotes?.length || 0) * 20, 100)}%`, 
                                                height: '100%', 
                                                background: 'var(--brand-orange)',
                                                transition: 'width 0.4s ease'
                                            }} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock size={20} color="var(--brand-orange)" /> Description
                    </h3>
                    <p style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: '1.8' }}>{incident.description}</p>

                    {incident.images?.length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            <h3 className="card-title" style={{ marginBottom: '16px' }}>Photos de l'incident</h3>
                            <div className="grid-2">
                                {incident.images.map((img, i) => (
                                    <img key={i} src={getImageUrl(img.path)} alt="" style={{ borderRadius: 'var(--radius-md)', width: '100%', aspectRatio: '16/9', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => window.open(getImageUrl(img.path), '_blank')} onMouseOver={e => e.target.style.transform = 'scale(1.02)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-detail" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <MapPin size={20} color="var(--brand-orange)" /> Localisation
                        </h3>
                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{incident.location.address}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Building2 size={16} opacity={0.6} /> {incident.location.city || 'Ville non spécifiée'}
                        </p>

                        {!hasCoords && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} /> Coordonnées GPS non disponibles
                        </p>}

                        {hasCoords && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <MapContainer
                                        center={[incidentCoords[1], incidentCoords[0]]}
                                        zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}
                                    >
                                        <TileLayer
                                            url={mapTileUrl}
                                            attribution='&copy; CARTO'
                                        />
                                        <Marker
                                            position={[incidentCoords[1], incidentCoords[0]]}
                                            icon={createColoredMarker(SEV_COLORS[incident.severity])}
                                        >
                                            <Popup><span>{incident.title}</span></Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${incidentCoords[1]},${incidentCoords[0]}`, '_blank')}>
                                        <Map size={14} /> Google Maps
                                    </button>
                                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} onClick={() => window.open(`https://waze.com/ul?ll=${incidentCoords[1]},${incidentCoords[0]}&navigate=yes`, '_blank')}>
                                        <Navigation size={14} /> Waze
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Security Tip Card */}
                    <div className="card" style={{ background: 'var(--brand-orange-pale)', border: '1px dashed var(--brand-orange)' }}>
                        <h4 style={{ color: 'var(--brand-orange)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldAlert size={18} /> Conseil de sécurité
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            Évitez cette zone si possible jusqu'à ce que l'incident soit marqué comme résolu par les autorités ou les modérateurs.
                        </p>
                    </div>
                </div>
            </div>

            {isAuthorizedToChat && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={24} color="var(--brand-orange)" /> Discussion en direct
                    </h3>
                    <ChatBox incidentId={id} />
                </div>
            )}
        </div>
    );
};

export default IncidentDetailPage;
