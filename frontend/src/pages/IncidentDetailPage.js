// frontend/src/pages/IncidentDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChatBox from '../components/ChatBox';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const CAT_LABELS = {
    theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme',
    suspicious_activity: 'Activité suspecte', fire: 'Incendie',
    accident: 'Accident', other: 'Autre'
};

const SEV_LABELS = {
    low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique'
};

const SEV_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
};

const createColoredMarker = (color) => L.divIcon({
    className: '',
    html: `<div style="
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${color};
    border: 2px solid white;
    box-shadow: 0 0 6px ${color};
  "></div>`,
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
        try {
            const { data } = await axios.put(`/api/incidents/${id}/upvote`);
            if (data.success) {
                setUpvotes(data.upvoteCount);
                setHasVoted(data.hasVoted);
            }
        } catch (err) {
            console.error('Erreur upvote :', err);
        } finally {
            setVoting(false);
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
                <Link to="/feed" className="btn btn-secondary">Retour au fil</Link>
            </div>
        );
    }

    const isAuthorizedToChat = user && (user.role === 'admin' || (incident && (incident.reportedBy?._id || incident.reportedBy) === user._id));
    const hasCoords = incident.location?.coordinates?.lat && incident.location?.coordinates?.lng;

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Link to="/feed" className="btn btn-sm btn-ghost" style={{ marginBottom: '16px' }}>← Retour au fil</Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div className="incident-card-badges" style={{ marginBottom: '12px' }}>
                            <span className={`badge badge-${incident.status}`}>{incident.status}</span>
                            <span className={`badge badge-${incident.severity}`}>{SEV_LABELS[incident.severity]}</span>
                            <span className={`badge badge-${incident.category}`}>{CAT_LABELS[incident.category]}</span>
                        </div>
                        <h1 className="page-title">{incident.title}</h1>
                        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
                            Signalé le {new Date(incident.createdAt).toLocaleDateString()} par {incident.reportedBy ? incident.reportedBy.name : 'Utilisateur anonyme'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {user?.role === 'admin' && incident.status === 'approved' && (
                            <button className="btn btn-success" onClick={async () => {
                                if (window.confirm('Voulez-vous vraiment marquer cette affaire comme résolue ?')) {
                                    try {
                                        const { data } = await axios.put(`/api/incidents/${id}/moderate`, { status: 'resolved' });
                                        if (data.success) setIncident(data.incident);
                                    } catch (err) { alert('Erreur lors de la résolution.'); }
                                }
                            }}>✅ Marquer comme Résolu</button>
                        )}
                        <button className={`btn ${hasVoted ? 'btn-primary' : 'btn-secondary'}`} onClick={handleUpvote} disabled={voting || incident.status !== 'approved'}>
                            {hasVoted ? '✅ Confirmé' : '👍 Confirmer'} ({upvotes})
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>Description</h3>
                    <p style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: '1.8' }}>{incident.description}</p>

                    {incident.images?.length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            <h3 className="card-title" style={{ marginBottom: '16px' }}>Photos</h3>
                            <div className="grid-2">
                                {incident.images.map((img, i) => (
                                    <img key={i} src={getImageUrl(img.path)} alt="" style={{ borderRadius: 'var(--radius-md)', width: '100%', aspectRatio: '16/9', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(getImageUrl(img.path), '_blank')} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-detail" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '16px' }}>📍 Localisation</h3>
                        <p style={{ fontWeight: '600' }}>{incident.location.address}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{incident.location.city || 'Non spécifiée'}</p>

                        {!hasCoords && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>📍 Coordonnées GPS non disponibles</p>}

                        {hasCoords && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <MapContainer
                                        key={theme}
                                        center={[incident.location.coordinates.lat, incident.location.coordinates.lng]}
                                        zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}
                                    >
                                        <TileLayer
                                            url={mapTileUrl}
                                            attribution='&copy; CARTO'
                                        />
                                        <Marker
                                            position={[incident.location.coordinates.lat, incident.location.coordinates.lng]}
                                            icon={createColoredMarker(SEV_COLORS[incident.severity])}
                                        >
                                            <Popup><span>{incident.title}</span></Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${incident.location.coordinates.lat},${incident.location.coordinates.lng}`, '_blank')}>
                                        🗺️ Google Maps
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => window.open(`https://waze.com/ul?ll=${incident.location.coordinates.lat},${incident.location.coordinates.lng}&navigate=yes`, '_blank')}>
                                        🚗 Waze
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isAuthorizedToChat && <div style={{ marginTop: '32px' }}><ChatBox incidentId={id} /></div>}
        </div>
    );
};

export default IncidentDetailPage;
