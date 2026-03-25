'use client';

import { useState, useRef, type DragEvent } from 'react';
import { uploadFile } from '@/lib/api';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploaded: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploaded }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip'];

    const validateFile = (f: File): string | null => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        if (!allowedTypes.includes(ext)) {
            return `File type .${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`;
        }
        if (f.size > 50 * 1024 * 1024) {
            return 'File size exceeds 50MB limit';
        }
        return null;
    };

    const handleFileSelect = (f: File) => {
        setError('');
        const err = validateFile(f);
        if (err) {
            setError(err);
            return;
        }
        setFile(f);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileSelect(droppedFile);
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError('');
        setProgress(0);

        // Simulate progress since fetch doesn't support upload progress
        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + Math.random() * 15, 90));
        }, 200);

        try {
            await uploadFile(file, description || undefined);
            setProgress(100);
            clearInterval(progressInterval);
            setTimeout(() => {
                onUploaded();
                handleReset();
            }, 500);
        } catch (err) {
            clearInterval(progressInterval);
            setError(err instanceof Error ? err.message : 'Upload failed');
            setProgress(0);
        }
        setIsUploading(false);
    };

    const handleReset = () => {
        setFile(null);
        setDescription('');
        setError('');
        setProgress(0);
        onClose();
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleReset} />

            {/* Modal */}
            <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 rounded-2xl border border-white/10 bg-[#111118] p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Upload File</h2>
                    <button
                        onClick={handleReset}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Drop Zone */}
                {!file ? (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${isDragging
                                ? 'border-violet-500 bg-violet-500/10'
                                : 'border-white/10 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.04]'
                            }`}
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10">
                            <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-white">
                            Drop your file here, or <span className="text-violet-400">browse</span>
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {allowedTypes.join(', ').toUpperCase()} • Max 50MB
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            accept={allowedTypes.map((t) => `.${t}`).join(',')}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-lg">
                                📄
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{file.name}</p>
                                <p className="text-xs text-zinc-400">{formatSize(file.size)}</p>
                            </div>
                            {!isUploading && (
                                <button
                                    onClick={() => setFile(null)}
                                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {/* Progress bar */}
                        {isUploading && (
                            <div className="mt-3">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-right text-xs text-zinc-500">{Math.round(progress)}%</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Description */}
                {file && !isUploading && (
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Add a description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                        />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Upload Button */}
                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload'}
                    </button>
                )}
            </div>
        </div>
    );
}
