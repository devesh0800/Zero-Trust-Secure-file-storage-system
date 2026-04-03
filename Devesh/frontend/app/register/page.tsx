'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import * as cryptoHelpers from '@/lib/crypto';

const PASSWORD_REQUIREMENTS = [
    { label: '12+ characters', test: (p: string) => p.length >= 12, icon: '⌗' },
    { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p), icon: 'A' },
    { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p), icon: 'a' },
    { label: 'Number', test: (p: string) => /[0-9]/.test(p), icon: '#' },
    { label: 'Special char', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), icon: '!' },
];

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [captchaId, setCaptchaId] = useState('');
    const [captchaText, setCaptchaText] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState('');
    const [securityPin, setSecurityPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { register, getCaptcha } = useAuth();
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

    useEffect(() => { fetchCaptcha(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1 && !allRequirementsMet) {
            setError('Please meet all password requirements');
            return;
        }

        setIsLoading(true);

        try {
            if (step === 1) {
                const api = await import('@/lib/api');
                await api.sendRegistrationOtp(email);
                setStep(2);
                setIsLoading(false);
                return;
            }

            const { publicKey, privateKey } = await cryptoHelpers.generateIdentityKeys() as any;
            const encryptedBlob = await cryptoHelpers.encryptPrivateKey(privateKey, securityPin);
            const publicKeyBase64 = await cryptoHelpers.exportPublicKey(publicKey);

            await register(email, password, username, captchaId, captchaText, otpCode, publicKeyBase64, securityPin);

            localStorage.setItem('vault_identity_key', JSON.stringify(encryptedBlob));
            router.push('/login?registered=true');

        } catch (err) {
            fetchCaptcha();
            setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
            if (!(err instanceof ApiError && err.message.includes('OTP'))) {
                setStep(1);
            }
        }

        setIsLoading(false);
    };

    const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password));
    const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
    const strengthPercent = (metCount / PASSWORD_REQUIREMENTS.length) * 100;

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 py-12 selection:bg-violet-500/30 overflow-hidden">
            
            {/* ═══ Animated Background Layer ═══ */}
            <div className="pointer-events-none absolute inset-0">
                {/* Hex Pattern Overlay */}
                <div className="absolute inset-0 hex-pattern opacity-40" />

                {/* Morphing Gradient Orbs */}
                <div className="absolute top-[5%] right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[150px] orb-1 morph-blob" />
                <div className="absolute bottom-[10%] left-[5%] h-[450px] w-[450px] rounded-full bg-violet-600/8 blur-[130px] orb-2 morph-blob" />
                <div className="absolute top-[40%] left-[40%] h-[350px] w-[350px] rounded-full bg-purple-600/5 blur-[100px] orb-3" />

                {/* Rising Particles */}
                <div className="floating-particle fp-1" />
                <div className="floating-particle fp-2" />
                <div className="floating-particle fp-3" />
                <div className="floating-particle fp-4" />
                <div className="floating-particle fp-5" />
                <div className="floating-particle fp-6" />
                <div className="floating-particle fp-7" />
                <div className="floating-particle fp-8" />
            </div>

            {/* ═══ Orbital Security Badges ═══ */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="orbit-1">
                    <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-violet-300/70">AES-256</span>
                    </div>
                </div>
                <div className="orbit-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300/70">RSA Keys</span>
                    </div>
                </div>
                <div className="orbit-3">
                    <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-purple-300/70">Zero-Trust</span>
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
                        Create Your <span className="text-shimmer">Vault</span>
                    </h1>
                    <p className="stagger-3 mt-3 text-sm text-zinc-500 leading-relaxed">
                        Zero-knowledge encrypted storage for your sensitive data
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="stagger-3 mb-6 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${
                            step === 1 
                                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' 
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                            {step === 1 ? '1' : '✓'}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${step === 1 ? 'text-zinc-300' : 'text-emerald-400'}`}>Details</span>
                    </div>
                    <div className={`h-px w-8 transition-all duration-700 ${step === 2 ? 'bg-gradient-to-r from-emerald-500 to-violet-500' : 'bg-zinc-800'}`} />
                    <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${
                            step === 2 
                                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' 
                                : 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/50'
                        }`}>
                            2
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${step === 2 ? 'text-zinc-300' : 'text-zinc-600'}`}>Verify</span>
                    </div>
                </div>

                {/* ═══ Form Card with Rotating Gradient Border ═══ */}
                <div className="stagger-4 rotating-border relative rounded-[2rem] p-8 glass-card">
                    {/* Scan Line Effect */}
                    <div className="scan-line" />

                    <form onSubmit={handleSubmit} className="relative space-y-5">
                        {step === 1 ? (
                            <div className="space-y-5">
                                {/* Username & Email Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1 stagger-4">
                                        <label className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                            <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="devesh_01"
                                            required
                                            className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 stagger-5">
                                        <label className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                            <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@work.com"
                                            required
                                            className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Password Section */}
                                <div className="stagger-5 space-y-3">
                                    <label className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                        </svg>
                                        Master Password
                                    </label>
                                    <div className="relative group/pass">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimum 12 characters"
                                            required
                                            className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 pr-12 text-sm text-white placeholder-zinc-700 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-violet-400 transition-colors duration-300"
                                        >
                                            {showPassword ? (
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Animated Password Strength Bar */}
                                    <div className="relative h-1 w-full rounded-full bg-zinc-800/50 overflow-hidden">
                                        <div 
                                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
                                                strengthPercent <= 20 ? 'bg-red-500' :
                                                strengthPercent <= 60 ? 'bg-amber-500' :
                                                strengthPercent < 100 ? 'bg-yellow-500' :
                                                'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                            }`}
                                            style={{ width: `${strengthPercent}%` }}
                                        />
                                    </div>
                                    
                                    {/* Visual Requirements Checklist */}
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                        {PASSWORD_REQUIREMENTS.map((req, i) => (
                                            <div 
                                                key={i} 
                                                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 border transition-all duration-500 ${
                                                    req.test(password) 
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                                        : 'bg-white/[0.01] border-white/[0.04]'
                                                }`}
                                            >
                                                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold transition-all duration-500 ${
                                                    req.test(password)
                                                        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                                        : 'bg-zinc-800/50 text-zinc-600'
                                                }`}>
                                                    {req.test(password) ? '✓' : req.icon}
                                                </div>
                                                <span className={`text-[8px] font-bold tracking-tight transition-colors duration-500 text-center leading-tight ${
                                                    req.test(password) ? 'text-emerald-400' : 'text-zinc-600'
                                                }`}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Security PIN Section */}
                                <div className="stagger-6">
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                            <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                                            </svg>
                                            Security PIN
                                        </label>
                                        <span className="text-[8px] text-indigo-400/70 font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-indigo-500/5 border border-indigo-500/10">Local Only</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPin ? 'text' : 'password'}
                                            value={securityPin}
                                            onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                            placeholder="Create a 6-digit PIN"
                                            required
                                            maxLength={6}
                                            className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-violet-400 transition-colors duration-300"
                                        >
                                            {showPin ? (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                            ) : (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {/* PIN strength dots */}
                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                        {[0,1,2,3,4,5].map(i => (
                                            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                                                securityPin.length > i 
                                                    ? 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.5)]' 
                                                    : 'bg-zinc-800'
                                            }`} />
                                        ))}
                                    </div>
                                </div>

                                {/* Security Check */}
                                <div className="stagger-7 space-y-3">
                                    <label className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                        </svg>
                                        Human Verification
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white/[0.03] p-2 overflow-hidden border border-white/[0.06]" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                                        <button type="button" onClick={fetchCaptcha} className="group/refresh flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:text-violet-400 hover:border-violet-500/30 transition-all duration-300 hover:bg-violet-500/5 active:scale-90">
                                            <svg className="h-5 w-5 transition-transform duration-500 group-hover/refresh:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Type the characters above"
                                        value={captchaText}
                                        onChange={(e) => setCaptchaText(e.target.value)}
                                        required
                                        className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-sm text-white placeholder-zinc-700 outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* ── Step 2: OTP Verification ── */
                            <div className="space-y-6">
                                <div className="stagger-1 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                        <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Verify Your Email</h3>
                                    <p className="mt-2 text-sm text-zinc-500 px-4">Enter the 6-digit code sent to <br/><span className="text-indigo-400 font-mono font-bold tracking-tight">{email}</span></p>
                                </div>

                                <div className="stagger-2 space-y-4">
                                    <input
                                        type="text"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                        placeholder="······"
                                        className="input-glow w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/5 py-5 text-center text-3xl font-mono tracking-[0.6em] text-white outline-none"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                    {/* OTP filled indicator */}
                                    <div className="flex items-center justify-center gap-2">
                                        {[0,1,2,3,4,5].map(i => (
                                            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                                                otpCode.length > i 
                                                    ? 'w-6 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                                                    : 'w-4 bg-zinc-800'
                                            }`} />
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => setStep(1)} className="stagger-3 w-full flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-white transition-colors duration-300 uppercase tracking-[0.15em]">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                        Edit details
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400 animate-in">
                                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="stagger-8 pt-1">
                            <button
                                type="submit"
                                disabled={isLoading || (step === 1 && !allRequirementsMet)}
                                className="btn-premium group/btn w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] py-4 text-sm font-bold text-white shadow-[0_4px_30px_rgba(124,58,237,0.25)] transition-all duration-500 hover:bg-right hover:shadow-[0_8px_50px_rgba(124,58,237,0.45)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2.5">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Initialising Vault...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className={`h-4 w-4 transition-transform duration-300 ${step === 1 ? 'group-hover/btn:rotate-12' : 'group-hover/btn:scale-110'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            {step === 1 ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            )}
                                        </svg>
                                        {step === 1 ? 'Generate Keys' : 'Secure My Vault'}
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <div className="neon-line mx-auto w-16 mb-4" />
                        <p className="text-xs text-zinc-600">
                            Already part of our network?{' '}
                            <Link href="/login" className="font-bold text-violet-400 hover:text-violet-300 transition-colors duration-300">
                                Sign In →
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Badges */}
                <div className="stagger-8 mt-8 flex flex-wrap items-center justify-center gap-3">
                    {[
                        { label: 'AES-256-GCM', color: 'emerald' },
                        { label: 'Zero-Trust', color: 'indigo' },
                        { label: 'E2EE', color: 'violet' },
                    ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-1.5 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-3 py-1.5 backdrop-blur-sm">
                            <div className={`h-1 w-1 rounded-full bg-${badge.color}-500/70 shadow-[0_0_4px_currentColor]`} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}