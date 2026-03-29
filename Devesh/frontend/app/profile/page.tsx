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
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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

    // PIN Modal State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [selectedFileForDownload, setSelectedFileForDownload] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPinUpdateModalOpen, setIsPinUpdateModalOpen] = useState(false);

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
            return shareUrl;
        } catch (error: any) {
            console.error('API share error:', error);
            throw error;
        }
    };

    const initiateDownload = (file: any) => {
        setSelectedFileForDownload(file);
        setIsPinModalOpen(true);
    };

    const confirmDownload = async (pin: string) => {
        if (!selectedFileForDownload) return;
        setIsDownloading(true);
        try {
            await api.downloadFile(selectedFileForDownload.id, selectedFileForDownload.name, pin);
            setIsPinModalOpen(false);
            showMessage('success', 'Safe decryption complete. Download started.');
        } catch (error: any) {
            console.error('Download error:', error);
            showMessage('error', error.message || 'Verification failed. Please try again.');
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

    // Profile Picture Handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showMessage('error', 'Image size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPersonalInfo(prev => ({ ...prev, profile_pic: base64String }));
            try {
                await api.updateProfileInfo({ profile_pic: base64String });
                await refreshUser();
                showMessage('success', 'Profile picture updated');
            } catch (err) {
                showMessage('error', 'Failed to upload image');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePic = async () => {
        try {
            await api.updateProfileInfo({ profile_pic: null });
            await refreshUser();
            showMessage('success', 'Profile picture removed');
            setIsAvatarModalOpen(false);
        } catch (err) {
            showMessage('error', 'Failed to remove image');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showMessage('success', 'Copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-blue-500/30">
            <Navbar />
            
            <main className="mx-auto max-w-5xl px-4 pt-24 pb-12">
                {/* Premium Header Card */}
                <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl transition-all hover:shadow-blue-500/5">
                    <div className="bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/5 p-8">
                        <div className="flex flex-col items-center gap-8 md:flex-row">
                            <div className="group relative cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 overflow-hidden text-4xl font-black text-white shadow-2xl transition-transform duration-300 group-hover:scale-105 group-hover:border-blue-500/50">
                                    {user?.profile_pic ? (
                                        <img src={user.profile_pic} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        user?.full_name?.[0] || user?.username?.[0] || 'U'
                                    )}
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <svg className="h-6 w-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Manage</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                    {user?.full_name || user?.username}
                                </h1>
                                <p className="text-sm font-medium text-zinc-400 mt-1">{user?.email}</p>
                                <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-3">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                                        user?.mfa_enabled 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${user?.mfa_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        MFA: {user?.mfa_enabled ? 'SECURED' : 'ACTION REQUIRED'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        Plan: Enterprise
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <input type="file" id="pic-upload" className="hidden" accept="image/*" onChange={(e) => { handleFileChange(e); setIsAvatarModalOpen(false); }} />

                {/* Avatar Management Modal */}
                {isAvatarModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-sm rounded-[2rem] bg-[#0c0c0e] border border-zinc-800 p-8 shadow-2xl">
                            <h3 className="text-lg font-black text-white mb-2 text-center uppercase tracking-widest">Profile Identity</h3>
                            <p className="text-xs text-zinc-500 text-center mb-10 font-medium">Customize your visual interface in the vault</p>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => document.getElementById('pic-upload')?.click()}
                                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-blue-500/50 transition-all group"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-blue-400">Upload New Image</span>
                                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </button>
                                
                                <button 
                                    onClick={handleRemovePic}
                                    disabled={!user?.profile_pic}
                                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all disabled:opacity-30 disabled:hover:bg-zinc-900 group"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">Reset To Initial</span>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                
                                <button 
                                    onClick={() => setIsAvatarModalOpen(false)}
                                    className="w-full py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-zinc-300 transition-colors"
                                >
                                    Cancel Operations
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Message */}
                {message.text && (
                    <div className={`mb-6 rounded-2xl border px-6 py-4 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg ${
                        message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${message.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="mb-10 border-b border-zinc-800/50">
                    <nav className="-mb-px flex space-x-12 overflow-x-auto no-scrollbar">
                        {(['personal', 'storage', 'activity', 'security'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    window.history.pushState(null, '', `?tab=${tab}`);
                                }}
                                className={`whitespace-nowrap border-b-4 py-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                    activeTab === tab 
                                    ? 'border-blue-500 text-blue-400' 
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                    <h2 className="text-xl font-black text-white border-b border-zinc-800/50 pb-5 mb-8 uppercase tracking-widest flex items-center gap-3">
                                        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Profile Details
                                    </h2>
                                    <form onSubmit={handleUpdatePersonal} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="group space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={personalInfo.full_name}
                                                    onChange={e => setPersonalInfo({...personalInfo, full_name: e.target.value})}
                                                    placeholder="Enter your full name"
                                                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/50 px-5 py-4 text-sm text-white font-medium focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                                />
                                            </div>
                                            <div className="group space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Username <span className="text-zinc-700 font-bold ml-1">(Immutable)</span></label>
                                                <input
                                                    type="text"
                                                    value={personalInfo.username}
                                                    readOnly
                                                    className="w-full rounded-2xl border border-zinc-800/50 bg-zinc-950 px-5 py-4 text-sm text-zinc-500 font-medium cursor-not-allowed border-dashed outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Email Address <span className="text-zinc-700 font-bold ml-1">(Immutable)</span></label>
                                            <div className="relative">
                                                <input type="email" value={personalInfo.email} readOnly className="w-full rounded-2xl border border-zinc-800/50 bg-zinc-950 px-5 py-4 text-sm text-zinc-500 font-medium cursor-not-allowed border-dashed" />
                                                <svg className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            </div>
                                        </div>

                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">Mobile Identity</label>
                                            <div className="flex gap-3">
                                                <div className="relative">
                                                    <select className="h-full rounded-2xl border border-zinc-700 bg-zinc-900/50 px-5 pr-12 text-xs font-black text-white outline-none appearance-none focus:border-blue-500/50 transition-all shadow-inner">
                                                        <option>🇮🇳 +91</option>
                                                        <option>🇺🇸 +1</option>
                                                        <option>🇬🇧 +44</option>
                                                        <option>🇦🇪 +971</option>
                                                        <option>🇸🇬 +65</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={personalInfo.phone_number}
                                                    onChange={e => setPersonalInfo({...personalInfo, phone_number: e.target.value})}
                                                    placeholder="Enter your phone number"
                                                    className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900/50 px-5 py-4 text-sm text-white font-medium focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-4 pt-6">
                                            <button 
                                                type="submit" 
                                                disabled={isLoading}
                                                className="group relative overflow-hidden rounded-2xl bg-white px-10 py-4 text-xs font-black text-black hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <span className="relative z-10 uppercase tracking-widest">Update Profile</span>
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            </button>
                                            <button type="button" onClick={() => refreshUser()} className="rounded-2xl border border-zinc-800 bg-transparent px-10 py-4 text-xs font-black text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all uppercase tracking-widest">Revert Changes</button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <svg className="h-24 w-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5-1.1-2.5-2.5S10.6 7 12 7zm0 13.91C9.47 19.12 7 16.27 7 13c0-2.76 2.24-5 5-5s5 2.24 5 5c0 3.27-2.47 6.12-5 7.91z" /></svg>
                                    </div>
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-blue-500" />
                                        Advanced Security Analytics
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-zinc-500 uppercase tracking-widest">Vault Instance ID</span>
                                                <button onClick={() => copyToClipboard(user?.id || '')} className="text-blue-500 hover:text-blue-400 font-bold transition-colors">COPY ID</button>
                                            </div>
                                            <div className="font-mono bg-zinc-950/80 border border-zinc-800 px-4 py-3 rounded-xl text-[10px] text-zinc-400 break-all leading-relaxed shadow-inner">
                                                {user?.id}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Protection Layer</span>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Security Tier</span>
                                            <div className="text-right">
                                                <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest block">L3 Enterprise</span>
                                                <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Zero-Trust Protocol Active</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-zinc-800/50">
                                        <p className="text-[9px] text-zinc-600 uppercase font-black leading-relaxed tracking-widest mb-4">
                                            What is L3 Enterprise? <br/>
                                            <span className="font-medium text-zinc-700 normal-case tracking-normal">It means you are protected by the highest level of bank-grade encryption (AES-256-GCM) with per-file keys and hardware-isolated authentication.</span>
                                        </p>
                                        <button className="w-full py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-[0.98]">
                                            Export Security Audit Logs
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: STORAGE */}
                    {activeTab === 'storage' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {isLoading ? <div className="py-24 text-center text-zinc-600 font-bold uppercase tracking-widest animate-pulse">Synchronizing Cryptographic Vault...</div> : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Used Capacity</p>
                                            <p className="text-3xl font-black text-white">{formatSize(storageStats?.used_size)}</p>
                                            <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${storageStats?.percentage}%` }} />
                                            </div>
                                        </div>
                                        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Files</p>
                                            <h2 className="text-4xl font-black text-white">{storageStats?.total_files || 0}</h2>
                                            <p className="text-[10px] font-medium text-zinc-600 mt-2 uppercase tracking-widest">Across all data tiers</p>
                                        </div>
                                        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Free Space</p>
                                            <p className="text-3xl font-black text-emerald-400">{formatSize(storageStats?.free_size)}</p>
                                            <p className="text-[10px] text-zinc-600 mt-2 font-bold uppercase tracking-widest">Available for allocation</p>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                Storage Breakdown
                                            </h3>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{storageStats?.percentage || '0.00'}% Allocated</span>
                                        </div>
                                        <div className="h-4 w-full rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-inner flex">
                                            <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${storageStats?.percentage}%` }}></div>
                                        </div>
                                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                    Encrypted Media
                                                </div>
                                                <p className="text-xs font-bold text-zinc-300 pl-4">{formatSize(storageStats?.breakdown?.images || 0)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    Secure Docs
                                                </div>
                                                <p className="text-xs font-bold text-zinc-300 pl-4">{formatSize(storageStats?.breakdown?.docs || 0)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
                                                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                    Binary Blobs
                                                </div>
                                                <p className="text-xs font-bold text-zinc-300 pl-4">{formatSize(storageStats?.breakdown?.others || 0)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-2xl">
                                        <div className="bg-zinc-900/50 px-8 py-5 border-b border-zinc-800 flex justify-between items-center">
                                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Recently Access Objects</h3>
                                            <button className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">View All Files</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[#0c0c0e] text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800/50">
                                                    <tr>
                                                        <th className="px-8 py-5">File Name</th>
                                                        <th className="px-8 py-5">Extension</th>
                                                        <th className="px-8 py-5">Size</th>
                                                        <th className="px-8 py-5 text-right">Operations</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800/50">
                                                    {storageStats?.recentFiles?.map((f: any, idx: number) => (
                                                        <tr key={f.id || `file-${idx}`} className="hover:bg-zinc-800/30 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-[10px] group-hover:border-blue-500/30 transition-colors uppercase">
                                                                        {f.type.substring(0, 3)}
                                                                    </div>
                                                                    <span className="font-bold text-zinc-200">{f.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">.{f.type}</td>
                                                            <td className="px-8 py-5 text-zinc-500 font-mono text-[10px]">{formatSize(f.size)}</td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex justify-end gap-5 text-[9px] font-black uppercase tracking-widest">
                                                                    <button onClick={() => handleShare(f)} className="text-zinc-500 hover:text-blue-500 transition-colors">Share Link</button>
                                                                    <button className="text-zinc-500 hover:text-green-500 transition-colors">Direct Share</button>
                                                                    <button onClick={() => initiateDownload(f)} className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all">Download</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB 3: ACTIVITY */}
                    {activeTab === 'activity' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="space-y-6">
                                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    Access Vector History
                                </h2>
                                <div className="space-y-3">
                                    {activityData?.loginHistory?.map((log: any, idx: number) => (
                                        <div key={log.id || `log-${idx}`} className="group rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 flex justify-between items-center transition-all hover:border-zinc-700">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-zinc-200">{log.ip_address}</span>
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-500 truncate w-64 group-hover:text-zinc-400 transition-colors uppercase tracking-tight">{log.user_agent}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                log.status === 'success' 
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}>
                                                {log.status === 'success' ? 'Authorized' : 'Denied'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                    Cryptographic Operations
                                </h2>
                                <div className="space-y-3">
                                    {activityData?.fileActivity?.map((log: any, idx: number) => (
                                        <div key={log.id || `act-${idx}`} className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 flex gap-5 items-center hover:border-zinc-700 transition-all">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                                log.event_type.includes('upload') ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                            }`}>
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {log.event_type.includes('upload') 
                                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    }
                                                </svg>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-zinc-200 uppercase tracking-widest">{log.event_type.replace('_', ' ')}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{log.event_description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SECURITY */}
                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                    <h3 className="text-sm font-black text-white border-b border-zinc-800/50 pb-4 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        Multi-Factor Protocols
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-zinc-100 uppercase tracking-widest">TOTP Authenticator</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">RFC 6238 Standard Compliance</p>
                                            </div>
                                            <button onClick={() => setIsMfaModalOpen(true)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                user?.mfa_enabled 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                            }`}>
                                                {user?.mfa_enabled ? 'Reconfigure' : 'Initialize'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                    <h3 className="text-sm font-black text-white border-b border-zinc-800/50 pb-4 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                        Access Decryption PIN
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Primary Security PIN</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">Secondary Layer Decryption Key</p>
                                            </div>
                                            <button onClick={() => setIsPinUpdateModalOpen(true)} className="bg-violet-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20">
                                                Manage PIN
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-600 font-medium leading-relaxed px-1">
                                            <span className="text-violet-500 font-black">Note:</span> This PIN is required to authorize any file decryption or download from your vault.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                    <h3 className="text-sm font-black text-white border-b border-zinc-800/50 pb-4 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003 20c3.517 0 6.799-1.009 9.571-2.753m0-3.44l.09.054A10.003 10.003 0 0020 3c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3" /></svg>
                                        Encryption Sessions
                                    </h3>
                                    <div className="space-y-3">
                                        {sessions.map(s => (
                                            <div key={s.id} className="flex justify-between items-center bg-zinc-900/30 px-5 py-4 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-200">{s.ip_address}</p>
                                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5 truncate w-32">{s.user_agent.split(')')[0].split('(')[1]}</p>
                                                </div>
                                                <button onClick={() => handleRevokeSession(s.id)} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 p-2 bg-rose-500/5 rounded-lg border border-rose-500/10">Terminate</button>
                                            </div>
                                        ))}
                                        {sessions.length > 1 && (
                                            <button className="w-full mt-4 py-3 border border-zinc-800 rounded-2xl text-[10px] font-black text-rose-500 hover:bg-rose-500/5 transition-all uppercase tracking-[0.2em]">Purge Active Sessions</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Password Change Form */}
                            <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-8 shadow-xl">
                                <h3 className="text-sm font-black text-white mb-8 border-b border-zinc-800/50 pb-4 uppercase tracking-widest">Update Cipherphrase</h3>
                                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Password</label>
                                        <input type="password" placeholder="••••••••••••" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/50 px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono" required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Password</label>
                                            <input type="password" placeholder="••••••••••••" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/50 px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Confirm New</label>
                                            <input type="password" placeholder="••••••••••••" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/50 px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono" required />
                                        </div>
                                    </div>
                                    <button type="submit" className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-lg">Update Secure Key</button>
                                </form>
                            </div>

                            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8">
                                <h3 className="text-xs font-black text-rose-500 mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    Account Erasure Protocol
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <button className="border border-zinc-800 text-zinc-400 py-3 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all">Download Audit Archive</button>
                                    <button className="bg-rose-600/10 text-rose-500 py-3 px-8 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Initialize Account Deletion</button>
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
                fileId={selectedFileForShare?.id || ''}
                onClose={() => setIsShareModalOpen(false)}
                onShare={performShare}
            />

            <DownloadPinModal 
                isOpen={isPinModalOpen} 
                onClose={() => setIsPinModalOpen(false)}
                onConfirm={confirmDownload}
                fileName={selectedFileForDownload?.name || ''}
                isDownloading={isDownloading}
            />

            <PinUpdateModal 
                isOpen={isPinUpdateModalOpen}
                onClose={() => setIsPinUpdateModalOpen(false)}
                mfaEnabled={!!user?.mfa_enabled}
                onSuccess={() => showMessage('success', 'Security PIN updated successfully. Access system re-locked.')}
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
