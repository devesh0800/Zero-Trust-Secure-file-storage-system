'use client';

/**
 * Reusable Security-Themed Background Animation Component
 * Includes: radar sweep, hex data streams, shield particles, circuit nodes
 */
const BackgroundAnimation = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
            {/* Base Radial Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,35,0.2),transparent_70%)]" />

            {/* Radar Sweep Animation */}
            <div className="radar-sweep absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1800px] h-[1800px] opacity-[0.03] sm:opacity-[0.05]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-500/10 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-blue-500/5 rounded-full" />

            {/* Circuit Traces and Pulse Nodes */}
            <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-blue-500/20 security-node" />
            <div className="absolute top-[45%] right-[20%] w-3 h-3 rounded-full bg-violet-500/20 security-node" />
            <div className="absolute bottom-[30%] left-[25%] w-2.5 h-2.5 rounded-full bg-cyan-500/20 security-node" />
            <div className="absolute top-[10%] right-[30%] w-2 h-2 rounded-full bg-indigo-500/20 security-node shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

            {/* Data Streams - Encrypted Hex Characters */}
            <div className="data-stream absolute top-0 left-[10%] text-[10px] font-mono text-blue-500/20 writing-mode-vertical">0X F4 A1 99 B2</div>
            <div className="data-stream absolute top-0 right-[15%] text-[10px] font-mono text-cyan-500/20 writing-mode-vertical" style={{ animationDelay: '2s' }}>A7 E2 1F C4 D0</div>
            <div className="data-stream absolute top-0 left-[40%] text-[10px] font-mono text-violet-500/20 writing-mode-vertical" style={{ animationDelay: '4.5s' }}>8B 33 55 E1 FF</div>
            
            {/* Floating Shield Particles */}
            <div className="shield-particle absolute bottom-[15%] left-[10%] opacity-20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            </div>
            <div className="shield-particle absolute top-[15%] right-[10%] opacity-10" style={{ animationDelay: '3s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
            </div>

            {/* Background Hex Pattern Grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
        </div>
    );
};

export default BackgroundAnimation;
