// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { to: '/feed', icon: '📰', label: "Fil d'actualité" },
    { to: '/dashboard', icon: '📊', label: 'Tableau de bord' },
    { to: '/map', icon: '🗺️', label: 'Carte des alertes' },
    { to: '/my-incidents', icon: '📂', label: 'Mes signalements' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/profile', icon: '👤', label: 'Mon profil' },
];

const ADMIN_ITEMS = [
    { to: '/admin', icon: '🛡️', label: "Vue d'ensemble", end: true },
    { to: '/admin/incidents', icon: '📋', label: 'Modération' },
    { to: '/admin/guides', icon: '📖', label: 'Guides' },
    { to: '/admin/users', icon: '👥', label: 'Utilisateurs' },
];

const Layout = () => {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const NavItem = ({ to, icon, label, end = false }) => (
        <NavLink
            to={to} end={end}
            title={collapsed ? label : ''}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
            <span className="sidebar-link-icon">{icon}</span>
            {!collapsed && <span className="sidebar-link-text">{label}</span>}
        </NavLink>
    );

    return (
        <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚡</div>
                    {!collapsed && (
                        <div className="sidebar-logo-text">
                            Flash<br /><span>Alerte</span>
                        </div>
                    )}
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                        title={collapsed ? 'Étendre' : 'Réduire'}
                    >
                        {collapsed ? '▶' : '◀'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">{collapsed ? '·' : 'Menu Principal'}</div>
                    {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}

                    {isAdmin && (
                        <>
                            <div className="sidebar-section-title" style={{ marginTop: 8 }}>
                                {collapsed ? '·' : 'Administration'}
                            </div>
                            {ADMIN_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
                        </>
                    )}

                    <div className="sidebar-section-title" style={{ marginTop: 8 }}>
                        {collapsed ? '·' : 'Préférences'}
                    </div>
                    <button
                        className="sidebar-link"
                        onClick={toggleTheme}
                        title={collapsed ? (theme === 'light' ? 'Mode sombre' : 'Mode clair') : ''}
                        style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    >
                        <span className="sidebar-link-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                        {!collapsed && <span className="sidebar-link-text">{theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}</span>}
                    </button>

                    <button
                        className="sidebar-link"
                        onClick={handleLogout}
                        title={collapsed ? 'Déconnexion' : ''}
                        style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'rgba(255,100,100,0.7)' }}
                    >
                        <span className="sidebar-link-icon">🚪</span>
                        {!collapsed && <span className="sidebar-link-text">Déconnexion</span>}
                    </button>
                </nav>

                {/* CTA Button */}
                {!collapsed && (
                    <div style={{ padding: '0 8px 8px' }}>
                        <Link to="/report" className="sidebar-report-btn">
                            <span>⚡</span> Signaler un incident
                        </Link>
                    </div>
                )}

                {/* User Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">{user?.name}</div>
                                <div className="sidebar-user-role">
                                    {user?.role === 'admin' ? '🛡️ Administrateur' : '👤 Citoyen'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
