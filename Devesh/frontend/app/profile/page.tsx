'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';

function ProfileContent() {
    const { user, refreshUser } = useAuth();
    
    // Basic Info State
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('Prefer not to say');
    const [dob, setDob] = useState('');
    const [isUpdatingBasic, setIsUpdatingBasic] = useState(false);
    
    // Security Info State
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Update Flow State
    const [updateType, setUpdateType] = useState<'none' | 'email' | 'phone'>('none');
    const [otpCode, setOtpCode] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
    
    // Feedback State
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load initial user data
    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setUsername(user.username || '');
            setGender(user.gender || 'Prefer not to say');
            setDob(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
            setEmail(user.email || '');
            setPhone(user.phone_number || '');
        }
    }, [user]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleCopyId = () => {
        if (user?.unique_share_id) {
            navigator.clipboard.writeText(user.unique_share_id);
            showMessage('success', 'Share ID copied to clipboard!');
        }
    };

    const handleUpdateBasicInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingBasic(true);
        setMessage({ type: '', text: '' });

        try {
            await api.updateProfileInfo({
                full_name: fullName,
                username,
                gender,
                dob: dob || null
            });
            await refreshUser();
            showMessage('success', 'Profile updated successfully.');
        } catch (error: any) {
            showMessage('error', error.message || 'Failed to update profile.');
        } finally {
            setIsUpdatingBasic(false);
        }
    };

    const handleRequestSecurityUpdate = async (type: 'email' | 'phone') => {
        setMessage({ type: '', text: '' });
        setUpdateType(type);
        setIsUpdatingSecurity(true);
        try {
            await api.sendUpdateOtp(type);
            setShowOtpInput(true);
            showMessage('success', `Verification code sent to your current ${type}.`);
        } catch (error: any) {
            showMessage('error', error.message || `Failed to send OTP for ${type} update.`);
            setUpdateType('none');
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    const handleVerifySecurityUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingSecurity(true);
        setMessage({ type: '', text: '' });

        try {
            if (updateType === 'email') {
                await api.updateEmail(email, otpCode);
            } else if (updateType === 'phone') {
                await api.updatePhone(phone, otpCode);
            }
            await refreshUser();
            showMessage('success', `${updateType === 'email' ? 'Email' : 'Phone'} updated successfully.`);
            setShowOtpInput(false);
            setUpdateType('none');
            setOtpCode('');
        } catch (error: any) {
            showMessage('error', error.message || 'Failed to process update.');
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            <Navbar />
            
            <main className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white uppercase shadow-lg shadow-violet-500/20">
                        {user?.username?.substring(0, 2) || user?.full_name?.substring(0, 2) || 'U'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                        <p className="text-sm text-zinc-400">Manage your account details and security preferences.</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                        message.type === 'error' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Basic Info Container */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                        <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
                        <form onSubmit={handleUpdateBasicInfo} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-[#0f0f17] px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isUpdatingBasic}
                                    className="w-full rounded-xl bg-violet-600/20 border border-violet-500/50 py-2.5 text-sm font-semibold text-violet-400 transition-all hover:bg-violet-600/30 hover:text-white disabled:opacity-50"
                                >
                                    {isUpdatingBasic ? 'Saving...' : 'Save Profile Info'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sensitive Info Container */}
                    <div className="space-y-6">
                        {/* Unique Share ID Panel */}
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-6">
                            <h2 className="text-lg font-semibold text-white mb-2">Unique Share ID</h2>
                            <p className="text-xs text-zinc-400 mb-4">You can use this ID to securely share files with other internal users.</p>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex-1 rounded-xl border border-indigo-500/30 bg-black/20 px-4 py-3 text-sm font-mono text-indigo-300 tracking-wider">
                                    {user?.unique_share_id || 'Generating...'}
                                </div>
                                <button
                                    onClick={handleCopyId}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 transition-colors hover:bg-indigo-500/30 hover:text-indigo-300"
                                    title="Copy Share ID"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Security Settings panel */}
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                                <h2 className="text-lg font-semibold text-emerald-400">Security Credentials</h2>
                            </div>
                            
                            <div className="space-y-5">
                                {/* Email Update */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-emerald-500/80 uppercase tracking-wider">Email Address</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border border-emerald-500/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            disabled={updateType === 'email' && showOtpInput}
                                        />
                                        {user?.email !== email && updateType !== 'email' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRequestSecurityUpdate('email')}
                                                disabled={isUpdatingSecurity || !email}
                                                className="shrink-0 rounded-xl bg-emerald-600/20 border border-emerald-500/50 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-600/30 hover:text-white"
                                            >
                                                Update
                                            </button>
                                        )}
                                    </div>
                                    {updateType === 'email' && showOtpInput && (
                                        <form onSubmit={handleVerifySecurityUpdate} className="mt-3 animate-in fade-in slide-in-from-top-2">
                                            <p className="mb-2 text-xs text-zinc-400">Enter the verification code sent to your old email to verify this change.</p>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    placeholder="OTP Code"
                                                    className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-2 text-sm text-center tracking-widest text-white font-mono"
                                                    maxLength={6}
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingSecurity}
                                                    className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110"
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setUpdateType('none'); setShowOtpInput(false); }}
                                                    className="shrink-0 px-2 flex items-center justify-center text-zinc-500 hover:text-zinc-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Phone Update */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-emerald-500/80 uppercase tracking-wider">Phone Number</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full rounded-xl border border-emerald-500/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            disabled={updateType === 'phone' && showOtpInput}
                                        />
                                        {user?.phone_number !== phone && updateType !== 'phone' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRequestSecurityUpdate('phone')}
                                                disabled={isUpdatingSecurity || !phone}
                                                className="shrink-0 rounded-xl bg-emerald-600/20 border border-emerald-500/50 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-600/30 hover:text-white"
                                            >
                                                Update
                                            </button>
                                        )}
                                    </div>
                                    {updateType === 'phone' && showOtpInput && (
                                        <form onSubmit={handleVerifySecurityUpdate} className="mt-3 animate-in fade-in slide-in-from-top-2">
                                            <p className="mb-2 text-xs text-zinc-400">Enter the verification code sent to your old phone to verify this change.</p>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    placeholder="OTP Code"
                                                    className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-2 text-sm text-center tracking-widest text-white font-mono"
                                                    maxLength={6}
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingSecurity}
                                                    className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110"
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setUpdateType('none'); setShowOtpInput(false); }}
                                                    className="shrink-0 px-2 flex items-center justify-center text-zinc-500 hover:text-zinc-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
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
