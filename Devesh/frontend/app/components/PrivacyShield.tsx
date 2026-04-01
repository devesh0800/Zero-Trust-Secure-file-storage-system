'use client';

import { useEffect, useState } from 'react';

interface PrivacyShieldProps {
    children: React.ReactNode;
    enabled?: boolean;
}

export default function PrivacyShield({ children, enabled = true }: PrivacyShieldProps) {
    const [isBlurred, setIsBlurred] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        // 1. Disable Right Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // 2. Disable Keyboard Shortcuts (Ctrl+S, Ctrl+P, PrintScreen, Ctrl+Shift+I)
        const handleKeyDown = (e: KeyboardEvent) => {
            // PrintScreen
            if (e.key === 'PrintScreen') {
                alert("Security Alert: Screenshots are restricted for this secure file.");
                setIsBlurred(true);
            }
            
            // CMD/CTRL combinations
            if (e.ctrlKey || e.metaKey) {
                if (['s', 'p', 'u'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    return false;
                }
            }
        };

        // 3. Detect Blur (Tab Hidden or Screenshot Tool Active)
        const handleBlur = () => setIsBlurred(true);
        const handleFocus = () => setIsBlurred(false);
        const handleVisibilityChange = () => {
            if (document.hidden) setIsBlurred(true);
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled]);

    if (!enabled) return <>{children}</>;

    return (
        <div className={`relative transition-all duration-500 unselectable ${isBlurred ? 'blur-[40px] grayscale' : ''}`}>
            {/* Protective Overlay to prevent direct interaction */}
            <div className="absolute inset-0 z-10 bg-transparent" />
            
            <div className="relative z-0">
                {children}
            </div>

            {isBlurred && (
                <div className="absolute inset-0 z-20 flex items-center justify-center text-center p-10 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
                    <div className="max-w-xs animate-in zoom-in-95 duration-300">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/20">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15L12 9M10.5 10.5L12 9L13.5 10.5M12 9L12 15M12 21a9 9 0 110-18 9 9 0 010 18z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Security Protocol</h3>
                        <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                            Preview paused to protect sensitive data. Focus the window to resume.
                        </p>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .unselectable {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                @media print {
                    body {
                        display: none !important;
                    }
                    * {
                        visibility: hidden !important;
                    }
                }
            `}</style>
        </div>
    );
}
