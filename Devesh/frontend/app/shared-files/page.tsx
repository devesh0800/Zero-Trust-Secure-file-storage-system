'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import BackgroundAnimation from '../components/BackgroundAnimation';

function SharedFilesContent() {
    const { user } = useAuth();
    const [tab, setTab] = useState<'sent' | 'received'>('received');
    const [sentShares, setSentShares] = useState<any[]>([]);
    const [receivedShares, setReceivedShares] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

    const showMsg = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const results = await Promise.allSettled([api.getSentShares(), api.getReceivedShares()]);
            if (results[0].status === 'fulfilled') setSentShares(results[0].value);
            else console.error('Error fetching sent shares:', results[0].reason);
            if (results[1].status === 'fulfilled') setReceivedShares(results[1].value);
            else { console.error('Error fetching received shares:', results[1].reason); showMsg('error', 'Failed to load received files.'); }
        } catch (e: any) { console.error('FetchData error:', e); }
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
            read:        { label: 'Read Only',   cls: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
            edit:        { label: 'Edit',        cls: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
            view_once:   { label: 'View Once',   cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/20' },
            no_download: { label: 'No Download', cls: 'bg-purple-500/10 text-purple-400 ring-purple-500/20' },
        };
        const b = map[mode] || map.read;
        return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ring-1 ${b.cls}`}>{b.label}</span>;
    };

    const statusBadge = (status: string) => {
        const map: Record<string, { cls: string; dot: string }> = {
            pending:  { cls: 'text-amber-400',   dot: 'bg-amber-400' },
            accepted: { cls: 'text-emerald-400', dot: 'bg-emerald-400 shadow-[0_0_4px_#34d399]' },
            revoked:  { cls: 'text-red-400',     dot: 'bg-red-400' },
            expired:  { cls: 'text-zinc-500',    dot: 'bg-zinc-500' },
        };
        const s = map[status] || map.pending;
        return (
            <span className={`inline-flex items-center gap-1 rounded-md bg-white/[0.03] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ring-1 ring-white/[0.04] ${s.cls}`}>
                <div className={`h-1 w-1 rounded-full ${s.dot}`} />
                {status}
            </span>
        );
    };

    const pendingCount = receivedShares.filter(s => s.status === 'pending').length;

    const getFileIcon = (ext: string) => {
        const extension = ext?.toLowerCase();
        if (['jpg','jpeg','png','gif','webp','svg'].includes(extension)) return '🖼';
        if (['pdf'].includes(extension)) return '📄';
        if (['doc','docx'].includes(extension)) return '📝';
        if (['mp4','mov','avi'].includes(extension)) return '🎬';
        if (['zip','rar','7z'].includes(extension)) return '📦';
        return '📎';
    };

    return (
        <div className="min-h-screen bg-[#050508]">
            <Navbar />
            <BackgroundAnimation />

            <main className={`relative mx-auto max-w-5xl px-4 pt-32 pb-16 sm:px-6 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {/* Header */}
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-white tracking-tight">Shared Files</h1>
                            <div className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-2 py-1 ring-1 ring-violet-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400">E2EE</span>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500">Manage your secure end-to-end encrypted file transfers.</p>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Syncing...</span>
                        </div>
                    )}
                </div>

                {/* Feedback Toast */}
                {message.text && (
                    <div className={`mb-6 rounded-xl px-5 py-3.5 text-sm font-medium flex items-center gap-3 transition-all duration-300 ${
                        message.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400 shadow-[0_0_6px_#f87171]'}`} />
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1.5 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
                    <button
                        onClick={() => setTab('received')}
                        className={`relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                            tab === 'received' ? 'bg-white/[0.08] text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)]' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Received
                        {pendingCount > 0 && (
                            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('sent')}
                        className={`relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                            tab === 'sent' ? 'bg-white/[0.08] text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)]' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Sent
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
                        <p className="mt-4 text-xs text-zinc-500 font-medium">Decrypting transfers...</p>
                    </div>
                ) : (
                    <>
                        {/* ═══ RECEIVED TAB ═══ */}
                        {tab === 'received' && (
                            receivedShares.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-700 mb-4">
                                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-400">No files shared with you yet</p>
                                    <p className="mt-1 text-xs text-zinc-600">Files shared by connections will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {receivedShares.map((share) => (
                                        <div key={share.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center justify-between transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.03]">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* File Icon */}
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg shadow-lg shadow-indigo-500/15 shrink-0">
                                                    {getFileIcon(share.file?.file_extension)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-white truncate">{share.file?.original_filename || 'Encrypted File'}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <span className="text-[11px] text-zinc-500">from <span className="font-medium text-zinc-400">@{share.sharer?.username}</span></span>
                                                        <span className="text-zinc-700">·</span>
                                                        <span className="text-[11px] text-zinc-500">{formatSize(share.file?.file_size)}</span>
                                                        <span className="text-zinc-700">·</span>
                                                        {permBadge(share.permission_mode)}
                                                        {statusBadge(share.status)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                                {share.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleAccept(share.id)} className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-[10px] font-bold text-white shadow-md shadow-violet-500/15 transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                                                            Accept
                                                        </button>
                                                        <button onClick={() => handleReject(share.id)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] font-bold text-zinc-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
                                                            Decline
                                                        </button>
                                                    </>
                                                )}
                                                {share.status === 'accepted' && (
                                                    <a href={`/preview/${share.id}`} className="group/open flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-[10px] font-bold text-white shadow-md shadow-violet-500/15 transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                                                        <svg className="h-3.5 w-3.5 transition-transform group-hover/open:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                        </svg>
                                                        Open
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ═══ SENT TAB ═══ */}
                        {tab === 'sent' && (
                            sentShares.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-700 mb-4">
                                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-400">You haven&apos;t shared any files yet</p>
                                    <p className="mt-1 text-xs text-zinc-600">Share files from your dashboard to track them here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {sentShares.map((share) => (
                                        <div key={share.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.03] overflow-hidden">
                                            {/* File Info Row */}
                                            <div className="p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg shadow-lg shadow-blue-500/15 shrink-0">
                                                        {getFileIcon(share.file?.file_extension)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white truncate">{share.file?.original_filename}</p>
                                                        <p className="text-[11px] text-zinc-500 mt-0.5">to <span className="font-medium text-zinc-400">@{share.receiver?.username}</span> · {formatSize(share.file?.file_size)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                                    {permBadge(share.permission_mode)}
                                                    {statusBadge(share.status)}
                                                </div>
                                            </div>

                                            {/* Tracking Bar */}
                                            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.01] border-t border-white/[0.04]">
                                                <div className="flex items-center gap-5 text-[11px]">
                                                    {/* View Status */}
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`flex h-5 w-5 items-center justify-center rounded-md ${share.is_viewed ? 'bg-blue-500/10 text-blue-400' : 'bg-white/[0.03] text-zinc-600'}`}>
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </div>
                                                        <span className={`font-medium ${share.is_viewed ? 'text-blue-400' : 'text-zinc-600'}`}>
                                                            {share.is_viewed ? `Seen (${share.view_count}×)` : 'Not seen'}
                                                        </span>
                                                    </div>

                                                    {/* Download Status */}
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`flex h-5 w-5 items-center justify-center rounded-md ${share.is_downloaded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.03] text-zinc-600'}`}>
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                            </svg>
                                                        </div>
                                                        <span className={`font-medium ${share.is_downloaded ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                                            {share.is_downloaded ? `Downloaded (${share.download_count}×)` : 'Not downloaded'}
                                                        </span>
                                                    </div>

                                                    {/* Last Access */}
                                                    {share.last_access_at && (
                                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                                            <svg className="h-3 w-3 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-medium text-zinc-500">{new Date(share.last_access_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {share.status === 'accepted' && (
                                                    <button onClick={() => handleRevoke(share.id)} className="flex items-center gap-1.5 rounded-lg border border-red-500/10 bg-red-500/[0.03] px-3 py-1.5 text-[10px] font-bold text-red-400/70 transition-all duration-200 hover:border-red-500/25 hover:text-red-400 hover:bg-red-500/[0.06]">
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
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
