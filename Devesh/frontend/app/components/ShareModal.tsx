'use client';

import { useState, useEffect } from 'react';
import * as api from '@/lib/api';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShare: (options: { password?: string, expiresAt?: string }) => Promise<string | null>;
    fileName: string;
    fileId: string;
}

export default function ShareModal({ isOpen, onClose, onShare, fileName, fileId }: ShareModalProps) {
    const [activeTab, setActiveTab] = useState<'platform' | 'public' | 'private'>('platform');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasAttemptedSearch, setHasAttemptedSearch] = useState(false);
    const [password, setPassword] = useState('');
    const [expiry, setExpiry] = useState('24h');
    const [showPassword, setShowPassword] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    // Search users on platform
    useEffect(() => {
        const searchUsers = async () => {
            if (searchTerm.length < 3) {
                setSearchResults([]);
                setHasAttemptedSearch(false);
                return;
            }
            setIsSearching(true);
            try {
                const users = await api.searchUsers(searchTerm);
                setSearchResults(users || []);
                setHasAttemptedSearch(true);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(searchUsers, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    if (!isOpen) return null;

    const handlePublicShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        let expiresAt: string | undefined;
        const now = new Date();
        if (expiry === '1h') expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        else if (expiry === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        else if (expiry === '7d') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        try {
            const link = await onShare({ password: password || undefined, expiresAt });
            if (link) setGeneratedLink(link);
        } catch (err) {
            console.error('Link generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlatformShare = async (receiverId: string) => {
        setIsGenerating(true);
        try {
            await api.createAdvancedShare({
                fileId,
                receiverId,
                encryptedAesKey: 'AUTO_GENERATED',
                permissionMode: 'read'
            });
            alert('File shared successfully with user!');
            onClose();
        } catch (err) {
            alert('Platform share failed. Make sure you are connected with this user.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRestrictAccess = async () => {
        setIsRevoking(true);
        try {
            await api.revokeAllShares(fileId);
            alert('All access points for this file have been terminated. It is now private.');
            onClose();
        } catch (err) {
            alert('Failed to restrict access. Please try again.');
        } finally {
            setIsRevoking(false);
        }
    };

    const handleClose = () => {
        setGeneratedLink(null);
        setSearchTerm('');
        setPassword('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-[380px] overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#0c0c0e] shadow-2xl animate-in zoom-in-95 duration-300 glass-card">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-600/10 p-6 border-b border-white/[0.04] relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 h-32 w-32 bg-indigo-500/10 blur-[50px] rounded-full" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Protocol Dispatch</h2>
                            <p className="text-[14px] font-bold text-white mt-0.5 truncate max-w-[250px] tracking-tight">{fileName}</p>
                        </div>
                        <button onClick={handleClose} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Multi-Tab Selector */}
                    <div className="flex gap-1.5 rounded-xl bg-white/[0.02] p-1 border border-white/[0.04]">
                        {(['platform', 'public', 'private'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setGeneratedLink(null); }}
                                className={`flex-1 rounded-lg py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab 
                                    ? 'bg-white/[0.05] text-white shadow-lg border border-white/10' 
                                    : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                {tab === 'platform' ? 'Platform' : tab === 'public' ? 'Public' : 'Purge'}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[250px]">
                        {activeTab === 'platform' && (
                            <div className="space-y-5 animate-in slide-in-from-left-4 duration-500">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Scan identity (email/username)..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.01] px-5 py-4 text-[13px] font-bold text-white placeholder:text-zinc-700 focus:border-indigo-500/50 outline-none transition-all focus:bg-white/[0.03]"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-indigo-400 transition-colors">
                                        {isSearching ? (
                                            <div className="h-3.5 w-3.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        ) : (
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-56 overflow-y-auto no-scrollbar space-y-3 pr-1">
                                    {isSearching ? (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                            <div className="h-8 w-8 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">Decoding Network Labels...</p>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((user) => {
                                            const status = user.connection_status;
                                            const isConnected = status === 'active';
                                            const isPending = status === 'pending';

                                            return (
                                                <div 
                                                    key={user.id}
                                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all group/user"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 group-hover/user:scale-110 transition-transform">
                                                            {user.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-black text-white uppercase tracking-tight">@{user.username}</p>
                                                            <p className="text-[9px] text-zinc-600 font-bold">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    {isConnected ? (
                                                        <button 
                                                            onClick={() => handlePlatformShare(user.id)}
                                                            className="px-3 py-2 rounded-lg bg-indigo-600 text-[8px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all"
                                                        >
                                                            DISPATCH
                                                        </button>
                                                    ) : isPending ? (
                                                        <span className="px-3 py-2 text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 rounded-lg border border-amber-500/20">
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await api.sendConnectionRequest(user.username);
                                                                    const users = await api.searchUsers(searchTerm);
                                                                    setSearchResults(users || []);
                                                                } catch (err) { alert('Sync failed'); }
                                                            }}
                                                            className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[8px] font-black text-white uppercase tracking-widest hover:bg-white/[0.1] transition-all"
                                                        >
                                                            CONNECT
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : hasAttemptedSearch ? (
                                        <div className="py-12 text-center space-y-2">
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Null Reference</p>
                                            <p className="text-[11px] text-zinc-800 font-bold italic">Identity not detected in current security mesh.</p>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] animate-pulse">Waiting for telemetry input...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'public' && (
                            <div className="animate-in slide-in-from-right-4 duration-500">
                                {!generatedLink ? (
                                    <form onSubmit={handlePublicShare} className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Password Crypt</label>
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400">{showPassword ? 'Hide' : 'Reveal'}</button>
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Optional: Set access key"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.01] px-6 py-5 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all focus:bg-white/[0.03]"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Link Persistence</label>
                                            <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                                {['1h', '24h', '7d', 'never'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setExpiry(opt)}
                                                        className={`rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            expiry === opt ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isGenerating}
                                            className="group relative w-full overflow-hidden rounded-xl bg-white py-4 text-[9px] font-black text-black uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="relative z-10 group-hover:text-white transition-colors">{isGenerating ? 'GENERATING...' : '⚡ GENERATE LINK'}</span>
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="rounded-2xl bg-indigo-500/5 p-6 border border-indigo-500/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Deployment Successful</label>
                                            <div className="flex items-center gap-4">
                                                <input readOnly value={generatedLink} className="flex-1 bg-transparent text-xs font-bold text-white outline-none truncate font-mono" />
                                                <button onClick={() => {
                                                    navigator.clipboard.writeText(generatedLink || '');
                                                    alert('Link secured to clipboard.');
                                                }} className="rounded-xl bg-white text-black px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Copy</button>
                                            </div>
                                        </div>
                                        <button onClick={() => setGeneratedLink(null)} className="w-full text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] hover:text-white transition-all py-2">Initialize New Link</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'private' && (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="h-20 w-20 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.1)] group cursor-help">
                                    <svg className="h-10 w-10 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Revocation</h3>
                                    <p className="text-[11px] text-zinc-600 font-bold leading-relaxed px-10">Set this object to Restricted Status. All active links and peer permissions will be permanently severed.</p>
                                </div>
                                <button 
                                    onClick={handleRestrictAccess}
                                    disabled={isRevoking}
                                    className="w-full rounded-2xl border border-rose-500/50 bg-rose-500/10 py-5 text-[10px] font-black text-rose-500 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-[0.4em] disabled:opacity-30"
                                >
                                    {isRevoking ? 'TERMINATING ACCESS...' : '⚡ CONFIRM RESTRICTION'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
