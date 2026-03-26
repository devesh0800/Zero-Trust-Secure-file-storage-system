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
            setError(err.message || 'Download failed');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans tracking-tight">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Validating Secure Link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 font-sans tracking-tight">
            <Navbar />
            
            <main className="max-w-xl mx-auto px-4 pt-32 pb-12 text-center">
                {error && !fileInfo ? (
                    <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-12 shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-6">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-zinc-900 mb-2 uppercase tracking-tight">Link Compromised</h1>
                        <p className="text-sm text-zinc-500 font-medium mb-8">This share link is either invalid, has expired, or reached its maximum download limit.</p>
                        <a href="/" className="inline-block rounded-xl bg-zinc-900 px-8 py-3 text-xs font-black text-white hover:bg-black transition-all uppercase tracking-widest">Back to Storage</a>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl shadow-zinc-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Sharer Header */}
                        <div className="flex flex-col items-center mb-10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl font-black text-white shadow-lg shadow-blue-500/20 mb-4">
                                {fileInfo.shared_by?.[0]}
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Securely Shared By</p>
                            <h2 className="text-sm font-bold text-zinc-900">{fileInfo.shared_by}</h2>
                        </div>

                        {/* File Details */}
                        <div className="rounded-2xl bg-zinc-50 p-6 border border-zinc-100 mb-8">
                            <h1 className="text-xl font-black text-zinc-900 mb-1 break-all uppercase tracking-tight leading-tight">{fileInfo.shareable_filename}</h1>
                            <div className="flex justify-center items-center gap-4 mt-4">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-white border border-zinc-200 px-3 py-1 rounded-full">{(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-white border border-zinc-200 px-3 py-1 rounded-full">{fileInfo.mime_type.split('/')[1]}</span>
                            </div>
                        </div>

                        {fileInfo.is_password_required ? (
                            <form onSubmit={handleDownload} className="space-y-4">
                                <div className="text-left">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Encrypted Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter secure password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                    {error && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase">{error}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isDownloading}
                                    className="w-full rounded-2xl bg-zinc-900 py-4 text-xs font-black text-white hover:bg-black transition-all uppercase tracking-widest shadow-xl shadow-zinc-900/20 disabled:opacity-50"
                                >
                                    {isDownloading ? 'Decrypting...' : 'Decrypt & Download'}
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => handleDownload()}
                                disabled={isDownloading}
                                className="w-full rounded-2xl bg-blue-600 py-4 text-xs font-black text-white hover:bg-blue-700 transition-all uppercase tracking-widest shadow-xl shadow-blue-500/30 group disabled:opacity-50"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {isDownloading ? (
                                        <>
                                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Initializing Download...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Secure Download
                                        </>
                                    )}
                                </span>
                            </button>
                        )}

                        <p className="mt-8 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">End-to-End Encrypted Access</p>
                    </div>
                )}
            </main>
        </div>
    );
}
