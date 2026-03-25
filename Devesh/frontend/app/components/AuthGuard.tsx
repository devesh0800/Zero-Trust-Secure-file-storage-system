'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500"></div>
                    <p className="text-sm text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return <>{children}</>;
}
