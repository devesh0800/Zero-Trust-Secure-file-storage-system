'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import * as api from './api';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    is_active: boolean;
    mfa_enabled: boolean;
    is_restricted?: boolean;
    phone_number?: string;
    gender?: string;
    dob?: string;
    profile_pic?: string;
    unique_share_id?: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sessionMessage: { type: 'error' | 'info'; text: string } | null;
    login: (identifier: string, password: string, captchaId: string, captchaText: string) => Promise<any>;
    verifyMfa: (tempToken: string, mfaToken: string) => Promise<any>;
    verifyLoginOtp: (tempToken: string, emailOtp: string, phoneOtp?: string, newDevice?: boolean) => Promise<any>;
    register: (email: string, password: string, username: string, captchaId: string, captchaText: string, otpCode: string) => Promise<any>;
    getCaptcha: () => Promise<any>;
    logout: (reason?: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    clearMessage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionMessage, setSessionMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/';

    const clearMessage = () => setSessionMessage(null);

    const logoutFn = useCallback(async (reason?: string) => {
        try {
            await api.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        setUser(null);
        api.setAccessToken(null);

        if (reason) {
            setSessionMessage({ type: 'error', text: reason });
        }

        if (!isPublicPage) {
            router.push('/login');
        }
    }, [isPublicPage, router]);

    const refreshUser = useCallback(async () => {
        try {
            const userData = await api.getMe();
            setUser(userData);
        } catch (error: any) {
            setUser(null);
            api.setAccessToken(null);
            // If we're on a private page and getMe fails, it means session is gone
            if (!isPublicPage && error.status === 401) {
                logoutFn("Your session has expired or was revoked.");
            }
        }
    }, [isPublicPage, logoutFn]);

    // 1. Idle Timeout (10 minutes)
    useIdleTimeout({
        onIdle: () => {
            if (user && !isPublicPage) {
                logoutFn("Logged out due to inactivity (10 minutes).");
            }
        },
        timeoutInMinutes: 10
    });

    // 2. Heartbeat (Check session status every 30 seconds)
    useEffect(() => {
        if (!user || isPublicPage) return;

        const interval = setInterval(() => {
            refreshUser();
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [user, isPublicPage, refreshUser]);

    // Check auth on mount
    useEffect(() => {
        const init = async () => {
            const token = api.getAccessToken();
            if (token) {
                await refreshUser();
            }
            setIsLoading(false);
        };
        init();
    }, [refreshUser]);

    const loginFn = async (identifier: string, password: string, captchaId: string, captchaText: string) => {
        clearMessage();
        const result = await api.login(identifier, password, captchaId, captchaText);
        if (result && (result.mfa_required || result.otp_required)) {
            return result;
        }
        await refreshUser();
        return result;
    };

    const verifyLoginOtpFn = async (tempToken: string, emailOtp: string, phoneOtp?: string, newDevice?: boolean) => {
        const result = await api.verifyLoginOtp(tempToken, emailOtp, phoneOtp, newDevice);
        if (result && !result.mfa_required) {
            await refreshUser();
        }
        return result;
    };

    const verifyMfaFn = async (tempToken: string, mfaToken: string) => {
        const result = await api.verifyMfa(tempToken, mfaToken);
        await refreshUser();
        return result;
    };

    const registerFn = async (email: string, password: string, username: string, captchaId: string, captchaText: string, otpCode: string) => {
        clearMessage();
        const result = await api.register(email, password, username, captchaId, captchaText, otpCode);
        await refreshUser();
        return result;
    };

    const getCaptchaFn = async () => {
        return await api.getCaptcha();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                sessionMessage,
                login: loginFn,
                verifyMfa: verifyMfaFn,
                verifyLoginOtp: verifyLoginOtpFn,
                register: registerFn,
                getCaptcha: getCaptchaFn,
                logout: logoutFn,
                refreshUser,
                clearMessage
            }}
        >
            {children}
            {sessionMessage && (
                <div className="fixed bottom-4 right-4 z-[9999] animate-in overflow-hidden rounded-xl border border-red-500/20 bg-[#12121e]/95 p-4 shadow-2xl backdrop-blur-md max-w-sm">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Security Alert</p>
                            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{sessionMessage.text}</p>
                        </div>
                        <button
                            onClick={clearMessage}
                            className="shrink-0 text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-red-500/40 w-full rounded-full" />
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
