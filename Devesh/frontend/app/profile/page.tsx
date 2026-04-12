'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import MfaModal from '../components/MfaModal';
import ShareModal from '../components/ShareModal';
import AdvancedShareModal from '../components/AdvancedShareModal';
import DownloadPinModal from '../components/DownloadPinModal';
import PinUpdateModal from '../components/PinUpdateModal';
import BackgroundAnimation from '../components/BackgroundAnimation';
import FileCard from '../components/FileCard';
import { useSearchParams } from 'next/navigation';

function ProfileContent() {
    const { user, refreshUser, sessionDuration } = useAuth();
    const searchParams = useSearchParams();

    // Sharing UI State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedFileForShare, setSelectedFileForShare] = useState<any>(null);
    const [isAdvShareOpen, setIsAdvShareOpen] = useState(false);
    const [advShareFile, setAdvShareFile] = useState<{ id: string; name: string } | null>(null);

    const initialTab = searchParams.get('tab') as any;
    const [activeTab, setActiveTab] = useState<'personal' | 'storage' | 'activity' | 'security'>(
        ['personal', 'storage', 'activity', 'security'].includes(initialTab) ? initialTab : 'personal'
    );

    useEffect(() => {
        if (initialTab && ['personal', 'storage', 'activity', 'security'].includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const [personalInfo, setPersonalInfo] = useState({
        full_name: '',
        username: '',
        email: '',
        phone_number: '',
        gender: 'prefer_not_to_say',
        dob: ''
    });

    const [storageStats, setStorageStats] = useState<any>(null);
    const [files, setFiles] = useState<api.FileItem[]>([]);
    const [activityData, setActivityData] = useState<any>(null);
    const [sessions, setSessions] = useState<api.Session[]>([]);
    const [securityInfo, setSecurityInfo] = useState<any>(null);
    const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        if (user) {
            setPersonalInfo({
                full_name: user?.full_name || '',
                username: user?.username || '',
                email: user?.email || '',
                phone_number: user?.phone_number || '',
                gender: user?.gender || 'prefer_not_to_say',
                dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'storage') {
                    const [stats, filesData] = await Promise.all([
                        api.getStorageStats(),
                        api.getFiles()
                    ]);
                    setStorageStats(stats);
                    setFiles(filesData.data?.files || []);
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

    const loadFiles = async () => {
        try {
            const data = await api.getFiles();
            setFiles(data.data?.files || []);
            const stats = await api.getStorageStats();
            setStorageStats(stats);
        } catch (err) {
            console.error('Reload error:', err);
        }
    };

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
            showMessage('success', 'Node registry updated.');
        } catch (error: any) {
            showMessage('error', error.message || 'Update failed.');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showMessage('error', 'Cipher keys do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await api.changePassword(passwordData.current, passwordData.new);
            showMessage('success', 'Security protocol updated.');
            setPasswordData({ current: '', new: '', confirm: '' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: any) {
            showMessage('error', error.message || 'Cipher sync failed.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await api.revokeSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            showMessage('success', 'Session terminated.');
        } catch (error: any) {
            showMessage('error', 'Revocation failed.');
        }
    };

    const handleLogoutAll = async () => {
        try {
            setIsLoading(true);
            await api.logoutAll();
            window.location.href = '/login';
        } catch (error: any) {
            showMessage('error', error?.message || 'Remote termination failed');
        } finally {
            setIsLoading(false);
        }
    };

    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [selectedFileForDownload, setSelectedFileForDownload] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
    const [isPinUpdateModalOpen, setIsPinUpdateModalOpen] = useState(false);
    const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

    const formatIp = (ip: string) => {
        if (!ip) return '0.0.0.0';
        if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
        return ip.replace('::ffff:', '');
    };

    const handleShare = (file: any) => {
        setSelectedFileForShare({
            id: file.id,
            original_filename: file.original_filename || file.name
        });
        setIsShareModalOpen(true);
    };

    const handleAdvShare = (file: any) => {
        setAdvShareFile({ 
            id: file.id, 
            name: file.original_filename || file.name 
        });
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
            return `${window.location.origin}/share/${data.share_token}`;
        } catch (error: any) {
            throw error;
        }
    };

    const initiateDownload = (file: any) => {
        if (!securityInfo?.is_pin_set) {
            showMessage('error', 'SECURITY ALERT: No Security PIN detected. Please establish your registry first.');
            setActiveTab('security');
            setTimeout(() => {
                const element = document.getElementById('security-pin-registry');
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }
        setSelectedFileForDownload(file);
        setIsPinModalOpen(true);
    };

    const confirmDownload = async (pin: string) => {
        setIsDownloading(true);
        try {
            if (isDownloadingArchive) {
                await api.downloadLogArchive(pin);
                setIsPinModalOpen(false);
                setIsDownloadingArchive(false);
                showMessage('success', 'Archive exported.');
            } else if (selectedFileForDownload) {
                await api.downloadFile(selectedFileForDownload.id, selectedFileForDownload.name, pin);
                setIsPinModalOpen(false);
                showMessage('success', 'Decryption started.');
            }
        } catch (error: any) {
            showMessage('error', error.message || 'PIN Authentication failed.');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Size validation (2MB)
        if (file.size > 2 * 1024 * 1024) { 
            showMessage('error', 'Image size exceeds 2MB limit.'); 
            return; 
        }

        setIsLoading(true);
        try {
            await api.uploadAvatar(file);
            await refreshUser();
            showMessage('success', 'Profile identity updated.');
        } catch (err: any) { 
            showMessage('error', err.message || 'Avatar sync failed.'); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePic = async () => {
        try {
            await api.updateProfileInfo({ profile_pic: null });
            await refreshUser();
            showMessage('success', 'Avatar purged.');
            setIsAvatarModalOpen(false);
        } catch (err) { showMessage('error', 'Purge failed.'); }
    };

    return (
        <div className="min-h-screen bg-[#050508]">
            <Navbar />

            {/* Background Layer */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 hex-pattern opacity-[0.1]" />
                <div className="absolute top-[15%] right-[-5%] h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px] orb-1 morph-blob" />
                <div className="absolute bottom-[20%] left-[-10%] h-[550px] w-[550px] rounded-full bg-indigo-600/5 blur-[140px] orb-2 morph-blob" />
            </div>

            <BackgroundAnimation />

            <main className="relative z-10 mx-auto max-w-5xl px-4 pt-32 pb-12">
                {/* Premium Header Card */}
                <div className="stagger-1 mb-8 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] shadow-2xl glass-card">
                    <div className="bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 p-6 relative">
                        <div className="absolute -top-24 -right-24 h-64 w-64 bg-blue-500/10 blur-[80px] rounded-full" />
                        <div className="flex flex-col items-center gap-6 md:flex-row relative z-10">
                            <div className="group relative cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                                <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-white/[0.06] overflow-hidden text-3xl font-black text-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-blue-500/50 group-hover:shadow-blue-500/20">
                                    {user?.profile_pic ? (
                                        <img 
                                            src={user.profile_pic.startsWith('http') ? user.profile_pic : `${api.RAW_API_URL}${user.profile_pic}`} 
                                            alt="Profile" 
                                            className="h-full w-full object-cover" 
                                        />
                                    ) : (
                                        user?.full_name?.[0] || user?.username?.[0] || 'U'
                                    )}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Manage</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{user?.full_name || user?.username}</h1>
                                <p className="text-[12px] font-bold text-zinc-500 mt-2 uppercase tracking-widest">{user?.email}</p>
                                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2.5">
                                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${user?.mfa_enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        <div className={`h-1 w-1 rounded-full ${user?.mfa_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                        MFA: {user?.mfa_enabled ? 'SECURED' : 'UNGUARDED'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-400">Enterprise Node</span>
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-violet-400">
                                        <div className="h-1 w-1 rounded-full bg-violet-400" />
                                        MEMBER SINCE: {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <input type="file" id="pic-upload" className="hidden" accept="image/*" onChange={(e) => { handleFileChange(e); setIsAvatarModalOpen(false); }} />

                {/* Avatar Modal */}
                {isAvatarModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-sm rounded-[2rem] bg-[#0c0c0e] border border-zinc-800 p-8 shadow-2xl">
                            <h3 className="text-lg font-black text-white mb-2 text-center uppercase tracking-widest">Adjust Avatar</h3>
                            <div className="space-y-4 mt-8">
                                <button onClick={() => document.getElementById('pic-upload')?.click()} className="w-full flex items-center justify-between p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition-all group">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Keyframe</span>
                                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </button>
                                <button onClick={handleRemovePic} disabled={!user?.profile_pic} className="w-full flex items-center justify-between p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-all disabled:opacity-30">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Purge Media</span>
                                </button>
                                <button onClick={() => setIsAvatarModalOpen(false)} className="w-full py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {message.text && (
                    <div className={`mb-8 rounded-2xl border px-6 py-4 text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg ${message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`h-1.5 w-1.5 rounded-full ${message.type === 'error' ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="stagger-2 mb-10 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
                    <nav className="-mb-px flex space-x-12">
                        {(['personal', 'storage', 'activity', 'security'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); window.history.pushState(null, '', `?tab=${tab}`); }}
                                className={`whitespace-nowrap border-b-[3px] py-4 px-2 text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${activeTab === tab ? 'border-blue-500 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="stagger-3 lg:col-span-2 space-y-6">
                                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 glass-card">
                                    <h2 className="text-[16px] font-black text-white border-b border-white/[0.06] pb-4 mb-6 uppercase tracking-widest flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                        Profile Details
                                    </h2>
                                    <form onSubmit={handleUpdatePersonal} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
                                                <input type="text" value={personalInfo.full_name} onChange={e => setPersonalInfo({ ...personalInfo, full_name: e.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-3 text-[13px] text-white focus:border-blue-500/50 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Username</label>
                                                <input type="text" value={personalInfo.username} readOnly className="w-full rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-3 text-[13px] text-zinc-700 cursor-not-allowed outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
                                            <input type="email" value={personalInfo.email} readOnly className="w-full rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-3 text-[13px] text-zinc-700 cursor-not-allowed outline-none" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Phone Number</label>
                                                <input type="tel" value={personalInfo.phone_number} onChange={e => setPersonalInfo({ ...personalInfo, phone_number: e.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-3 text-[13px] text-white focus:border-blue-500/50 outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Gender</label>
                                                <select value={personalInfo.gender} onChange={e => setPersonalInfo({ ...personalInfo, gender: e.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-3 text-[13px] text-white focus:border-blue-500/50 outline-none appearance-none">
                                                    <option value="prefer_not_to_say" className="bg-[#0c0c0e]">Select Gender</option>
                                                    <option value="male" className="bg-[#0c0c0e]">Male</option>
                                                    <option value="female" className="bg-[#0c0c0e]">Female</option>
                                                    <option value="other" className="bg-[#0c0c0e]">Other</option>
                                                    <option value="prefer_not_to_say" className="bg-[#0c0c0e]">Prefer not to say</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date of Birth</label>
                                            <input type="date" value={personalInfo.dob} onChange={e => setPersonalInfo({ ...personalInfo, dob: e.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-3 text-[13px] text-white focus:border-blue-500/50 outline-none [color-scheme:dark]" />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button type="submit" disabled={isLoading} className="rounded-xl bg-white px-8 py-3 text-[10px] font-black text-black transition-all hover:brightness-110 active:scale-[0.97] uppercase tracking-widest">Save Changes</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="stagger-4 space-y-6">
                                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 glass-card">
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-white/[0.06] pb-4">Account Info</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Node ID</span>
                                            <div className="font-mono bg-black/[0.2] border border-white/[0.06] px-3.5 py-2.5 rounded-xl text-[9px] text-zinc-500 break-all leading-relaxed">{user?.id}</div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Storage Tier</span>
                                            <div className="bg-black/[0.2] border border-white/[0.06] px-3.5 py-2.5 rounded-xl text-[11px] text-zinc-300 font-black uppercase flex items-center gap-2">Enterprise (Free)</div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Identity Guard</span>
                                            <div className="bg-black/[0.2] border border-white/[0.06] px-3.5 py-2.5 rounded-xl text-[11px] text-zinc-300 font-black uppercase flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${user?.mfa_enabled ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'}`} />
                                                MFA {user?.mfa_enabled ? 'ENGAGED' : 'OFFLINE'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'storage' && (
                        <div className="space-y-6">
                            <div className="stagger-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 glass-card transition-transform duration-500 hover:scale-[1.01]">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2.5">Storage Used</p>
                                    <p className="text-2xl font-black text-white">{formatSize(storageStats?.used_size)}</p>
                                    <p className="text-[9px] font-bold text-zinc-600 mt-1 uppercase tracking-tighter">of 5 GB total</p>
                                    <div className="mt-4 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]" style={{ width: `${Math.max(1, storageStats?.percentage || 0)}%` }} />
                                    </div>
                                </div>
                                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 glass-card transition-transform duration-500 hover:scale-[1.01]">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Files Stored</p>
                                    <h2 className="text-3xl font-black text-white">{storageStats?.total_files || 0}</h2>
                                    <p className="text-[8px] font-black text-zinc-600 mt-2.5 uppercase tracking-widest">Secure Folders</p>
                                </div>
                                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 glass-card transition-transform duration-500 hover:scale-[1.01]">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2.5">Available Space</p>
                                    <p className="text-2xl font-black text-emerald-400">{formatSize(storageStats?.free_size)}</p>
                                    <p className="text-[9px] font-bold text-emerald-500/50 mt-1 uppercase tracking-tighter">{(100 - (storageStats?.percentage || 0)).toFixed(2)}% free</p>
                                </div>
                            </div>

                            <div className="relative stagger-4 group">
                                <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-1000 blur-xl" />
                                <div className="relative rounded-3xl border border-white/[0.06] bg-[#0c0c10]/60 p-6 glass-card backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01] overflow-hidden">
                                    <div className="absolute -top-24 -right-24 h-64 w-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-700" />
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <h3 className="text-[9px] font-black text-white uppercase tracking-[0.25em] flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                                            Storage Breakdown
                                        </h3>
                                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">
                                            {(storageStats?.used_size / (5 * 1024 * 1024 * 1024) * 100).toFixed(4)}% Allocated
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-white/[0.03] rounded-full overflow-hidden mb-8 flex border border-white/[0.06] shadow-2xl relative z-10">
                                        {storageStats?.used_size > 0 ? (
                                            <>
                                                <div className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)] relative group/segment transition-all duration-1000" style={{ width: `${Math.max(4, (132085 / (5 * 1024 * 1024 * 1024)) * 100 * 5000)}%` }}>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                                                </div>
                                                <div className="h-full bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.3)] relative group/segment transition-all duration-1000" style={{ width: `${Math.max(1.5, (25 / (5 * 1024 * 1024 * 1024)) * 100 * 5000)}%` }}>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                                                </div>
                                                <div className="h-full flex-1 bg-white/[0.02] relative">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full w-full bg-white/[0.02]" />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/[0.04] relative z-10">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Encrypted Media</span>
                                            </div>
                                            <p className="text-sm font-black text-cyan-400 tracking-tight">128.99 KB</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Secure Docs</span>
                                            </div>
                                            <p className="text-sm font-black text-violet-400 tracking-tight">25 B</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500/30" />
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Binary Blobs</span>
                                            </div>
                                            <p className="text-sm font-black text-zinc-700 tracking-tight">0 B</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative stagger-5 group">
                                <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-1000 blur-xl" />
                                <div className="relative rounded-3xl border border-white/[0.04] bg-[#0c0c10]/60 overflow-hidden glass-card backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01]">
                                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
                                    <div className="flex items-center justify-between p-6 border-b border-white/[0.06] relative z-10">
                                        <h3 className="text-[9px] font-black text-white uppercase tracking-[0.25em]">Recently Accessed Objects</h3>
                                        <button className="text-[8px] font-black text-blue-500/80 uppercase tracking-widest hover:text-blue-400 transition-colors">View All Files</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/[0.03]">
                                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">File Name</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Extension</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Size</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center">Operations</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {files.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest">No data objects detected in current vault.</td>
                                                    </tr>
                                                ) : (
                                                    files.map((file) => (
                                                        <tr key={file.id} className="hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/[0.06] group-hover:border-blue-500/30 transition-colors uppercase">{file.file_extension || 'OBJ'}</div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-black text-zinc-300 truncate max-w-[180px]">{file.original_filename}</span>
                                                                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">Today, 14:48</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[10px] font-black text-zinc-600 font-mono tracking-tighter uppercase">{file.file_extension}</td>
                                                            <td className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase">{formatSize(file.file_size)}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => handleShare(file)} className="px-3.5 py-2 rounded-lg bg-cyan-600/10 border border-cyan-400/20 text-[8px] font-black text-cyan-400 uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all cursor-pointer">Share Link</button>
                                                                    <button onClick={() => handleAdvShare(file)} className="px-3.5 py-2 rounded-lg bg-violet-600/10 border border-violet-500/20 text-[8px] font-black text-violet-400 uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all cursor-pointer">Direct Share</button>
                                                                    <button onClick={() => initiateDownload(file)} className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">Download</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (() => {
                        const formatIp = (ip: string) => {
                            if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
                            return ip.replace('::ffff:', '');
                        };

                        const getBrowserName = (ua: string) => {
                            if (ua.includes('Firefox')) return 'Firefox';
                            if (ua.includes('Chrome')) return 'Chrome';
                            if (ua.includes('Safari')) return 'Safari';
                            if (ua.includes('Edge')) return 'Edge';
                            if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
                            return 'Web Browser';
                        };

                        const getDeviceInfo = (ua: string) => {
                            let os = 'Cloud Node';
                            let type = 'desktop';

                            if (ua.includes('Windows')) { os = 'Windows PC'; type = 'desktop'; }
                            else if (ua.includes('Macintosh')) { os = 'MacBook Pro'; type = 'desktop'; }
                            else if (ua.includes('iPhone')) { os = 'iPhone'; type = 'mobile'; }
                            else if (ua.includes('iPad')) { os = 'iPad'; type = 'tablet'; }
                            else if (ua.includes('Android')) { os = 'Android Device'; type = 'mobile'; }
                            else if (ua.includes('Linux')) { os = 'Linux Terminal'; type = 'desktop'; }

                            return { os, type };
                        };

                        const groupedLogins = activityData?.loginHistory?.reduce((acc: any, log: any) => {
                            const formattedIp = formatIp(log.ip_address || '0.0.0.0');
                            const key = `${formattedIp}-${log.user_agent}`;
                            if (!acc[key]) {
                                const info = getDeviceInfo(log.user_agent);
                                acc[key] = {
                                    id: key,
                                    ip: formattedIp,
                                    ua: log.user_agent,
                                    browser: getBrowserName(log.user_agent),
                                    os: info.os,
                                    type: info.type,
                                    status: log.status,
                                    history: []
                                };
                            }
                            acc[key].history.push(log);
                            return acc;
                        }, {}) || {};

                        const loginDevices = Object.values(groupedLogins);

                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="stagger-3 space-y-6">
                                    <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">Login Activity</h2>
                                    <div className="space-y-4">
                                        {loginDevices.length === 0 ? (
                                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest glass-card">No activity trace detected.</div>
                                        ) : (
                                            loginDevices.map((device: any) => {
                                                const isExpanded = expandedDevice === device.id;
                                                return (
                                                    <div key={device.id} className="space-y-2">
                                                        <div 
                                                            onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
                                                            className={`rounded-2xl border p-5 flex justify-between items-center glass-card cursor-pointer transition-all duration-300 hover:bg-white/[0.04] ${isExpanded ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-white/[0.06] bg-white/[0.02]'}`}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className="h-12 w-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.06] shadow-inner">
                                                                    {device.type === 'mobile' ? (
                                                                        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    ) : device.type === 'tablet' ? (
                                                                        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[14px] font-black text-white uppercase tracking-wider">{device.os}</span>
                                                                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${device.status === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-400 border-rose-500/20 bg-rose-500/5'}`}>{device.status}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                                                                            <span className="text-[7.5px] text-zinc-500 font-black uppercase tracking-tighter">IP:</span>
                                                                            <p className="text-[10px] text-zinc-200 font-bold tracking-widest">{device.ip}</p>
                                                                        </div>
                                                                        <div className="h-1 w-1 rounded-full bg-zinc-700" />
                                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                                                                            <span className="text-[7.5px] text-zinc-500 font-black uppercase tracking-tighter">Browser:</span>
                                                                            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.1em]">{device.browser}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`transition-all duration-300 flex items-center gap-4 ${isExpanded ? 'rotate-180 text-blue-400' : 'text-zinc-600'}`}>
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="ml-8 pl-4 border-l border-white/[0.04] space-y-2 animate-in slide-in-from-top-2 duration-500">
                                                                {device.history.map((log: any, hIdx: number) => (
                                                                    <div key={log.id || hIdx} className="rounded-xl border border-white/[0.02] bg-white/[0.005] p-4 flex flex-col gap-2 group hover:bg-white/[0.02] transition-all">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`h-1.5 w-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500/30 group-hover:bg-emerald-500' : 'bg-rose-500/30 group-hover:bg-rose-500'} transition-colors`} />
                                                                                <span className="text-[10px] text-zinc-300 font-bold tracking-tight">{new Date(log.created_at).toLocaleString()}</span>
                                                                            </div>
                                                                            <span className={`text-[8px] font-black uppercase tracking-widest ${log.status === 'success' ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>{log.status}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 pl-4">
                                                                            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">IP: {formatIp(log.ip_address)}</span>
                                                                            <span className="text-[8px] text-zinc-700 font-bold uppercase">{device.browser}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                                <div className="stagger-4 space-y-6">
                                    <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">Packet Trace</h2>
                                    <div className="space-y-3">
                                        {activityData?.fileActivity?.length === 0 ? (
                                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest glass-card">No trace objects detected.</div>
                                        ) : (
                                            activityData?.fileActivity?.map((log: any, idx: number) => (
                                                <div key={log.id || idx} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex gap-5 items-center glass-card hover:bg-white/[0.04] transition-all">
                                                    <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/[0.06]">
                                                        <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-black text-zinc-200 uppercase tracking-wide">{log.event_type.replace('_', ' ')}</p>
                                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tight">{log.event_description}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'security' && (
                        <div className="space-y-8">

                            <div className="stagger-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-3xl border border-white/[0.06] bg-[#0c0c10]/60 p-8 glass-card backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01]">
                                    <h3 className="text-[9px] font-black text-white mb-8 border-b border-white/[0.06] pb-5 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                        MFA Authenticator
                                    </h3>
                                    <div className="flex justify-between items-center bg-white/[0.01] p-6 rounded-2xl border border-white/[0.04]">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">MFA</p>
                                            <p className="text-[8px] text-zinc-600 font-bold uppercase">2-Step Verification</p>
                                        </div>
                                        <button onClick={() => setIsMfaModalOpen(true)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${user?.mfa_enabled ? 'text-emerald-400 border border-emerald-500/20 bg-emerald-500/5' : 'bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/5'}`}>{user?.mfa_enabled ? 'Enabled' : 'Setup Now'}</button>
                                    </div>
                                </div>
                                <div id="security-pin-registry" className="rounded-3xl border border-white/[0.06] bg-[#0c0c10]/60 p-8 glass-card backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01] flex flex-col">
                                    <h3 className="text-[9px] font-black text-white mb-8 border-b border-white/[0.06] pb-5 uppercase tracking-[0.2em] flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Security PIN Registry
                                        </span>
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[8px] font-black tracking-widest ${securityInfo?.is_pin_set ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                            <div className={`h-1 w-1 rounded-full ${securityInfo?.is_pin_set ? 'bg-emerald-400 animate-pulse shadow-[0_0_5px_#10b981]' : 'bg-rose-500 shadow-[0_0_5px_#ef4444]'}`} />
                                            {securityInfo?.is_pin_set ? 'PIN SECURED' : 'PIN NOT SET'}
                                        </span>
                                    </h3>
                                    <div className="flex-1 flex flex-col justify-center gap-4">
                                        <p className="text-[9px] text-zinc-500 text-center font-bold uppercase tracking-tighter leading-relaxed">Required for all sensitive file operations and vault access.</p>
                                        <button onClick={() => setIsPinUpdateModalOpen(true)} className="bg-violet-600 hover:bg-violet-500 text-white w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 transition-all active:scale-95">
                                            {securityInfo?.is_pin_set ? 'Update Your Security PIN' : 'Create Your Security PIN'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="stagger-4 space-y-5">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                        Active Directives
                                    </h3>
                                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{sessions.length} Nodes Verified</span>
                                </div>
                                <div className="space-y-3">
                                    {sessions.sort((a, b) => (a.is_current ? -1 : 1)).map((sess) => (
                                        <div key={sess.id} className={`rounded-3xl border p-4.5 glass-card relative overflow-hidden transition-all duration-500 ${sess.is_current ? 'border-violet-500/30 bg-violet-500/[0.03]' : 'border-white/[0.06] bg-white/[0.01]'}`}>
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${sess.is_current ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-white/[0.04] border-white/[0.06] text-zinc-500'}`}>
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[13px] font-bold text-white uppercase tracking-wide group-hover:text-violet-300 transition-colors">{formatIp(sess.ip_address)}</p>
                                                            {sess.is_current && <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-md uppercase border border-emerald-500/20">Active Node</span>}
                                                        </div>
                                                        <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1 tracking-tighter max-w-[200px] truncate">{sess.user_agent}</p>
                                                        <div className="text-[9px] text-violet-400 font-black uppercase mt-1.5 tracking-widest flex items-center gap-1.5">
                                                            <div className="h-1 w-1 rounded-full bg-violet-400 shadow-[0_0_5px_#a78bfa] animate-pulse" />
                                                            LIFE: {sess.is_current ? sessionDuration : 'PERSISTENT'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!sess.is_current && (
                                                    <button onClick={() => handleRevokeSession(sess.id)} className="px-4 py-2 rounded-lg border border-rose-500/20 bg-rose-500/5 text-[9px] font-black text-rose-500 uppercase tracking-widest transition-all hover:bg-rose-500 hover:text-white">Revoke</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="stagger-4 rounded-3xl border border-white/[0.04] bg-[#0c0c10]/60 p-8 glass-card backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01] relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 h-64 w-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
                                <h3 className="text-[9px] font-black text-white mb-10 uppercase tracking-[0.25em] relative z-10">Change Password</h3>
                                <form onSubmit={handleUpdatePassword} className="space-y-8 max-w-2xl relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Current Password</label>
                                        <input type="password" placeholder="••••••••••••" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} className="w-full rounded-2xl border border-white/[0.06] bg-black/[0.2] px-6 py-4 text-[13px] text-white outline-none font-mono focus:border-blue-500/40 transition-all shadow-inner" required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block ml-1">New Password</label>
                                            <input type="password" placeholder="••••••••••••" value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })} className="w-full rounded-2xl border border-white/[0.06] bg-black/[0.2] px-6 py-4 text-[13px] text-white outline-none font-mono focus:border-blue-500/40 transition-all shadow-inner" required />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Confirm Password</label>
                                            <input type="password" placeholder="••••••••••••" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} className="w-full rounded-2xl border border-white/[0.06] bg-black/[0.2] px-6 py-4 text-[13px] text-white outline-none font-mono focus:border-blue-500/40 transition-all shadow-inner" required />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="bg-white hover:bg-zinc-200 text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 mt-4">Update Password</button>
                                </form>
                            </div>

                            <div className="stagger-5 rounded-3xl border border-rose-500/10 bg-rose-500/[0.01] p-8 glass-card transition-transform duration-500 hover:scale-[1.01] relative overflow-hidden">
                                <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-rose-500/5 blur-[80px] rounded-full pointer-events-none" />
                                <h3 className="text-[9px] font-black text-rose-500 mb-8 uppercase tracking-[0.25em] flex items-center gap-2 relative z-10">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    Delete Account
                                </h3>
                                <div className="flex flex-wrap gap-4 relative z-10">
                                    <button onClick={() => { 
                                        if (!securityInfo?.is_pin_set) {
                                            showMessage('error', 'SECURITY ALERT: PIN registration required for log export.');
                                            setActiveTab('security');
                                            setTimeout(() => {
                                                const el = document.getElementById('security-pin-registry');
                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 100);
                                            return;
                                        }
                                        setIsPinModalOpen(true); 
                                        setIsDownloadingArchive(true); 
                                    }} className="px-8 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.02] text-[9px] font-black text-white hover:bg-white/[0.05] transition-all uppercase tracking-widest">Download Log Archive</button>
                                    <button onClick={async () => { if (window.confirm('🚨 PERMANENT DELETE everything?')) { try { setIsLoading(true); await api.deleteAccount(); window.location.href = '/login'; } finally { setIsLoading(false); } } }} className="bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-500 hover:text-white py-3.5 px-8 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg shadow-rose-900/10 active:scale-95 tracking-widest">Delete Everything</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <MfaModal isOpen={isMfaModalOpen} onClose={() => setIsMfaModalOpen(false)} />
            <ShareModal isOpen={isShareModalOpen} fileName={selectedFileForShare?.name || ''} fileId={selectedFileForShare?.id || ''} onClose={() => setIsShareModalOpen(false)} onShare={performShare} />
            <AdvancedShareModal isOpen={isAdvShareOpen} onClose={() => setIsAdvShareOpen(false)} fileId={advShareFile?.id || ''} fileName={advShareFile?.name || ''} />
            <DownloadPinModal isOpen={isPinModalOpen} onClose={() => { setIsPinModalOpen(false); setIsDownloadingArchive(false); }} onConfirm={confirmDownload} fileName={selectedFileForDownload?.name || ''} isDownloading={isDownloading} />
            <PinUpdateModal isOpen={isPinUpdateModalOpen} onClose={() => setIsPinUpdateModalOpen(false)} mfaEnabled={user?.mfa_enabled ?? false} onSuccess={() => showMessage('success', 'Registry updated!')} />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfileContent />
        </AuthGuard>
    );
}
