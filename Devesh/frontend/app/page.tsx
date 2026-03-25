'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4 text-center">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-indigo-600/8 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      <div className="relative">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/30">
          <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Secure<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Vault</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-zinc-400">
          Zero-trust encrypted file storage. Your files are protected with military-grade AES-256-GCM encryption.
        </p>

        {/* Features */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-emerald-400">✓</span> AES-256 Encrypted
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-emerald-400">✓</span> Zero-Trust Architecture
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-emerald-400">✓</span> Per-File Encryption
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 sm:w-auto"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
