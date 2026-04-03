'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import type { FileItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import AuthGuard from '../components/AuthGuard';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import AdvancedShareModal from '../components/AdvancedShareModal';
import BackgroundAnimation from '../components/BackgroundAnimation';

function formatTotalSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function DashboardContent() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [totalFiles, setTotalFiles] = useState(0);
    const [showFilesList, setShowFilesList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const { user } = useAuth();

    // Sharing UI State
    const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isAdvShareOpen, setIsAdvShareOpen] = useState(false);
    const [advShareFile, setAdvShareFile] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    const handleShare = (file: FileItem) => {
        setSelectedFileForShare(file);
        setIsShareModalOpen(true);
    };

    const handleAdvShare = (file: FileItem) => {
        setAdvShareFile({ id: file.id, name: file.original_filename });
        setIsAdvShareOpen(true);
    };

    const performShare = async (options: { password?: string, expiresAt?: string }): Promise<string | null> => {
        if (!selectedFileForShare) return null;
        try {
            const data = await api.createShare(selectedFileForShare.id, {
                accessType: options.password ? 'password_protected' : 'public',
                password: options.password,
                expiresAt: options.expiresAt
            });
            const shareUrl = `${window.location.origin}/share/${data.share_token}`;
            return shareUrl;
        } catch (error: any) {
            console.error('API share error:', error);
            throw error;
        }
    };

    const loadFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getFiles();
            setFiles(data.data.files || []);
            setTotalFiles(data.data.pagination?.total || data.data.files?.length || 0);
        } catch {
            setFiles([]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const totalSize = files.reduce((sum, f) => sum + Number(f.file_size), 0);
    const usagePercent = Math.max(0.5, Math.min(100, (totalSize / (10 * 1024 * 1024 * 1024)) * 100));

    return (
        <div className="min-h-screen bg-[#050508]">
            <Navbar />

            <BackgroundAnimation />

            <main className={`relative mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {/* Restricted Banner */}
                {user?.is_restricted && (
                    <div className="mb-8 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white">Account Restricted (Read-Only)</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">Uploads and deletions are disabled until identity verification is complete.</p>
                            </div>
                        </div>
                        <Link 
                            href="/unlock/ai-verify"
                            className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/15 transition-all duration-300 hover:shadow-orange-500/30 hover:brightness-110 active:scale-[0.97]"
                        >
                            Verify Identity
                        </Link>
                    </div>
                )}

                {/* ═══ Welcome Header ═══ */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-white tracking-tight">My Files</h1>
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1 ring-1 ring-emerald-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Secure</span>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500">
                            Your encrypted vault — <span className="text-zinc-400 font-medium">{totalFiles} file{totalFiles !== 1 ? 's' : ''}</span> · {formatTotalSize(totalSize)} stored
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUpload(true)}
                        disabled={user?.is_restricted}
                        className={`group flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                            user?.is_restricted 
                            ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(124,58,237,0.2)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.35)] hover:brightness-110 active:scale-[0.97]'
                        }`}
                        title={user?.is_restricted ? "Uploads disabled in Restricted mode" : "Upload File"}
                    >
                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Upload File
                    </button>
                </div>

                {/* ═══ Stats Grid ═══ */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Files Card */}
                    <button
                        onClick={() => setShowFilesList(!showFilesList)}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 text-left ${
                            showFilesList 
                                ? 'border-violet-500/25 bg-violet-500/[0.03] shadow-[0_0_30px_rgba(139,92,246,0.06)]' 
                                : 'border-white/[0.06] bg-white/[0.02] hover:border-violet-500/15 hover:bg-white/[0.03]'
                        }`}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                                    showFilesList ? 'bg-violet-500/15 text-violet-400' : 'bg-white/[0.04] text-zinc-500 group-hover:bg-violet-500/10 group-hover:text-violet-400'
                                }`}>
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                    </svg>
                                </div>
                                <span className={`rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                    showFilesList ? 'bg-violet-500/15 text-violet-400' : 'bg-white/[0.04] text-zinc-600'
                                }`}>
                                    {showFilesList ? 'Viewing' : 'View'}
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-white leading-none tracking-tight">{totalFiles}</p>
                                <p className="mt-1.5 text-xs text-zinc-500 font-medium">Encrypted Files</p>
                            </div>
                        </div>
                        {/* Bottom accent bar */}
                        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out" style={{ width: showFilesList ? '100%' : '0%' }} />
                    </button>

                    {/* Storage Card */}
                    <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-indigo-500/15 hover:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-500 transition-all duration-300 group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                                </svg>
                            </div>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{usagePercent.toFixed(1)}% used</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold text-white leading-none tracking-tight">{formatTotalSize(totalSize)}</p>
                            <p className="mt-1.5 text-xs text-zinc-500 font-medium">of 10 GB Storage</p>
                        </div>
                        <div className="mt-4">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out" 
                                    style={{ width: `${Math.max(2, usagePercent)}%` }} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-emerald-500/15 hover:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-500 transition-all duration-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1 ring-1 ring-emerald-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Healthy</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold text-white leading-none tracking-tight">AES-256</p>
                            <p className="mt-1.5 text-xs text-zinc-500 font-medium">Vault Health: Perfect</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                                {['E2EE', 'MFA', 'PIN'].map((label, i) => (
                                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#050508] bg-emerald-500/15 text-[7px] font-bold text-emerald-400">
                                        ✓
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-medium text-zinc-500">3 security layers active</span>
                        </div>
                    </div>
                </div>

                {/* ═══ File List ═══ */}
                {showFilesList && (
                    <div className="mt-10 animate-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white tracking-tight">File Vault</h2>
                            <div className="relative w-56">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-300 focus:border-violet-500/30 focus:bg-white/[0.04] focus:shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500"></div>
                                <p className="mt-4 text-xs text-zinc-500 font-medium">Decrypting file entries...</p>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-20 bg-white/[0.01]">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-700 mb-3">
                                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-zinc-500 font-medium">No files yet</p>
                                <p className="mt-1 text-xs text-zinc-600">Upload your first file to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/[0.05]">
                                            <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Name</th>
                                            <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Upload Date</th>
                                            <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Size</th>
                                            <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {files
                                            .filter(f => f.original_filename.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((file) => (
                                                <tr key={file.id} className="group transition-colors duration-200 hover:bg-white/[0.02]">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-sm font-medium text-white truncate max-w-[200px]">{file.original_filename}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="text-xs text-zinc-500">
                                                            {new Date(file.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="inline-flex items-center rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/[0.04]">
                                                            {formatTotalSize(file.file_size)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <FileCard
                                                                file={file}
                                                                onDeleted={loadFiles}
                                                                onShare={handleShare}
                                                                onAdvShare={handleAdvShare}
                                                                variant="compact"
                                                                isRestricted={user?.is_restricted}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modals */}
            <UploadModal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onUploaded={() => {
                    setShowUpload(false);
                    loadFiles();
                }}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onShare={performShare}
                fileName={selectedFileForShare?.original_filename || ''}
                fileId={selectedFileForShare?.id || ''}
            />

            <AdvancedShareModal
                isOpen={isAdvShareOpen}
                onClose={() => setIsAdvShareOpen(false)}
                fileId={advShareFile?.id || ''}
                fileName={advShareFile?.name || ''}
            />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}
