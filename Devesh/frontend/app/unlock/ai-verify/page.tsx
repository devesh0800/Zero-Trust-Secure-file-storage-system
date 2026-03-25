'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAiChallenge, verifyAiChallenge, ApiError } from '@/lib/api';

interface Question {
    id: string;
    question: string;
    options: string[];
}

export default function AIVerifyPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [status, setStatus] = useState<'loading' | 'active' | 'verifying' | 'failed' | 'success'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const data = await getAiChallenge();
                setQuestions(data.questions);
                setAnswers(new Array(data.questions.length).fill(-1));
                setStatus('active');
            } catch (err) {
                setStatus('failed');
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Failed to establish connection with Security AI.');
                }
            }
        };

        fetchChallenge();
    }, []);

    const handleSelectOption = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentStep] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleNext = async () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Submit answers
            setStatus('verifying');
            setError('');
            try {
                const result = await verifyAiChallenge(answers);
                setStatus('success');
                // Proceed to reset credentials after 2 seconds
                setTimeout(() => {
                    router.push(`/unlock/reset-credentials?token=${result.reset_token}`);
                }, 2000);
            } catch (err) {
                setStatus('failed');
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Identity verification completely failed.');
                }
            }
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                        <div className="absolute h-full w-full animate-ping rounded-full border-2 border-indigo-500 opacity-20"></div>
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500"></div>
                    </div>
                    <p className="mt-6 font-mono text-sm tracking-widest text-indigo-400 uppercase">Initializing Sentinels...</p>
                </div>
            </div>
        );
    }

    if (status === 'failed' && questions.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
                <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                    <p className="text-sm text-zinc-400 mb-6">{error}</p>
                    <button onClick={() => router.push('/dashboard')} className="w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentStep];

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] p-4 text-white">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-[120px]" />
            </div>

            <div className="z-10 w-full max-w-2xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Security AI Sentinel</h1>
                            <p className="font-mono text-xs tracking-wider text-indigo-400">IDENTITY_VERIFICATION_PROTOCOL</p>
                        </div>
                    </div>
                    <div className="font-mono text-sm text-zinc-500">
                        PHASE 0{currentStep + 1} / 0{questions.length}
                    </div>
                </div>

                {/* Main Content Area */}
                {status === 'success' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-12 text-center duration-700">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                            <svg className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Identity Verified</h2>
                        <p className="mt-2 text-zinc-400">Initializing secure credentials reset protocol...</p>
                    </div>
                ) : status === 'verifying' ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                             <div className="absolute inset-0 animate-ping rounded-full border border-indigo-500/50"></div>
                             <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500"></div>
                        </div>
                        <p className="font-mono text-sm tracking-widest text-indigo-400 uppercase animate-pulse">Analyzing Responses...</p>
                     </div>
                ) : status === 'failed' ? (
                     <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-12 text-center duration-500">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-zinc-400 mb-8">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            Re-initialize Protocol
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-6 backdrop-blur-md">
                            <p className="text-lg leading-relaxed text-zinc-200">
                                <span className="mr-2 font-mono text-indigo-400">&gt;</span>
                                {currentQuestion?.question}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {currentQuestion?.options.map((option, idx) => {
                                const isSelected = answers[currentStep] === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectOption(idx)}
                                        className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                                            isSelected 
                                            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                                            : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                isSelected ? 'border-indigo-400 bg-indigo-400 text-[#0a0a0f]' : 'border-zinc-500 bg-transparent text-transparent group-hover:border-zinc-400'
                                            }`}>
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            </div>
                                            <span className={`text-base ${isSelected ? 'font-medium text-white' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                                                {option}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button
                                onClick={handleNext}
                                disabled={answers[currentStep] === -1}
                                className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all duration-300 ${
                                    answers[currentStep] !== -1
                                    ? 'bg-white text-[#0a0a0f] hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'cursor-not-allowed bg-white/10 text-white/30'
                                }`}
                            >
                                {currentStep === questions.length - 1 ? 'Execute Verification' : 'Next Parameter'}
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Progress indicators */}
            {status === 'active' && (
                <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3">
                    {questions.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                idx === currentStep ? 'w-8 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 
                                idx < currentStep ? 'w-4 bg-indigo-400/50' : 'w-4 bg-white/10'
                            }`} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
