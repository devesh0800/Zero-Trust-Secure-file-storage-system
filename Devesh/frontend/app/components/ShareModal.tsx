'use client';

import { useState } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShare: (options: { password?: string, expiresAt?: string }) => Promise<string | null>;
    fileName: string;
}

export default function ShareModal({ isOpen, onClose, onShare, fileName }: ShareModalProps) {
    const [password, setPassword] = useState('');
    const [expiry, setExpiry] = useState('24h');
    const [showPassword, setShowPassword] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsGenerating(true);
        let expiresAt: string | undefined;
        const now = new Date();
        
        if (expiry === '1h') {
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        } else if (expiry === '24h') {
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        } else if (expiry === '7d') {
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }

        const link = await onShare({
            password: password || undefined,
            expiresAt
        });

        setIsGenerating(false);
        if (link) {
            setGeneratedLink(link);
        }
    };

    const handleClose = () => {
        setGeneratedLink(null);
        setPassword('');
        setExpiry('24h');
        onClose();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Secure Sharing</h2>
                    <button onClick={handleClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {!generatedLink ? (
                    <>
                        <div className="mb-6 rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">File to Share</p>
                            <p className="text-sm font-bold text-zinc-900 truncate">{fileName}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex justify-between items-center">
                                    <span>Password Protection (Optional)</span>
                                    <button onClick={() => setShowPassword(!showPassword)} className="text-blue-600 hover:underline lowercase font-bold tracking-normal">
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Set a link password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none transition-all shadow-sm"
                                />
                                <p className="text-[10px] text-zinc-400 italic font-medium">If set, users must enter this password to download.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Link Expiry</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['1h', '24h', '7d', 'never'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setExpiry(opt)}
                                            className={`rounded-xl border py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                expiry === opt 
                                                ? 'border-blue-600 bg-blue-50 text-blue-600' 
                                                : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-3">
                            <button onClick={handleClose} className="flex-1 rounded-2xl border border-zinc-200 py-4 text-[10px] font-black text-zinc-400 hover:bg-zinc-50 transition-all uppercase tracking-widest">Discard</button>
                            <button
                                onClick={handleConfirm}
                                disabled={isGenerating}
                                className="flex-[2] rounded-2xl bg-zinc-900 py-4 text-[10px] font-black text-white shadow-xl shadow-zinc-900/20 hover:bg-black transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Secure Link'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 rounded-3xl bg-emerald-50 p-6 text-center border-2 border-emerald-100 border-dashed">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Success! Link Ready</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Shared Link</label>
                                <div className="flex items-center gap-2">
                                    <input readOnly value={generatedLink} className="flex-1 bg-transparent text-xs font-bold text-zinc-600 outline-none" />
                                    <button onClick={() => copyToClipboard(generatedLink)} className="rounded-lg bg-zinc-900 p-2 text-white hover:bg-black transition-all shadow-md">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    </button>
                                </div>
                            </div>

                            {password && (
                                <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 block">Encryption Password</label>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-blue-600 tracking-widest">{password}</span>
                                        <button onClick={() => copyToClipboard(password)} className="text-[10px] font-black text-blue-400 uppercase hover:text-blue-600 underline">Copy</button>
                                    </div>
                                    <p className="mt-2 text-[8px] font-bold text-blue-400 uppercase italic">⚠️ Share this password via a separate secure channel!</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            className="mt-8 w-full rounded-2xl bg-zinc-900 py-4 text-[10px] font-black text-white shadow-xl shadow-zinc-900/20 hover:bg-black transition-all uppercase tracking-widest"
                        >
                            Complete & Exit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
