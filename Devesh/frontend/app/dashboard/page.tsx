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
import DownloadPinModal from '../components/DownloadPinModal';

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
    const [securityStatus, setSecurityStatus] = useState<{ is_pin_set: boolean } | null>(null);

    // Download Modal State
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [fileToDownload, setFileToDownload] = useState<FileItem | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isDownloading, setIsDownloadingInternal] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchSec = async () => {
            try {
                const data = await api.getSecurityInfo();
                setSecurityStatus({ is_pin_set: data.is_pin_set });
            } catch (e) {
                console.error('Dashboard Security Trace Fail:', e);
            }
        };
        fetchSec();
    }, [user]);

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

    const handleDownloadClick = (file: FileItem) => {
        if (!securityStatus?.is_pin_set) {
            alert('SECURITY PROTOCOL: Please establish a Security PIN in your Profile settings first.');
            window.location.href = '/profile?tab=security';
            return;
        }
        setFileToDownload(file);
        setDownloadError(null);
        setIsDownloadModalOpen(true);
    };

    const executeDownload = async (pin: string) => {
        if (!fileToDownload) return;
        setIsDownloadingInternal(true);
        setDownloadError(null);
        try {
            await api.downloadFile(fileToDownload.id, fileToDownload.original_filename, pin);
            setIsDownloadModalOpen(false);
        } catch (err: any) {
            setDownloadError(err.message || 'Download failed');
        } finally {
            setIsDownloadingInternal(false);
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

            {/* ═══ Premium Background Layer (Same as Login) ═══ */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 hex-pattern opacity-[0.15]" />
                <div className="absolute top-[5%] right-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[150px] orb-1 morph-blob" />
                <div className="absolute bottom-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[130px] orb-2 morph-blob" />
                
                {/* Floating Security Words/Tags with Wave Motion */}
                <div className="absolute top-[15%] left-[5%] animate-security-wave opacity-25 hover:opacity-100 transition-opacity duration-700">
                    <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-300">Secure Encryption</span>
                    </div>
                </div>

                <div className="absolute top-[45%] right-[8%] animate-security-wave opacity-20 hover:opacity-100 transition-opacity duration-700" style={{ animationDelay: '3s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Privacy First</span>
                    </div>
                </div>

                <div className="absolute bottom-[20%] right-[15%] animate-security-wave opacity-15 hover:opacity-100 transition-opacity duration-700" style={{ animationDelay: '7s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">End-to-End Private</span>
                    </div>
                </div>

                <div className="absolute bottom-[10%] left-[20%] animate-security-wave opacity-20 hover:opacity-100 transition-opacity duration-700" style={{ animationDelay: '1.5s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-300">High Security</span>
                    </div>
                </div>

                <div className="absolute top-[25%] left-[45%] animate-security-wave opacity-10 hover:opacity-100 transition-opacity duration-700" style={{ animationDelay: '5s' }}>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Multi-Layer Protection</span>
                    </div>
                </div>

                {/* Particles from Login Page */}
                <div className="floating-particle fp-1" />
                <div className="floating-particle fp-2" />
                <div className="floating-particle fp-3" />
                <div className="floating-particle fp-4" />
                <div className="floating-particle fp-5" />
                <div className="floating-particle fp-6" />
                <div className="floating-particle fp-7" />
                <div className="floating-particle fp-8" />
            </div>

            <BackgroundAnimation />

            <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
                {/* Restricted Banner */}
                {user?.is_restricted && (
                    <div className="stagger-1 mb-8 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                <div className="stagger-1 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black text-white tracking-tight uppercase">My Files</h1>
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 ring-1 ring-emerald-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Security Active</span>
                            </div>
                        </div>
                        <p className="text-[13px] text-zinc-500 font-medium">
                            System status: <span className="text-indigo-400">Operational</span> · <span className="text-zinc-400">{totalFiles} total files</span> · {formatTotalSize(totalSize)}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUpload(true)}
                        disabled={user?.is_restricted}
                        className={`group btn-premium flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest shadow-xl transition-all duration-500 ${
                            user?.is_restricted 
                            ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-50' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-600/20 hover:shadow-violet-600/40 active:scale-[0.97]'
                        }`}
                        title={user?.is_restricted ? "Uploads disabled in Restricted mode" : "Upload File"}
                    >
                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Upload File
                    </button>
                </div>

                {/* ═══ Stats Grid ═══ */}
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {/* Files Card */}
                    <button
                        onClick={() => setShowFilesList(!showFilesList)}
                        className={`stagger-2 group relative overflow-hidden rounded-[2rem] border transition-all duration-500 text-left glass-card ${
                            showFilesList 
                                ? 'border-violet-500/30 bg-violet-500/[0.05] shadow-[0_0_40px_rgba(139,92,246,0.1)] scale-[1.02]' 
                                : 'border-white/[0.06] bg-white/[0.02] hover:border-violet-500/20 hover:scale-[1.01]'
                        }`}
                    >
                        <div className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500 ${
                                    showFilesList ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-white/[0.05] text-zinc-500 group-hover:bg-violet-500/10 group-hover:text-violet-400'
                                }`}>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                    </svg>
                                </div>
                                <span className={`rounded-lg px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest transition-all duration-500 ${
                                    showFilesList ? 'bg-white/10 text-white' : 'bg-white/[0.05] text-zinc-600'
                                }`}>
                                    {showFilesList ? 'Active' : 'Explore'}
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-black text-white leading-none tracking-tight">{totalFiles}</p>
                                <p className="mt-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Files</p>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-700 ease-out" style={{ width: showFilesList ? '100%' : '0%' }} />
                    </button>

                    {/* Storage Card */}
                    <div className="stagger-3 group relative overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-500 hover:border-indigo-500/20 hover:scale-[1.01] glass-card">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-500 transition-all duration-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                                </svg>
                            </div>
                            <span className="text-[8px] font-black text-indigo-400/80 uppercase tracking-widest">{usagePercent.toFixed(1)}% Capacity</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-black text-white leading-none tracking-tight">{formatTotalSize(totalSize)}</p>
                            <p className="mt-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Storage Used</p>
                        </div>
                        <div className="mt-4">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 transition-all duration-1000 ease-out" 
                                    style={{ width: `${Math.max(2, usagePercent)}%` }} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="stagger-4 group relative overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-500 hover:border-emerald-500/20 hover:scale-[1.01] glass-card">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-500 transition-all duration-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-0.5 ring-1 ring-emerald-500/20">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Security Monitoring</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-black text-white leading-none tracking-tight uppercase">AES-256 SECURED</p>
                            <p className="mt-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">End-to-End Private</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                                {['E2EE', 'MFA', 'PIN'].map((label, i) => (
                                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border border-[#050508] bg-emerald-500/20 text-[7px] font-black text-emerald-400 shadow-lg" title={label}>
                                        ✓
                                    </div>
                                ))}
                            </div>
                            <span className="ml-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest">3 Security Filters</span>
                        </div>
                    </div>
                </div>

                {/* ═══ File List ═══ */}
                {showFilesList && (
                    <div className="mt-12 stagger-5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">File Explorer</h2>
                                <span className="h-px w-20 bg-gradient-to-r from-violet-500/40 to-transparent" />
                            </div>
                            <div className="relative w-56 group/search">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 transition-colors group-focus-within/search:text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.01] pl-10 pr-4 py-2.5 text-[11px] text-white placeholder-zinc-700 outline-none transition-all duration-500 focus:border-violet-500/30 focus:bg-white/[0.03] focus:shadow-[0_0_30px_rgba(139,92,246,0.05)]"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 rounded-[2.5rem] border border-white/[0.04] bg-white/[0.01]">
                                <div className="h-10 w-10 animate-spin rounded-full border-3 border-violet-500/10 border-t-violet-500"></div>
                                <p className="mt-6 text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Loading your files...</p>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/[0.06] py-24 bg-white/[0.01] group/empty">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-800 mb-5 group-hover/empty:scale-110 transition-transform duration-500">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-zinc-400 font-bold">No Files Found</p>
                                <p className="mt-1 text-[10px] text-zinc-600 uppercase tracking-widest">Upload a file to see it here</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.01] glass-card">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                            <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">File Name</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Date</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Size</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {files
                                            .filter(f => f.original_filename.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((file) => (
                                                <tr key={file.id} className="group transition-all duration-300 hover:bg-violet-500/[0.03]">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                                </svg>
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-[13px] font-bold text-white truncate max-w-[220px] group-hover:text-indigo-300 transition-colors">{file.original_filename}</p>
                                                                <p className="mt-0.5 text-[9px] text-zinc-600 font-mono tracking-tight">{file.id.slice(0, 18)}...</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight group-hover:text-zinc-400">
                                                            {new Date(file.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center rounded-lg bg-white/[0.05] px-2 py-0.5 text-[9px] font-black text-zinc-400 ring-1 ring-white/[0.06] group-hover:bg-violet-500/10 group-hover:text-violet-300 transition-all">
                                                            {formatTotalSize(file.file_size)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-2">
                                                            <FileCard
                                                                file={file}
                                                                onDeleted={loadFiles}
                                                                onShare={handleShare}
                                                                onAdvShare={handleAdvShare}
                                                                onDownload={handleDownloadClick}
                                                                variant="compact"
                                                                isRestricted={user?.is_restricted}
                                                                isPinSet={securityStatus?.is_pin_set ?? true}
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

            {fileToDownload && (
                <DownloadPinModal
                    isOpen={isDownloadModalOpen}
                    onClose={() => setIsDownloadModalOpen(false)}
                    onConfirm={executeDownload}
                    fileName={fileToDownload.original_filename}
                    isDownloading={isDownloading}
                    error={downloadError}
                />
            )}
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
