import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { setupMFA, enableMFA, disableMFA, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface MfaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MfaModal({ isOpen, onClose }: MfaModalProps) {
    const { user, refreshUser } = useAuth();

    // MFA State
    const [mfaStep, setMfaStep] = useState<'status' | 'setup' | 'verify'>('status');
    const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setMfaStep('status');
            setError('');
            setToken('');
            setBackupCodes([]);
        }
    }, [isOpen]);

    // ---- MFA Handlers ----
    const handleStartSetup = async () => {
        setIsLoading(true); setError('');
        try {
            const data = await setupMFA();
            setSetupData(data);
            setMfaStep('setup');
        } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to initialize MFA setup'); }
        setIsLoading(false);
    };

    const handleEnableMFA = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError('');
        try {
            const data = await enableMFA(token);
            setBackupCodes(data.backupCodes);
            setMfaStep('verify');
            await refreshUser();
        } catch (err) { setError(err instanceof ApiError ? err.message : 'Invalid verification code'); }
        setIsLoading(false);
    };

    const handleDisableMFA = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError('');
        try {
            await disableMFA(token);
            await refreshUser();
            setToken('');
            setMfaStep('status');
        } catch (err) { setError(err instanceof ApiError ? err.message : 'Invalid verification code'); }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">2-Factor Auth</h2>
                            <p className="text-xs text-zinc-500">Secure your vault with MFA</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    {mfaStep === 'status' && (
                        <div className="space-y-6 text-center">
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${user?.mfa_enabled ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
                                <svg className={`h-8 w-8 ${user?.mfa_enabled ? 'text-emerald-400' : 'text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-white">MFA is {user?.mfa_enabled ? 'Enabled' : 'Disabled'}</p>
                                <p className="mt-2 text-sm text-zinc-400">Add an extra layer of security using your authenticator app.</p>
                            </div>
                            {user?.mfa_enabled ? (
                                <form onSubmit={handleDisableMFA} className="space-y-4 pt-2">
                                    <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="000000" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-lg tracking-widest text-white outline-none focus:border-violet-500/50" maxLength={6} required />
                                    {error && <p className="text-xs text-red-400">{error}</p>}
                                    <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{isLoading ? 'Disabling...' : 'Disable MFA'}</button>
                                </form>
                            ) : (
                                <button onClick={handleStartSetup} disabled={isLoading} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">{isLoading ? 'Loading...' : 'Enable MFA'}</button>
                            )}
                        </div>
                    )}

                    {mfaStep === 'setup' && setupData && (
                        <div className="space-y-5">
                            <p className="text-sm text-zinc-400 text-center">Scan with your authenticator app</p>
                            <div className="flex justify-center rounded-2xl bg-white p-4">
                                <img src={setupData.qrCodeUrl} alt="QR Code" className="h-[180px] w-[180px]" />
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Manual Key</p>
                                <p className="mt-1 font-mono text-sm text-white break-all">{setupData.secret}</p>
                            </div>
                            <form onSubmit={handleEnableMFA} className="space-y-4">
                                <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="000000" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-lg tracking-widest text-white outline-none focus:border-violet-500/50" maxLength={6} required />
                                {error && <p className="text-xs text-red-400">{error}</p>}
                                <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{isLoading ? 'Verifying...' : 'Complete Setup'}</button>
                            </form>
                        </div>
                    )}

                    {mfaStep === 'verify' && backupCodes.length > 0 && (
                        <div className="space-y-5 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                            <h3 className="text-lg font-bold text-white">MFA Enabled!</h3>
                            <p className="text-sm text-zinc-400">Save these backup codes securely.</p>
                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/5 p-4 text-left">
                                {backupCodes.map((code, i) => <div key={i} className="font-mono text-sm text-zinc-300">{code}</div>)}
                            </div>
                            <button onClick={onClose} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700">I&apos;ve saved these codes</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
