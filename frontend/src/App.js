// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IncidentFeedPage from './pages/IncidentFeedPage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import MyIncidentsPage from './pages/MyIncidentsPage';
import NotificationsPage from './pages/NotificationsPage';
import MapPage from './pages/MapPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

import { ThemeProvider } from './context/ThemeContext';

/**
 * Composant de route protégée (requiert d'être connecté)
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isLoggedIn, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Chargement de votre session...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/feed" replace />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Routes Publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/feed" replace />} />

            {/* Routes Protégées (Layout avec Sidebar) */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="feed" element={<IncidentFeedPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="report" element={<ReportIncidentPage />} />
                <Route path="incidents/:id" element={<IncidentDetailPage />} />
                <Route path="my-incidents" element={<MyIncidentsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Routes Admin */}
                <Route path="admin" element={
                    <ProtectedRoute adminOnly>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="admin/incidents" element={
                    <ProtectedRoute adminOnly>
                        <AdminIncidentsPage />
                    </ProtectedRoute>
                } />
                <Route path="admin/users" element={
                    <ProtectedRoute adminOnly>
                        <AdminUsersPage />
                    </ProtectedRoute>
                } />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;
