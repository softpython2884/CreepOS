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
    }, []);

    useEffect(() => {
        setBackdoorSuccessCallback(() => runPanicSequence);
    }, [setBackdoorSuccessCallback, runPanicSequence]);


    return null;
}
