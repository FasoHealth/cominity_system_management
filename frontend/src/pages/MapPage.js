// frontend/src/pages/MapPage.js — v2 with proximity slider + floating CTA
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import L from 'leaflet';
import { 
    Map as MapIcon, 
    MapPin, 
    Clock, 
    Search, 
    Navigation, 
    ThumbsUp, 
    Zap, 
    Target, 
    Plus, 
    Minus, 
    AlertCircle,
    ShieldAlert,
    AlertTriangle,
    Flame,
    Car,
    Hammer,
    Eye,
    LocateFixed,
    ChevronRight
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

const SEV_COLORS = { low: '#22C55E', medium: '#EAB308', high: '#F97316', critical: '#EF4444' };
const SEV_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };

const CAT_PILLS = [
    { value: '', label: 'Tout' },
    { value: 'theft', label: 'Vol' },
    { value: 'assault', label: 'Sécurité' },
    { value: 'fire', label: 'Incendie' },
    { value: 'vandalism', label: 'Vandalisme' },
    { value: 'kidnapping', label: 'Enlèvement' },
];

function timeAgo(date) {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60) return `Il y a ${min} min`;
    return `Il y a ${Math.floor(min / 60)}h`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Fixed SVG icon helper for Leaflet markers to avoid complex React rendering inside L.divIcon
const createMarker = (color) => L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 10px ${color}99;display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12],
});

const FlyTo = ({ pos }) => { const map = useMap(); useEffect(() => { if (pos) map.flyTo(pos, 15, { duration: 0.8 }); }, [pos]); return null; };

const MapPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const CAT_LABELS = { 
        theft: t('feed.categories.theft'), 
        assault: t('feed.categories.assault'), 
        vandalism: t('feed.categories.vandalism'), 
        suspicious_activity: t('feed.categories.suspicious_activity'), 
        fire: t('feed.categories.fire'), 
        kidnapping: t('feed.categories.kidnapping'), 
        other: t('feed.categories.other') 
    };

    const SEV_LABELS = { 
        low: t('feed.severities.low'), 
        medium: t('feed.severities.medium'), 
        high: t('feed.severities.high'), 
        critical: t('feed.severities.critical') 
    };

    const CAT_PILLS = [
        { value: '', label: t('feed.categories.all') },
        { value: 'theft', label: t('feed.categories.theft') },
        { value: 'assault', label: t('feed.categories.assault') },
        { value: 'fire', label: t('feed.categories.fire') },
        { value: 'vandalism', label: t('feed.categories.vandalism') },
        { value: 'kidnapping', label: t('feed.categories.kidnapping') },
    ];

    function timeAgo(date) {
        const sec = Math.floor((Date.now() - new Date(date)) / 1000);
        if (sec < 60) return t('feed.time.now');
        const min = Math.floor(sec / 60);
        if (min < 60) return t('feed.time.min', { count: min });
        const h = Math.floor(min / 60);
        if (h < 24) return t('feed.time.hour', { count: h });
        return t('feed.time.day', { count: Math.floor(h / 24) });
    }

    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');
    const [searchVal, setSearchVal] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [flyTo, setFlyTo] = useState(null);
    const [radiusKm, setRadiusKm] = useState(2.5);
    const [center, setCenter] = useState([12.3647, -1.5338]); // Default Ouaga
    const [userPos, setUserPos] = useState(null);

    const mapTile = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const pos = [coords.latitude, coords.longitude];
                    setCenter(pos);
                    setUserPos(pos);
                    setFlyTo(pos);
                },
                () => console.warn("Geolocation refusée.")
            );
        }

        axios.get('/api/incidents?limit=500').then(({ data }) => {
            if (data.success) {
                setIncidents(data.incidents.filter(i => i.status === 'approved'));
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const filtered = incidents.filter(inc => {
        const matchCat = !category || inc.category === category;
        const matchSearch = !searchVal ||
            inc.title.toLowerCase().includes(searchVal.toLowerCase()) ||
            inc.location?.address?.toLowerCase().includes(searchVal.toLowerCase());
        return matchCat && matchSearch;
    });

    const withDist = filtered.map(inc => {
        const coords = inc.location?.coordinates?.coordinates;
        const dist = (coords && coords.length === 2)
            ? haversineKm(center[0], center[1], coords[1], coords[0])
            : 999;
        return { ...inc, dist };
    }).sort((a, b) => a.dist - b.dist);

    const handleItemClick = (inc) => {
        setActiveId(inc._id);
        const coords = inc.location?.coordinates?.coordinates;
        if (coords && coords.length === 2) setFlyTo([coords[1], coords[0]]);
    };

    if (loading) return (
        <div className="page-loader" style={{ height: '100vh' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>{t('map.loading')}</p>
        </div>
    );

    return (
        <div className="map-layout" style={{ height: 'calc(100vh)', position: 'relative' }}>
            {/* ── Left panel ── */}
            <div className="map-sidebar">
                {/* Header */}
                <div className="map-sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div className="map-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LocateFixed size={18} color="var(--brand-orange)" /> {t('map.in_your_zone')}
                        </div>
                        <span style={{ background: 'var(--brand-orange)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                            {t('map.alerts_count', { count: withDist.length })}
                        </span>
                    </div>

                    {/* Radius slider */}
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {t('map.radius_label')}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-orange)' }}>{radiusKm} {t('map.km')}</span>
                        </div>
                        <input
                            type="range" min="0.5" max="10" step="0.5"
                            value={radiusKm}
                            onChange={e => setRadiusKm(parseFloat(e.target.value))}
                            style={{
                                width: '100%', height: 4, borderRadius: 2,
                                accentColor: 'var(--brand-orange)', cursor: 'pointer',
                            }}
                        />
                    </div>

                    {/* Category pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {CAT_PILLS.map(c => (
                            <button key={c.value} className={`pill${category === c.value ? ' active' : ''}`}
                                style={{ fontSize: '0.72rem', padding: '4px 12px' }}
                                onClick={() => setCategory(c.value)}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="map-sidebar-list">
                    {withDist.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 16px' }}>
                            <div className="empty-state-icon">
                                <AlertCircle size={40} opacity={0.2} />
                            </div>
                            <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>{t('feed.no_incidents')}</p>
                        </div>
                    ) : withDist.map(inc => {
                        const Icon = CATEGORY_ICONS[inc.category] || AlertTriangle;
                        return (
                            <div key={inc._id}
                                className={`map-incident-item${activeId === inc._id ? ' active' : ''}`}
                                onClick={() => handleItemClick(inc)}>
                                <div className={`cat-icon ${inc.category}`} style={{ width: 38, height: 38, fontSize: '1rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--bg-secondary)' }}>
                                    <Icon size={18} />
                                </div>
                                <div className="map-incident-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                                        <span className="map-incident-name">{inc.title}</span>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Clock size={10} /> {timeAgo(inc.createdAt)}
                                        </span>
                                    </div>
                                    <div className="map-incident-addr" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={10} opacity={0.6} /> {inc.location?.address}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Navigation size={10} /> {inc.dist < 999 ? formatDist(inc.dist) : '—'}
                                        </span>
                                        {inc.upvoteCount > 0 && (
                                            <span style={{ fontSize: '0.72rem', color: 'var(--brand-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <ThumbsUp size={10} /> {inc.upvoteCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Map ── */}
            <div className="map-container">
                {/* Search bar */}
                <div className="map-search-bar" style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }}>
                        <Search size={18} />
                    </span>
                    <input placeholder={t('map.search_placeholder')}
                        value={searchVal} onChange={e => setSearchVal(e.target.value)}
                        style={{ width: '100%', paddingLeft: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', height: 48, boxShadow: 'var(--shadow-sm)' }} />
                </div>

                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url={mapTile} attribution="&copy; CARTO" />
                    {flyTo && <FlyTo pos={flyTo} />}

                    {/* User position marker */}
                    {userPos && (
                        <Marker position={userPos} icon={L.divIcon({
                            className: '',
                            html: '<div style="width:20px;height:20px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.6);"></div>',
                            iconSize: [20, 20], iconAnchor: [10, 10]
                        })}>
                            <Popup>{t('map.user_popup')}</Popup>
                        </Marker>
                    )}

                    {/* Proximity circle */}
                    <Circle
                        center={center}
                        radius={radiusKm * 1000}
                        pathOptions={{ color: '#E8541A', fillColor: '#E8541A', fillOpacity: 0.06, dashArray: '8 6', weight: 2 }}
                    />

                    {/* Markers */}
                    {withDist.filter(inc => inc.location?.coordinates?.coordinates).map(inc => {
                        const coords = inc.location.coordinates.coordinates;
                        return (
                        <Marker
                            key={inc._id}
                            position={[coords[1], coords[0]]}
                            icon={createMarker(SEV_COLORS[inc.severity])}
                            eventHandlers={{ click: () => setActiveId(inc._id) }}
                        >
                            <Popup>
                                <div style={{ minWidth: 220, padding: 4 }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                        <span className={`badge badge-${inc.category}`} style={{ fontSize: '0.65rem' }}>{CAT_LABELS[inc.category]}</span>
                                        <span className={`badge badge-${inc.severity}`} style={{ fontSize: '0.65rem' }}>{SEV_LABELS[inc.severity]}</span>
                                        {inc.upvoteCount > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--brand-orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={10} /> {inc.upvoteCount}</span>}
                                    </div>
                                    <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{inc.title}</h4>
                                    <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={10} /> {inc.location.address}
                                    </p>
                                    <button className="btn btn-primary btn-sm btn-full" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} onClick={() => navigate(`/incidents/${inc._id}`)}>
                                        {t('map.details_btn')} <ChevronRight size={14} />
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                        );
                    })}
                </MapContainer>

                {/* Floating CTA */}
                <div style={{ position: 'absolute', bottom: 32, right: 32, zIndex: 400 }}>
                    <Link to="/report" className="btn btn-primary btn-lg" style={{
                        borderRadius: 40, padding: '16px 32px', gap: 12,
                        boxShadow: '0 8px 32px rgba(232,84,26,0.45)',
                        fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.04em',
                        display: 'flex', alignItems: 'center'
                    }}>
                        <Zap size={20} fill="currentColor" /> {t('map.report_cta')}
                    </Link>
                </div>

                {/* Map Controls */}
                <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                        { icon: <Target size={20} />, action: () => setFlyTo(userPos) },
                        { icon: <Plus size={20} />, action: () => {} }, // Logic would need map ref
                        { icon: <Minus size={20} />, action: () => {} }
                    ].map((btn, i) => (
                        <div key={i} onClick={btn.action} style={{
                            width: 44, height: 44, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-md)', cursor: 'pointer',
                            color: 'var(--text-primary)', transition: 'all 0.2s'
                        }} onMouseOver={e => e.currentTarget.style.color = 'var(--brand-orange)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-primary)'}>
                            {btn.icon}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="map-legend" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-md)' }}>
                    <div className="map-legend-title" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-muted)' }}>{t('map.legend_gravity')}</div>
                    <div className="map-legend-items" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(SEV_COLORS).map(([sev, color]) => (
                            <div key={sev} className="map-legend-item" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                <div className="map-legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: color }} /> {SEV_LABELS[sev]}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPage;
