// frontend/src/pages/MapPage.js — v2 with proximity slider + floating CTA
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import L from 'leaflet';

const CAT_LABELS = { theft: 'Vol', assault: 'Agression', vandalism: 'Vandalisme', suspicious_activity: 'Suspect', fire: 'Incendie', accident: 'Accident', other: 'Autre' };
const CAT_ICONS = { theft: '💰', assault: '👊', vandalism: '🔨', suspicious_activity: '👁️', fire: '🔥', accident: '🚗', other: '⚠️' };
const SEV_COLORS = { low: '#22C55E', medium: '#EAB308', high: '#F97316', critical: '#EF4444' };
const SEV_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };

const CAT_PILLS = [
    { value: '', label: 'Tout' },
    { value: 'assault', label: 'Sécurité' },
    { value: 'accident', label: 'Accident' },
    { value: 'fire', label: 'Incendie' },
    { value: 'vandalism', label: 'Travaux' },
    { value: 'other', label: 'Météo' },
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

const createMarker = (color, icon) => L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 10px ${color}99;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;">${icon}</div>`,
    iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22],
});

const FlyTo = ({ pos }) => { const map = useMap(); useEffect(() => { if (pos) map.flyTo(pos, 15, { duration: 0.8 }); }, [pos]); return null; };

const MapPage = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');
    const [searchVal, setSearchVal] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [flyTo, setFlyTo] = useState(null);
    const [radiusKm, setRadiusKm] = useState(2.5);
    const [center] = useState([12.3647, -1.5338]); // Ouagadougou default

    const mapTile = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    useEffect(() => {
        axios.get('/api/incidents?limit=500').then(({ data }) => {
            if (data.success) setIncidents(data.incidents);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const filtered = incidents.filter(inc => {
        const matchCat = !category || inc.category === category;
        const matchSearch = !searchVal ||
            inc.title.toLowerCase().includes(searchVal.toLowerCase()) ||
            inc.location?.address?.toLowerCase().includes(searchVal.toLowerCase());
        return matchCat && matchSearch;
    });

    // Sort by distance from center
    const withDist = filtered.map(inc => {
        const dist = inc.location?.coordinates?.lat
            ? haversineKm(center[0], center[1], inc.location.coordinates.lat, inc.location.coordinates.lng)
            : 999;
        return { ...inc, dist };
    }).sort((a, b) => a.dist - b.dist);

    const handleItemClick = (inc) => {
        setActiveId(inc._id);
        if (inc.location?.coordinates?.lat) setFlyTo([inc.location.coordinates.lat, inc.location.coordinates.lng]);
    };

    if (loading) return (
        <div className="page-loader" style={{ height: '100vh' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Chargement de la carte...</p>
        </div>
    );

    return (
        <div className="map-layout" style={{ height: 'calc(100vh)', position: 'relative' }}>
            {/* ── Left panel ── */}
            <div className="map-sidebar">
                {/* Header */}
                <div className="map-sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div className="map-sidebar-title">Dans votre zone</div>
                        <span style={{ background: 'var(--brand-orange)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                            {withDist.length} alertes
                        </span>
                    </div>

                    {/* Radius slider */}
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Rayon de proximité
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-orange)' }}>{radiusKm} km</span>
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
                            <div className="empty-state-icon">🛡️</div>
                            <p className="empty-state-title" style={{ fontSize: '0.9rem' }}>Aucun incident</p>
                        </div>
                    ) : withDist.map(inc => (
                        <div key={inc._id}
                            className={`map-incident-item${activeId === inc._id ? ' active' : ''}`}
                            onClick={() => handleItemClick(inc)}>
                            <div className={`cat-icon ${inc.category}`} style={{ width: 38, height: 38, fontSize: '1rem', flexShrink: 0 }}>
                                {CAT_ICONS[inc.category] || '⚠️'}
                            </div>
                            <div className="map-incident-info">
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                                    <span className="map-incident-name">{inc.title}</span>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {timeAgo(inc.createdAt)}
                                    </span>
                                </div>
                                <div className="map-incident-addr">{inc.location?.address}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        ✈️ {inc.dist < 999 ? formatDist(inc.dist) : '—'}
                                    </span>
                                    {inc.upvoteCount > 0 && (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--brand-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            👍 {inc.upvoteCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Map ── */}
            <div className="map-container">
                {/* Search bar */}
                <div className="map-search-bar">
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }}>🔍</span>
                    <input placeholder="Rechercher un quartier, une rue..."
                        value={searchVal} onChange={e => setSearchVal(e.target.value)}
                        style={{ width: '100%', paddingLeft: 36 }} />
                </div>

                <MapContainer key={theme} center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url={mapTile} attribution="&copy; CARTO" />
                    {flyTo && <FlyTo pos={flyTo} />}

                    {/* Proximity circle */}
                    <Circle
                        center={center}
                        radius={radiusKm * 1000}
                        pathOptions={{ color: '#E8541A', fillColor: '#E8541A', fillOpacity: 0.06, dashArray: '8 6', weight: 2 }}
                    />

                    {/* Markers */}
                    {withDist.filter(inc => inc.location?.coordinates?.lat).map(inc => (
                        <Marker
                            key={inc._id}
                            position={[inc.location.coordinates.lat, inc.location.coordinates.lng]}
                            icon={createMarker(SEV_COLORS[inc.severity], CAT_ICONS[inc.category] || '⚠️')}
                            eventHandlers={{ click: () => setActiveId(inc._id) }}
                        >
                            <Popup>
                                <div style={{ minWidth: 200, padding: 4 }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                        <span className={`badge badge-${inc.category}`} style={{ fontSize: '0.65rem' }}>{CAT_LABELS[inc.category]}</span>
                                        <span className={`badge badge-${inc.severity}`} style={{ fontSize: '0.65rem' }}>{SEV_LABELS[inc.severity]}</span>
                                        {inc.upvoteCount > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--brand-orange)', fontWeight: 700 }}>👍 {inc.upvoteCount}</span>}
                                    </div>
                                    <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700 }}>{inc.title}</h4>
                                    <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#6B7280' }}>📍 {inc.location.address}</p>
                                    <button className="btn btn-primary btn-sm btn-full" onClick={() => navigate(`/incidents/${inc._id}`)}>
                                        Voir les détails →
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Floating CTA */}
                <div style={{ position: 'absolute', bottom: 24, right: 20, zIndex: 400 }}>
                    <Link to="/report" className="btn btn-primary btn-lg" style={{
                        borderRadius: 40, padding: '14px 28px', gap: 10,
                        boxShadow: '0 8px 24px rgba(232,84,26,0.45)',
                        fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.03em'
                    }}>
                        ⚡ SIGNALER UN INCIDENT
                    </Link>
                </div>

                {/* Zoom controls */}
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['📍', '+', '−'].map((icon, i) => (
                        <div key={i} style={{
                            width: 40, height: 40, background: '#fff', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: i === 0 ? '1rem' : '1.2rem',
                            color: 'var(--text-secondary)', fontWeight: 600
                        }}>
                            {icon}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="map-legend">
                    <div className="map-legend-title">Légende</div>
                    <div className="map-legend-items">
                        {Object.entries(SEV_COLORS).map(([sev, color]) => (
                            <div key={sev} className="map-legend-item">
                                <div className="map-legend-dot" style={{ background: color }} /> {SEV_LABELS[sev]}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPage;
