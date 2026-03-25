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
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 transition-all hover:bg-white/10 focus:ring-2 focus:ring-violet-500/20"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white uppercase shadow-lg shadow-violet-500/20">
                                {user?.username?.substring(0, 2) || user?.full_name?.substring(0, 2) || 'U'}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="text-xs font-semibold text-white leading-none">{user?.username || user?.full_name}</p>
                                <p className="mt-1 text-[10px] text-zinc-500 leading-none">ID: {user?.id.substring(0, 8)}...</p>
                            </div>
                            <svg className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                                <div className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f17] shadow-2xl shadow-black/50 ring-1 ring-black ring-opacity-5 z-20 backdrop-blur-xl">
                                    <div className="px-3 py-3 border-b border-white/5">
                                        <p className="text-xs font-medium text-zinc-400">Account</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-white">{user?.email}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button
                                            onClick={() => {
                                                setIsSecurityOpen(true);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-violet-500/10 hover:text-violet-400"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                            Security
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsMfaOpen(true);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-emerald-500/10 hover:text-emerald-400"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                            MFA Setup
                                        </button>

                                        <Link
                                            href="/dashboard?view=files"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-indigo-500/10 hover:text-indigo-400"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.625-1.815a9.75 9.75 0 01-4.5 0M12 5.25v.75m-4.125 1.485a9.75 9.75 0 014.125 0m0 0a9.75 9.75 0 014.125 0M12 5.25V4.5m4.125 1.485a9.75 9.75 0 014.125 0" />
                                            </svg>
                                            Files
                                        </Link>

                                        <Link
                                            href="/help"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-orange-500/10 hover:text-orange-400"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                            </svg>
                                            Help
                                        </Link>
                                    </div>
                                    <div className="p-1.5 border-t border-white/5">
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                            </svg>
                                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                                        </button>
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
