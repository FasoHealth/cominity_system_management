// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon, label, badge = null, end = false }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isSidebarCollapsed ? label : ''}
        >
            <span className="sidebar-link-icon">{icon}</span>
            {!isSidebarCollapsed && <span className="sidebar-link-text">{label}</span>}
            {badge && !isSidebarCollapsed && <span className="sidebar-link-badge">{badge}</span>}
        </NavLink>
    );

    return (
        <div className="app-layout">
            {/* ── Sidebar ───────────────────────────────────────────────────────── */}
            <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🛡️</div>
                    {!isSidebarCollapsed && (
                        <div className="sidebar-logo-text">
                            Community<br />
                            <span className="auth-logo-sub">Security Alert</span>
                        </div>
                    )}
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        aria-label="Toggle Sidebar"
                    >
                        {isSidebarCollapsed ? '▶' : '◀'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">{!isSidebarCollapsed ? 'Menu Principal' : '...'}</div>
                    <NavItem to="/feed" icon="📰" label="Fil d'actualité" />
                    <NavItem to="/dashboard" icon="📊" label="Tableau de bord" />
                    <NavItem to="/map" icon="🗺️" label="Carte des alertes" />
                    <NavItem to="/report" icon="➕" label="Signaler un incident" />
                    <NavItem to="/my-incidents" icon="📂" label="Mes signalements" />
                    <NavItem to="/notifications" icon="🔔" label="Notifications" />

                    {isAdmin && (
                        <>
                            <div className="sidebar-section-title">{!isSidebarCollapsed ? 'Administration' : '...'}</div>
                            <NavItem to="/admin" icon="🛡️" label="Vue d'ensemble" end />
                            <NavItem to="/admin/incidents" icon="📋" label="Modération" />
                            <NavItem to="/admin/users" icon="👥" label="Utilisateurs" />
                        </>
                    )}

                    <div className="sidebar-section-title">{!isSidebarCollapsed ? 'Préférences' : '...'}</div>
                    <button className="sidebar-link theme-toggle-btn" onClick={toggleTheme} style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                        <span className="sidebar-link-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                        {!isSidebarCollapsed && <span className="sidebar-link-text">{theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}</span>}
                    </button>

                    <div className="sidebar-section-title">{!isSidebarCollapsed ? 'Compte' : '...'}</div>
                    <button className="sidebar-link logout-btn" onClick={handleLogout} style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                        <span className="sidebar-link-icon">🚪</span>
                        {!isSidebarCollapsed && <span className="sidebar-link-text">Déconnexion</span>}
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">{user?.name}</div>
                                <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrateur' : 'Citoyen'}</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────────────────────────── */}
            <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
