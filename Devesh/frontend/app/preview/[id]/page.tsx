'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../../components/Navbar';
import AuthGuard from '../../components/AuthGuard';
import ForensicWatermark from '../../components/ForensicWatermark';

function SecurePreviewContent({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const [share, setShare] = useState<any>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Track view
                const data = await api.trackShareView(params.id);
                setShare(data);
            } catch (err: any) {
                setError(err.message || 'Access denied.');
            }
            setIsLoading(false);
        };
        init();
    }, [params.id]);

    const handleDownload = async () => {
        if (!share) return;
        try {
            await api.trackShareDownload(share.id);
            // Trigger file download
            await api.downloadFile(share.file_id, share.file?.original_name || 'file');
        } catch (err: any) {
            setError(err.message || 'Download failed.');
        }
    };

    const isImage = share?.file?.file_type && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(share.file.file_type.toLowerCase());
    const isText = share?.file?.file_type && ['txt', 'md', 'csv', 'json', 'log'].includes(share.file.file_type.toLowerCase());
    const canDownload = share?.permission_mode !== 'no_download';

    return (
        <div className="min-h-screen bg-zinc-50">
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 py-10">
                {isLoading ? (
                    <div className="py-20 text-center text-zinc-400">Decrypting and verifying access...</div>
                ) : error ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-400">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </div>
                        <h2 className="text-lg font-black text-zinc-900 uppercase">Access Denied</h2>
                        <p className="text-sm text-zinc-400 mt-2">{error}</p>
                    </div>
                ) : share && (
                    <>
                        {/* Header */}
                        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs uppercase shadow-lg">
                                    {share.file?.file_type?.toUpperCase()?.slice(0, 3) || 'F'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">{share.file?.original_name}</p>
                                    <p className="text-[10px] text-zinc-400">
                                        Shared by <b>@{share.sharer?.username}</b> • Mode: <b className="text-blue-600">{share.permission_mode}</b>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {canDownload && (
                                    <button
                                        onClick={handleDownload}
                                        className="rounded-xl bg-zinc-900 px-6 py-2.5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                    >
                                        ⬇ Download
                                    </button>
                                )}
                                {!canDownload && (
                                    <span className="rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                        🚫 Download Disabled
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Watermarked Preview */}
                        <ForensicWatermark userId={user?.id || ''} username={user?.username || ''}>
                            <div className="rounded-2xl border border-zinc-200 bg-white p-8 min-h-[400px] flex items-center justify-center">
                                {isImage ? (
                                    <p className="text-sm text-zinc-400 italic">Image preview loading... (Encrypted)</p>
                                ) : isText ? (
                                    <p className="text-sm text-zinc-400 italic">Text preview loading... (Encrypted)</p>
                                ) : (
                                    <div className="text-center">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100">
                                            <svg className="h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-zinc-900">{share.file?.original_name}</p>
                                        <p className="text-[10px] text-zinc-400 mt-1">Preview not available for this file type.</p>
                                        {canDownload && (
                                            <button onClick={handleDownload} className="mt-4 rounded-xl bg-zinc-900 px-8 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-lg">
                                                Secure Download
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ForensicWatermark>

                        {/* Security Footer */}
                        <div className="mt-6 rounded-2xl bg-zinc-900 p-5 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Zero-Trust Protected</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                    This file is watermarked with your identity. All views and downloads are tracked.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default function SecurePreviewPage({ params }: { params: { id: string } }) {
    return (
        <AuthGuard>
            <SecurePreviewContent params={params} />
        </AuthGuard>
    );
}
