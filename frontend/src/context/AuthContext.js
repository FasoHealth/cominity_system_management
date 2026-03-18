// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── Configuration Axios globale ───────────────────────────────────────────────
// configuration axios globale — on utilise le proxy de package.json en développement
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('csa_token'));
    const [loading, setLoading] = useState(true);

    // ── Injecter le token JWT dans chaque requête axios ───────────────────────
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // ── Au chargement, récupérer le profil si un token existe ────────────────
    const fetchProfile = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        try {
            const { data } = await axios.get('/api/auth/me');
            if (data.success) setUser(data.user);
        } catch {
            // Token invalide ou expiré
            logout();
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // ── Connexion ─────────────────────────────────────────────────────────────
    const login = (userData, jwtToken) => {
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('csa_token', jwtToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    };

    // ── Déconnexion ───────────────────────────────────────────────────────────
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('csa_token');
        delete axios.defaults.headers.common['Authorization'];
    };

    // ── Mise à jour locale du profil sans refetch ─────────────────────────────
    const updateUser = (updatedData) => {
        setUser((prev) => ({ ...prev, ...updatedData }));
    };

    const isAdmin = user?.role === 'admin';
    const isCitizen = user?.role === 'citizen';
    const isLoggedIn = !!user && !!token;

    return (
        <AuthContext.Provider value={{ user, token, loading, isAdmin, isCitizen, isLoggedIn, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// ── Hook d'accès au contexte ──────────────────────────────────────────────────
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
    return ctx;
};

export default AuthContext;
