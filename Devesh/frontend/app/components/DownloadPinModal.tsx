'use client';

import { useState } from 'react';

interface DownloadPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pin: string) => void;
    fileName: string;
    isDownloading: boolean;
    error?: string | null;
}

export default function DownloadPinModal({ isOpen, onClose, onConfirm, fileName, isDownloading, error }: DownloadPinModalProps) {
    const [pin, setPin] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(pin);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-[2.5rem] border border-zinc-800 bg-[#0c0c0e] p-10 shadow-3xl animate-in zoom-in-95 duration-300">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-500">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Security Access</h2>
                    <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                        Authorize decryption for<br/><span className="text-blue-500">{fileName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] ml-1 block text-center">Enter Private Security PIN</label>
                        <input
                            type="password"
                            maxLength={6}
                            autoFocus
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className={`w-full rounded-2xl border bg-zinc-950 px-6 py-5 text-center text-2xl font-black tracking-[0.5em] text-white placeholder:text-zinc-800 outline-none transition-all shadow-inner ${error ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-blue-500/50'}`}
                            required
                        />
                        {error && (
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider text-center animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={isDownloading || pin.length < 4}
                            className="w-full rounded-2xl bg-blue-600 py-5 text-xs font-black text-white hover:bg-blue-500 transition-all uppercase tracking-widest shadow-2xl shadow-blue-500/10 disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                'Verify & Download'
                            )}
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
