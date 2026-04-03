'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAiChallenge, verifyAiChallenge, ApiError } from '@/lib/api';

import BackgroundAnimation from '../../components/BackgroundAnimation';
import Navbar from '../../components/Navbar';

interface Question {
    id: string;
    question: string;
    type: 'mcq' | 'input' | 'pin';
    options: string[];
}

export default function AIVerifyPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<(number | string)[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'loading' | 'active' | 'verifying' | 'failed' | 'success'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const data = await getAiChallenge();
                setQuestions(data);
                setAnswers(new Array(data.length).fill(''));
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

    const handleInputChange = (value: string) => {
        setInputValue(value);
        const newAnswers = [...answers];
        newAnswers[currentStep] = value;
        setAnswers(newAnswers);
    };

    const handleNext = async () => {
        // Reset input value for next step
        setInputValue('');
        
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

            <div className="z-10 w-full max-w-2xl animate-fade-in">
                {/* Header */}
                <div className="mb-10 flex items-center justify-between border-b border-white/[0.08] pb-8">
                    <div className="flex items-center gap-5">
                        <div className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_10px_30px_rgba(124,58,237,0.3)] transition-all duration-500 hover:scale-110">
                             <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
                            <svg className="relative h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">Identity Audit</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                                <p className="font-['Outfit'] text-[0.7rem] font-bold tracking-[0.2em] text-zinc-500 uppercase">Step {currentStep + 1} of {questions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {status === 'success' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-16 text-center duration-1000">
                        <div className="relative mb-10 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                             <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-emerald-500/5" />
                            <svg className="relative h-14 w-14 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-white">Identity Synchronized</h2>
                        <p className="mt-4 text-[1rem] text-zinc-500 font-medium">Authentication confirmed. Initializing high-level credential reset protocol...</p>
                    </div>
                ) : status === 'verifying' ? (
                     <div className="flex flex-col items-center justify-center py-24">
                        <div className="relative mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-violet-600/10 border border-violet-500/20">
                             <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-violet-500/5 shadow-[0_0_50px_rgba(124,58,237,0.1)]" />
                             <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/10 border-t-violet-500"></div>
                        </div>
                        <p className="font-['Outfit'] text-[0.7rem] font-black tracking-[0.4em] text-violet-400 uppercase animate-pulse">Analyzing Neural Handshakes...</p>
                     </div>
                ) : status === 'failed' ? (
                      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-16 text-center duration-500">
                         <div className="mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-rose-500/10 border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
                             <svg className="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                             </svg>
                         </div>
                         <h2 className="text-3xl font-black text-white mb-3">Verification Failed</h2>
                         <p className="text-[1rem] text-zinc-500 mb-10 font-medium max-w-sm mx-auto">{error}</p>
                         <button
                             onClick={() => window.location.reload()}
                             className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-10 py-4 text-sm font-bold text-white transition-all hover:bg-white/[0.08]"
                         >
                             Re-initialize Node Protocol
                         </button>
                     </div>
                ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="mb-8 rounded-3xl border border-white/[0.08] bg-[#0c0c14]/60 p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <p className="text-xl leading-relaxed text-zinc-200 font-medium">
                            <span className="mr-3 font-mono text-violet-400">&gt;</span>
                            {currentQuestion?.question}
                        </p>
                    </div>

                    {currentQuestion?.type === 'mcq' ? (
                        <div className="space-y-4">
                            {currentQuestion?.options.map((option, idx) => {
                                const isSelected = answers[currentStep] === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectOption(idx)}
                                        className={`group relative w-full overflow-hidden rounded-2xl border px-6 py-5 text-left transition-all duration-300 ${
                                            isSelected 
                                            ? 'border-violet-500/50 bg-violet-500/10 shadow-[0_0_25px_rgba(124,58,237,0.15)]' 
                                            : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                isSelected ? 'border-violet-400 bg-violet-400/20 text-violet-100 scale-110' : 'border-zinc-600 bg-transparent text-transparent group-hover:border-zinc-400'
                                            }`}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,1)]" />
                                                )}
                                            </div>
                                            <span className={`text-[1.05rem] ${isSelected ? 'font-bold text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                                {option}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative group">
                                <input
                                    type={currentQuestion?.type === 'pin' ? 'password' : 'text'}
                                    value={inputValue}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    placeholder={currentQuestion?.type === 'pin' ? "Enter 6-digit PIN" : "Type your answer here..."}
                                    autoComplete="off"
                                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0c14]/50 px-6 py-5 text-lg text-white placeholder-zinc-600 outline-none transition-all duration-300 focus:border-violet-500/50 focus:bg-violet-500/5 focus:ring-4 focus:ring-violet-500/10"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors">
                                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743-5.743L11 7.086V9a1 1 0 11-2 0V6.142L6.064 7.728a4 4 0 105.656 5.656l1.5-1.5a5.964 5.964 0 00.865-1.884L15.858 9a2 2 0 011.884-.865l1.5-1.5z" /></svg>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 ml-4 italic">Press 'Proceed' after providing the synchronization values.</p>
                        </div>
                    )}

                    <div className="mt-12 flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={!answers[currentStep] && answers[currentStep] !== 0}
                            className={`group relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl px-10 py-4 text-sm font-bold transition-all duration-500 ${
                                (answers[currentStep] || answers[currentStep] === 0)
                                ? 'text-white'
                                : 'cursor-not-allowed text-white/20'
                            }`}
                        >
                            {(answers[currentStep] || answers[currentStep] === 0) && (
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:scale-105 transition-transform duration-500" />
                            )}
                            {(!answers[currentStep] && answers[currentStep] !== 0) && (
                                <div className="absolute inset-0 bg-white/5" />
                            )}
                            <span className="relative z-10">
                                {currentStep === questions.length - 1 ? 'Execute Final Verification' : 'Proceed to Next Node'}
                            </span>
                            <svg className="relative z-10 h-5 w-5 translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' :
                                    idx < currentStep ? 'w-4 bg-indigo-400/50' : 'w-4 bg-white/10'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
