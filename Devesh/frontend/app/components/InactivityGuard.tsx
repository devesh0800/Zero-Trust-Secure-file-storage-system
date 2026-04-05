'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

/**
 * 🛠️ Ultra-Premium InactivityGuard (Compact Version)
 * Implements High-Security Proof-of-Presence logic.
 * 3 Minutes Idle -> Warning Modal (2 Minute Countdown) -> Auto-Logout
 * Cursor movement is ignored during the warning phase.
 */
export default function InactivityGuard() {
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(120); // 2 Minutes
    
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

    const IDLE_TIME = 3 * 60 * 1000; // 3 Minutes
    const WARNING_TIME = 120; // 120 Seconds (2 Mins)

    const handleForceLogout = useCallback(async () => {
        await api.logout();
        logout();
        router.push('/login');
    }, [logout, router]);

    const resetIdleTimer = useCallback(() => {
        if (showWarning) return; // Don't reset if warning is already visible

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        
        idleTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(WARNING_TIME);
        }, IDLE_TIME);
    }, [showWarning, IDLE_TIME]);

    const handleStayActive = () => {
        setShowWarning(false);
        setCountdown(WARNING_TIME);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        resetIdleTimer();
    };

    useEffect(() => {
        if (!isAuthenticated) {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            return;
        }

        // Monitoring events for idle phase (Phase 1)
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => window.addEventListener(event, resetIdleTimer));
        resetIdleTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [isAuthenticated, resetIdleTimer]);

    useEffect(() => {
        if (showWarning && isAuthenticated) {
            countdownTimerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                        handleForceLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, [showWarning, isAuthenticated, handleForceLogout]);

    if (!showWarning || !isAuthenticated) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050508]/95 backdrop-blur-[40px] transition-all duration-1000 ease-out">
            {/* 🌌 Animated Security Matrix Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="fp-1" /><div className="fp-2" /><div className="fp-3" /><div className="fp-4" />
                <div className="fp-5" /><div className="fp-6" /><div className="fp-7" /><div className="fp-8" />
                <div className="absolute inset-0 bg-[#8b5cf6]/5 mix-blend-overlay animate-pulse" />
            </div>

            {/* 🛡️ Main Security Container with Rotating Border */}
            <div className="relative w-full max-w-[380px] p-[1.5px] rounded-[2.5rem] rotating-border stagger-1 overflow-hidden scale-100 group shadow-[0_0_80px_rgba(244,63,94,0.1)]">
                <div className="relative overflow-hidden rounded-[2.4rem] bg-[#0c0c10]/95 p-8 glass-card">
                    
                    {/* 🕵️‍♂️ Vertical Surveillance Scanner */}
                    <div className="scan-line" style={{ background: 'linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.4), transparent)', height: '2px' }} />

                    <div className="relative z-10 text-center">
                        {/* 🔒 Pulsing Shield Logo */}
                        <div className="mx-auto w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[1.8rem] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(244,63,94,0.1)] shield-logo stagger-2">
                            <div className="absolute inset-0 bg-rose-500/5 rounded-[1.8rem] animate-ping" />
                            <svg className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.27 0 2.091-1.42 1.436-2.522L13.436 4.304c-.655-1.122-2.274-1.122-2.93 0L3.064 16.478c-.655 1.102.166 2.522 1.436 2.522z" />
                            </svg>
                        </div>

                        {/* 📝 Security Metadata */}
                        <div className="space-y-3 mb-10">
                            <div className="flex items-center justify-center gap-2 stagger-3">
                                <div className="h-[1px] w-6 bg-rose-500/30" />
                                <h2 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em]">Protocol Active</h2>
                                <div className="h-[1px] w-6 bg-rose-500/30" />
                            </div>
                            <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter text-shimmer stagger-4">
                                SESSION EXPIRING
                            </h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] leading-relaxed stagger-5">
                                Automated node purge in:
                            </p>
                        </div>

                        {/* ⏳ High-Tech Countdown Orb */}
                        <div className="relative h-36 w-36 mx-auto mb-10 flex items-center justify-center stagger-6">
                            <div className="absolute inset-0 border border-white/[0.03] rounded-full scale-115 animate-security-wave" />
                            <div className="absolute inset-3 border border-rose-500/5 rounded-full animate-spin-slow" />
                            
                            <svg className="absolute inset-0 h-full w-full -rotate-90">
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="68"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.02)"
                                    strokeWidth="5"
                                />
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="68"
                                    fill="transparent"
                                    stroke="url(#roseGradient)"
                                    strokeWidth="3.5"
                                    strokeDasharray={427}
                                    strokeDashoffset={427 - (427 * countdown / 120)}
                                    className="transition-all duration-1000 ease-linear drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#f43f5e" />
                                        <stop offset="100%" stopColor="#881337" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                                {formatTime(countdown)}
                            </span>
                        </div>

                        {/* ⚡ Action Controls */}
                        <div className="space-y-6 stagger-7">
                            <button
                                onClick={handleStayActive}
                                className="w-full h-14 rounded-[1.2rem] bg-white text-black text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:bg-zinc-200 active:scale-[0.96] shadow-[0_15px_30px_rgba(0,0,0,0.4)] btn-premium group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    I'M ACTIVE — RESUME
                                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-black stroke-[3px] group-hover:translate-x-1 transition-transform">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </button>
                            
                            <div className="flex flex-col gap-1 stagger-8">
                                <p className="text-[7px] text-zinc-700 font-bold uppercase tracking-[0.3em]">
                                    SECUREVAULT DISTRIBUTED IDENTITY
                                </p>
                                <div className="neon-line opacity-20 px-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .animate-spin-slow {
                    animation: spin 12s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rotating-border {
                    --angle: 0deg;
                    background-image: conic-gradient(from var(--angle), #f43f5e, #18181b, #f43f5e);
                    animation: border-rotate 4s linear infinite;
                }
                @keyframes border-rotate {
                    to { --angle: 360deg; }
                }
                .text-shimmer {
                    background: linear-gradient(90deg, #fff, #f43f5e, #fff);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
                @keyframes shimmer {
                    to { background-position: 200% center; }
                }
            `}</style>
        </div>
    );
}
