// frontend/src/pages/ReportIncidentPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
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
    ChevronLeft,
    Filter,
    Ghost,
    Send,
    AlertCircle,
    Info,
    CheckCircle2,
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



const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, 15); }, [center, map]);
    return null;
};

const ReportIncidentPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const CATS = [
        { value: 'theft', label: t('feed.categories.theft'), icon: ShieldAlert },
        { value: 'assault', label: t('feed.categories.assault'), icon: ShieldAlert },
        { value: 'vandalism', label: t('feed.categories.vandalism'), icon: Hammer },
        { value: 'suspicious_activity', label: t('feed.categories.suspicious_activity'), icon: Eye },
        { value: 'fire', label: t('feed.categories.fire'), icon: Flame },
        { value: 'kidnapping', label: t('feed.categories.kidnapping'), icon: Ghost },
        { value: 'other', label: t('feed.categories.other'), icon: AlertTriangle },
    ];
    const SEVS = [
        { value: 'low', label: t('feed.severities.low'), desc: t('incident.report.form.severity_desc.low') },
        { value: 'medium', label: t('feed.severities.medium'), desc: t('incident.report.form.severity_desc.medium') },
        { value: 'high', label: t('feed.severities.high'), desc: t('incident.report.form.severity_desc.high') },
        { value: 'critical', label: t('feed.severities.critical'), desc: t('incident.report.form.severity_desc.critical') },
    ];

    const mapTileUrl = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const [form, setForm] = useState({
        title: '', description: '', category: 'other', severity: 'medium',
        address: '', city: 'Ouagadougou', isAnonymous: false, lat: null, lng: null
    });

    const [step, setStep] = useState(1);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const nextStep = () => {
        if (step === 1) {
            if (!form.title || form.title.length < 5) { setError(t('incident.report.form.min_chars_5')); return; }
            setError(null);
        }
        if (step === 2) {
            if (!form.description || form.description.length < 20) { setError(t('incident.report.form.min_chars_20')); return; }
            if (!form.address) { setError(t('incident.report.form.address_required') || 'L\'adresse est requise'); return; }
            setError(null);
        }
        setStep(s => s + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setStep(s => s - 1);
        window.scrollTo(0, 0);
    };

    const handleImageChange = (e) => {
        // ... (rest of image logic remains same)
        const newFiles = Array.from(e.target.files);
        const remainingSlots = 4 - images.length;
        if (remainingSlots <= 0) return;
        const filesToAdd = newFiles.slice(0, remainingSlots);
        setImages(prev => [...prev, ...filesToAdd]);
        setPreviews(prev => [...prev, ...filesToAdd.map(f => URL.createObjectURL(f))]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (i) => {
        const newImages = images.filter((_, idx) => idx !== i);
        const newPreviews = previews.filter((_, idx) => idx !== i);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) { setError(t('incident.report.geo_not_supported')); return; }
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
                    setError(t('incident.report.geo_address_error'));
                } finally { setGeoLoading(false); }
            },
            (err) => {
                setGeoLoading(false);
                setError(err.code === 1 ? t('incident.report.geo_denied') : t('incident.report.geo_failed'));
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true); setError(null);
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
                setError(t('incident.report.error_submit'));
            }
        } finally { setLoading(false); }
    };

    const selectedCat = CATS.find(c => c.value === form.category);
    const selectedSev = SEVS.find(s => s.value === form.severity);

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldAlert size={28} color="var(--brand-orange)" /> {t('incident.report.title')}
                </h1>
                <p className="page-subtitle">{t('incident.report.subtitle')}</p>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator-container">
                <div className="step-line">
                    <div className="step-line-progress" style={{ width: `${((step - 1) / 2) * 100}%` }} />
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className={`step-dot ${step >= i ? 'active' : ''} ${step > i ? 'completed' : ''}`}>
                        {step > i ? <CheckCircle2 size={16} /> : i}
                        <span className="step-label">
                            {i === 1 ? t('incident.report.steps.classification') || 'Classification' :
                                i === 2 ? t('incident.report.steps.details') || 'Détails & Lieu' :
                                    t('incident.report.steps.review') || 'Validation'}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
                <div className="card slide-up" style={{ padding: 32, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertCircle size={20} /> {error}
                    </div>}

                    <div style={{ flex: 1 }}>
                        {step === 1 && (
                            <div className="fade-in">
                                <div className="form-group slide-up stagger-1">
                                    <label className="form-label" htmlFor="title">
                                        {t('incident.report.form.title')}
                                    </label>
                                    <input className="form-control" type="text" id="title"
                                        placeholder={t('incident.report.form.title_placeholder')}
                                        value={form.title} onChange={e => set('title', e.target.value)} required minLength={5} maxLength={100} />
                                </div>

                                <div className="form-group slide-up stagger-2">
                                    <label className="form-label">{t('incident.report.form.category')}</label>
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

                                <div className="form-group slide-up stagger-3">
                                    <label className="form-label">{t('incident.report.form.severity')}</label>
                                    <div className="sev-grid">
                                        {SEVS.map(sev => (
                                            <label key={sev.value} className={`sev-option ${sev.value}${form.severity === sev.value ? ' selected' : ''}`}>
                                                <input type="radio" name="severity" value={sev.value}
                                                    checked={form.severity === sev.value}
                                                    onChange={() => set('severity', sev.value)} />
                                                <div style={{ fontWeight: 700 }}>{sev.label}</div>
                                                <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>{sev.desc}</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="fade-in">
                                <div className="form-group slide-up stagger-1">
                                    <label className="form-label" htmlFor="description">
                                        {t('incident.report.form.description')}
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 8 }}>
                                            {form.description.length}/2000
                                        </span>
                                    </label>
                                    <textarea className="form-control" id="description" rows={5}
                                        placeholder={t('incident.report.form.description_placeholder')}
                                        value={form.description} onChange={e => set('description', e.target.value)}
                                        required minLength={20} maxLength={2000} />
                                </div>

                                <div className="form-group slide-up stagger-2">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <label className="form-label" style={{ margin: 0 }}>
                                            <MapPin size={18} /> {t('incident.report.form.location')}
                                        </label>
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={handleGetLocation} disabled={geoLoading}>
                                            {geoLoading ? <Loader2 size={14} className="spin" /> : <Target size={14} />}
                                            {geoLoading ? '...' : t('incident.report.form.my_position')}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <input className="form-control" type="text" placeholder={t('incident.report.form.address_placeholder')}
                                            value={form.address} onChange={e => set('address', e.target.value)} required />
                                    </div>
                                </div>

                                {form.lat && form.lng && (
                                    <div className="slide-up stagger-3" style={{ height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 24, border: '1px solid var(--border)' }}>
                                        <MapContainer center={[form.lat, form.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                                            <TileLayer url={mapTileUrl} attribution="&copy; CARTO" />
                                            <Marker position={[form.lat, form.lng]} icon={redIcon} />
                                            <ChangeView center={[form.lat, form.lng]} />
                                        </MapContainer>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="fade-in">
                                <div className="form-group slide-up stagger-1">
                                    <label className="form-label">
                                        <Camera size={18} /> {t('incident.report.form.photos')}
                                    </label>
                                    <div className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 12, border: '2px dashed var(--border)', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
                                        <ImageIcon size={32} opacity={0.3} style={{ marginBottom: 12 }} />
                                        <div style={{ fontWeight: 600 }}>{t('incident.report.form.upload_hint')}</div>
                                        <input ref={fileInputRef} type="file" style={{ display: 'none' }} multiple accept="image/*" onChange={handleImageChange} />
                                    </div>
                                    {previews.length > 0 && (
                                        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                                            {previews.map((p, i) => (
                                                <div key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                                                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 0, right: 0, background: 'var(--brand-orange)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group slide-up stagger-2" style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12 }}>
                                    <label className="toggle-label">
                                        <input type="checkbox" className="toggle-input" checked={form.isAnonymous} onChange={e => set('isAnonymous', e.target.checked)} />
                                        <div className="toggle-switch" />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Ghost size={16} /> {t('incident.report.form.anonymous')}
                                        </span>
                                    </label>
                                </div>

                                <div className="slide-up stagger-3" style={{ background: 'var(--brand-orange-pale)', padding: 16, borderRadius: 12, border: '1px solid var(--brand-orange-light)', marginBottom: 24 }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--brand-orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Info size={16} /> {t('incident.report.summary.fast_validation.title')}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', marginTop: 4 }}>{t('incident.report.summary.fast_validation.desc')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                        {step > 1 && (
                            <button className="btn btn-secondary" type="button" onClick={prevStep} style={{ flex: 1, height: 52, borderRadius: 12 }}>
                                <ChevronLeft size={20} /> {t('common.previous')}
                            </button>
                        )}
                        {step < 3 ? (
                            <button className="btn btn-primary" type="button" onClick={nextStep} style={{ flex: 1, height: 52, borderRadius: 12, marginLeft: step === 1 ? 'auto' : 0, maxWidth: step === 1 ? '200px' : 'none' }}>
                                {t('common.next')} <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button className="btn btn-primary" type="button" onClick={handleSubmit} style={{ flex: 2, height: 52, borderRadius: 12 }} disabled={loading}>
                                {loading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
                                {loading ? t('incident.report.form.submitting') : t('incident.report.form.submit')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right panel summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="slide-up stagger-2">
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-navy-light))', border: 'none', padding: 24 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 16 }}>
                            {t('incident.report.summary.title')}
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedCat && React.createElement(selectedCat.icon, { size: 20, color: 'var(--brand-orange)' })}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{selectedCat?.label || '...'}</div>
                                <span className={`badge badge-${form.severity}`} style={{ marginTop: 4, display: 'inline-block' }}>{selectedSev?.label}</span>
                            </div>
                        </div>
                        {form.title && <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>{form.title}</div>}
                        {form.address && (
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                <MapPin size={12} /> {form.address}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportIncidentPage;
