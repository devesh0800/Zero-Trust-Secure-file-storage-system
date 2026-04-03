'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050508] px-4 text-center overflow-hidden">
      {/* ═══ Background Effects ═══ */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 hex-pattern opacity-30" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/8 blur-[150px] orb-1 morph-blob" />
        <div className="absolute left-[15%] top-[25%] h-[400px] w-[400px] rounded-full bg-indigo-600/6 blur-[120px] orb-2 morph-blob" />
        <div className="absolute right-[15%] bottom-[25%] h-[400px] w-[400px] rounded-full bg-purple-600/6 blur-[120px] orb-3" />
        
        {/* Rising Particles */}
        <div className="floating-particle fp-1" />
        <div className="floating-particle fp-2" />
        <div className="floating-particle fp-3" />
        <div className="floating-particle fp-4" />
        <div className="floating-particle fp-5" />
        <div className="floating-particle fp-6" />
        <div className="floating-particle fp-7" />
        <div className="floating-particle fp-8" />
      </div>

      <div className={`relative transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Logo */}
        <div className="stagger-1">
          <div className="shield-logo shield-float mx-auto mb-8 flex h-22 w-22 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600">
            <svg className="h-11 w-11 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>

        <h1 className="stagger-2 text-5xl font-bold tracking-tight text-white sm:text-7xl">
          Secure<span className="text-shimmer">Vault</span>
        </h1>
        <p className="stagger-3 mx-auto mt-5 max-w-lg text-base text-zinc-500 leading-relaxed sm:text-lg">
          Zero-trust encrypted file storage. Your files are protected with military-grade <span className="text-zinc-400 font-medium">AES-256-GCM</span> encryption.
        </p>

        {/* Features */}
        <div className="stagger-4 mt-10 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: '🔐', label: 'AES-256 Encrypted' },
            { icon: '🛡️', label: 'Zero-Trust Architecture' },
            { icon: '🔑', label: 'Per-File Encryption' },
          ].map((feature) => (
            <div key={feature.label} className="group flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-2 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/20 hover:bg-violet-500/5 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <span className="text-sm">{feature.icon}</span>
              <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="stagger-5 mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="btn-premium group/cta flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] px-8 text-sm font-bold text-white shadow-[0_4px_30px_rgba(124,58,237,0.3)] transition-all duration-500 hover:bg-right hover:shadow-[0_8px_50px_rgba(124,58,237,0.5)] active:scale-[0.97] sm:w-auto"
          >
            Get Started Free
            <svg className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="group/signin flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-8 text-sm font-medium text-zinc-400 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white sm:w-auto"
          >
            <svg className="h-4 w-4 transition-transform duration-300 group-hover/signin:-translate-y-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
