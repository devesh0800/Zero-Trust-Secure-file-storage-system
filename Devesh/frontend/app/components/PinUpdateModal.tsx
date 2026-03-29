'use client';

import { useState } from 'react';
import * as api from '@/lib/api';

interface PinUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    mfaEnabled: boolean;
    onSuccess: () => void;
}

export default function PinUpdateModal({ isOpen, onClose, mfaEnabled, onSuccess }: PinUpdateModalProps) {
    const [newPin, setNewPin] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleRequestOtp = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.requestPinUpdateOtp();
            setIsOtpSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await api.updateSecurityPin({
                new_pin: newPin,
                otp_code: !mfaEnabled ? otpCode : undefined,
                mfa_token: mfaEnabled ? mfaToken : undefined
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update PIN');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md rounded-[2.5rem] border border-zinc-800 bg-[#0c0c0e] p-10 shadow-3xl animate-in zoom-in-95 duration-300">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600/10 border border-violet-500/20 text-violet-500">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Control PIN</h2>
                    <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                        Authorize high-security PIN update via <span className="text-violet-500">{mfaEnabled ? 'Authenticator' : 'Email OTP'}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">New 6-Digit PIN</label>
                        <input
                            type="password"
                            maxLength={6}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4 text-center text-xl font-mono tracking-[0.5em] text-white placeholder:text-zinc-800 outline-none focus:border-violet-500/50 transition-all font-bold"
                            required
                        />
                    </div>

                    {mfaEnabled ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">MFA Authenticator Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4 text-center text-xl font-mono tracking-widest text-white placeholder:text-zinc-800 outline-none focus:border-violet-500/50 transition-all"
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!isOtpSent ? (
                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    disabled={isLoading}
                                    className="w-full py-4 border border-zinc-800 rounded-2xl text-[10px] font-black text-violet-400 hover:bg-violet-500/5 transition-all uppercase tracking-[0.2em]"
                                >
                                    {isLoading ? 'Sending Request...' : 'Send Security OTP to Email'}
                                </button>
                            ) : (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Email Verification Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4 text-center text-xl font-mono tracking-widest text-white placeholder:text-zinc-800 outline-none focus:border-violet-500/50 transition-all"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || newPin.length !== 6 || (mfaEnabled ? mfaToken.length !== 6 : !isOtpSent || otpCode.length !== 6)}
                            className="w-full rounded-2xl bg-violet-600 py-5 text-xs font-black text-white hover:bg-violet-500 transition-all uppercase tracking-widest shadow-2xl shadow-violet-500/20 disabled:opacity-30"
                        >
                            {isLoading ? 'Confirming Update...' : 'Update Security PIN'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-[10px] font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
