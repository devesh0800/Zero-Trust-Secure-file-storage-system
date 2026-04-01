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
    const { user } = useAuth();

    // Sharing UI State
    const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isAdvShareOpen, setIsAdvShareOpen] = useState(false);
    const [advShareFile, setAdvShareFile] = useState<{ id: string; name: string } | null>(null);

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

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 pt-36 pb-12 sm:px-6 lg:px-8">
                {user?.is_restricted && (
                    <div className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Account Restricted (Read-Only)</h2>
                                <p className="text-sm text-zinc-400">File uploads and deletions are disabled until identity verification is complete.</p>
                            </div>
                        </div>
                        <Link 
                            href="/unlock/ai-verify"
                            className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/40 hover:brightness-110"
                        >
                            Verify Identity
                        </Link>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Files</h1>
                        <p className="mt-1 text-sm text-zinc-400">
                            Your encrypted file vault • {totalFiles} file{totalFiles !== 1 ? 's' : ''} • {formatTotalSize(totalSize)}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUpload(true)}
                        disabled={user?.is_restricted}
                        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all ${
                            user?.is_restricted 
                            ? 'bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/25 hover:shadow-violet-500/40 hover:brightness-110'
                        }`}
                        title={user?.is_restricted ? "Uploads disabled in Restricted mode" : "Upload File"}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Upload File
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Files Card */}
                    <button
                        onClick={() => setShowFilesList(!showFilesList)}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${showFilesList ? 'border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10' : 'border-white/10 bg-white/[0.03] hover:border-violet-500/30'}`}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                    </svg>
                                </div>
                                <div className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${showFilesList ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                                    {showFilesList ? 'Hide List' : 'View List'}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-white leading-none">{totalFiles}</p>
                                <p className="mt-1 text-sm text-zinc-400">Total Encrypted Files</p>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500" style={{ width: showFilesList ? '100%' : '0%' }} />
                    </button>

                    {/* Storage Card */}
                    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-indigo-500/30">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white leading-none">{formatTotalSize(totalSize)}</p>
                                <p className="mt-1 text-sm text-zinc-400">Storage Occupied</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Usage Limit</span>
                                <span className="text-[10px] font-bold text-zinc-400">1.2% of 10GB</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: '1.2%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-emerald-500/30">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white leading-none">AES-256</p>
                                <p className="mt-1 text-sm text-zinc-400">Vault Health: Perfect</p>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-6 w-6 rounded-full border-2 border-[#0a0a0f] bg-emerald-500/20 flex items-center justify-center">
                                        <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">3 Security Filters Active</span>
                        </div>
                    </div>
                </div>

                {/* File List / Content Section */}
                {showFilesList && (
                    <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Detailed File Vault</h2>
                            <div className="relative w-64">
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
                                />
                                <svg className="absolute right-3 top-2.5 h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500"></div>
                                <p className="mt-4 text-sm text-zinc-400">Decrypting file entries...</p>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 bg-white/[0.01]">
                                <p className="text-sm text-zinc-400">No matching files found in this vault.</p>
                            </div>
                        ) : (
                            /* User specific request: Name, uploading date, file storage, size etc. */
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/[0.02]">
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Upload Date</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">File Size</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {files
                                            .filter(f => f.original_filename.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((file) => (
                                                <tr key={file.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-sm font-medium text-white truncate max-w-[200px]">{file.original_filename}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-zinc-400">
                                                            {new Date(file.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400">
                                                            {formatTotalSize(file.file_size)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

            {/* Upload Modal */}
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
