// frontend/src/pages/MapPage.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
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

const MapPage = () => {
    const { theme } = useTheme();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ category: '', severity: '' });
    const navigate = useNavigate();

    const mapTileUrl = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const { data } = await axios.get('/api/incidents?limit=1000');
                if (data.success) {
                    setIncidents(data.incidents);
                    setFilteredIncidents(data.incidents);
                }
            } catch (err) { console.error("Erreur map:", err); }
            finally { setLoading(false); }
        };
        fetchIncidents();
    }, []);

    useEffect(() => {
        let result = incidents;
        if (filters.category) result = result.filter(inc => inc.category === filters.category);
        if (filters.severity) result = result.filter(inc => inc.severity === filters.severity);
        setFilteredIncidents(result);
    }, [filters, incidents]);

    if (loading) return <div className="page-loader"><div className="spinner"></div><p>Initialisation...</p></div>;

    return (
        <div style={{ height: 'calc(100vh - 0px)', width: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
                <select className="form-control" style={{ width: '160px' }} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                    <option value="">Toutes catégories</option>
                    {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select className="form-control" style={{ width: '160px' }} value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
                    <option value="">Toute gravité</option>
                    {Object.entries(SEV_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </div>

            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: 'var(--bg-card)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 'bold', boxShadow: 'var(--shadow-md)' }}>
                ⚡ {filteredIncidents.length} Alertes actives
            </div>

            <div className="card" style={{ position: 'absolute', bottom: '30px', right: '20px', zIndex: 1000, padding: '12px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(SEV_LABELS).map(([v, l]) => (
                        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: SEV_COLORS[v] }}></div>
                            <span style={{ color: 'var(--text-primary)' }}>{l}</span>
                        </div>
                    ))}
                </div>
            </div>

            <MapContainer key={theme} center={[12.3647, -1.5338]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url={mapTileUrl} attribution='&copy; CARTO' />
                {filteredIncidents.filter(inc => inc.location?.coordinates?.lat).map((inc) => (
                    <Marker
                        key={inc._id}
                        position={[inc.location.coordinates.lat, inc.location.coordinates.lng]}
                        icon={createColoredMarker(SEV_COLORS[inc.severity])}
                    >
                        <Popup>
                            <div style={{ minWidth: '180px' }}>
                                <div style={{ marginBottom: '6px' }}>
                                    <span className={`badge badge-${inc.severity}`} style={{ fontSize: '0.6rem' }}>{inc.severity}</span>
                                </div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>{inc.title}</h4>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#64748b' }}>📍 {inc.location.address}</p>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="btn btn-primary btn-sm btn-full" style={{ fontSize: '0.7rem' }} onClick={() => navigate(`/incidents/${inc._id}`)}>Détails</button>
                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }} onClick={() => window.open(`https://www.google.com/maps?q=${inc.location.coordinates.lat},${inc.location.coordinates.lng}`, '_blank')}>📍 Itinéraire</button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapPage;
