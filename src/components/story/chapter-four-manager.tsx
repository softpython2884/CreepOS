'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { EventId, AppId } from '../desktop';
import type { TerminalWriter } from './chapter-two-manager';
import type { GeoJSON } from 'geojson';
import { getThreat } from '@/app/actions';

interface ChapterFourManagerProps {
    terminal: TerminalWriter;
    location: GeoJSON.Point;
    triggerEvent: (eventId: EventId) => void;
    openApp: (appId: AppId) => void;
    onBackdoorSuccess: () => void; // This will be called by the Browser component
}

export default function ChapterFourManager({ terminal, location, triggerEvent, openApp, onBackdoorSuccess }: ChapterFourManagerProps) {
    const hasRun = useRef(false);
    const sequenceTimeout = useRef<NodeJS.Timeout>();

    const runPanicSequence = useCallback(async () => {
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
        // This function will be called from the browser component when the backdoor is accessed.
        (onBackdoorSuccess as any) = () => {
            if (!hasRun.current) {
                hasRun.current = true;
                
                // Start a 35-second timer before the panic sequence
                sequenceTimeout.current = setTimeout(runPanicSequence, 35000);
            }
        };

        // Cleanup the timer if the component unmounts
        return () => {
            if (sequenceTimeout.current) {
                clearTimeout(sequenceTimeout.current);
            }
        };
    }, [onBackdoorSuccess, runPanicSequence]);


    return null;
}
