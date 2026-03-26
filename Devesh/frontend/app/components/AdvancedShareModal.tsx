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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Secure Share</h2>
                            <p className="text-[10px] text-zinc-400 mt-1 truncate max-w-[250px]">{fileName}</p>
                        </div>
                        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all">
                            ✕
                        </button>
                    </div>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 uppercase">File Shared!</h3>
                        <p className="text-[10px] text-zinc-400 mt-2">Recipient will see it in their Shared Files inbox.</p>
                        <button onClick={onClose} className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-black transition-all">
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="p-6 space-y-5">
                        {/* Select Receiver */}
                        <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Share With</label>
                            {connections.length === 0 ? (
                                <p className="text-[10px] text-zinc-400">No active connections. Go to <b>Connections</b> to add users first.</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {connections.map((conn) => (
                                        <button
                                            key={conn.peer?.id}
                                            onClick={() => setSelectedReceiver(conn.peer?.id)}
                                            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                                                selectedReceiver === conn.peer?.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                                            }`}
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-[10px] uppercase">
                                                {conn.peer?.username?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-900">@{conn.peer?.username}</p>
                                                <p className="text-[9px] text-zinc-400">{conn.peer?.full_name || conn.peer?.unique_share_id}</p>
                                            </div>
                                            {conn.is_verified && <span className="ml-auto text-[8px] font-black text-emerald-500">✔ VERIFIED</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Permission Mode */}
                        <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Access Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'read', label: 'Read Only', emoji: '👁️', desc: 'View & Download' },
                                    { key: 'edit', label: 'Edit', emoji: '✏️', desc: 'Modify allowed' },
                                    { key: 'view_once', label: 'View Once', emoji: '💣', desc: 'Auto-delete' },
                                    { key: 'no_download', label: 'No Download', emoji: '🚫', desc: 'Stream only' },
                                ].map((mode) => (
                                    <button
                                        key={mode.key}
                                        onClick={() => setPermissionMode(mode.key)}
                                        className={`rounded-xl px-3 py-3 text-left transition-all border ${
                                            permissionMode === mode.key
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-zinc-200 bg-white hover:bg-zinc-50'
                                        }`}
                                    >
                                        <span className="text-sm">{mode.emoji}</span>
                                        <p className="text-[10px] font-black text-zinc-900 mt-1">{mode.label}</p>
                                        <p className="text-[8px] text-zinc-400">{mode.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expiry */}
                        <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Link Expiry</label>
                            <div className="flex gap-2">
                                {['1h', '24h', '7d', 'never'].map((e) => (
                                    <button
                                        key={e}
                                        onClick={() => setExpiry(e)}
                                        className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            expiry === e
                                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                                : 'border-zinc-200 text-zinc-400 hover:bg-zinc-50'
                                        }`}
                                    >
                                        {e === 'never' ? '∞' : e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-[10px] font-bold text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

                        {/* Submit */}
                        <button
                            onClick={handleShare}
                            disabled={isLoading || !selectedReceiver}
                            className="w-full rounded-2xl bg-zinc-900 py-3.5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Encrypting & Sharing...' : '🔐 Share Securely'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
