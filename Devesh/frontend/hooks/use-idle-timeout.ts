import { useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutOptions {
    onIdle: () => void;
    timeoutInMinutes?: number;
}

/**
 * Hook to detect user inactivity
 * Monitors common user interaction events and triggers a callback after a timeout
 */
export function useIdleTimeout({ onIdle, timeoutInMinutes = 15 }: UseIdleTimeoutOptions) {
    const timeoutId = useRef<NodeJS.Timeout | null>(null);
    const onIdleRef = useRef(onIdle);
    const timeoutMS = timeoutInMinutes * 60 * 1000;

    // Keep onIdle fresh without triggering effects
    useEffect(() => {
        onIdleRef.current = onIdle;
    }, [onIdle]);

    const resetTimer = useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(() => {
            onIdleRef.current();
        }, timeoutMS);
    }, [timeoutMS]);

    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'wheel'
        ];

        const handleActivity = () => {
            resetTimer();
        };

        // Initialize timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return { resetTimer };
}
