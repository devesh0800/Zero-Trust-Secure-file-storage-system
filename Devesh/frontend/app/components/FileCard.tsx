'use client';

import { type FileItem, downloadFile, deleteFile, ApiError } from '@/lib/api';
import { useState } from 'react';
import DownloadPinModal from './DownloadPinModal';
import Link from 'next/link';

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getFileIcon(extension: string): { icon: string; color: string } {
    const mapping: Record<string, { icon: string; color: string }> = {
        pdf: { icon: '📄', color: 'from-red-500 to-rose-600' },
        doc: { icon: '📝', color: 'from-blue-500 to-blue-600' },
        docx: { icon: '📝', color: 'from-blue-500 to-blue-600' },
        txt: { icon: '📜', color: 'from-zinc-400 to-zinc-500' },
        jpg: { icon: '🖼️', color: 'from-amber-500 to-orange-600' },
        jpeg: { icon: '🖼️', color: 'from-amber-500 to-orange-600' },
        png: { icon: '🖼️', color: 'from-emerald-500 to-green-600' },
        zip: { icon: '📦', color: 'from-purple-500 to-violet-600' },
    };
    return mapping[extension.toLowerCase()] || { icon: '📎', color: 'from-zinc-400 to-zinc-500' };
}

interface FileCardProps {
    file: FileItem;
    onDeleted: () => void;
    onShare?: (file: FileItem) => void;
    onAdvShare?: (file: FileItem) => void;
    onDownload?: (file: FileItem) => void;
    variant?: 'default' | 'compact';
    isRestricted?: boolean;
    isPinSet?: boolean;
}

export default function FileCard({ file, onDeleted, onShare, onAdvShare, onDownload, variant = 'default', isRestricted = false, isPinSet = true }: FileCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { icon, color } = getFileIcon(file.file_extension);

    const handleDownload = async () => {
        if (onDownload) {
            onDownload(file);
            return;
        }

        // Fallback for direct usage if onDownload not provided (shouldn't happen in dashboard now)
        if (!isPinSet) {
            alert('SECURITY PROTOCOL: Please establish a Security PIN in your Profile settings first.');
            window.location.href = '/profile?tab=security';
            return;
        }
        setIsDownloading(true);
        try {
            await downloadFile(file.id, file.original_filename);
        } catch (err: any) {
            alert('Download failed: ' + (err.message || 'Unknown error'));
        }
        setIsDownloading(false);
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${file.original_filename}"? This cannot be undone.`)) return;
        setIsDeleting(true);
        try {
            await deleteFile(file.id);
            onDeleted();
        } catch (err) {
            alert('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setIsDeleting(false);
        }
    };

    return (
        <>
            {variant === 'compact' ? (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 transition-all hover:bg-violet-500/20 disabled:opacity-50"
                        title="Download"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    </button>

                    {/* Share Buttons */}
                    {onShare && (
                        <button
                            onClick={() => onShare(file)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all hover:bg-blue-500/20"
                            title="Share Link"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                        </button>
                    )}
                    {onAdvShare && (
                        <button
                            onClick={() => onAdvShare(file)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-all hover:bg-emerald-500/20"
                            title="Direct Secure Share"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || isRestricted}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                        title={isRestricted ? "Deletion disabled in Restricted mode" : "Delete"}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-violet-500/5">
                    {/* File Icon & Info */}
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-xl shadow-lg`}>
                            {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-white" title={file.original_filename}>
                                {file.original_filename}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                                <span className="rounded-md bg-white/5 px-2 py-0.5 uppercase">{file.file_extension}</span>
                                <span>•</span>
                                <span>{formatFileSize(file.file_size)}</span>
                            </div>
                            <p className="mt-2 text-xs text-zinc-500">{formatDate(file.created_at)}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-400 transition-all hover:bg-violet-500/20 disabled:opacity-50"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            {isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || isRestricted}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isRestricted ? "Deletion disabled in Restricted mode" : "Delete"}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            {isDeleting ? '...' : 'Delete'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
