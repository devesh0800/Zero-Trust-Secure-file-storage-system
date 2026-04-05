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
    const [mounted, setMounted] = useState(false);

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

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

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
            
            if (result && result.otp_required) {
                setOtpRequired(true);
                setTempToken(result.temp_token);
                setRequiresPhoneOtp(!!(result.new_device && result.phone_required));
                setIsLoading(false);
                return;
            }

            if (result && result.mfa_required) {
                setMfaRequired(true);
                setTempToken(result.temp_token);
                setIsLoading(false);
                return;
            }

            router.push('/dashboard');
        } catch (err) {
            fetchCaptcha();
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
                setError('Verification failed. Please try again.');
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
                setError('Verification failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 py-12 selection:bg-violet-500/30 overflow-hidden">
            
            {/* ═══ Animated Background Layer ═══ */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 hex-pattern opacity-40" />
                <div className="absolute top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[150px] orb-1 morph-blob" />
                <div className="absolute bottom-[5%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-600/8 blur-[130px] orb-2 morph-blob" />
                <div className="absolute top-[50%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/5 blur-[100px] orb-3" />
            </div>

            {/* ═══ Subtitle floating elements ═══ */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="orbit-1">
                    <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-violet-300/70">Encryption</span>
                    </div>
                </div>
                <div className="orbit-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300/70">Privacy</span>
                    </div>
                </div>
                <div className="orbit-3">
                    <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-purple-300/70">Secure</span>
                    </div>
                </div>
            </div>

            {/* ═══ Main Content ═══ */}
            <div className={`relative w-full max-w-md transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Brand Header */}
                <div className="mb-8 text-center">
                    <div className="stagger-1">
                        <div className="shield-logo shield-float mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600">
                            <svg className="h-9 w-9 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="stagger-2 text-4xl font-extrabold tracking-tight text-white">
                        {mfaRequired ? (
                            <span className="text-shimmer">Verify Identity</span>
                        ) : otpRequired ? (
                            <span className="text-shimmer">Email Verification</span>
                        ) : (
                            <>Welcome <span className="text-shimmer">Back</span></>
                        )}
                    </h1>
                    <p className="stagger-3 mt-3 text-sm text-zinc-500 leading-relaxed">
                        {mfaRequired ? 'Enter the security code from your app' :
                         otpRequired ? 'We sent a verification code to your email' :
                         'Sign in to your secure storage'}
                    </p>
                </div>

                {/* Success Alert */}
                {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('registered') && !error && !otpRequired && !mfaRequired && (
                    <div className="stagger-3 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold tracking-tight">Account created! Please sign in.</p>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="stagger-4 rotating-border relative rounded-[2rem] p-8 glass-card">
                    <div className="scan-line" />

                    {/* OTP Form */}
                    {otpRequired && (
                        <form onSubmit={handleOtpSubmit} className="relative space-y-6">
                            <div className="stagger-1 rounded-2xl bg-violet-500/5 p-6 border border-violet-500/15 text-center">
                                <label className="mb-4 block text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">Email Verification Code</label>
                                <input
                                    type="text"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000 000"
                                    required
                                    className="input-glow w-full text-center tracking-[0.5em] text-3xl font-mono rounded-xl border border-violet-500/20 bg-white/[0.02] px-4 py-4 text-white placeholder-zinc-800 outline-none"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            {requiresPhoneOtp && (
                                <div className="stagger-2 space-y-2">
                                    <label className="ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Phone Verification Code</label>
                                    <input
                                        type="text"
                                        value={phoneOtp}
                                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="······"
                                        className="input-glow w-full text-center tracking-[0.5em] text-2xl font-mono rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white outline-none"
                                        maxLength={6}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-in">
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="btn-premium w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 py-4 text-sm font-bold text-white shadow-[0_4px_30px_rgba(124,58,237,0.3)] transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-50">
                                {isLoading ? 'Verifying...' : 'Sign In'}
                            </button>

                            <button type="button" onClick={() => { setOtpRequired(false); setEmailOtp(''); }} className="w-full py-2 text-[10px] font-bold text-zinc-600 hover:text-white transition-colors duration-300 uppercase tracking-[0.2em]">
                                ← Back to Login
                            </button>
                        </form>
                    )}

                    {/* MFA Form */}
                    {mfaRequired && (
                        <form onSubmit={handleMfaSubmit} className="relative space-y-6">
                            <div className="stagger-1 space-y-4">
                                <label className="ml-1 block text-center text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Security Code</label>
                                <input
                                    type="text"
                                    value={mfaToken}
                                    onChange={(e) => setMfaToken(e.target.value)}
                                    placeholder="000000"
                                    required
                                    className="input-glow w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-5 text-center text-3xl font-mono tracking-[0.6em] text-white outline-none"
                                    maxLength={8}
                                    autoFocus
                                />
                            </div>
                            
                            {error && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="btn-premium w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-bold text-white shadow-[0_4px_30px_rgba(16,185,129,0.3)] transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-50">
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>

                            <button type="button" onClick={() => { setMfaRequired(false); setMfaToken(''); }} className="w-full py-2 text-[10px] font-bold text-zinc-600 hover:text-white transition-colors duration-300 uppercase tracking-[0.2em]">
                                ← Back to Login
                            </button>
                        </form>
                    )}

                    {/* Login Form */}
                    {!mfaRequired && !otpRequired && (
                        <form onSubmit={handleLoginSubmit} className="relative space-y-5">
                            <div className="stagger-4">
                                <label className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Username or Email</label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                                />
                            </div>

                            <div className="stagger-5">
                                <label className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        placeholder="Enter your password" 
                                        required 
                                        className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 pr-12 text-sm text-white placeholder-zinc-700 outline-none" 
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-violet-400 transition-colors">
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="stagger-6 space-y-3">
                                <label className="text-center block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Verification Code</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white/[0.03] p-2 overflow-hidden border border-white/[0.06]" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                                    <button type="button" onClick={fetchCaptcha} className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:text-violet-400 transition-all">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={captchaText}
                                    onChange={(e) => setCaptchaText(e.target.value)}
                                    placeholder="Enter the code above"
                                    required
                                    className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-sm text-white placeholder-zinc-700 outline-none"
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400 text-center animate-in">
                                    {error}
                                </div>
                            )}

                            <div className="stagger-7 pt-1">
                                <button type="submit" disabled={isLoading} className="btn-premium w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50">
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="stagger-8 mt-8 flex flex-col items-center gap-4 text-sm">
                        <div className="h-px w-16 bg-white/[0.06]" />
                        <Link href="/unlock/request" className="text-zinc-500 hover:text-white transition-colors text-xs">
                            Forgot Password?
                        </Link>
                        <p className="text-zinc-600 text-xs">
                            New here?{' '}
                            <Link href="/register" className="font-bold text-violet-400 hover:text-violet-300">Create an account →</Link>
                        </p>
                    </div>
                </div>

                <div className="stagger-8 mt-8 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-5 py-2 text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                        Safe & Secure
                    </div>
                </div>
            </div>
        </div>
    );
}
