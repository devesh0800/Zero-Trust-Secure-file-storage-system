'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../../components/Navbar';
import AuthGuard from '../../components/AuthGuard';
import ForensicWatermark from '../../components/ForensicWatermark';
import PrivacyShield from '../../components/PrivacyShield';
import DownloadPinModal from '../../components/DownloadPinModal';

interface PageProps {
    params: Promise<{ id: string }>;
}

function SecurePreviewContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [share, setShare] = useState<any>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinError, setPinError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const data = await api.trackShareView(id);
                setShare(data);
            } catch (err: any) {
                setError(err.message || 'Access denied.');
            }
            setIsLoading(false);
        };
        init();
    }, [id]);

    const handleDownload = async (pin?: string) => {
        if (!share) return;
        setIsDownloading(true);
        setPinError(null);
        try {
            await api.trackShareDownload(share.id);
            await api.downloadFile(share.file_id, share.file?.original_filename || 'file', pin);
            setShowPinModal(false);
        } catch (err: any) {
            if (err.status === 403) {
                if (!showPinModal) {
                    setShowPinModal(true);
                } else {
                    setPinError(err.message);
                }
            } else {
                setError(err.message || 'Download failed.');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const loadTextPreview = async (pin?: string) => {
        if (!share) return;
        setIsPreviewLoading(true);
        setPinError(null);
        try {
            const blob = await api.downloadFile(share.file_id, share.file?.original_filename || 'preview.txt', pin);
            const text = await blob.text();
            setTextContent(text);
            setShowPinModal(false);
        } catch (err: any) {
            if (err.status === 403) {
                if (!showPinModal) {
                    setShowPinModal(true);
                } else {
                    setPinError(err.message);
                }
            } else {
                console.error('Preview error:', err);
            }
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const isImage = share?.file?.file_extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(share.file.file_extension.toLowerCase());
    const isText = share?.file?.file_extension && ['txt', 'md', 'csv', 'json', 'log'].includes(share.file.file_extension.toLowerCase());
    const canDownload = share?.permission_mode !== 'no_download';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50">
                <Navbar />
                <main className="mx-auto max-w-4xl px-4 pt-32 pb-12 flex flex-col items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
                    <p className="mt-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Decrypting Security Layers...</p>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50">
                <Navbar />
                <main className="mx-auto max-w-4xl px-4 pt-32 pb-12 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 shadow-inner">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Access Restricted</h2>
                    <p className="text-sm text-zinc-400 mt-2 font-medium">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-8 text-[10px] font-black text-zinc-900 border-b-2 border-zinc-900 uppercase tracking-widest hover:text-zinc-500 hover:border-zinc-300 transition-all">Retry Access</button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 pt-32 pb-12">
                <PrivacyShield enabled={share.permission_mode === 'view_once'}>
                    {/* Header Card */}
                    <div className="mb-6 rounded-[2rem] border border-zinc-200 bg-white p-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-sm uppercase shadow-xl ring-4 ring-violet-50">
                                {share.file?.file_extension?.toUpperCase()?.slice(0, 3) || 'FILE'}
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-zinc-900 truncate max-w-[200px] md:max-w-md">{share.file?.original_filename}</h1>
                                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">
                                    Shared by <span className="text-zinc-900">@{share.sharer?.username || 'unknown'}</span> • Mode: <span className="text-indigo-600">{share.permission_mode}</span>
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 md:mt-0 flex gap-3">
                            {!textContent && isText && (
                                <button
                                    onClick={() => loadTextPreview()}
                                    disabled={isPreviewLoading}
                                    className="rounded-2xl bg-zinc-100 border border-zinc-200 px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                >
                                    {isPreviewLoading ? 'Decrypting...' : 'View Content'}
                                </button>
                            )}
                            {canDownload && (
                                <button
                                    onClick={() => handleDownload()}
                                    className="rounded-2xl bg-zinc-900 px-8 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
                                >
                                    Download Securely
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <ForensicWatermark userId={user?.id || ''} username={user?.username || ''}>
                        <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-10 min-h-[500px] flex items-center justify-center shadow-inner relative overflow-hidden">
                            {textContent ? (
                                <div className="w-full h-full max-h-[600px] overflow-y-auto">
                                    <pre className="text-sm font-mono text-zinc-800 whitespace-pre-wrap bg-zinc-50 p-8 rounded-2xl border border-zinc-100 leading-relaxed">
                                        {textContent}
                                    </pre>
                                </div>
                            ) : isImage ? (
                                <div className="text-center">
                                    <p className="text-sm text-zinc-300 font-medium italic animate-pulse mb-4">Encrypted Image Protected</p>
                                    <button onClick={() => handleDownload()} className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Preview Unsupported • Download to View</button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-50 border border-zinc-100 text-zinc-200 group-hover:scale-110 transition-transform duration-500">
                                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                    </div>
                                    <p className="text-lg font-black text-zinc-900">{share.file?.original_filename}</p>
                                    <p className="text-[10px] text-zinc-400 mt-2 uppercase font-bold tracking-widest">No visual preview available for this format</p>
                                    {isText && (
                                        <p className="mt-4 text-[10px] text-indigo-500 font-black uppercase tracking-widest animate-bounce">Click &quot;View Content&quot; Above to Decrypt</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </ForensicWatermark>

                    {/* Zero-Trust Protocol Info */}
                    <div className="mt-8 rounded-[2rem] bg-zinc-900 p-8 flex items-center gap-6 shadow-2xl">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-emerald-400">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.1em]">Zero-Trust Security Protocol Active</h4>
                            <p className="text-[10px] text-zinc-400 mt-1 font-medium leading-relaxed">
                                This session is encrypted end-to-end. Your identity is watermarked onto the content stream. 
                                <span className="text-zinc-500 ml-1 italic">Unauthorized distribution is traceable back to your account.</span>
                            </p>
                        </div>
                    </div>
                </PrivacyShield>
            </main>

            <DownloadPinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onConfirm={(pin) => {
                    // Decide which one to retry based on whether we have textContent or if it's text
                    if (isText && !textContent) {
                        loadTextPreview(pin);
                    } else {
                        handleDownload(pin);
                    }
                }}
                fileName={share.file?.original_filename || ''}
                isDownloading={isDownloading || isPreviewLoading}
                error={pinError}
            />
        </div>
    );
}

export default function SecurePreviewPage({ params }: PageProps) {
    return (
        <AuthGuard>
            <SecurePreviewContent params={params} />
        </AuthGuard>
    );
}
