// frontend/src/pages/ReportIncidentPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const redIcon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:var(--brand-orange);border:3px solid white;box-shadow:0 2px 12px rgba(232,84,26,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
});

const CATS = [
    { value: 'theft', label: 'Vol', icon: '💰' },
    { value: 'assault', label: 'Agression', icon: '👊' },
    { value: 'vandalism', label: 'Vandalisme', icon: '🔨' },
    { value: 'suspicious_activity', label: 'Suspect', icon: '👁️' },
    { value: 'fire', label: 'Incendie', icon: '🔥' },
    { value: 'accident', label: 'Accident', icon: '🚗' },
    { value: 'other', label: 'Autre', icon: '⚠️' },
];
const SEVS = [
    { value: 'low', label: 'Faible', desc: 'Peu urgent' },
    { value: 'medium', label: 'Moyen', desc: 'Modéré' },
    { value: 'high', label: 'Élevé', desc: 'Urgent' },
    { value: 'critical', label: 'Critique', desc: 'Extrême' },
];

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, 15); }, [center, map]);
    return null;
};

const ReportIncidentPage = () => {
    const { theme } = useTheme();
    const mapTileUrl = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const [form, setForm] = useState({
        title: '', description: '', category: 'other', severity: 'medium',
        address: '', city: 'Ouagadougou', isAnonymous: false, lat: null, lng: null
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 4);
        setImages(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    };

    const removeImage = (i) => {
        const newImages = images.filter((_, idx) => idx !== i);
        const newPreviews = previews.filter((_, idx) => idx !== i);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) { setError("Géolocalisation non supportée."); return; }
        setGeoLoading(true); setError(null);
        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await res.json();
                    const address = data.display_name || (data.address?.road ? `${data.address.road}, ${data.address.city || ''}` : '');
                    setForm(p => ({
                        ...p, lat: latitude, lng: longitude,
                        address: address || p.address,
                        city: data.address?.city || data.address?.town || data.address?.village || p.city
                    }));
                } catch {
                    setForm(p => ({ ...p, lat: latitude, lng: longitude }));
                    setError("Position récupérée, mais adresse introuvable automatiquement.");
                } finally { setGeoLoading(false); }
            },
            (err) => {
                setGeoLoading(false);
                setError(err.code === 1 ? "Localisation refusée." : "Impossible de vous localiser.");
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== null) fd.append(k, v); });
            images.forEach(img => fd.append('images', img));
            const { data } = await axios.post('/api/incidents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (data.success) navigate('/my-incidents');
        } catch (err) {
            // Affichage détaillé des erreurs
            if (err.response?.data?.errors) {
                setError(err.response.data.errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`).join(' | '));
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Erreur lors du signalement.');
            }
        } finally { setLoading(false); }
    };

    const selectedCat = CATS.find(c => c.value === form.category);
    const selectedSev = SEVS.find(s => s.value === form.severity);

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">⚡ Signaler un incident</h1>
                <p className="page-subtitle">Aidez la communauté en signalant un problème de sécurité localement.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
                {/* Form */}
                <div className="card">
                    {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}
                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">Titre du signalement</label>
                            <input className="form-control" type="text" id="title"
                                placeholder="Ex: Incendie au marché central, Vol de moto..."
                                value={form.title} onChange={e => set('title', e.target.value)} required minLength={5} maxLength={100} />
                        </div>

                        {/* Category */}
                        <div className="form-group">
                            <label className="form-label">Catégorie</label>
                            <div className="cat-grid">
                                {CATS.map(cat => (
                                    <label key={cat.value} className={`cat-option${form.category === cat.value ? ' selected' : ''}`}>
                                        <input type="radio" name="category" value={cat.value}
                                            checked={form.category === cat.value}
                                            onChange={() => set('category', cat.value)} />
                                        <span className="cat-option-icon">{cat.icon}</span>
                                        <span className="cat-option-label">{cat.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Severity */}
                        <div className="form-group">
                            <label className="form-label">
                                Niveau de gravité
                                {selectedSev && (
                                    <span className={`badge badge-${form.severity}`} style={{ marginLeft: 8 }}>
                                        {selectedSev.label}
                                    </span>
                                )}
                            </label>
                            <div className="sev-grid">
                                {SEVS.map(sev => (
                                    <label key={sev.value} className={`sev-option ${sev.value}${form.severity === sev.value ? ' selected' : ''}`}>
                                        <input type="radio" name="severity" value={sev.value}
                                            checked={form.severity === sev.value}
                                            onChange={() => set('severity', sev.value)} />
                                        <div>{sev.label}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 2, opacity: 0.7 }}>{sev.desc}</div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="description">
                                Description
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>
                                    {form.description.length}/2000
                                </span>
                            </label>
                            <textarea className="form-control" id="description" rows={4}
                                placeholder="Décrivez l'incident en détail : que s'est-il passé, les personnes impliquées, l'heure approximative..."
                                value={form.description} onChange={e => set('description', e.target.value)}
                                required minLength={20} maxLength={2000} />
                        </div>

                        {/* Location */}
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label className="form-label" style={{ margin: 0 }}>📍 Localisation</label>
                                <button type="button" className="btn btn-sm btn-secondary"
                                    onClick={handleGetLocation} disabled={geoLoading}>
                                    {geoLoading ? '⌛ Localisation...' : '🎯 Ma position GPS'}
                                </button>
                            </div>
                            <div className="form-row">
                                <input className="form-control" type="text" placeholder="Adresse ou point de repère"
                                    value={form.address} onChange={e => set('address', e.target.value)} required />
                                <input className="form-control" type="text" placeholder="Ville"
                                    value={form.city} onChange={e => set('city', e.target.value)} />
                            </div>
                        </div>

                        {/* Mini map preview */}
                        {form.lat && form.lng && (
                            <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 20, border: '2px solid var(--brand-orange)' }}>
                                <MapContainer key={theme} center={[form.lat, form.lng]} zoom={15}
                                    style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                                    <TileLayer url={mapTileUrl} attribution="&copy; CARTO" />
                                    <Marker position={[form.lat, form.lng]} icon={redIcon} />
                                    <ChangeView center={[form.lat, form.lng]} />
                                </MapContainer>
                            </div>
                        )}

                        {/* Images */}
                        <div className="form-group">
                            <label className="form-label">
                                📸 Photos (optionnel)
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Max 4</span>
                            </label>
                            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                                <div className="upload-zone-icon">📷</div>
                                <div className="upload-zone-text">Cliquez pour ajouter des photos</div>
                                <div className="upload-zone-hint">JPG, PNG, WEBP • Max 5 Mo chacune</div>
                            </div>
                            <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                                multiple accept="image/*" onChange={handleImageChange} />
                            {previews.length > 0 && (
                                <div className="image-previews">
                                    {previews.map((p, i) => (
                                        <div key={i} className="image-preview">
                                            <img src={p} alt={`Aperçu ${i + 1}`} />
                                            <button type="button" className="image-preview-remove"
                                                onClick={() => removeImage(i)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Anonymity toggle */}
                        <div className="form-group">
                            <label className="toggle-label">
                                <input type="checkbox" className="toggle-input"
                                    checked={form.isAnonymous} onChange={e => set('isAnonymous', e.target.checked)} />
                                <div className="toggle-switch" />
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    🎭 Signaler anonymement
                                </span>
                            </label>
                            {form.isAnonymous && (
                                <p className="form-hint">Votre identité ne sera pas visible dans le signalement.</p>
                            )}
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                            {loading ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Envoi en cours...</>
                            ) : '⚡ Soumettre le signalement'}
                        </button>
                    </form>
                </div>

                {/* Right sidebar info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Selected summary */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))', border: 'none' }}>
                        <p style={{ fontSize: '0.72rem', text: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 12 }}>
                            RÉCAPITULATIF
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                {selectedCat?.icon || '⚠️'}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{selectedCat?.label || 'Autre'}</div>
                                <span className={`badge badge-${form.severity}`} style={{ marginTop: 4 }}>{selectedSev?.label}</span>
                            </div>
                        </div>
                        {form.address && (
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                <span>📍</span> <span>{form.address}</span>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ borderLeft: '4px solid var(--yellow)' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>⚠️ Rappel civique</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Tout signalement abusif ou mensonger peut entraîner des sanctions. Utilisez le GPS pour une précision maximale.
                        </p>
                    </div>

                    <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>✅ Validation automatique</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Si 3+ citoyens signalent le même type d'incident dans un rayon de 500m en 15 min, il sera automatiquement approuvé.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportIncidentPage;
