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
            
            {/* ═══ Premium Background Layer (Floating Waves) ═══ */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 hex-pattern opacity-[0.12]" />
                <div className="absolute top-[10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-cyan-600/5 blur-[120px] orb-1 morph-blob" />
                <div className="absolute bottom-[5%] right-[-5%] h-[450px] w-[450px] rounded-full bg-blue-600/5 blur-[100px] orb-2 morph-blob" />

                {/* Floating Wave Words */}
                <div className="absolute top-[20%] right-[15%] animate-security-wave opacity-20 transition-opacity duration-700">
                    <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Net-Protocol v4</span>
                    </div>
                </div>

                <div className="absolute bottom-[25%] left-[10%] animate-security-wave opacity-15 transition-opacity duration-700" style={{ animationDelay: '4s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">Identity Guard</span>
                    </div>
                </div>

                <div className="absolute top-[40%] left-[25%] animate-security-wave opacity-10 transition-opacity duration-700" style={{ animationDelay: '2.5s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-md">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Peer-to-Peer</span>
                    </div>
                </div>

                {/* Particles */}
                <div className="floating-particle fp-1" />
                <div className="floating-particle fp-3" />
                <div className="floating-particle fp-5" />
                <div className="floating-particle fp-7" />
            </div>

            <BackgroundAnimation />

            <main className="relative z-10 mx-auto max-w-4xl px-4 pt-32 pb-16 sm:px-6">
                {/* Header */}
                <div className="stagger-1 mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase">Your Connections</h1>
                        <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1 ring-1 ring-cyan-500/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{activeCount} People Online</span>
                        </div>
                    </div>
                    <p className="text-[13px] text-zinc-500 font-medium tracking-tight">Stay connected and share files securely with your trusted contacts.</p>
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

                {/* Send Request Card */}
                <div className="stagger-3 mb-8 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 glass-card">
                    <label className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em] mb-4">
                        <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        Add New Connection
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                            placeholder="Enter Node ID, Email, or Username"
                            className="input-glow flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px] text-white placeholder-zinc-700 outline-none focus:bg-white/[0.05]"
                        />
                        <button
                            onClick={handleSendRequest}
                            className="btn-premium rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-cyan-600/20 transition-all duration-300 hover:shadow-cyan-600/40 active:scale-[0.97]"
                        >
                            Connect
                        </button>
                    </div>
                    {user?.unique_share_id && (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                            <span>Your Account ID:</span>
                            <code className="text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg ring-1 ring-cyan-500/20">{user.unique_share_id}</code>
                            <button
                                onClick={() => { navigator.clipboard.writeText(user.unique_share_id || ''); showMessage('success', 'ID copied!'); }}
                                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
                                title="Copy ID"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="stagger-4 flex gap-1.5 mb-8 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.04] w-fit">
                    {(['active', 'pending', 'sent'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`relative rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                tab === t
                                    ? 'bg-white/[0.08] text-white shadow-xl'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {t === 'active' ? 'Active' : t === 'pending' ? 'Requests' : 'Sent'}
                            {t === 'pending' && pendingCount > 0 && (
                                <span className="ml-2 inline-flex h-4 min-w-[17px] items-center justify-center rounded-full bg-rose-600 px-1 text-[8px] font-black text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Connection List */}
                {isLoading ? (
                    <div className="stagger-5 flex flex-col items-center justify-center py-24 rounded-[3rem] border border-white/[0.04] bg-white/[0.01]">
                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-cyan-500/10 border-t-cyan-500" />
                        <p className="mt-6 text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Syncing connections...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="stagger-5 flex flex-col items-center justify-center py-24 rounded-[3rem] border border-dashed border-white/[0.08] bg-white/[0.01]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/[0.03] text-zinc-800 mb-6 transition-transform duration-500 hover:scale-110">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Connections Yet</p>
                        <p className="mt-2 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Share your ID with friends to begin connecting</p>
                    </div>
                ) : (
                <div className="stagger-5 space-y-3">
                    {filtered.map((conn) => (
                        <div key={conn.id} className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4.5 flex items-center justify-between transition-all duration-500 hover:border-cyan-500/30 hover:bg-white/[0.04] glass-card">
                            <div className="flex items-center gap-4 min-w-0 z-10">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-black text-sm transition-all duration-500 group-hover:scale-110 shadow-lg shadow-cyan-600/20">
                                        {conn.peer?.full_name?.[0] || conn.peer?.username?.[0] || '?'}
                                    </div>
                                    {conn.is_verified && (
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#050508] flex items-center justify-center p-0.5">
                                            <div className="h-full w-full rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                                <svg className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2.5">
                                        <p className="text-[13px] font-bold text-white uppercase tracking-wide group-hover:text-cyan-300 transition-colors">{conn.peer?.full_name || conn.peer?.username}</p>
                                        {conn.is_verified && (
                                            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-emerald-400 ring-1 ring-emerald-500/20">
                                                <div className="h-1 w-1 rounded-full bg-emerald-400" />
                                                VERIFIED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                                        <span className="text-zinc-600">Username:</span> @{conn.peer?.username} · <span className="text-zinc-400">User ID:</span> <span className="text-cyan-500/70 font-black">{conn.peer?.unique_share_id}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0 ml-4 z-10 transition-all duration-300 translate-x-2 opacity-50 group-hover:translate-x-0 group-hover:opacity-100">
                                {conn.status === 'active' && (
                                    <>
                                        <button onClick={() => handleShowSafety(conn.id)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest transition-all duration-300 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/10">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                                            </svg>
                                            Verify
                                        </button>
                                        <button onClick={() => handleRevoke(conn.id)} className="flex items-center gap-1.5 rounded-lg border border-rose-500/10 bg-rose-500/[0.04] px-3 py-2 text-[9px] font-black text-rose-500/60 uppercase tracking-widest transition-all duration-300 hover:border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/[0.08]">
                                            Remove
                                        </button>
                                    </>
                                )}
                                {conn.status === 'pending' && conn.direction === 'received' && (
                                    <>
                                        <button onClick={() => handleAccept(conn.id)} className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-cyan-600/20 transition-all duration-300 hover:brightness-110 active:scale-[0.97]">
                                            Accept
                                        </button>
                                        <button onClick={() => handleReject(conn.id)} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest transition-all duration-300 hover:bg-white/[0.08] hover:text-white">
                                            Decline
                                        </button>
                                    </>
                                )}
                                {conn.status === 'pending' && conn.direction === 'sent' && (
                                    <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                                        <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">Sending Request...</span>
                                    </div>
                                )}
                            </div>
                            {/* Wave interaction decorative line */}
                            <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
                        <h2 className="text-lg font-bold text-white mb-1">Verify Connection</h2>
                        <p className="text-[11px] text-zinc-500 mb-6">Confirm this code matches with your friend's screen. If it's correct, mark as verified.</p>
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
