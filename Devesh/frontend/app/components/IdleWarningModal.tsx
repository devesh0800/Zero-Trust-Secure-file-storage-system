
'use client';

import { useEffect, useState } from 'react';

interface IdleWarningModalProps {
    isOpen: boolean;
    timeLeft: number; // seconds
    onStayLoggedIn: () => void;
    onLogout: () => void;
}

export default function IdleWarningModal({ isOpen, timeLeft, onStayLoggedIn, onLogout }: IdleWarningModalProps) {
    if (!isOpen) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = (timeLeft / 120) * 100; // Assuming 120s (2m) base

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-[#0c0c0e] shadow-[0_0_100px_rgba(59,130,246,0.1)] p-10 relative">
                {/* Background Decor */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Warning Icon */}
                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 border border-zinc-800 text-orange-500 shadow-2xl">
                        <svg className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">User Inactive</h2>
                    <p className="text-zinc-500 text-sm font-medium mb-10 px-4">Your session is about to expire due to inactivity. Move your mouse or press any key to stay connected.</p>

                    {/* Countdown Clock */}
                    <div className="relative mb-10 w-full group">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Auto-Logout In</span>
                            <span className={`font-mono text-3xl font-black tabular-nums transition-colors ${timeLeft < 30 ? 'text-rose-500 animate-pulse' : 'text-blue-400'}`}>
                                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div 
                                className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft < 30 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`} 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col w-full gap-4">
                        <button 
                            onClick={onStayLoggedIn}
                            className="group relative overflow-hidden rounded-2xl bg-white px-8 py-4 text-xs font-black text-black hover:bg-zinc-200 transition-all active:scale-95"
                        >
                            <span className="uppercase tracking-widest">Keep Working</span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                        
                        <button 
                            onClick={onLogout}
                            className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-rose-400 transition-colors py-2"
                        >
                            Logout Securely Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
