// frontend/src/pages/ReportIncidentPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Correction icône Leaflet par défaut
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Marker rouge pour la preview
const redIcon = L.divIcon({
    className: '',
    html: `<div style="width: 16px; height: 16px; border-radius: 50%; background: #ef4444; border: 2px solid white; box-shadow: 0 0 6px #ef4444;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const CAT_LABELS = {
    theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme',
    suspicious_activity: 'Activité suspecte', fire: 'Incendie',
    accident: 'Accident', other: 'Autre'
};

const SEV_LABELS = {
    low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique'
};

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 15);
    }, [center, map]);
    return null;
};

const ReportIncidentPage = () => {
    const { theme } = useTheme();
    const mapTileUrl = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'other',
        severity: 'medium',
        address: '',
        city: 'Ouagadougou',
        isAnonymous: false,
        lat: null,
        lng: null
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData({ ...formData, [id]: type === 'checkbox' ? checked : value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 4);
        setImages(files);
        const filePreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(filePreviews);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        setGeoLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await res.json();

                    const address = data.display_name ||
                        (data.address?.road ? `${data.address.road}, ${data.address.city || ''}` : "");

                    setFormData(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude,
                        address: address || prev.address,
                        city: data.address?.city || data.address?.town || data.address?.village || prev.city
                    }));

                    if (!address) {
                        setError("Adresse non trouvée, saisissez manuellement");
                    }
                } catch (err) {
                    console.error("Erreur reverse geocoding:", err);
                    setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                    setError("Position récupérée mais impossible de trouver l'adresse exacte.");
                } finally {
                    setGeoLoading(false);
                }
            },
            (err) => {
                setGeoLoading(false);
                if (err.code === 1) setError("Localisation refusée. Entrez l'adresse manuellement.");
                else if (err.code === 3) setError("Localisation trop longue. Réessayez.");
                else setError("Impossible de vous localiser.");
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('severity', formData.severity);
            data.append('address', formData.address);
            data.append('city', formData.city);
            data.append('isAnonymous', formData.isAnonymous);

            if (formData.lat && formData.lng) {
                data.append('lat', formData.lat);
                data.append('lng', formData.lng);
            }

            images.forEach((image) => {
                data.append('images', image);
            });

            const response = await axios.post('/api/incidents', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                navigate('/my-incidents');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du signalement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Signaler un Incident 👮‍♀️</h1>
                <p className="page-subtitle">Aidez la communauté en signalant un problème de sécurité.</p>
            </div>

            <div className="grid-2">
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">Titre du signalement</label>
                            <input
                                className="form-control"
                                type="text" id="title"
                                placeholder="Ex: Vol de sac à main, Accident..."
                                value={formData.title}
                                onChange={handleInputChange} required
                            />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="category">Catégorie</label>
                                <select id="category" className="form-control" value={formData.category} onChange={handleInputChange}>
                                    {Object.entries(CAT_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="severity">Gravité</label>
                                <select id="severity" className="form-control" value={formData.severity} onChange={handleInputChange}>
                                    {Object.entries(SEV_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="description">Description</label>
                            <textarea
                                className="form-control"
                                id="description"
                                placeholder="Décrivez l'incident..."
                                value={formData.description}
                                onChange={handleInputChange} required
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="form-label">Localisation</label>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={handleGetLocation} disabled={geoLoading}>
                                    {geoLoading ? '⌛ Localisation...' : '📍 Ma position'}
                                </button>
                            </div>
                            <input
                                className="form-control"
                                type="text" id="address"
                                placeholder={formData.lat ? "Recherche d'adresse..." : "Adresse ou point de repère..."}
                                value={formData.address}
                                onChange={handleInputChange} required
                            />
                        </div>

                        {formData.lat && formData.lng && (
                            <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                <MapContainer
                                    key={theme}
                                    center={[formData.lat, formData.lng]} zoom={15}
                                    style={{ height: '100%', width: '100%' }} zoomControl={false}
                                >
                                    <TileLayer
                                        url={mapTileUrl}
                                        attribution='&copy; CARTO'
                                    />
                                    <Marker position={[formData.lat, formData.lng]} icon={redIcon} />
                                    <ChangeView center={[formData.lat, formData.lng]} />
                                </MapContainer>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                                    Lieu détecté. Est-ce bien ici ?
                                </p>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Photos (Optionnel)</label>
                            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                                <div className="upload-area-icon">📸</div>
                                <div className="upload-area-text">Ajouter des preuves (Max 4)</div>
                            </div>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/*" onChange={handleImageChange} />
                            <div className="upload-preview">
                                {previews.map((p, i) => <img key={i} src={p} alt="Aperçu" className="upload-thumb" />)}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-group">
                                <input type="checkbox" id="isAnonymous" checked={formData.isAnonymous} onChange={handleInputChange} />
                                <span style={{ fontSize: '0.9rem' }}>Rester anonyme</span>
                            </label>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                            {loading ? 'Envoi...' : 'Soumettre le signalement'}
                        </button>
                    </form>
                </div>

                <div className="sidebar-info" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                        <h3 className="card-title">🛡️ Civisme et Sécurité</h3>
                        <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Tout signalement abusif est passible de sanctions. Utilisez le GPS pour une précision maximale.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportIncidentPage;
