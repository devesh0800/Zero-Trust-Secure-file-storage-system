'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import BackgroundAnimation from '../components/BackgroundAnimation';

function ConnectionsContent() {
    const { user } = useAuth();
    const [connections, setConnections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [identifier, setIdentifier] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [safetyModal, setSafetyModal] = useState<{ id: string; number: string } | null>(null);
    const [tab, setTab] = useState<'active' | 'pending' | 'sent'>('active');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const fetchConnections = async () => {
        setIsLoading(true);
        try {
            const data = await api.getConnections();
            setConnections(data);
        } catch { /* empty */ }
        setIsLoading(false);
    };

    useEffect(() => { fetchConnections(); }, []);

    const handleSendRequest = async () => {
        if (!identifier.trim()) return;
        try {
            await api.sendConnectionRequest(identifier.trim());
            showMessage('success', `Connection request sent to ${identifier}!`);
            setIdentifier('');
            fetchConnections();
        } catch (err: any) {
            showMessage('error', err.message || 'Failed to send request.');
        }
    };

    const handleAccept = async (id: string) => {
        try { await api.acceptConnection(id); showMessage('success', 'Connection accepted!'); fetchConnections(); }
        catch (err: any) { showMessage('error', err.message); }
    };

    const handleReject = async (id: string) => {
        try { await api.rejectConnection(id); showMessage('success', 'Connection rejected.'); fetchConnections(); }
        catch (err: any) { showMessage('error', err.message); }
    };

    const handleRevoke = async (id: string) => {
        try { await api.revokeConnection(id); showMessage('success', 'Connection removed.'); fetchConnections(); }
        catch (err: any) { showMessage('error', err.message); }
    };

    const handleShowSafety = async (id: string) => {
        try { const data = await api.getSafetyNumber(id); setSafetyModal({ id, number: data.safety_number }); }
        catch (err: any) { showMessage('error', err.message); }
    };

    const handleVerify = async (id: string) => {
        try { await api.verifyConnection(id); showMessage('success', 'Connection verified with Safety Number!'); setSafetyModal(null); fetchConnections(); }
        catch (err: any) { showMessage('error', err.message); }
    };

    const filtered = connections.filter(c => {
        if (tab === 'active') return c.status === 'active';
        if (tab === 'pending') return c.status === 'pending' && c.direction === 'received';
        if (tab === 'sent') return c.status === 'pending' && c.direction === 'sent';
        return true;
    });

    const pendingCount = connections.filter(c => c.status === 'pending' && c.direction === 'received').length;
    const activeCount = connections.filter(c => c.status === 'active').length;

    return (
        <div className="min-h-screen bg-[#050508]">
            <Navbar />
            <BackgroundAnimation />

            <main className={`relative mx-auto max-w-4xl px-4 pt-32 pb-16 sm:px-6 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Trusted Connections</h1>
                        <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2 py-1 ring-1 ring-cyan-500/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">{activeCount} Active</span>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500">Only verified connections can securely share end-to-end encrypted files.</p>
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

                {/* Send Request Card */}
                <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-3">
                        <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                        Send Connection Request
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                            placeholder="Enter Unique ID, Email, or Username"
                            className="input-glow flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none"
                        />
                        <button
                            onClick={handleSendRequest}
                            className="btn-premium rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-[11px] font-bold text-white uppercase tracking-wider shadow-[0_4px_20px_rgba(6,182,212,0.2)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-[0.97]"
                        >
                            Connect
                        </button>
                    </div>
                    {user?.unique_share_id && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
                            <span>Your ID:</span>
                            <code className="font-bold text-cyan-400 tracking-wider bg-cyan-500/5 px-2 py-0.5 rounded-md ring-1 ring-cyan-500/10">{user.unique_share_id}</code>
                            <button
                                onClick={() => { navigator.clipboard.writeText(user.unique_share_id || ''); showMessage('success', 'ID copied!'); }}
                                className="text-zinc-500 hover:text-cyan-400 transition-colors"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
                    {(['active', 'pending', 'sent'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`relative rounded-lg px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                tab === t
                                    ? 'bg-white/[0.08] text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {t === 'active' ? 'Active' : t === 'pending' ? 'Incoming' : 'Sent'}
                            {t === 'pending' && pendingCount > 0 && (
                                <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Connection List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
                        <p className="mt-4 text-xs text-zinc-500 font-medium">Loading connections...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-700 mb-4">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-zinc-400">No {tab === 'pending' ? 'incoming' : tab} connections</p>
                        <p className="mt-1 text-xs text-zinc-600">Send a request using someone&apos;s Unique ID or email.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filtered.map((conn) => (
                            <div key={conn.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center justify-between transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.03]">
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase shadow-lg shadow-cyan-500/15">
                                            {conn.peer?.full_name?.[0] || conn.peer?.username?.[0] || '?'}
                                        </div>
                                        {conn.is_verified && (
                                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#050508] flex items-center justify-center">
                                                <div className="h-3 w-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                    <svg className="h-2 w-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-white truncate">{conn.peer?.full_name || conn.peer?.username}</p>
                                            {conn.is_verified && (
                                                <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                                                    <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                            @{conn.peer?.username} · <span className="text-cyan-400/70 font-medium">{conn.peer?.unique_share_id}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    {conn.status === 'active' && (
                                        <>
                                            <button onClick={() => handleShowSafety(conn.id)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-bold text-zinc-400 transition-all duration-200 hover:border-cyan-500/30 hover:text-cyan-400 hover:bg-cyan-500/5">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                                                </svg>
                                                Safety №
                                            </button>
                                            <button onClick={() => handleRevoke(conn.id)} className="flex items-center gap-1.5 rounded-lg border border-red-500/10 bg-red-500/[0.03] px-3 py-2 text-[10px] font-bold text-red-400/70 transition-all duration-200 hover:border-red-500/25 hover:text-red-400 hover:bg-red-500/[0.06]">
                                                Remove
                                            </button>
                                        </>
                                    )}
                                    {conn.status === 'pending' && conn.direction === 'received' && (
                                        <>
                                            <button onClick={() => handleAccept(conn.id)} className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-[10px] font-bold text-white shadow-md shadow-cyan-500/15 transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                                                Accept
                                            </button>
                                            <button onClick={() => handleReject(conn.id)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] font-bold text-zinc-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
                                                Decline
                                            </button>
                                        </>
                                    )}
                                    {conn.status === 'pending' && conn.direction === 'sent' && (
                                        <div className="flex items-center gap-1.5 px-3 py-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                            <span className="text-[10px] font-bold text-amber-400/70">Awaiting response</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Safety Number Modal */}
            {safetyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0c0c14]/95 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl text-center">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-white mb-1">Safety Number</h2>
                        <p className="text-[11px] text-zinc-500 mb-6">Compare this code with your contact via call or message. If it matches, click Verify.</p>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 mb-6">
                            <p className="text-2xl font-bold text-white tracking-[0.35em] font-mono">{safetyModal.number}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSafetyModal(null)} className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-[11px] font-bold text-zinc-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
                                Close
                            </button>
                            <button onClick={() => handleVerify(safetyModal.id)} className="flex-[2] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-[11px] font-bold text-white shadow-lg shadow-emerald-500/15 transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                                ✓ Mark Verified
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ConnectionsPage() {
    return (
        <AuthGuard>
            <ConnectionsContent />
        </AuthGuard>
    );
}
