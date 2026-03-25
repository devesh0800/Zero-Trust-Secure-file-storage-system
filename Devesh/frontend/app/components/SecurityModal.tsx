import { useState, useEffect } from 'react';
import { getSessions, revokeSession, getAuditLogs, Session, AuditLogEntry } from '@/lib/api';

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
    const [activeTab, setActiveTab] = useState<'sessions' | 'activity'>('sessions');

    // Sessions State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Audit Logs State
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        if (activeTab === 'sessions') {
            fetchSessions();
        } else {
            fetchLogs();
        }
    }, [isOpen, activeTab]);

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const data = await getAuditLogs(1, 50); // Fetch recent 50 logs
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            setRevokingId(sessionId);
            await revokeSession(sessionId);
            // Remove from list
            setSessions(sessions.filter(s => s.id !== sessionId));
        } catch (error) {
            console.error('Failed to revoke session:', error);
            alert('Failed to revoke session. Please try again.');
        } finally {
            setRevokingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to format User Agent nicely
    const parseUserAgent = (ua: string) => {
        if (ua.includes('Edg/')) return 'Edge';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Postman')) return 'Postman';
        return 'Unknown Browser';
    };

    const getEventColor = (type: string, status: string) => {
        if (status === 'failure') return 'text-red-400';
        if (type.includes('login') && status === 'success') return 'text-emerald-400';
        if (type.includes('logout')) return 'text-zinc-400';
        if (type.includes('file_download')) return 'text-blue-400';
        if (type.includes('file_upload')) return 'text-violet-400';
        if (type.includes('file_delete')) return 'text-amber-400';
        return 'text-zinc-300';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Security Center</h2>
                            <p className="text-sm text-zinc-400">Manage your active sessions and view account activity.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 px-6 pt-2">
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sessions'
                            ? 'border-violet-500 text-violet-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-white/10'
                            }`}
                    >
                        Active Sessions
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity'
                            ? 'border-violet-500 text-violet-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-white/10'
                            }`}
                    >
                        Activity Log
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {/* SESSIONS TAB */}
                    {activeTab === 'sessions' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            {isLoadingSessions ? (
                                <div className="flex justify-center py-10">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-10 text-zinc-400">
                                    No active sessions found.
                                </div>
                            ) : (
                                sessions.map((session, index) => (
                                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${index === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-400 border border-white/10'}`}>
                                                {index === 0 ? (
                                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-white">
                                                        {parseUserAgent(session.user_agent)}
                                                    </h3>
                                                    {index === 0 && (
                                                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">Current</span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-zinc-400 flex items-center gap-1.5">
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                    </svg>
                                                    {session.ip_address}
                                                </p>
                                                <p className="mt-0.5 text-xs text-zinc-500">
                                                    Started: {formatDate(session.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {index !== 0 && (
                                            <button
                                                onClick={() => handleRevokeSession(session.id)}
                                                disabled={revokingId === session.id}
                                                className="flex h-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50 sm:w-auto w-full"
                                            >
                                                {revokingId === session.id ? 'Removing...' : 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ACTIVITY LOG TAB */}
                    {activeTab === 'activity' && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            {isLoadingLogs ? (
                                <div className="flex justify-center py-10">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-10 text-zinc-400">
                                    No activity logs found.
                                </div>
                            ) : (
                                <div className="relative border-l border-white/10 ml-3 md:ml-4 space-y-6 pb-4">
                                    {logs.map((log) => (
                                        <div key={log.id} className="relative pl-6 md:pl-8">
                                            {/* Timeline dot */}
                                            <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#12121a] ${log.status === 'success' ? 'bg-violet-500' : 'bg-red-500'}`} />

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <h4 className={`text-sm font-medium ${getEventColor(log.event_type, log.status)}`}>
                                                    {log.event_type.replace(/_/g, ' ').toUpperCase()}
                                                </h4>
                                                <span className="text-xs text-zinc-500">{formatDate(log.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-zinc-300 mb-2">
                                                {log.event_description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                    </svg>
                                                    {log.ip_address}
                                                </span>
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5 max-w-[200px] truncate" title={log.user_agent}>
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                                    </svg>
                                                    {parseUserAgent(log.user_agent)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
