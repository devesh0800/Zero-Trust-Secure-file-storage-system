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
            
            {/* ═══ Premium Background Layer (Shared Vault) ═══ */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 hex-pattern opacity-[0.1]" />
                <div className="absolute top-[-5%] right-[5%] h-[550px] w-[550px] rounded-full bg-violet-600/5 blur-[140px] orb-1 morph-blob" />
                <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[130px] orb-2 morph-blob" />

                {/* Floating Wave Words */}
                <div className="absolute top-[18%] left-[8%] animate-security-wave opacity-20 transition-opacity duration-700">
                    <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">Vault-Lock Active</span>
                    </div>
                </div>

                <div className="absolute top-[45%] right-[12%] animate-security-wave opacity-15 transition-opacity duration-700" style={{ animationDelay: '3.5s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">E2EE Stream</span>
                    </div>
                </div>

                <div className="absolute bottom-[15%] left-[20%] animate-security-wave opacity-10 transition-opacity duration-700" style={{ animationDelay: '6s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-md">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Atomic Sharing</span>
                    </div>
                </div>

                {/* Particles */}
                <div className="floating-particle fp-2" />
                <div className="floating-particle fp-4" />
                <div className="floating-particle fp-6" />
                <div className="floating-particle fp-8" />
            </div>

            <BackgroundAnimation />

            <main className="relative z-10 mx-auto max-w-5xl px-4 pt-32 pb-16 sm:px-6">
                {/* Header */}
                <div className="stagger-1 mb-6 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-xl font-black text-white tracking-tight uppercase">Shared Files</h1>
                            <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 ring-1 ring-emerald-500/20">
                                <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Secure Transfer</span>
                            </div>
                        </div>
                        <p className="text-[12px] text-zinc-500 font-medium tracking-tight">Manage files you've shared or received</p>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-1.5 pb-1">
                            <div className="h-1 w-1 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Updating list...</span>
                        </div>
                    )}
                </div>

                {/* Feedback Toast */}
                {message.text && (
                    <div className={`stagger-2 mb-6 rounded-2xl px-5 py-3.5 text-[13px] font-bold flex items-center gap-3 transition-all duration-300 ${
                        message.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400 shadow-[0_0_6px_#f87171]'}`} />
                        {message.text.toUpperCase()}
                    </div>
                )}

                {/* Tabs */}
                <div className="stagger-3 flex gap-1.5 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
                    <button
                        onClick={() => setTab('received')}
                        className={`relative flex items-center gap-2 rounded-lg px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                            tab === 'received' ? 'bg-white/[0.08] text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Received Files
                        {pendingCount > 0 && (
                            <span className="inline-flex h-3.5 min-w-[15px] items-center justify-center rounded-md bg-rose-600 px-1 text-[7px] font-black text-white">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('sent')}
                        className={`relative flex items-center gap-2 rounded-lg px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                            tab === 'sent' ? 'bg-white/[0.08] text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Sent Files
                    </button>
                </div>

                {isLoading ? (
                    <div className="stagger-4 flex flex-col items-center justify-center py-24 rounded-[3rem] border border-white/[0.04] bg-white/[0.01]">
                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-violet-500/10 border-t-violet-500" />
                        <p className="mt-6 text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Loading shared content...</p>
                    </div>
                ) : (
                    <>
                        {/* ═══ RECEIVED TAB ═══ */}
                        {tab === 'received' && (
                            receivedShares.length === 0 ? (
                                <div className="stagger-4 flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-800 mb-5 transition-transform duration-500 hover:scale-110">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">No Files Found</p>
                                    <p className="mt-1 text-[9px] text-zinc-700 font-bold uppercase tracking-wider">You haven't received any shared files yet</p>
                                </div>
                            ) : (
                                <div className="stagger-4 space-y-3">
                                    {receivedShares.map((share) => (
                                        <div key={share.id} className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4.5 flex items-center justify-between transition-all duration-500 hover:border-violet-500/30 hover:bg-white/[0.04] glass-card">
                                            <div className="flex items-center gap-4 flex-1 min-w-0 z-10">
                                                {/* File Icon */}
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-lg shadow-lg shadow-indigo-600/20 shrink-0 transition-transform duration-500 group-hover:scale-110">
                                                    {getFileIcon(share.file?.file_extension)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-bold text-white uppercase tracking-wide group-hover:text-violet-300 transition-colors truncate">{share.file?.original_filename || 'Encrypted File'}</p>
                                                    <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Origin: <span className="text-violet-400">@{share.sharer?.username}</span></span>
                                                        <span className="h-0.5 w-0.5 rounded-full bg-zinc-800" />
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{formatSize(share.file?.file_size)}</span>
                                                        <span className="h-0.5 w-0.5 rounded-full bg-zinc-800" />
                                                        {permBadge(share.permission_mode)}
                                                        {statusBadge(share.status)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 shrink-0 z-10 transition-all duration-300 opacity-60 group-hover:opacity-100">
                                                {share.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleAccept(share.id)} className="rounded-lg bg-white px-4 py-2 text-[9px] font-black text-black uppercase tracking-widest transition-all duration-300 hover:brightness-110 active:scale-95">
                                                            Authorize
                                                        </button>
                                                        <button onClick={() => handleReject(share.id)} className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest transition-all duration-300 hover:text-white">
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {share.status === 'accepted' && (
                                                    <a href={`/preview/${share.id}`} className="group/open flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-violet-600/20 transition-all duration-300 hover:bg-violet-500 active:scale-95">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                        </svg>
                                                        Access
                                                    </a>
                                                )}
                                            </div>
                                            {/* Decorative wave line */}
                                            <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-transparent via-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ═══ SENT TAB ═══ */}
                        {tab === 'sent' && (
                            sentShares.length === 0 ? (
                                <div className="stagger-4 flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-800 mb-5 transition-transform duration-500 hover:scale-110">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Inbox Empty</p>
                                    <p className="mt-1 text-[9px] text-zinc-700 font-bold uppercase tracking-wider">You haven't shared any files with others yet</p>
                                </div>
                            ) : (
                                <div className="stagger-4 space-y-3">
                                    {sentShares.map((share) => (
                                        <div key={share.id} className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 hover:border-cyan-500/30 hover:bg-white/[0.04] glass-card">
                                            {/* File Info Row */}
                                            <div className="p-4.5 flex items-center justify-between z-10 relative">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 text-lg shadow-lg shadow-blue-600/20 shrink-0 transition-transform duration-500 group-hover:scale-110">
                                                        {getFileIcon(share.file?.file_extension)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-white uppercase tracking-wide group-hover:text-cyan-300 transition-colors truncate">{share.file?.original_filename}</p>
                                                        <p className="text-[9px] font-bold text-zinc-500 mt-1.5 uppercase tracking-widest">Recipient: <span className="text-cyan-400">@{share.receiver?.username}</span> · {formatSize(share.file?.file_size)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0 ml-4">
                                                    {permBadge(share.permission_mode)}
                                                    {statusBadge(share.status)}
                                                </div>
                                            </div>

                                            {/* Tracking Bar */}
                                            <div className="flex items-center justify-between px-4.5 py-3 bg-white/[0.01] border-t border-white/[0.04] z-10 relative">
                                                <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-widest">
                                                    {/* View Status */}
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`flex h-5 w-5 items-center justify-center rounded-md transition-all duration-500 ${share.is_viewed ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.03] text-zinc-800'}`}>
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                            </svg>
                                                        </div>
                                                        <span className={share.is_viewed ? 'text-cyan-400' : 'text-zinc-700'}>
                                                            {share.is_viewed ? `Seen (${share.view_count})` : 'Unseen'}
                                                        </span>
                                                    </div>

                                                    {/* Download Status */}
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`flex h-5 w-5 items-center justify-center rounded-md transition-all duration-500 ${share.is_downloaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.03] text-zinc-800'}`}>
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                            </svg>
                                                        </div>
                                                        <span className={share.is_downloaded ? 'text-emerald-400' : 'text-zinc-700'}>
                                                            {share.is_downloaded ? `Saved (${share.download_count})` : 'Stashed'}
                                                        </span>
                                                    </div>

                                                    {/* Last Access */}
                                                    {share.last_access_at && (
                                                        <div className="flex items-center gap-1.5 text-zinc-700">
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>{new Date(share.last_access_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {share.status === 'accepted' && (
                                                    <button onClick={() => handleRevoke(share.id)} className="flex items-center gap-1.5 rounded-lg border border-rose-500/10 bg-rose-500/[0.04] px-3.5 py-1.5 text-[9px] font-black text-rose-500/80 uppercase tracking-widest transition-all hover:bg-rose-500 hover:text-white">
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                            {/* Decorative wave line */}
                                            <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
