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
                <div className="absolute inset-0 hex-pattern opacity-40" />
                <div className="absolute top-[5%] right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[150px] orb-1 morph-blob" />
                <div className="absolute bottom-[10%] left-[5%] h-[450px] w-[450px] rounded-full bg-violet-600/8 blur-[130px] orb-2 morph-blob" />
                <div className="absolute top-[40%] left-[40%] h-[350px] w-[350px] rounded-full bg-purple-600/5 blur-[100px] orb-3" />
            </div>

            {/* ═══ Orbital Badges ═══ */}
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

            {/* ═══ Content ═══ */}
            <div className={`relative w-full max-w-md transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                
                <div className="mb-8 text-center">
                    <div className="stagger-1 text-center">
                        <div className="shield-logo shield-float mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600">
                            <svg className="h-9 w-9 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="stagger-2 text-4xl font-extrabold tracking-tight text-white">
                        Create Your <span className="text-shimmer">Account</span>
                    </h1>
                    <p className="stagger-3 mt-3 text-sm text-zinc-500 leading-relaxed">
                        Your private and secure file storage
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
                        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${step === 1 ? 'text-zinc-300' : 'text-emerald-400'}`}>Your Info</span>
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
                        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${step === 2 ? 'text-zinc-300' : 'text-zinc-600'}`}>Verification</span>
                    </div>
                </div>

                <div className="stagger-4 rotating-border relative rounded-[2rem] p-8 glass-card">
                    <div className="scan-line" />

                    <form onSubmit={handleSubmit} className="relative space-y-5">
                        {step === 1 ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1 stagger-4">
                                        <label className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Username</label>
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
                                        <label className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Email</label>
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

                                <div className="stagger-5 space-y-3">
                                    <label className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Password</label>
                                    <div className="relative group/pass">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimum 12 characters"
                                            required
                                            className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 pr-12 text-sm text-white placeholder-zinc-700 outline-none"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    
                                    <div className="relative h-1 w-full rounded-full bg-zinc-800/50 overflow-hidden">
                                        <div className="absolute left-0 h-full bg-violet-600 transition-all" style={{ width: `${strengthPercent}%` }} />
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                        {PASSWORD_REQUIREMENTS.map((req, i) => (
                                            <div key={i} className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 border ${req.test(password) ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.04]'}`}>
                                                <div className="text-[8px]">{req.icon}</div>
                                                <span className="text-[8px]">{req.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="stagger-6">
                                    <label className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Safety PIN (6-digits)</label>
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
                                        <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                            {showPin ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-center">
                                <h3 className="text-xl font-bold text-white">Verify Your Email</h3>
                                <p className="text-sm text-zinc-500">Code sent to <span className="text-indigo-400">{email}</span></p>

                                <div className="space-y-4">
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
                                    
                                    {/* Captcha Section */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex h-12 items-center justify-center rounded-xl bg-white/[0.03] p-2 border border-white/[0.06]" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                                        <button type="button" onClick={fetchCaptcha} className="text-[10px] text-zinc-600 uppercase tracking-widest">Refresh Captcha</button>
                                        <input
                                            type="text"
                                            placeholder="Type the characters above"
                                            value={captchaText}
                                            onChange={(e) => setCaptchaText(e.target.value)}
                                            required
                                            className="input-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-sm text-white outline-none"
                                        />
                                    </div>

                                    <div className="flex justify-center gap-6">
                                        <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-zinc-600 uppercase">← Back</button>
                                        <button 
                                            type="button" 
                                            onClick={async () => {
                                                const api = await import('@/lib/api');
                                                await api.sendRegistrationOtp(email);
                                            }}
                                            className="text-[10px] font-bold text-indigo-400 uppercase"
                                        >
                                            Resend OTP
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (step === 1 && !allRequirementsMet)}
                            className="btn-premium w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 py-4 text-sm font-bold text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : step === 1 ? 'Next Step' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-zinc-600">
                        Already have an account? <Link href="/login" className="text-violet-400 font-bold">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}