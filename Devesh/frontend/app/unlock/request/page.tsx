'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { requestUnlock, ApiError } from '@/lib/api';

export default function UnlockRequestPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [testMagicLink, setTestMagicLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setTestMagicLink('');
        setIsLoading(true);

        try {
            const data = await requestUnlock(email);
            setSuccess('Recovery email sent. Please check your inbox.');
            if (data.test_magic_link) {
                setTestMagicLink(data.test_magic_link);
            }
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
        <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-violet-600/8 blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/8 blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 shadow-lg shadow-orange-500/25">
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Unlock Account</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Enter your email to receive a recovery link
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                            />
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                                {success}
                            </div>
                        )}
                        
                        {/* Dev Environment Simulation Magic Link */}
                        {testMagicLink && (
                           <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-center">
                                <p className="text-xs text-orange-400 mb-2 font-medium">DEVELOPMENT MODE: MAGIC LINK GENERATED</p>
                                <a 
                                    href={testMagicLink}
                                    className="block w-full rounded-lg bg-orange-500/20 py-2 text-sm font-semibold text-orange-300 hover:bg-orange-500/30 transition-colors"
                                >
                                    Click here to continue
                                </a>
                           </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                    Sending Link...
                                </span>
                            ) : (
                                'Request Unlock Link'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-zinc-400">
                        Remember your password?{' '}
                        <Link href="/login" className="font-medium text-orange-400 transition-colors hover:text-orange-300">
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
