// frontend/src/pages/EditIncidentPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    Pencil,
    XCircle,
    Send
} from 'lucide-react';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const redIcon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:var(--brand-orange);border:3px solid white;box-shadow:0 2px 12px rgba(232,84,26,0.6);display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
});

const CATS = [
    { value: 'theft', label: 'Vol', icon: ShieldAlert },
    { value: 'assault', label: 'Agression', icon: ShieldAlert },
    { value: 'vandalism', label: 'Vandalisme', icon: Hammer },
    { value: 'suspicious_activity', label: 'Suspect', icon: Eye },
    { value: 'fire', label: 'Incendie', icon: Flame },
    { value: 'kidnapping', label: 'Enlèvement', icon: ShieldAlert },
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

const EditIncidentPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { theme } = useTheme();

    const CATS = [
        { value: 'theft', label: t('feed.categories.theft'), icon: ShieldAlert },
        { value: 'assault', label: t('feed.categories.assault'), icon: ShieldAlert },
        { value: 'vandalism', label: t('feed.categories.vandalism'), icon: Hammer },
        { value: 'suspicious_activity', label: t('feed.categories.suspicious_activity'), icon: Eye },
        { value: 'fire', label: t('feed.categories.fire'), icon: Flame },
        { value: 'kidnapping', label: t('feed.categories.kidnapping'), icon: ShieldAlert },
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
        address: '', city: '', lat: null, lng: null
    });
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`/api/incidents/${id}`).then(({ data }) => {
            if (data.success) {
                const inc = data.incident;
                setForm({
                    title: inc.title,
                    description: inc.description,
                    category: inc.category,
                    severity: inc.severity,
                    address: inc.location.address,
                    city: inc.location.city,
                    lat: inc.location.coordinates?.coordinates[1] || null,
                    lng: inc.location.coordinates?.coordinates[0] || null,
                });
                setExistingImages(inc.images || []);
            }
        }).catch(err => {
            setError(t('incident.edit.error_load'));
        }).finally(() => setLoading(false));
    }, [id, t]);

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 4 - existingImages.length);
        setNewImages(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== null) fd.append(k, v); });
            newImages.forEach(img => fd.append('images', img));
            
            const { data } = await axios.put(`/api/incidents/${id}`, fd, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            if (data.success) navigate('/my-incidents');
        } catch (err) {
            setError(err.response?.data?.message || t('incident.edit.error_update'));
        } finally { setSaving(false); }
    };

    if (loading) return <div className="page-loader"><div className="spinner" /><p>{t('incident.edit.loading')}</p></div>;

    const selectedSev = SEVS.find(s => s.value === form.severity);

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Pencil size={28} color="var(--brand-orange)" /> {t('incident.edit.title')}
                </h1>
                <p className="page-subtitle">{t('incident.edit.subtitle')}</p>
            </div>

            <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ padding: 24 }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={20} /> {error}
                    </div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">
                                {t('incident.report.form.title')}
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 8 }}>
                                    {t('incident.report.form.min_chars_5')} • {form.title.length}/100
                                </span>
                            </label>
                            <input className="form-control" type="text" id="title"
                                value={form.title} onChange={e => set('title', e.target.value)} required minLength={5} maxLength={100} />
                        </div>

                        <div className="form-group">
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

                        <div className="form-group">
                            <label className="form-label">{t('incident.report.form.severity')}</label>
                            <div className="sev-grid">
                                {SEVS.map(sev => (
                                    <label key={sev.value} className={`sev-option ${sev.value}${form.severity === sev.value ? ' selected' : ''}`}>
                                        <input type="radio" name="severity" value={sev.value}
                                            checked={form.severity === sev.value}
                                            onChange={() => set('severity', sev.value)} />
                                        <div>{sev.label}</div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="description">
                                {t('incident.report.form.description')}
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 8 }}>
                                    {t('incident.report.form.min_chars_20')} • {form.description.length}/2000
                                </span>
                            </label>
                            <textarea className="form-control" id="description" rows={4}
                                value={form.description} onChange={e => set('description', e.target.value)} required minLength={20} maxLength={2000} />
                        </div>

                        {existingImages.length > 0 && (
                            <div className="form-group">
                                <label className="form-label">{t('incident.edit.current_photos')}</label>
                                <div className="image-previews">
                                    {existingImages.map((img, i) => (
                                        <div key={i} className="image-preview">
                                            <img src={`/${img.path}`} alt="Ancienne" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">{t('incident.edit.add_photos')}</label>
                            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                                <div className="upload-zone-text">{t('incident.report.form.upload_hint')}</div>
                            </div>
                            <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                                multiple accept="image/*" onChange={handleImageChange} />
                            {previews.length > 0 && (
                                <div className="image-previews">
                                    {previews.map((p, i) => (
                                        <div key={i} className="image-preview">
                                            <img src={p} alt="Nouveau" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                            <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>{t('incident.edit.cancel')}</button>
                            <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
                                {saving ? t('incident.edit.saving') : t('incident.edit.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditIncidentPage;
