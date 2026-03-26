'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import MfaModal from '../components/MfaModal';
import ShareModal from '../components/ShareModal';
import AdvancedShareModal from '../components/AdvancedShareModal';

import { useSearchParams } from 'next/navigation';

function ProfileContent() {
    const { user, refreshUser } = useAuth();
    const searchParams = useSearchParams();
    
    // Sharing UI State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedFileForShare, setSelectedFileForShare] = useState<any>(null);
    // Advanced P2PE Share Modal
    const [isAdvShareOpen, setIsAdvShareOpen] = useState(false);
    const [advShareFile, setAdvShareFile] = useState<{ id: string; name: string } | null>(null);
    const initialTab = searchParams.get('tab') as any;
    const [activeTab, setActiveTab] = useState<'personal' | 'storage' | 'activity' | 'security'>(
        ['personal', 'storage', 'activity', 'security'].includes(initialTab) ? initialTab : 'personal'
    );
    
    // Sync tab with URL
    useEffect(() => {
        if (initialTab && ['personal', 'storage', 'activity', 'security'].includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    
    // Feedback State
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Personal Info State
    const [personalInfo, setPersonalInfo] = useState({
        full_name: '',
        username: '',
        email: '',
        phone_number: '',
        gender: 'prefer_not_to_say',
        dob: ''
    });

    // Storage State
    const [storageStats, setStorageStats] = useState<any>(null);

    // Activity State
    const [activityData, setActivityData] = useState<any>(null);

    // Security State
    const [sessions, setSessions] = useState<api.Session[]>([]);
    const [securityInfo, setSecurityInfo] = useState<any>(null);
    const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Load initial data
    useEffect(() => {
        if (user) {
            setPersonalInfo({
                full_name: user.full_name || '',
                username: user.username || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                gender: user.gender || 'prefer_not_to_say',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
            });
        }
    }, [user]);

    // Fetch tab data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'storage') {
                    const stats = await api.getStorageStats();
                    setStorageStats(stats);
                } else if (activeTab === 'activity') {
                    const activity = await api.getActivityLog();
                    setActivityData(activity);
                } else if (activeTab === 'security') {
                    const [sess, sec] = await Promise.all([
                        api.getSessions(),
                        api.getSecurityInfo()
                    ]);
                    setSessions(sess);
                    setSecurityInfo(sec);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleUpdatePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updateProfileInfo({
                full_name: personalInfo.full_name,
                username: personalInfo.username,
                gender: personalInfo.gender,
                phone_number: personalInfo.phone_number,
                dob: personalInfo.dob || null
            });
            await refreshUser();
            showMessage('success', 'Personal information updated successfully.');
        } catch (error: any) {
            showMessage('error', error.message || 'Update failed.');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showMessage('error', 'New passwords do not match.');
            return;
        }
        try {
            await api.changePassword(passwordData.current, passwordData.new);
            showMessage('success', 'Password updated successfully.');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            showMessage('error', error.message || 'Failed to update password.');
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await api.revokeSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            showMessage('success', 'Session revoked.');
        } catch (error: any) {
            showMessage('error', 'Failed to revoke session.');
        }
    };

    const handleShare = (file: any) => {
        setSelectedFileForShare(file);
        setIsShareModalOpen(true);
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
            await navigator.clipboard.writeText(shareUrl);
            showMessage('success', `${options.password ? 'Password Protected' : 'Public'} Link copied to clipboard!`);
            return shareUrl;
        } catch (error: any) {
            showMessage('error', error.message || 'Failed to generate share link.');
            return null;
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans">
            <Navbar />
            
            <main className="mx-auto max-w-5xl px-4 pt-24 pb-12">
                {/* Header Card */}
                {/* Premium Header Card */}
                <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
                    <div className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 p-8">
                        <div className="flex flex-col items-center gap-8 md:flex-row">
                            <div className="group relative cursor-pointer">
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl font-black text-white shadow-xl shadow-blue-500/20 ring-4 ring-white transition-transform duration-300 group-hover:scale-105">
                                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <svg className="h-6 w-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{user?.full_name || user?.username}</h1>
                                <p className="text-sm font-medium text-zinc-500 mt-1">{user?.email}</p>
                                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${user?.mfa_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${user?.mfa_enabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        MFA: {user?.mfa_enabled ? 'Safe' : 'Action Required'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        Plan: Pro
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                        Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast Message */}
                {message.text && (
                    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm animate-in fade-in duration-300 ${
                        message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Tab Navigation */}
                {/* Custom Tab Navigation */}
                <div className="mb-8 border-b border-zinc-200">
                    <nav className="-mb-px flex space-x-12 overflow-x-auto no-scrollbar">
                        {(['personal', 'storage', 'activity', 'security'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    window.history.pushState(null, '', `?tab=${tab}`);
                                }}
                                className={`whitespace-nowrap border-b-4 py-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-600'
                                }`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {/* TAB 1: PERSONAL INFO */}
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                                    <h2 className="text-xl font-black text-zinc-900 border-b border-zinc-100 pb-4 mb-6 uppercase tracking-wider">Profile Details</h2>
                                    <form onSubmit={handleUpdatePersonal} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={personalInfo.full_name}
                                                    onChange={e => setPersonalInfo({...personalInfo, full_name: e.target.value})}
                                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</label>
                                                <input
                                                    type="text"
                                                    value={personalInfo.username}
                                                    onChange={e => setPersonalInfo({...personalInfo, username: e.target.value})}
                                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email (Secured)</label>
                                            <input type="email" value={personalInfo.email} readOnly className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 font-medium cursor-not-allowed" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</label>
                                            <div className="flex gap-2">
                                                <div className="relative">
                                                    <select className="h-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 pr-10 text-sm font-bold text-zinc-700 outline-none appearance-none focus:border-blue-500 transition-all shadow-sm">
                                                        <option>🇮🇳 +91</option>
                                                        <option>🇺🇸 +1</option>
                                                        <option>🇬🇧 +44</option>
                                                        <option>🇦🇪 +971</option>
                                                        <option>🇸🇬 +65</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={personalInfo.phone_number}
                                                    onChange={e => setPersonalInfo({...personalInfo, phone_number: e.target.value})}
                                                    placeholder="8368010XXX"
                                                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 pt-4">
                                            <button type="submit" className="rounded-xl bg-zinc-900 px-8 py-3 text-xs font-black text-white shadow-xl shadow-zinc-900/20 hover:bg-black transition-all uppercase tracking-widest">Save Changes</button>
                                            <button type="button" onClick={() => refreshUser()} className="rounded-xl border border-zinc-300 px-8 py-3 text-xs font-black text-zinc-500 hover:bg-zinc-50 transition-all uppercase tracking-widest">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-8 text-white shadow-xl shadow-zinc-900/20">
                                    <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4 italic">System Analytics</h3>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-white/40 uppercase tracking-widest">Unique ID</span>
                                            <span className="font-mono bg-white/10 px-2 py-1 rounded text-white/90">{user?.id?.substring(0, 14)}...</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-white/40 uppercase tracking-widest">Protection</span>
                                            <span className="font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-white/40 uppercase tracking-widest">Data Tier</span>
                                            <span className="font-bold text-blue-400 uppercase tracking-widest underline decoration-blue-500/30">L3 Enterprise</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-8 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/15 transition-all active:scale-95 border border-white/5">Export Audit Logs</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: STORAGE */}
                    {activeTab === 'storage' && (
                        <div className="space-y-6">
                            {isLoading ? <div className="py-12 text-center text-zinc-500">Calculating stats...</div> : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="rounded-xl border border-zinc-200 bg-white p-6"><p className="text-xs font-bold text-zinc-500 uppercase">Used Space</p><p className="text-2xl font-bold text-zinc-900">{formatSize(storageStats?.used_size)}</p></div>
                                        <div className="rounded-xl border border-zinc-200 bg-white p-6"><p className="text-xs font-bold text-zinc-500 uppercase">Total Files</p><p className="text-2xl font-bold text-zinc-900">{storageStats?.total_files}</p></div>
                                        <div className="rounded-xl border border-zinc-200 bg-white p-6"><p className="text-xs font-bold text-zinc-500 uppercase">Free Space</p><p className="text-2xl font-bold text-emerald-600">{formatSize(storageStats?.free_size)}</p></div>
                                    </div>

                                    <div className="rounded-xl border border-zinc-200 bg-white p-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-bold text-zinc-900 uppercase">Usage Progress</h3>
                                            <span className="text-xs font-bold text-blue-600">{storageStats?.percentage}%</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${storageStats?.percentage}%` }}></div>
                                        </div>
                                        <div className="mt-4 flex gap-6 text-[10px] uppercase font-bold text-zinc-500">
                                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span> Images</div>
                                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Docs</div>
                                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400"></span> Others</div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200">
                                                <tr><th className="px-6 py-3">Recent File</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Size</th><th className="px-6 py-3 text-right">Action</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {storageStats?.recentFiles?.map((f: any) => (
                                                    <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-zinc-900">{f.name}</td>
                                                        <td className="px-6 py-4 text-zinc-500">.{f.type}</td>
                                                        <td className="px-6 py-4 text-zinc-500">{formatSize(f.size)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-3 text-[10px] font-black uppercase tracking-widest">
                                                                <button onClick={() => handleShare(f)} className="text-zinc-400 hover:text-blue-600 transition-colors">Share</button>
                                                                <button onClick={() => { setAdvShareFile({ id: f.id, name: f.name }); setIsAdvShareOpen(true); }} className="text-emerald-500 hover:text-emerald-700 transition-colors">P2PE</button>
                                                                <button onClick={() => api.downloadFile(f.id, f.name)} className="text-blue-600 hover:underline">View</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB 3: ACTIVITY */}
                    {activeTab === 'activity' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-zinc-900 uppercase">Login History</h2>
                                <div className="space-y-2">
                                    {activityData?.loginHistory?.map((log: any) => (
                                        <div key={log.id} className="rounded-lg border border-zinc-100 bg-white p-4 flex justify-between items-center shadow-xs">
                                            <div>
                                                <p className="text-sm font-bold text-zinc-800">{log.ip_address} <span className="text-[10px] text-zinc-400 font-normal ml-2">{new Date(log.created_at).toLocaleString()}</span></p>
                                                <p className="text-xs text-zinc-500 truncate w-48">{log.user_agent}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-zinc-900 uppercase">File Activity</h2>
                                <div className="space-y-2">
                                    {activityData?.fileActivity?.map((log: any) => (
                                        <div key={log.id} className="rounded-lg border border-zinc-100 bg-white p-4 flex gap-4 items-center">
                                            <div className={`h-8 w-8 rounded flex items-center justify-center ${log.event_type.includes('upload') ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-800 lowercase first-letter:uppercase">{log.event_type.replace('_', ' ')}</p>
                                                <p className="text-[10px] text-zinc-500">{log.event_description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SECURITY */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-xl border border-zinc-200 bg-white p-6">
                                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 mb-4 uppercase">Authentication</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div><p className="text-sm font-bold text-zinc-800">Multi-Factor Auth (MFA)</p><p className="text-xs text-zinc-500">Verification via TOTP App</p></div>
                                            <button onClick={() => setIsMfaModalOpen(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase ${user?.mfa_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white'}`}>
                                                {user?.mfa_enabled ? 'Configure' : 'Enable'}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div><p className="text-sm font-bold text-zinc-800">Password</p><p className="text-xs text-zinc-500">Security key & login phrase</p></div>
                                            <button className="px-4 py-1.5 rounded-lg border border-zinc-300 text-[10px] font-bold text-zinc-600 uppercase hover:bg-zinc-50">Change</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-zinc-200 bg-white p-6">
                                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 mb-4 uppercase">Active Sessions</h3>
                                    <div className="space-y-3">
                                        {sessions.map(s => (
                                            <div key={s.id} className="flex justify-between items-center text-xs">
                                                <div><p className="font-bold text-zinc-800">{s.ip_address}</p><p className="text-zinc-500 truncate w-32">{s.user_agent.split(')')[0].split('(')[1]}</p></div>
                                                <button onClick={() => handleRevokeSession(s.id)} className="text-red-500 font-bold uppercase hover:underline">Revoke</button>
                                            </div>
                                        ))}
                                        <button className="w-full mt-4 py-2 border border-blue-600 rounded-lg text-[10px] font-bold text-blue-600 uppercase hover:bg-blue-50 transition-colors">Logout All Devices</button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Password Change Form (Hidden by default or shown on click) */}
                            <div className="rounded-xl border border-zinc-200 bg-white p-6">
                                <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase">Change Password</h3>
                                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                                    <input type="password" placeholder="Current Password" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 outline-none" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="password" placeholder="New Password" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 outline-none" required />
                                        <input type="password" placeholder="Confirm" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 outline-none" required />
                                    </div>
                                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition">Update Password</button>
                                </form>
                            </div>

                            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                                <h3 className="text-sm font-bold text-red-700 mb-4 uppercase">Danger Zone</h3>
                                <div className="flex flex-wrap gap-4">
                                    <button className="border border-red-300 text-red-700 py-2 px-6 rounded-lg text-xs font-bold hover:bg-red-100 transition shadow-sm uppercase">Download My Data</button>
                                    <button className="bg-red-600 text-white py-2 px-6 rounded-lg text-xs font-bold hover:bg-red-700 transition shadow-sm uppercase">Delete Account</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <MfaModal isOpen={isMfaModalOpen} onClose={() => setIsMfaModalOpen(false)} />
            
            <ShareModal 
                isOpen={isShareModalOpen} 
                fileName={selectedFileForShare?.name || ''}
                onClose={() => setIsShareModalOpen(false)}
                onShare={performShare}
            />

            {advShareFile && (
                <AdvancedShareModal
                    isOpen={isAdvShareOpen}
                    onClose={() => { setIsAdvShareOpen(false); setAdvShareFile(null); }}
                    fileId={advShareFile.id}
                    fileName={advShareFile.name}
                />
            )}
        </div>
    );
}

import { Suspense } from 'react';

export default function ProfilePage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading Profile...</div>}>
                <ProfileContent />
            </Suspense>
        </AuthGuard>
    );
}
