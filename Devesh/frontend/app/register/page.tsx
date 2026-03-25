'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

const PASSWORD_REQUIREMENTS = [
    { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [captchaId, setCaptchaId] = useState('');
    const [captchaText, setCaptchaText] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    
    // OTP State
    const [step, setStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState('');
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register, getCaptcha } = useAuth();
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

    const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!allRequirementsMet) {
            setError('Please meet all password requirements');
            return;
        }

        setIsLoading(true);
        try {
            if (step === 1) {
                // Step 1: Request OTP
                const api = await import('@/lib/api');
                await api.sendRegistrationOtp(email);
                setStep(2);
                setIsLoading(false);
                return;
            }

            // Step 2: Final Registration
            await register(email, password, username, captchaId, captchaText, otpCode);
            router.push('/login?registered=true');
        } catch (err) {
            fetchCaptcha(); // Refresh captcha on failure
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Registration failed. Please try again.');
                setStep(1);
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-violet-600/8 blur-[100px]" />
                <div className="absolute bottom-1/3 right-1/3 h-96 w-96 rounded-full bg-indigo-600/8 blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create your vault</h1>
                    <p className="mt-1 text-sm text-zinc-400">Start securing your files today</p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="devesh_01"
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
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

                            {/* Password Requirements */}
                            {password.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {PASSWORD_REQUIREMENTS.map((req, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            {req.test(password) ? (
                                                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            ) : (
                                                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                                </svg>
                                            )}
                                            <span className={req.test(password) ? 'text-emerald-400' : 'text-zinc-500'}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Captcha */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-zinc-300 text-center">Security Check</label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white/5 p-2 overflow-hidden"
                                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                                />
                                <button
                                    type="button"
                                    onClick={fetchCaptcha}
                                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-colors"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                </button>
                            </div>
                            <input
                                type="text"
                                value={captchaText}
                                onChange={(e) => setCaptchaText(e.target.value)}
                                placeholder="Enter characters above"
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>



                        {/* Step 2: OTP Entry */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl bg-violet-500/10 p-4 border border-violet-500/20">
                                <label className="mb-1.5 block text-sm font-medium text-violet-200">Email Verification Code</label>
                                <p className="text-xs text-zinc-400 mb-3">We just sent a 6-digit code to {email}. Check your console for the mocked code.</p>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit OTP"
                                    required
                                    className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-violet-500/30 bg-white/[0.03] px-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:border-violet-500/80 focus:ring-2 focus:ring-violet-500/20"
                                />
                                <button type="button" onClick={() => setStep(1)} className="mt-3 text-xs w-full text-zinc-400 hover:text-white pb-1">
                                    Change email address or details
                                </button>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || !allRequirementsMet}
                            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                    Processing...
                                </span>
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="mt-6 text-center text-sm text-zinc-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-violet-400 transition-colors hover:text-violet-300">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Security badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Your files are encrypted with AES-256-GCM before storage
                </div>
            </div>
        </div>
    );
}
