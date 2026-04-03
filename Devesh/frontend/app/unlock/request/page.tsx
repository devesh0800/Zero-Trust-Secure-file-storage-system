'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { requestUnlock, ApiError } from '@/lib/api';
import BackgroundAnimation from '../../components/BackgroundAnimation';
import Navbar from '../../components/Navbar';

export default function UnlockRequestPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            await requestUnlock(email);
            setSuccess('Recovery email sent. Please check your inbox.');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to request an unlock link. Please try again later.');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="relative min-h-screen bg-[#07070b] font-['Outfit'] overflow-hidden text-[#f0f0fa]">
            <BackgroundAnimation />
            
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
                <div className="w-full max-w-[420px] animate-fade-in">
                    {/* Header Area */}
                    <div className="mb-10 text-center">
                        <div className="group relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] shadow-[0_10px_30px_rgba(124,58,237,0.3)] transition-all duration-500 hover:scale-110 hover:-rotate-6">
                            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
                            <svg className="relative h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Account <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Recovery</span></h1>
                        <p className="text-[0.92rem] text-zinc-500 leading-relaxed font-medium">
                            Authorized access only. Enter your encrypted identity to receive a magic recovery link.
                        </p>
                    </div>

                    {/* Glassmorphic Form Container */}
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0c0c14]/60 p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)]">
                        <div className="absolute -top-24 -right-24 h-48 w-48 bg-violet-500/10 blur-[60px]" />
                        <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-indigo-500/10 blur-[60px]" />

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[0.8rem] font-bold text-zinc-400 uppercase tracking-widest ml-1">Secure Email</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@securevault.io"
                                        required
                                        className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-300 focus:border-violet-500/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-violet-500/10"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Status Notifications */}
                            {error && (
                                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3.5 text-xs font-bold text-rose-400 flex items-center gap-3 animate-shake">
                                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-rose-500/20 text-rose-500 flex-shrink-0">!</div>
                                    {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 text-xs font-bold text-emerald-400 flex items-center gap-3">
                                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 flex-shrink-0">✓</div>
                                    {success}
                                </div>
                            )}


                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:scale-105 transition-transform duration-500" />
                                <div className="relative flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold text-white transition-all shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]">
                                    {isLoading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                    ) : 'Send Recovery Link'}
                                </div>
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <Link href="/login" className="text-xs font-bold text-zinc-500 transition-all hover:text-violet-400 flex items-center justify-center gap-2 group">
                                <svg className="w-4 h-4 translate-x-0 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Protocol Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}

