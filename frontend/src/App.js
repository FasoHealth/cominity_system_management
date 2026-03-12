// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Citizen pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IncidentFeedPage from './pages/IncidentFeedPage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import MyIncidentsPage from './pages/MyIncidentsPage';
import NotificationsPage from './pages/NotificationsPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import SupportAppealPage from './pages/SupportAppealPage';
import EditIncidentPage from './pages/EditIncidentPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAppealsPage from './pages/admin/AdminAppealsPage';

import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isLoggedIn, isAdmin } = useAuth();
    if (loading) return <div className="page-loader"><div className="spinner" /><p>Chargement...</p></div>;
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (adminOnly && !isAdmin) return <Navigate to="/feed" replace />;
    return children;
};

const AppRoutes = () => (
    <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/support-appeal" element={<SupportAppealPage />} />
        <Route path="/" element={<Navigate to="/feed" replace />} />

        {/* Protected (sidebar layout) */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="feed" element={<IncidentFeedPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="report" element={<ReportIncidentPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />
            <Route path="incidents/edit/:id" element={<EditIncidentPage />} />
            <Route path="my-incidents" element={<MyIncidentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Admin routes */}
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="admin/incidents" element={<ProtectedRoute adminOnly><AdminIncidentsPage /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
            <Route path="admin/appeals" element={<ProtectedRoute adminOnly><AdminAppealsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
);

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
