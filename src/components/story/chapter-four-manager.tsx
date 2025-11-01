'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { EventId, AppId } from '../desktop';
import type { TerminalWriter } from './chapter-two-manager';
import type { GeoJSON } from 'geojson';
import { getThreat } from '@/app/actions';

interface ChapterFourManagerProps {
    terminal: TerminalWriter;
    location: GeoJSON.Point;
    triggerEvent: (eventId: EventId) => void;
    openApp: (appId: AppId) => void;
    setBackdoorSuccessCallback: (callback: () => void) => void;
}

export default function ChapterFourManager({ terminal, location, triggerEvent, openApp, setBackdoorSuccessCallback }: ChapterFourManagerProps) {
    const hasRun = useRef(false);

    const runPanicSequence = useCallback(async () => {
        if (hasRun.current) return;
        hasRun.current = true;

        // 1. Visual effects
        triggerEvent('red_screen');

        // 2. Open terminal and display threat
        openApp('terminal');
        const threat = await getThreat(location);
        
        setTimeout(() => {
            terminal.write(threat);

            // 3. Final "DIE" screen after a delay
            setTimeout(() => {
                triggerEvent('die_screen');
            }, 4000);
        }, 1000);

    }, [triggerEvent, openApp, terminal, location]);

    useEffect(() => {
        const handleSuccess = () => {
            setTimeout(() => {
                runPanicSequence();
            }, 200);
        };
        // This function will be called from the browser component when the button is clicked.
        setBackdoorSuccessCallback(() => handleSuccess);
    }, [setBackdoorSuccessCallback, runPanicSequence]);


    return null;
}
