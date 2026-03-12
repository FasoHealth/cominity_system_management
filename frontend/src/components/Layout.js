// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
    Newspaper, 
    LayoutDashboard, 
    Map as MapIcon, 
    Folder, 
    Bell, 
    User, 
    Shield, 
    ClipboardList, 
    UserCheck, 
    BookOpen, 
    Users, 
    Zap, 
    ChevronLeft, 
    ChevronRight,
    Moon,
    Sun,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const NAV_ITEMS = [
    { to: '/feed', icon: <Newspaper size={20} />, label: "Fil d'actualité" },
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { to: '/map', icon: <MapIcon size={20} />, label: 'Carte des alertes' },
    { to: '/my-incidents', icon: <Folder size={20} />, label: 'Mes signalements' },
    { to: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { to: '/profile', icon: <User size={20} />, label: 'Mon profil' },
];

const ADMIN_ITEMS = [
    { to: '/admin', icon: <Shield size={20} />, label: "Vue d'ensemble", end: true },
    { to: '/admin/incidents', icon: <ClipboardList size={20} />, label: 'Modération' },
    { to: '/admin/appeals', icon: <UserCheck size={20} />, label: 'Recours Compte' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'Utilisateurs' },
];

const Layout = () => {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const navigate = useNavigate();

    // Fetch unread notifications
    React.useEffect(() => {
        const fetchUnread = async () => {
            try {
                if (user) {
                    const { data } = await axios.get('/api/notifications');
                    if (data.success) {
                        setUnreadNotifs(data.unreadCount || 0);
                    }
                }
            } catch (err) {
                console.error('Erreur unread count:', err);
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const NavItem = ({ to, icon, label, end = false }) => (
        <NavLink
            to={to} end={end}
            title={collapsed ? label : ''}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
            <span className="sidebar-link-icon">
                {icon}
                {to === '/notifications' && unreadNotifs > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 8,
                        height: 8,
                        background: 'var(--brand-orange)',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-primary)'
                    }} />
                )}
            </span>
            {!collapsed && (
                <span className="sidebar-link-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    {label}
                    {to === '/notifications' && unreadNotifs > 0 && !collapsed && (
                        <span className="badge badge-error" style={{ fontSize: '0.65rem', padding: '1px 6px', height: 'auto', background: 'var(--brand-orange)', border: 'none' }}>
                            {unreadNotifs}
                        </span>
                    )}
                </span>
            )}
        </NavLink>
    );

    return (
        <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Zap size={22} fill="var(--brand-orange)" color="var(--brand-orange)" />
                    </div>
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
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
                        <span className="sidebar-link-icon">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </span>
                        {!collapsed && <span className="sidebar-link-text">{theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}</span>}
                    </button>

                    <button
                        className="sidebar-link"
                        onClick={handleLogout}
                        title={collapsed ? 'Déconnexion' : ''}
                        style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'rgba(255,100,100,0.7)' }}
                    >
                        <span className="sidebar-link-icon"><LogOut size={20} /></span>
                        {!collapsed && <span className="sidebar-link-text">Déconnexion</span>}
                    </button>
                </nav>

                {/* CTA Button */}
                {!collapsed && (
                    <div style={{ padding: '0 8px 8px' }}>
                        <Link to="/report" className="sidebar-report-btn">
                            <Zap size={18} fill="currentColor" /> <span>Signaler un incident</span>
                        </Link>
                    </div>
                )}

                {/* User Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.avatar ? (
                                <img src={`${process.env.REACT_APP_API_URL || ''}${user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">{user?.name}</div>
                                <div className="sidebar-user-role">
                                    {user?.role === 'admin' ? (
                                        <><Shield size={12} style={{ marginRight: 4 }} /> Admin</>
                                    ) : (
                                        <><User size={12} style={{ marginRight: 4 }} /> Citoyen</>
                                    )}
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
