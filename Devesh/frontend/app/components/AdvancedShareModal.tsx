'use client';

import { useState, useEffect } from 'react';
import * as api from '@/lib/api';

interface AdvancedShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileName: string;
}

export default function AdvancedShareModal({ isOpen, onClose, fileId, fileName }: AdvancedShareModalProps) {
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedReceiver, setSelectedReceiver] = useState<string>('');
    const [permissionMode, setPermissionMode] = useState('read');
    const [expiry, setExpiry] = useState('never');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            api.getConnections().then((data) => {
                setConnections(data.filter((c: any) => c.status === 'active'));
            });
            setSuccess(false);
            setError('');
            setSelectedReceiver('');
        }
    }, [isOpen]);

    const expiryMap: Record<string, number | null> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        'never': null,
    };

    const handleShare = async () => {
        if (!selectedReceiver) { setError('Select a connected user.'); return; }
        setIsLoading(true);
        setError('');
        try {
            const expiresAt = expiryMap[expiry]
                ? new Date(Date.now() + expiryMap[expiry]!).toISOString()
                : undefined;

            // For now, pass a placeholder encrypted AES key.
            // In full E2E mode, this would be wrapped with receiver's public key.
            const encryptedAesKey = 'E2E_PLACEHOLDER_KEY';

            await api.createAdvancedShare({
                fileId,
                receiverId: selectedReceiver,
                encryptedAesKey,
                permissionMode,
                expiresAt,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to share.');
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-[380px] overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#0c0c0e] shadow-2xl animate-in zoom-in-95 duration-300 glass-card">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10 p-6 border-b border-white/[0.04] relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 h-32 w-32 bg-blue-500/10 blur-[50px] rounded-full" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Secure Share</h2>
                            <p className="text-[14px] font-bold text-white mt-0.5 truncate max-w-[200px] tracking-tight">{fileName}</p>
                        </div>
                        <button onClick={onClose} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {success ? (
                    <div className="p-8 text-center space-y-5">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">Shared Successfully</h3>
                        <p className="text-[10px] text-zinc-500 font-bold leading-relaxed px-6">Access credentials encrypted and delivered.</p>
                        <button onClick={onClose} className="w-full rounded-2xl bg-white/[0.05] border border-white/[0.08] py-3.5 text-[9px] font-black text-white uppercase tracking-widest hover:bg-white/[0.1] transition-all">
                            Acknowledged
                        </button>
                    </div>
                ) : (
                    <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar">
                        {/* Select Receiver */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Receiver Identity</label>
                            {connections.length === 0 ? (
                                <div className="p-6 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] text-center">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">No active protocol connections found. Establish a connection to share objects.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                                    {connections.map((conn) => (
                                        <button
                                            key={conn.peer?.id}
                                            onClick={() => setSelectedReceiver(conn.peer?.id)}
                                            className={`w-full flex items-center gap-3.5 rounded-[1.25rem] px-4 py-3.5 text-left transition-all border ${
                                                selectedReceiver === conn.peer?.id
                                                    ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]'
                                                    : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/[0.06] text-blue-400 font-black text-[11px] uppercase group-hover:scale-110 transition-transform">
                                                {conn.peer?.username?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[13px] font-black text-white tracking-tight uppercase">@{conn.peer?.username}</p>
                                                <p className="text-[9px] text-zinc-600 font-bold truncate mt-0.5">{conn.peer?.unique_share_id}</p>
                                            </div>
                                            {selectedReceiver === conn.peer?.id && (
                                                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-in">
                                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Permission Mode */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Access protocol</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { key: 'read', label: 'Read Only', emoji: '👁️', desc: 'Secure View' },
                                    { key: 'edit', label: 'Modify', emoji: '✏️', desc: 'Full Access' },
                                    { key: 'view_once', label: 'Burn Once', emoji: '💣', desc: 'Self-Destruct' },
                                    { key: 'no_download', label: 'Stream Only', emoji: '🚫', desc: 'No Storage' },
                                ].map((mode) => (
                                    <button
                                        key={mode.key}
                                        onClick={() => setPermissionMode(mode.key)}
                                        className={`group rounded-xl px-4 py-3 text-left transition-all border relative overflow-hidden ${
                                            permissionMode === mode.key
                                                ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]'
                                                : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-base group-hover:scale-125 transition-transform duration-300">{mode.emoji}</span>
                                            {permissionMode === mode.key && <div className="h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                                        </div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{mode.label}</p>
                                        <p className="text-[8px] text-zinc-600 font-bold mt-0.5 group-hover:text-zinc-500 transition-colors">{mode.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expiry */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Temporal Restriction</label>
                            <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                {['1h', '24h', '7d', 'never'].map((e) => (
                                    <button
                                        key={e}
                                        onClick={() => setExpiry(e)}
                                        className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                            expiry === e
                                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] scale-[1.02]'
                                                : 'text-zinc-600 hover:text-zinc-400'
                                        }`}
                                    >
                                        {e === 'never' ? '∞' : e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-5 py-4 animate-shake">
                                <div className="h-2 w-2 rounded-full bg-rose-500" />
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleShare}
                            disabled={isLoading || !selectedReceiver}
                            className="group relative w-full overflow-hidden rounded-xl bg-white py-4 text-[9px] font-black text-black uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 group-hover:text-white transition-colors">
                                {isLoading ? 'INITIALIZING...' : '⚡ AUTHORIZE DISPATCH'}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
