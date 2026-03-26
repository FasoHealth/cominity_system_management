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
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';
import { X, ExternalLink } from 'lucide-react';

const NAV_ITEMS = [
    { to: '/feed', icon: <Newspaper size={20} />, labelKey: 'nav.feed' },
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, labelKey: 'nav.dashboard' },
    { to: '/map', icon: <MapIcon size={20} />, labelKey: 'nav.map' },
    { to: '/my-incidents', icon: <Folder size={20} />, labelKey: 'nav.my_incidents' },
    { to: '/notifications', icon: <Bell size={20} />, labelKey: 'nav.notifications' },
    { to: '/profile', icon: <User size={20} />, labelKey: 'nav.profile' },
];

const ADMIN_ITEMS = [
    { to: '/admin', icon: <Shield size={20} />, labelKey: 'nav.admin.overview', end: true },
    { to: '/admin/incidents', icon: <ClipboardList size={20} />, labelKey: 'nav.admin.moderation' },
    { to: '/admin/appeals', icon: <UserCheck size={20} />, labelKey: 'nav.admin.appeals' },
    { to: '/admin/users', icon: <Users size={20} />, labelKey: 'nav.admin.users' },
];

const Layout = () => {
    const { t } = useTranslation();
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [collapsed, setCollapsed] = useState(false);
    const { unreadCount: unreadNotifs, lastNotification, setLastNotification } = useNotifications();
    const navigate = useNavigate();

    // Update user location for proximity alerts (500m)
    React.useEffect(() => {
        if (user && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    await axios.put('/api/auth/update-profile', {
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude] // [lng, lat] for MongoDB
                        }
                    });
                } catch (err) {
                    console.error('Failed to sync location:', err);
                }
            }, (err) => {
                console.warn('Geolocation permission denied or error:', err.message);
            });
        }
    }, [user?._id]); // Run when a user logs in

    const handleLogout = () => { logout(); navigate('/login'); };

    const NavItem = ({ to, icon, labelKey, end = false }) => {
        const { t } = useTranslation();
        const label = t(labelKey);
        return (
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
    };

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
                            CS<br /><span>Alert</span>
                        </div>

                    )}
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                        title={collapsed ? t('nav.expand') : t('nav.collapse')}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">{collapsed ? '·' : t('nav.main_menu')}</div>
                    {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}

                    {isAdmin && (
                        <>
                            <div className="sidebar-section-title" style={{ marginTop: 8 }}>
                                {collapsed ? '·' : t('nav.admin_section')}
                            </div>
                            {ADMIN_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
                        </>
                    )}


                    <div className="sidebar-section-title" style={{ marginTop: 8 }}>
                        {collapsed ? '·' : t('nav.actions')}
                    </div>

                    <button
                        className="sidebar-link"
                        onClick={handleLogout}
                        title={collapsed ? t('nav.logout') : ''}
                        style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'rgba(255,100,100,0.7)' }}
                    >
                        <span className="sidebar-link-icon"><LogOut size={20} /></span>
                        {!collapsed && <span className="sidebar-link-text">{t('nav.logout')}</span>}
                    </button>
                </nav>

                {/* CTA Button */}
                {!collapsed && (
                    <div style={{ padding: '0 8px 8px' }}>
                        <Link to="/report" className="sidebar-report-btn">
                            <Zap size={18} fill="currentColor" /> <span>{t('nav.report_incident')}</span>
                        </Link>
                    </div>
                )}

                {/* User Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.avatar ? (
                                <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">{user?.name}</div>
                                <div className="sidebar-user-role">
                                    {user?.role === 'admin' ? (
                                        <><Shield size={12} style={{ marginRight: 4 }} /> {t('auth.roles.admin')}</>
                                    ) : (
                                        <><User size={12} style={{ marginRight: 4 }} /> {t('auth.roles.citizen')}</>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>


            {/* ── Main Content ── */}
            <main className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
                <header className="main-header fade-in">
                    <div className="header-left">
                        {collapsed && (
                            <div className="sidebar-logo-icon" style={{ width: 32, height: 32 }}>
                                <Zap size={18} fill="var(--brand-orange)" color="var(--brand-orange)" />
                            </div>
                        )}
                    </div>
                    <div className="header-right">
                        <LanguageSwitcher />
                        <button
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            title={theme === 'light' ? t('nav.dark_mode') : t('nav.light_mode')}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>
                </header>
                <div className="page-content-wrapper">
                    <div className="fade-in-container slide-up">
                        <Outlet />
                    </div>
                </div>

                {/* Real-time Notification Toast */}
                {lastNotification && (
                    <div className="notification-toast slide-up">
                        <div className="toast-icon">
                            <Bell size={20} color="white" />
                        </div>
                        <div className="toast-content" onClick={() => {
                            if (lastNotification.incident) navigate(`/incidents/${lastNotification.incident}`);
                            setLastNotification(null);
                        }}>
                            <div className="toast-title">{lastNotification.title}</div>
                            <div className="toast-message">{lastNotification.message}</div>
                        </div>
                        <button className="toast-close" onClick={() => setLastNotification(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Layout;
