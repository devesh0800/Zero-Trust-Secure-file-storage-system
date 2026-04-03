'use client';

import { useAuth } from '@/lib/auth-context';
import { getSessions, logoutAll, logout as apiLogout } from '@/lib/api';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MfaModal from './MfaModal';
import SecurityModal from './SecurityModal';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMfaOpen, setIsMfaOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownMounted, setDropdownMounted] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutAllDevices, setLogoutAllDevices] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isDropdownOpen) {
            requestAnimationFrame(() => setDropdownMounted(true));
        } else {
            setDropdownMounted(false);
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isDropdownOpen]);

    const openLogoutModal = () => {
        setIsDropdownOpen(false);
        setLogoutAllDevices(false);
        setShowLogoutModal(true);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setShowLogoutModal(false);
        try {
            if (logoutAllDevices) {
                await logoutAll();
            } else {
                await apiLogout();
            }
            await logout();
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            setIsLoggingOut(false);
        }
    };

    if (!isAuthenticated) return null;

    const initials = user?.full_name?.[0] || user?.username?.[0] || 'U';

    const menuItems = [
        { href: '/profile?tab=personal', label: 'Personal Details' },
        { href: '/profile?tab=storage', label: 'Storage Info' },
        { href: '/profile?tab=sessions', label: 'Connections' },
        { href: '/files/shared', label: 'Shared Files' },
        { href: '/profile?tab=activity', label: 'Activity Log' },
        { href: '#', label: 'Security', onClick: () => { setIsSecurityOpen(true); setIsDropdownOpen(false); } },
        { href: '/help', label: 'Help Center' },
    ];

    return (
        <>
            <div className="fixed left-1/2 -translate-x-1/2 top-4 z-[100] w-[95%] max-w-6xl animate-in fade-in slide-in-from-top-4 duration-1000">
                <nav className="relative flex h-[68px] items-center justify-between rounded-[2rem] border border-white/[0.08] bg-[#0c0c14]/80 px-8 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                    {/* Ambient Glow */}
                    <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-violet-600/10 blur-[50px] pointer-events-none" />

                    {/* Logo Section */}
                    <Link href="/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-violet-500 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 3.89 2.36 7.22 5.737 8.615a10.75 10.75 0 004.263 0c3.377-1.395 5.737-4.725 5.737-8.615 0-1.353-.223-2.653-.636-3.874a11.946 11.946 0 01-4.585-4.417 11.883 11.883 0 01-3.016 0z" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-lg font-black tracking-tight text-white">SecureVault</span>
                    </Link>

                    {/* Navigation - Icons + Center */}
                    <div className="hidden items-center gap-10 lg:flex">
                        <Link href="/dashboard" className={`group flex items-center gap-2.5 text-[13px] font-bold transition-all duration-300 ${pathname === '/dashboard' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <svg className={`h-[18px] w-[18px] ${pathname === '/dashboard' ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            Dashboard
                        </Link>

                        <Link href="/shared-files" className={`group flex items-center gap-2.5 text-[13px] font-bold transition-all duration-300 ${pathname === '/shared-files' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <svg className={`h-[18px] w-[18px] ${pathname === '/shared-files' ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                            Shared
                        </Link>

                        <Link href="/connections" className={`group flex items-center gap-2.5 text-[13px] font-bold transition-all duration-300 ${pathname === '/connections' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <svg className={`h-[18px] w-[18px] ${pathname === '/connections' ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            Network
                        </Link>
                    </div>

                    {/* Actions & Profile Pill */}
                    <div className="flex items-center gap-3">
                        <NotificationDropdown />

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`group flex items-center h-11 pr-5 pl-1 rounded-full border transition-all duration-300 ${isDropdownOpen ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                            >
                                <div className="relative">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 border border-white/10 shadow-lg">
                                        <img src={user?.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.username} alt={user?.username} className="h-full w-full rounded-full object-cover p-1" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0c0c14] bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="ml-3 text-left">
                                    <p className="text-[12px] font-black text-white leading-none uppercase tracking-tight">{user?.username.slice(0, 10)}...</p>
                                    <p className="mt-1 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Profile</p>
                                </div>
                                <svg className="ml-4 h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-all transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className={`absolute right-0 mt-4 w-80 origin-top-right overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0d0d16]/98 shadow-[0_40px_80px_rgba(0,0,0,0.7)] backdrop-blur-3xl transition-all duration-300 ${dropdownMounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2'}`}>
                                    {/* Header */}
                                    <div className="p-5 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.06]">
                                                <img src={user?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="h-full w-full object-cover" alt="U" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="truncate text-sm font-black text-white uppercase tracking-wide">{user?.username}</h3>
                                                <p className="truncate text-[11px] text-zinc-500 mt-0.5">{user?.email}</p>
                                                <div className="mt-2 flex gap-2">
                                                    <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                        MFA Active
                                                    </span>
                                                    <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[8px] font-bold text-violet-400 uppercase tracking-wider">
                                                        Free
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu */}
                                    <div className="px-3 pb-1">
                                        {/* Personal Details - Person icon */}
                                        <Link href="/profile?tab=personal" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Personal Details</span>
                                        </Link>

                                        {/* Storage Info - Cog/settings icon */}
                                        <Link href="/profile?tab=storage" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Storage Info</span>
                                        </Link>

                                        {/* Connections - Users icon */}
                                        <Link href="/profile?tab=sessions" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Connections</span>
                                        </Link>

                                        {/* Shared Files - Download icon */}
                                        <Link href="/shared-files" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Shared Files</span>
                                        </Link>

                                        {/* Activity Log - Clipboard icon */}
                                        <Link href="/profile?tab=activity" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Activity Log</span>
                                        </Link>

                                        {/* Security - Broadcast/signal icon */}
                                        <Link href="/profile?tab=security" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Security</span>
                                        </Link>

                                        {/* Help Center - Lightbulb icon */}
                                        <Link href="/help" onClick={() => setIsDropdownOpen(false)} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-all">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.858 1.591-2.17a6.75 6.75 0 10-7.682 0c.933.312 1.591 1.187 1.591 2.17V18" /></svg>
                                            </div>
                                            <span className="text-[13px] text-zinc-400 group-hover:text-white transition-colors">Help Center</span>
                                        </Link>
                                    </div>

                                    {/* Logout - Power icon */}
                                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.04]">
                                        <button onClick={openLogoutModal} disabled={isLoggingOut} className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-rose-500/[0.06] transition-all group">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/[0.08] text-rose-500">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                                            </div>
                                            <span className="text-[13px] text-rose-500">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </div>

            <MfaModal isOpen={isMfaOpen} onClose={() => setIsMfaOpen(false)} />
            <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />

            {/* Logout Dialog */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
                    
                    {/* Dialog */}
                    <div className="relative w-[420px] rounded-3xl border border-white/[0.08] bg-[#0d0d16] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10">
                                <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Sign Out</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">Choose how you want to sign out</p>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 mb-8">
                            {/* Only this device */}
                            <button
                                onClick={() => setLogoutAllDevices(false)}
                                className={`flex w-full items-center gap-4 rounded-2xl border p-4 transition-all ${
                                    !logoutAllDevices
                                        ? 'border-violet-500/50 bg-violet-500/10'
                                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                                }`}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                                    !logoutAllDevices ? 'border-violet-500' : 'border-zinc-600'
                                }`}>
                                    {!logoutAllDevices && <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Only this device</p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Sign out from this browser session only</p>
                                </div>
                            </button>

                            {/* All devices */}
                            <button
                                onClick={() => setLogoutAllDevices(true)}
                                className={`flex w-full items-center gap-4 rounded-2xl border p-4 transition-all ${
                                    logoutAllDevices
                                        ? 'border-rose-500/50 bg-rose-500/10'
                                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                                }`}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                                    logoutAllDevices ? 'border-rose-500' : 'border-zinc-600'
                                }`}>
                                    {logoutAllDevices && <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Logout from all devices</p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Sign out from every active session everywhere</p>
                                </div>
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all ${
                                    logoutAllDevices
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-violet-600 hover:bg-violet-700'
                                }`}
                            >
                                {isLoggingOut ? 'Signing out...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
