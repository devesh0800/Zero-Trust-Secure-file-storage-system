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

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'security':
        case 'login':
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
            );
        case 'share':
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                </div>
            );
    }
}

export default function NotificationDropdown() {
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setMounted(true));
        } else {
            setMounted(false);
        }
    }, [isOpen]);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await api.getNotifications(1, 20);
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));
            await api.deleteNotification(id);
        } catch (error) {
            console.error('Failed to delete notification', error);
            loadNotifications(); // Reload on failure
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
        setIsLoading(false);
    };

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to clear all notifications?')) return;
        setIsLoading(true);
        try {
            await api.deleteAllNotifications();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
        setIsLoading(false);
    };

    const displayNotifications = activeFilter === 'unread' 
        ? notifications.filter(n => !n.is_read) 
        : notifications;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-300 ${
                    isOpen 
                        ? 'border-violet-500/30 bg-violet-500/5 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                        : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                }`}
            >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.4)] ring-2 ring-[#050508]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute right-0 mt-3 w-[360px] origin-top-right rounded-2xl border border-white/[0.08] bg-[#0c0c14]/98 shadow-[0_30px_90px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-3xl z-[100] overflow-hidden transition-all duration-300 ease-out ${
                    mounted 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 -translate-y-2 scale-[0.97]'
                }`}>
                    {/* Header */}
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-bold text-white tracking-tight">Notifications</h3>
                            <div className="flex items-center gap-3">
                                {displayNotifications.length > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider"
                                    >
                                        Mark All
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
                            <button 
                                onClick={() => setActiveFilter('all')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                All Alerts
                            </button>
                            <button 
                                onClick={() => setActiveFilter('unread')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative ${activeFilter === 'unread' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Unread
                                {unreadCount > 0 && activeFilter !== 'unread' && (
                                    <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="max-h-[420px] overflow-y-auto no-scrollbar pb-2">
                        {displayNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-violet-500/5 flex items-center justify-center mb-4 border border-violet-500/10">
                                    <svg className="w-8 h-8 text-violet-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                </div>
                                <p className="text-[13px] font-bold text-white mb-1">Clear Horizon!</p>
                                <p className="text-[11px] text-zinc-500 max-w-[200px]">No {activeFilter === 'unread' ? 'unread ' : ''}notifications detected in your secure vault.</p>
                            </div>
                        ) : (
                            <div className="space-y-1 px-2.5">
                                {displayNotifications.map((notification, i) => (
                                    <div 
                                        key={notification.id} 
                                        className={`group relative rounded-2xl p-3.5 transition-all duration-300 ${
                                            !notification.is_read 
                                                ? 'bg-violet-500/[0.04] border border-violet-500/10' 
                                                : 'hover:bg-white/[0.03] border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className={`text-[13.5px] leading-snug truncate ${
                                                        !notification.is_read ? 'font-bold text-white' : 'font-medium text-zinc-300'
                                                    }`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.is_read && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-2 font-medium">
                                                    {notification.message}
                                                </p>
                                                <span className="text-[10px] font-bold text-zinc-600 tracking-wider">
                                                    {timeAgo(notification.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* HOVER ACTIONS */}
                                        <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
                                                    title="Mark as read"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-zinc-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-white/5 hover:border-rose-500/30"
                                                title="Delete alert"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
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
