'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
    // Login State
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [captchaId, setCaptchaId] = useState('');
    const [captchaText, setCaptchaText] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // MFA/OTP State
    const [mfaRequired, setMfaRequired] = useState(false);
    const [otpRequired, setOtpRequired] = useState(false);
    const [requiresPhoneOtp, setRequiresPhoneOtp] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');

    const { login, verifyMfa, verifyLoginOtp, getCaptcha } = useAuth();
    const router = useRouter();

    const fetchCaptcha = async () => {
        try {
            const data = await getCaptcha();
            setCaptchaId(data.id);
            setCaptchaSvg(data.svg);
        } catch {
            setError('Failed to load captcha. Please refresh.');
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(identifier, password, captchaId, captchaText);
            
            // Handle OTP requirement (New: requested by user)
            if (result && result.otp_required) {
                setOtpRequired(true);
                setTempToken(result.temp_token);
                setRequiresPhoneOtp(!!(result.new_device && result.phone_required));
                setIsLoading(false);
                return;
            }

            // Handle MFA requirement
            if (result && result.mfa_required) {
                setMfaRequired(true);
                setTempToken(result.temp_token);
                setIsLoading(false);
                return;
            }

            router.push('/dashboard');
        } catch (err) {
            fetchCaptcha(); // Refresh captcha on failure
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Login failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await verifyLoginOtp(tempToken, emailOtp, requiresPhoneOtp ? phoneOtp : undefined, requiresPhoneOtp);
            
            if (result && result.mfa_required) {
                setOtpRequired(false);
                setMfaRequired(true);
                setTempToken(result.temp_token);
                setIsLoading(false);
                return;
            }

            router.push('/dashboard');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('OTP Verification failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await verifyMfa(tempToken, mfaToken);
            router.push('/dashboard');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('MFA Verification failed. Please try again.');
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
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        {mfaRequired ? 'Authenticator App' :
                         otpRequired ? 'Verification Required' :
                         'Welcome back'}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        {mfaRequired ? 'Enter the code from your Authenticator app' :
                         otpRequired ? 'We need to verify it\'s you' :
                         'Sign in to your secure vault'}
                    </p>
                </div>

                {/* Success Alert for new registrations */}
                {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('registered') && !error && !otpRequired && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm font-medium">Registration successful! Please sign in.</p>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                    {/* OPTION 1: Email OTP */}
                    {otpRequired && (
                        <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in fade-in duration-300">
                            <div className="rounded-xl bg-violet-500/10 p-4 border border-violet-500/20">
                                <label className="mb-1.5 block text-sm font-medium text-violet-200">Email Verification Code</label>
                                <p className="text-xs text-zinc-400 mb-3">Please check your email for the 6-digit login code.</p>
                                <input
                                    type="text"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    required
                                    className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-violet-500/30 bg-white/[0.03] px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                    maxLength={6}
                                />
                            </div>

                            {requiresPhoneOtp && (
                                <div className="space-y-1.5 pt-2">
                                    <label className="block text-sm font-medium text-zinc-300">Phone Code (New Device)</label>
                                    <input
                                        type="text"
                                        value={phoneOtp}
                                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none"
                                        maxLength={6}
                                    />
                                </div>
                            )}

                            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}

                            <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60">
                                {isLoading ? 'Verifying...' : 'Complete Secure Login'}
                            </button>

                            <button type="button" onClick={() => { setOtpRequired(false); setEmailOtp(''); }} className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                                Back to login
                            </button>
                        </form>
                    )}

                    {/* OPTION 2: Authenticator App */}
                    {mfaRequired && (
                        <form onSubmit={handleMfaSubmit} className="space-y-5 animate-in fade-in duration-300">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Authentication Code</label>
                                <input
                                    type="text"
                                    value={mfaToken}
                                    onChange={(e) => setMfaToken(e.target.value)}
                                    placeholder="000000"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-center tracking-widest text-white outline-none focus:border-violet-500/50"
                                    maxLength={8}
                                />
                            </div>
                            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
                            <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60">
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button type="button" onClick={() => { setMfaRequired(false); setMfaToken(''); }} className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                                Back to login
                            </button>
                        </form>
                    )}

                    {/* OPTION 3: Main Login Form */}
                    {!mfaRequired && !otpRequired && (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email or Username</label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Enter email or username"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" required className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white outline-none focus:border-violet-500/50" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-zinc-300 text-center">Security Check</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white/5 p-2 overflow-hidden" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                                    <button type="button" onClick={fetchCaptcha} className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-colors">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                    </button>
                                </div>
                                <input type="text" value={captchaText} onChange={(e) => setCaptchaText(e.target.value)} placeholder="Enter characters above" required className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50" />
                            </div>
                            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
                            <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60">
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>
                    )}

                    {/* Register & Unlock links */}
                    {!mfaRequired && !otpRequired && (
                        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-zinc-400">
                            <Link href="/unlock/request" className="font-medium text-rose-400 hover:text-rose-300 transition-colors">Locked out? Recover your account</Link>
                            <p>Don&apos;t have an account? <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">Create one</Link></p>
                        </div>
                    )}
                </div>

                {/* Security badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Protected by AES-256 encryption & Zero-Trust Architecture
                </div>
            </div>
        </div>
    );
}
