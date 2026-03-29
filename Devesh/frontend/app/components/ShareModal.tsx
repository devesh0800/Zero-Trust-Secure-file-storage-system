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
    const [password, setPassword] = useState('');
    const [expiry, setExpiry] = useState('24h');
    const [showPassword, setShowPassword] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    // Search users on platform
    useEffect(() => {
        const searchUsers = async () => {
            if (searchTerm.length < 3) {
                setSearchResults([]);
                return;
            }
            try {
                // Mocking connection search - assuming an endpoint exists or using general connection fetch
                const connections = await api.getConnections();
                const filtered = connections.filter((c: any) => 
                    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setSearchResults(filtered);
            } catch (err) {
                console.error('Search failed', err);
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
            // Logic for P2PE Share with user
            // We can use createAdvancedShare if available or a general share endpoint
            await api.createAdvancedShare({
                fileId,
                receiverId,
                encryptedAesKey: 'AUTO_GENERATED', // Backend handles this or we fetch public key
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

    const handleClose = () => {
        setGeneratedLink(null);
        setSearchTerm('');
        setPassword('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-[#161616] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">File share karo</h2>
                        <p className="text-sm font-medium text-zinc-500 mt-1">{fileName}</p>
                    </div>
                    <button onClick={handleClose} className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-3 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Unified Tab Navigation */}
                <div className="mb-8 flex gap-2 rounded-2xl bg-[#0c0c0e] p-1.5 border border-zinc-800/50">
                    {(['platform', 'public', 'private'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setGeneratedLink(null); }}
                            className={`flex-1 rounded-xl py-3 text-xs font-bold capitalize transition-all ${
                                activeTab === tab 
                                ? 'bg-zinc-800 text-white shadow-lg' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {tab === 'platform' ? 'Platform user' : tab === 'public' ? 'Public link' : 'Keep private'}
                        </button>
                    ))}
                </div>

                <div className="min-h-[250px]">
                    {/* TAB: PLATFORM USER */}
                    {activeTab === 'platform' && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Email ya username se dhundho..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>

                            <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2">
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <button 
                                            key={user.id}
                                            onClick={() => handlePlatformShare(user.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-200">{user.username}</p>
                                                    <p className="text-[10px] text-zinc-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Share</span>
                                        </button>
                                    ))
                                ) : searchTerm.length >= 3 ? (
                                    <p className="text-center py-8 text-xs font-bold text-zinc-600 uppercase tracking-widest animate-pulse">Searching Vault Network...</p>
                                ) : (
                                    <p className="text-center py-8 text-xs font-medium text-zinc-600">Username ya email type karo</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: PUBLIC LINK */}
                    {activeTab === 'public' && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            {!generatedLink ? (
                                <form onSubmit={handlePublicShare} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 flex justify-between">
                                            <span>Password Shield</span>
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-blue-500 lowercase">{showPassword ? 'Hide' : 'Show'}</button>
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Optional: Set password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Expiry</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['1h', '24h', '7d', 'never'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setExpiry(opt)}
                                                    className={`rounded-xl border py-2 text-[10px] font-bold uppercase transition-all ${
                                                        expiry === opt ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-zinc-800 text-zinc-600'
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
                                        className="w-full rounded-2xl bg-blue-600 py-4 text-xs font-bold text-white hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isGenerating ? 'Deploying...' : 'Generate Public Link'}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="rounded-2xl bg-zinc-950 p-5 border border-zinc-800">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 block">Success! Link Ready</label>
                                        <div className="flex items-center gap-3">
                                            <input readOnly value={generatedLink} className="flex-1 bg-transparent text-xs font-bold text-blue-400 outline-none truncate" />
                                            <button onClick={() => navigator.clipboard.writeText(generatedLink || '')} className="rounded-xl bg-zinc-800 border border-zinc-700 p-3 text-white hover:bg-zinc-700">Copy</button>
                                        </div>
                                    </div>
                                    <button onClick={() => setGeneratedLink(null)} className="w-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors py-2">Create another link</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: PRIVATE */}
                    {activeTab === 'private' && (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">Revoke Multi-Link Access</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed px-4">Set this file back to private status. All existing shared links and user associations for this file will be permanently terminated.</p>
                            <button className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-4 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all uppercase tracking-widest">Confirm Restrict Access</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
