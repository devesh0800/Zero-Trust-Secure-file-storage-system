'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import * as api from '@/lib/api';
import Navbar from '../../components/Navbar';

export default function SharedFilePage() {
    const { token } = useParams();
    const [fileInfo, setFileInfo] = useState<any>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        loadFileInfo();
    }, [token]);

    const loadFileInfo = async () => {
        setIsLoading(true);
        try {
            const data = await api.getSharedInfo(token as string);
            setFileInfo(data);
        } catch (err: any) {
            setError(err.message || 'Share link invalid or expired');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsDownloading(true);
        setError('');
        try {
            await api.downloadSharedFile(token as string, fileInfo.shareable_filename, password);
        } catch (err: any) {
            setError(err.message || 'Download failed. Please check your password.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-16 w-16 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 bg-blue-500/10 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Decrypting Tunnel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-blue-500/30">
            <Navbar />
            
            <main className="max-w-xl mx-auto px-6 pt-32 pb-20 text-center">
                {error && !fileInfo ? (
                    <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/30 p-12 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-8">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Access Terminated</h1>
                        <p className="text-sm text-zinc-500 font-medium mb-10 leading-relaxed px-4">This share link has been revoked, expired, or reached its maximum download threshold.</p>
                        <a href="/" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-[10px] font-bold text-black hover:bg-zinc-200 transition-all uppercase tracking-widest shadow-xl shadow-white/5">
                            Return to Vault
                        </a>
                    </div>
                ) : (
                    <div className="rounded-[3rem] border border-zinc-800/50 bg-zinc-900/40 p-12 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        {/* Sharer Header */}
                        <div className="flex flex-col items-center mb-12">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-black text-white shadow-2xl shadow-blue-500/20 mb-6 border border-white/10 uppercase">
                                    {fileInfo.shared_by?.[0]}
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em] mb-2 leading-none">Securely Shared By</p>
                            <h2 className="text-lg font-bold text-white tracking-tight">{fileInfo.shared_by}</h2>
                        </div>

                        {/* File Card */}
                        <div className="rounded-[2rem] bg-zinc-950/50 p-8 border border-zinc-800/50 mb-10 group hover:border-zinc-700/50 transition-colors">
                            <h1 className="text-2xl font-black text-white mb-2 break-all tracking-tight leading-tight uppercase">{fileInfo.shareable_filename}</h1>
                            <div className="flex justify-center items-center gap-3 mt-6">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                                    {(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                                    {fileInfo.mime_type.split('/')[1] || 'FILE'}
                                </span>
                            </div>
                        </div>

                        {fileInfo.is_password_required ? (
                            <form onSubmit={handleDownload} className="space-y-6">
                                <div className="text-left">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1 block">Authentication Guard</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            placeholder="Enter decryption password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                            required
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="mt-4 flex items-center gap-2 text-rose-500 animate-in slide-in-from-top-2 duration-300">
                                            <div className="h-1 w-1 rounded-full bg-rose-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isDownloading}
                                    className="w-full relative group overflow-hidden rounded-2xl bg-white py-5 text-xs font-black text-black hover:bg-zinc-200 transition-all uppercase tracking-widest shadow-2xl shadow-white/5 disabled:opacity-50"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {isDownloading ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                Decrypting...
                                            </>
                                        ) : 'Decrypt & Download'}
                                    </span>
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => handleDownload()}
                                disabled={isDownloading}
                                className="w-full rounded-[1.5rem] bg-blue-600 py-5 text-xs font-black text-white hover:bg-blue-500 transition-all uppercase tracking-widest shadow-2xl shadow-blue-500/20 group disabled:opacity-50 animate-pulse"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    {isDownloading ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-5 w-5 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Secure Access
                                        </>
                                    )}
                                </span>
                            </button>
                        )}

                        <div className="mt-12 flex items-center justify-center gap-6">
                            <div className="h-px flex-1 bg-zinc-800/50" />
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">AES-256-GCM</p>
                            <div className="h-px flex-1 bg-zinc-800/50" />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
