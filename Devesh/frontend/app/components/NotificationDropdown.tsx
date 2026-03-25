'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await api.getNotifications(1, 10);
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
        setIsLoading(false);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f17] shadow-2xl shadow-black/50 ring-1 ring-black ring-opacity-5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={isLoading}
                                className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-zinc-500">
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`px-4 py-3 transition-colors ${!notification.is_read ? 'bg-violet-500/5' : 'hover:bg-white/[0.02]'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-white' : 'font-medium text-zinc-300'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-2 text-[10px] text-zinc-500 font-medium">
                                                    {new Date(notification.created_at).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                                    title="Mark as read"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
