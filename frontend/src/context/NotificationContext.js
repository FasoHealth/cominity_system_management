/**
 * frontend/src/context/NotificationContext.js
 * Handles real-time notifications via SSE (Server-Sent Events)
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { isLoggedIn, user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastNotification, setLastNotification] = useState(null);

    // Fetch initial notifications
    const fetchNotifications = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const { data } = await axios.get('/api/notifications');
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('SSE: Fetching initial notifications failed', err);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // SSE Stream setup
    useEffect(() => {
        if (!isLoggedIn || !token) return;

        // Use relative URL as it's proxied in development or served from same origin in production
        const sseUrl = `/api/notifications/stream?token=${token}`;
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
                console.log('SSE: Connected to notification stream');
                return;
            }

            // Real notification received
            setNotifications(prev => [data, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            setLastNotification(data);

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(data.title, { body: data.message });
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE: Stream connection error', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [isLoggedIn, token]);

    const markAllAsRead = async () => {
        try {
            const { data } = await axios.patch('/api/notifications/read-all');
            if (data.success) {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const value = {
        notifications,
        unreadCount,
        lastNotification,
        refreshNotifications: fetchNotifications,
        markAllAsRead,
        setLastNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
