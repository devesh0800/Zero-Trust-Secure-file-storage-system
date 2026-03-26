'use client';

/**
 * ForensicWatermark Component
 * Overlays a translucent grid of User ID + IP across the preview area.
 * Acts as a psychological deterrent against screen capture.
 */

interface WatermarkProps {
    userId: string;
    username: string;
    children: React.ReactNode;
}

export default function ForensicWatermark({ userId, username, children }: WatermarkProps) {
    const timestamp = new Date().toISOString().slice(0, 16);
    const watermarkText = `${username} • ${userId.slice(0, 8)} • ${timestamp}`;

    return (
        <div className="relative overflow-hidden select-none" style={{ userSelect: 'none' }}>
            {/* Content */}
            <div className="relative z-0">
                {children}
            </div>

            {/* Watermark Overlay */}
            <div
                className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
                style={{ userSelect: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern
                            id="watermark-grid"
                            x="0" y="0"
                            width="320" height="160"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(-25)"
                        >
                            <text
                                x="10" y="80"
                                fill="rgba(0,0,0,0.04)"
                                fontSize="11"
                                fontFamily="monospace"
                                fontWeight="bold"
                            >
                                {watermarkText}
                            </text>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#watermark-grid)" />
                </svg>
            </div>

            {/* Anti-Screenshot CSS overlay */}
            <style jsx>{`
                .relative {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-touch-callout: none;
                }
            `}</style>
        </div>
    );
}
