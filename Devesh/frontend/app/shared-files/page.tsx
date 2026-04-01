'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';

function SharedFilesContent() {
    const { user } = useAuth();
    const [tab, setTab] = useState<'sent' | 'received'>('received');
    const [sentShares, setSentShares] = useState<any[]>([]);
    const [receivedShares, setReceivedShares] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMsg = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Decouple fetching so if one fails, the other can still load.
            const results = await Promise.allSettled([api.getSentShares(), api.getReceivedShares()]);
            
            if (results[0].status === 'fulfilled') {
                setSentShares(results[0].value);
            } else {
                console.error('Error fetching sent shares:', results[0].reason);
            }

            if (results[1].status === 'fulfilled') {
                console.log('Received shares:', results[1].value);
                setReceivedShares(results[1].value);
            } else {
                console.error('Error fetching received shares:', results[1].reason);
                showMsg('error', 'Failed to load received files. Check console.');
            }
        } catch (e: any) {
            console.error('FetchData error:', e);
        }
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleAccept = async (id: string) => {
        try { await api.acceptAdvancedShare(id); showMsg('success', 'Share accepted!'); fetchData(); }
        catch (e: any) { showMsg('error', e.message); }
    };

    const handleReject = async (id: string) => {
        try { await api.rejectAdvancedShare(id); showMsg('success', 'Share rejected.'); fetchData(); }
        catch (e: any) { showMsg('error', e.message); }
    };

    const handleRevoke = async (id: string) => {
        try { await api.revokeAdvancedShare(id); showMsg('success', 'Access revoked!'); fetchData(); }
        catch (e: any) { showMsg('error', e.message); }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const permBadge = (mode: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            read: { label: 'Read Only', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
            edit: { label: 'Edit', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
            view_once: { label: 'View Once', cls: 'bg-red-50 text-red-600 border-red-100' },
            no_download: { label: 'No Download', cls: 'bg-purple-50 text-purple-600 border-purple-100' },
        };
        const b = map[mode] || map.read;
        return <span className={`rounded-lg border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${b.cls}`}>{b.label}</span>;
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: 'bg-amber-50 text-amber-600',
            accepted: 'bg-emerald-50 text-emerald-600',
            revoked: 'bg-red-50 text-red-600',
            expired: 'bg-zinc-100 text-zinc-400',
        };
        return <span className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${map[status] || ''}`}>{status}</span>;
    };

    const pendingCount = receivedShares.filter(s => s.status === 'pending').length;

    return (
        <div className="min-h-screen bg-zinc-50">
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 pt-36 pb-12">
                <div className="mb-8 border-b border-zinc-200 pb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">Shared Files</h1>
                        <p className="text-sm text-zinc-400 mt-1 font-medium italic">Manage your secure end-to-end encrypted file transfers.</p>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Encrypting View...</span>
                        </div>
                    )}
                </div>

                {message.text && (
                    <div className={`mb-6 rounded-2xl px-6 py-4 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button onClick={() => setTab('received')} className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'received' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                        Received {pendingCount > 0 && <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">{pendingCount}</span>}
                    </button>
                    <button onClick={() => setTab('sent')} className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'sent' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                        Sent (Dashboard)
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center text-zinc-400">Loading shares...</div>
                ) : (
                    <>
                        {/* RECEIVED TAB */}
                        {tab === 'received' && (
                            receivedShares.length === 0 ? (
                                <div className="py-20 text-center text-zinc-400 text-sm">No files shared with you yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {receivedShares.map((share) => (
                                        <div key={share.id} className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center justify-between hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs uppercase shadow-lg shadow-indigo-500/20 shrink-0">
                                                    {share.file?.file_extension?.toUpperCase()?.slice(0, 3) || 'F'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-zinc-900 truncate">{share.file?.original_filename || 'Encrypted File'}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] text-zinc-400">from <b className="text-zinc-600">@{share.sharer?.username}</b></span>
                                                        <span className="text-[10px] text-zinc-300">•</span>
                                                        <span className="text-[10px] text-zinc-400">{formatSize(share.file?.file_size)}</span>
                                                        <span className="text-[10px] text-zinc-300">•</span>
                                                        {permBadge(share.permission_mode)}
                                                        {statusBadge(share.status)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                                {share.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleAccept(share.id)} className="rounded-lg bg-zinc-900 px-4 py-1.5 text-[9px] font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-md">Accept</button>
                                                        <button onClick={() => handleReject(share.id)} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-50 transition-all">Decline</button>
                                                    </>
                                                )}
                                                {share.status === 'accepted' && (
                                                    <a href={`/preview/${share.id}`} className="rounded-lg bg-blue-600 px-4 py-1.5 text-[9px] font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                                                        Open
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* SENT TAB (Sender Dashboard) */}
                        {tab === 'sent' && (
                            sentShares.length === 0 ? (
                                <div className="py-20 text-center text-zinc-400 text-sm">You haven&apos;t shared any files yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {sentShares.map((share) => (
                                        <div key={share.id} className="rounded-2xl border border-zinc-200 bg-white p-5 hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-xs uppercase shadow-lg shadow-blue-500/20 shrink-0">
                                                        {share.file?.file_extension?.toUpperCase()?.slice(0, 3) || 'F'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-zinc-900 truncate">{share.file?.original_filename}</p>
                                                        <p className="text-[10px] text-zinc-400">to <b className="text-zinc-600">@{share.receiver?.username}</b> • {formatSize(share.file?.file_size)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {permBadge(share.permission_mode)}
                                                    {statusBadge(share.status)}
                                                </div>
                                            </div>

                                            {/* Blue Tick Tracking Area */}
                                            <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                                                <div className="flex items-center gap-6 text-[10px] font-bold">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={share.is_viewed ? 'text-blue-600' : 'text-zinc-300'}>👁️</span>
                                                        <span className={share.is_viewed ? 'text-blue-600' : 'text-zinc-400'}>
                                                            {share.is_viewed ? `Seen (${share.view_count}×)` : 'Not seen'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={share.is_downloaded ? 'text-emerald-600' : 'text-zinc-300'}>⬇️</span>
                                                        <span className={share.is_downloaded ? 'text-emerald-600' : 'text-zinc-400'}>
                                                            {share.is_downloaded ? `Downloaded (${share.download_count}×)` : 'Not downloaded'}
                                                        </span>
                                                    </div>
                                                    {share.last_access_at && (
                                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                                            🕒 {new Date(share.last_access_at).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                                {share.status === 'accepted' && (
                                                    <button onClick={() => handleRevoke(share.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-50 transition-all">
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default function SharedFilesPage() {
    return (
        <AuthGuard>
            <SharedFilesContent />
        </AuthGuard>
    );
}
