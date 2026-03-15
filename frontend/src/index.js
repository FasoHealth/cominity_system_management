// frontend/src/index.js — Point d'entrée React
import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './i18n';
import App from './App';

// Configuration Axios pour l'API
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://cominity-system-management.onrender.com' 
    : 'http://localhost:5000';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);
