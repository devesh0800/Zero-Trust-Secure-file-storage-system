import { useAuth } from '@/lib/auth-context';
import { getSessions, logoutAll } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import MfaModal from './MfaModal';
import SecurityModal from './SecurityModal';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMfaOpen, setIsMfaOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const sessions = await getSessions();
            if (sessions && sessions.length > 1) {
                const wantLogoutAll = window.confirm("You have multiple active sessions.\nDo you want to logout from ALL sessions?\n\nClick 'OK' to logout from all devices.\nClick 'Cancel' to logout from this session only.");
                if (wantLogoutAll) {
                    await logoutAll();
                    window.location.href = '/login';
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to pre-fetch sessions on logout:', error);
        }

        await logout();
        window.location.href = '/login';
    };

    if (!isAuthenticated) return null;

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-white">SecureVault</span>
                    </Link>

                    {/* Actions Area */}
                    <div className="flex items-center gap-3">
                        <NotificationDropdown />
                        
                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 rounded-full border border-white/5 bg-white/5 p-1 transition-all hover:bg-white/10 active:scale-95 pr-4"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-black text-white uppercase shadow-lg shadow-blue-500/20 overflow-hidden border border-white/5">
                                    {user?.profile_pic ? (
                                        <img src={user.profile_pic} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        user?.full_name?.[0] || user?.username?.[0] || 'U'
                                    )}
                                </div>
                                <div className="hidden text-left sm:block">
                                    <p className="text-[11px] font-black text-white tracking-tight leading-none uppercase">{user?.full_name || user?.username}</p>
                                    <p className="mt-1 text-[8px] font-bold text-zinc-500 tracking-widest leading-none uppercase">Profile</p>
                                </div>
                                <svg className={`h-3 w-3 text-zinc-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : 'text-white'}`} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] shadow-2xl shadow-black z-20 backdrop-blur-2xl">
                                    {/* Mini Profile Header */}
                                    <div className="bg-gradient-to-br from-violet-500/10 to-indigo-600/10 p-5 border-b border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white uppercase shadow-lg shadow-violet-500/30 overflow-hidden border border-white/10">
                                                {user?.profile_pic ? (
                                                    <img src={user.profile_pic} alt="Profile" className="h-full w-full object-cover" />
                                                ) : (
                                                    user?.username?.[0] || user?.full_name?.[0] || 'U'
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="truncate text-sm font-bold text-white">{user?.full_name || user?.username}</p>
                                                <p className="truncate text-[10px] text-zinc-500">{user?.email}</p>
                                                <div className="mt-1 flex gap-1.5">
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase transition-all ${user?.mfa_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        MFA {user?.mfa_enabled ? 'ON' : 'OFF'}
                                                    </span>
                                                    <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-blue-400">
                                                        {user?.role === 'admin' ? 'Pro' : 'Free'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation Grid/List */}
                                    <div className="p-2">
                                        <div className="grid grid-cols-1 gap-1">
                                            <Link
                                                href="/profile?tab=personal"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-violet-500 transition-all group-hover:scale-125" />
                                                Personal Details
                                            </Link>

                                            <Link
                                                href="/profile?tab=storage"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-blue-500 transition-all group-hover:scale-125" />
                                                Storage info
                                            </Link>

                                            <Link
                                                href="/connections"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-cyan-500 transition-all group-hover:scale-125" />
                                                Connections
                                            </Link>

                                            <Link
                                                href="/shared-files"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 transition-all group-hover:scale-125" />
                                                Shared Files
                                            </Link>

                                            <Link
                                                href="/profile?tab=activity"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-indigo-500 transition-all group-hover:scale-125" />
                                                Activity
                                            </Link>

                                            <Link
                                                href="/profile?tab=security"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 transition-all group-hover:scale-125" />
                                                Security info
                                            </Link>

                                            <div className="my-1 h-px bg-white/5 mx-4" />

                                            <Link
                                                href="/help"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                                            >
                                                <svg className="h-4 w-4 text-zinc-500 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                                </svg>
                                                Help Center
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="group mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-400/80 transition-all hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                                </svg>
                                                {isLoggingOut ? 'Signing out...' : 'Logout account'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <MfaModal
                isOpen={isMfaOpen}
                onClose={() => setIsMfaOpen(false)}
            />

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
            />
        </>
    );
}
