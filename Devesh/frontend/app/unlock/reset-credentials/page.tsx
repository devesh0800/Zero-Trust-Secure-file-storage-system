'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetCredentials, ApiError } from '@/lib/api';

function ResetCredentialsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please complete the AI Verification flow first.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            await resetCredentials(token as string, password);
            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to reset credentials. The token might have expired.');
            }
        }
        setIsLoading(false);
    };

    if (!token && !error) {
        return <div className="min-h-screen bg-[#0a0a0f]" />;
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-600/8 blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-teal-600/8 blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Full Access Restoration</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Set a new secure password to fully unlock your account
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                    {success ? (
                        <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Account Fully Unlocked</h2>
                            <p className="text-sm text-zinc-400">Redirecting to your secure vault...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Confirm Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Retype password"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading || !!error && !password}
                                className="w-full mt-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        Securing Account...
                                    </span>
                                ) : (
                                    'Update Password & Unlock'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetCredentialsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
            <ResetCredentialsContent />
        </Suspense>
    );
}
