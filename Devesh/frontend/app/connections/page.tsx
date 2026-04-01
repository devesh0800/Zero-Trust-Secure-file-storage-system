'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';

function ConnectionsContent() {
    const { user } = useAuth();
    const [connections, setConnections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [identifier, setIdentifier] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [safetyModal, setSafetyModal] = useState<{ id: string; number: string } | null>(null);
    const [tab, setTab] = useState<'active' | 'pending' | 'sent'>('active');

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
        try {
            await api.acceptConnection(id);
            showMessage('success', 'Connection accepted!');
            fetchConnections();
        } catch (err: any) { showMessage('error', err.message); }
    };

    const handleReject = async (id: string) => {
        try {
            await api.rejectConnection(id);
            showMessage('success', 'Connection rejected.');
            fetchConnections();
        } catch (err: any) { showMessage('error', err.message); }
    };

    const handleRevoke = async (id: string) => {
        try {
            await api.revokeConnection(id);
            showMessage('success', 'Connection removed.');
            fetchConnections();
        } catch (err: any) { showMessage('error', err.message); }
    };

    const handleShowSafety = async (id: string) => {
        try {
            const data = await api.getSafetyNumber(id);
            setSafetyModal({ id, number: data.safety_number });
        } catch (err: any) { showMessage('error', err.message); }
    };

    const handleVerify = async (id: string) => {
        try {
            await api.verifyConnection(id);
            showMessage('success', 'Connection verified with Safety Number!');
            setSafetyModal(null);
            fetchConnections();
        } catch (err: any) { showMessage('error', err.message); }
    };

    const filtered = connections.filter(c => {
        if (tab === 'active') return c.status === 'active';
        if (tab === 'pending') return c.status === 'pending' && c.direction === 'received';
        if (tab === 'sent') return c.status === 'pending' && c.direction === 'sent';
        return true;
    });

    const pendingCount = connections.filter(c => c.status === 'pending' && c.direction === 'received').length;

    return (
        <div className="min-h-screen bg-zinc-50">
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 pt-36 pb-12">
                {/* Header */}
                <div className="mb-8 border-b border-zinc-200 pb-8">
                    <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">Trusted Connections</h1>
                    <p className="text-sm text-zinc-400 mt-1 font-medium italic">Only verified and connected users can securely share end-to-end encrypted files.</p>
                </div>

                {/* Feedback */}
                {message.text && (
                    <div className={`mb-6 rounded-2xl px-6 py-4 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {message.text}
                    </div>
                )}

                {/* Search / Send Request */}
                <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Send Connection Request</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                            placeholder="Enter Unique ID, Email, or Username"
                            className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 outline-none focus:border-blue-500 transition-all"
                        />
                        <button
                            onClick={handleSendRequest}
                            className="rounded-xl bg-zinc-900 px-8 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10"
                        >
                            Connect
                        </button>
                    </div>
                    {user?.unique_share_id && (
                        <p className="mt-3 text-[10px] text-zinc-400">
                            Your Unique ID: <span className="font-black text-blue-600 tracking-widest">{user.unique_share_id}</span>
                            <button
                                onClick={() => { navigator.clipboard.writeText(user.unique_share_id || ''); showMessage('success', 'ID copied!'); }}
                                className="ml-2 text-zinc-400 hover:text-blue-600 underline"
                            >copy</button>
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['active', 'pending', 'sent'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                                tab === t
                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10'
                                    : 'bg-white text-zinc-400 border border-zinc-200 hover:bg-zinc-50'
                            }`}
                        >
                            {t}
                            {t === 'pending' && pendingCount > 0 && (
                                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Connection List */}
                {isLoading ? (
                    <div className="py-20 text-center text-zinc-400 text-sm">Loading connections...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                        </div>
                        <p className="text-sm font-bold text-zinc-400">No {tab} connections</p>
                        <p className="text-[10px] text-zinc-300 mt-1">Send a request using someone&apos;s Unique ID or email.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((conn) => (
                            <div key={conn.id} className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center justify-between hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm uppercase shadow-lg shadow-blue-500/20">
                                        {conn.peer?.full_name?.[0] || conn.peer?.username?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">{conn.peer?.full_name || conn.peer?.username}</p>
                                        <p className="text-[10px] text-zinc-400 font-medium">
                                            @{conn.peer?.username} &middot; ID: <span className="font-bold text-blue-600">{conn.peer?.unique_share_id}</span>
                                            {conn.is_verified && <span className="ml-2 text-emerald-500 font-black">✔ Verified</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {conn.status === 'active' && (
                                        <>
                                            <button onClick={() => handleShowSafety(conn.id)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all">
                                                Safety №
                                            </button>
                                            <button onClick={() => handleRevoke(conn.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-50 transition-all">
                                                Remove
                                            </button>
                                        </>
                                    )}
                                    {conn.status === 'pending' && conn.direction === 'received' && (
                                        <>
                                            <button onClick={() => handleAccept(conn.id)} className="rounded-lg bg-zinc-900 px-4 py-1.5 text-[9px] font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-md">
                                                Accept
                                            </button>
                                            <button onClick={() => handleReject(conn.id)} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-50 transition-all">
                                                Decline
                                            </button>
                                        </>
                                    )}
                                    {conn.status === 'pending' && conn.direction === 'sent' && (
                                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Awaiting...</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Safety Number Modal */}
            {safetyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        </div>
                        <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight mb-2">Safety Number</h2>
                        <p className="text-[10px] text-zinc-400 mb-6">Compare this code with your contact via call or message. If it matches, click Verify.</p>
                        <div className="rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 p-6 mb-6">
                            <p className="text-2xl font-black text-zinc-900 tracking-[0.3em] font-mono">{safetyModal.number}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSafetyModal(null)} className="flex-1 rounded-2xl border border-zinc-200 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-50 transition-all">
                                Close
                            </button>
                            <button onClick={() => handleVerify(safetyModal.id)} className="flex-[2] rounded-2xl bg-emerald-500 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                ✔ Mark Verified
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
