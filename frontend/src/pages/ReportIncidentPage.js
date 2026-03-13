// frontend/src/pages/ReportIncidentPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { 
    ShieldAlert, 
    AlertTriangle, 
    Hammer, 
    Eye, 
    Flame, 
    Car, 
    MapPin, 
    Target, 
    Loader2, 
    Camera, 
    Image as ImageIcon, 
    ChevronRight,
    Filter,
    Ghost,
    Send,
    AlertCircle,
    Info,
    CheckCircle,
    ClipboardCheck,
    X
} from 'lucide-react';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const redIcon = L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:var(--brand-orange);border:2px solid white;box-shadow:0 0 10px rgba(232,84,26,0.6);display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
});

const CATS = [
    { value: 'theft', label: 'Vol', icon: ShieldAlert },
    { value: 'assault', label: 'Agression', icon: ShieldAlert },
    { value: 'vandalism', label: 'Vandalisme', icon: Hammer },
    { value: 'suspicious_activity', label: 'Suspect', icon: Eye },
    { value: 'fire', label: 'Incendie', icon: Flame },
    { value: 'kidnapping', label: 'Enlèvement', icon: Ghost },
    { value: 'other', label: 'Autre', icon: AlertTriangle },
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
        const newFiles = Array.from(e.target.files);
        
        // Calculer combien d'images on peut encore ajouter
        const remainingSlots = 4 - images.length;
        if (remainingSlots <= 0) return; // Limite atteinte
        
        const filesToAdd = newFiles.slice(0, remainingSlots);
        
        setImages(prev => [...prev, ...filesToAdd]);
        setPreviews(prev => [...prev, ...filesToAdd.map(f => URL.createObjectURL(f))]);
        
        // Réinitialiser l'input pour permettre de sélectionner le même fichier si on l'a supprimé juste avant
        if (fileInputRef.current) fileInputRef.current.value = '';
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
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldAlert size={28} color="var(--brand-orange)" /> Signaler un incident
                </h1>
                <p className="page-subtitle">Aidez la communauté en signalant un problème de sécurité localement.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
                <div className="card" style={{ padding: 24 }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertCircle size={20} /> {error}
                    </div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">
                                Titre du signalement
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 8 }}>
                                    (Min. 5 caractères)
                                </span>
                            </label>
                            <input className="form-control" type="text" id="title"
                                placeholder="Ex: Incendie au marché central, Vol de moto..."
                                value={form.title} onChange={e => set('title', e.target.value)} required minLength={5} maxLength={100} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Catégorie</label>
                            <div className="cat-grid">
                                {CATS.map(cat => {
                                    const Icon = cat.icon;
                                    return (
                                        <label key={cat.value} className={`cat-option${form.category === cat.value ? ' selected' : ''}`}>
                                            <input type="radio" name="category" value={cat.value}
                                                checked={form.category === cat.value}
                                                onChange={() => set('category', cat.value)} />
                                            <span className="cat-option-icon"><Icon size={20} /></span>
                                            <span className="cat-option-label">{cat.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

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
                                        <div style={{ fontWeight: 700 }}>{sev.label}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 2, opacity: 0.7 }}>{sev.desc}</div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="description">
                                Description détaillée
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 8 }}>
                                    (Min. 20) • {form.description.length}/2000
                                </span>
                            </label>
                            <textarea className="form-control" id="description" rows={4}
                                placeholder="Décrivez l'incident en détail : que s'est-il passé, les personnes impliquées, l'heure approximative..."
                                value={form.description} onChange={e => set('description', e.target.value)}
                                required minLength={20} maxLength={2000} />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <MapPin size={18} /> Localisation
                                </label>
                                <button type="button" className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                    onClick={handleGetLocation} disabled={geoLoading}>
                                    {geoLoading ? <Loader2 size={14} className="spin" /> : <Target size={14} />}
                                    {geoLoading ? 'Localisation...' : 'Ma position GPS'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input className="form-control" type="text" placeholder="Adresse ou point de repère"
                                    value={form.address} onChange={e => set('address', e.target.value)} required />
                                <input className="form-control" type="text" placeholder="Ville"
                                    value={form.city} onChange={e => set('city', e.target.value)} />
                            </div>
                        </div>

                        {form.lat && form.lng && (
                            <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                <MapContainer center={[form.lat, form.lng]} zoom={15}
                                    style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                                    <TileLayer url={mapTileUrl} attribution="&copy; CARTO" />
                                    <Marker position={[form.lat, form.lng]} icon={redIcon} />
                                    <ChangeView center={[form.lat, form.lng]} />
                                </MapContainer>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Camera size={18} /> Photos (optionnel)
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>Max 4 photos</span>
                            </label>
                            <div className="upload-zone" style={{ borderRadius: 12, border: '2px dashed var(--border)', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => fileInputRef.current?.click()} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-orange)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                <div className="upload-zone-icon" style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                                    <ImageIcon size={32} opacity={0.4} />
                                </div>
                                <div className="upload-zone-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Cliquez pour ajouter des photos</div>
                                <div className="upload-zone-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, WEBP • Max 5 Mo chacune</div>
                            </div>
                            <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                                multiple accept="image/*" onChange={handleImageChange} />
                            {previews.length > 0 && (
                                <div className="image-previews" style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                                    {previews.map((p, i) => (
                                        <div key={i} className="image-preview" style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)', flexShrink: 0 }}>
                                            <img src={p} alt={`Aperçu ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                                            <button type="button" className="image-preview-remove" style={{ position: 'absolute', top: -6, right: -6, background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}><X size={12} strokeWidth={3} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 12, marginBottom: 24 }}>
                            <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                                <input type="checkbox" className="toggle-input"
                                    checked={form.isAnonymous} onChange={e => set('isAnonymous', e.target.checked)} />
                                <div className="toggle-switch" />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Ghost size={16} /> Signaler anonymement
                                </span>
                            </label>
                            {form.isAnonymous && (
                                <p className="form-hint" style={{ fontSize: '0.75rem', marginTop: 8, color: 'var(--text-muted)', marginLeft: 44 }}>Votre identité ne sera pas visible dans le signalement public.</p>
                            )}
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" type="submit" style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }} disabled={loading}>
                            {loading ? (
                                <Loader2 size={20} className="spin" />
                            ) : <Send size={20} />}
                            {loading ? 'Envoi en cours...' : 'Soumettre le signalement'}
                        </button>
                    </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))', border: 'none', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ClipboardCheck size={14} /> RÉCAPITULATIF
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {selectedCat ? (() => {
                                    const Icon = selectedCat.icon;
                                    return <Icon size={24} color="var(--brand-orange)" />;
                                })() : <AlertTriangle size={24} color="var(--brand-orange)" />}
                            </div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{selectedCat?.label || 'Autre'}</div>
                                <span className={`badge badge-${form.severity}`} style={{ marginTop: 6, display: 'inline-block' }}>{selectedSev?.label}</span>
                            </div>
                        </div>
                        {form.address && (
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <MapPin size={14} /> <span>{form.address}</span>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ borderLeft: '4px solid var(--yellow)', padding: 16 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#b45309' }}>
                            <Info size={16} /> Rappel civique
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Tout signalement abusif peut entraîner des sanctions. La précision géographique permet une intervention plus rapide.
                        </p>
                    </div>

                    <div className="card" style={{ borderLeft: '4px solid #10b981', padding: 16 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#047857' }}>
                            <CheckCircle size={16} /> Validation rapide
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Si d'autres citoyens signalent le même incident à proximité, il sera priorisé par nos services de modération.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportIncidentPage;
