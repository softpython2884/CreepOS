'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { EventId } from '../desktop';

interface ChapterFourManagerProps {
    triggerEvent: (eventId: EventId) => void;
    setBackdoorSuccessCallback: (callback: () => void) => void;
}

export default function ChapterFourManager({ triggerEvent, setBackdoorSuccessCallback }: ChapterFourManagerProps) {
    const hasRun = useRef(false);

    const runPanicSequence = useCallback(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        // 1. Visual effects
        triggerEvent('red_screen');

        // 2. Final "DIE" screen after a delay to let the red screen effect be seen
        setTimeout(() => {
            triggerEvent('die_screen');
        }, 1500); // 1.5s delay

    }, [triggerEvent]);

    useEffect(() => {
        // This function will be called from the browser component when the button is clicked.
        // It directly wires the panic sequence to be the callback.
        setBackdoorSuccessCallback(() => runPanicSequence);
    }, [setBackdoorSuccessCallback, runPanicSequence]);


    return null;
}
