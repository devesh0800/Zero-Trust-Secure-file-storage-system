'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyUnlock, ApiError } from '@/lib/api';

function VerifyLinkContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');
    const hasAttempted = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('No verification token provided in the link.');
            return;
        }

        if (hasAttempted.current) return;
        hasAttempted.current = true;

        const processToken = async () => {
            try {
                const data = await verifyUnlock(token);
                // The API will have set the restricted accessToken
                setStatus('success');
            } catch (err) {
                setStatus('error');
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Failed to verify the unlock link. It may be expired or invalid.');
                }
            }
        };

        processToken();
    }, [token]);

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
             {/* Background effects */}
             <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-orange-600/8 blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-rose-600/8 blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md text-center rounded-2xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl shadow-2xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500 mb-6"></div>
                        <h2 className="text-xl font-bold text-white mb-2">Verifying Link</h2>
                        <p className="text-sm text-zinc-400">Please wait while we securely process your unlock request.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-sm text-zinc-400 mb-8">{error}</p>
                        <button
                            onClick={() => router.push('/token/request')}
                            className="w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            Request New Link
                        </button>
                    </div>
                )}

                {status === 'success' && (
                     <div className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Read-Only Access Granted</h2>
                        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                            Your identity has been partially verified. You now have temporary <strong className="text-white">Restricted Mode</strong> access to your account. To completely unlock your files and restore full permissions, you must complete the final AI identity verification step.
                        </p>
                        <button
                            onClick={() => router.push('/unlock/ai-verify')}
                            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:brightness-110"
                        >
                            Start AI Verification
                        </button>
                     </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyUnlockPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
            <VerifyLinkContent />
        </Suspense>
    );
}
