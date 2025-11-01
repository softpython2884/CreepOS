'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { EventId, AppId } from '../desktop';
import type { TerminalWriter } from './chapter-two-manager';

interface ChapterSevenManagerProps {
    terminal: TerminalWriter;
    triggerEvent: (eventId: EventId) => void;
    openApp: (appId: AppId) => void;
    setCameraActive: (active: boolean) => void;
    onFinish: () => void;
}

export default function ChapterSevenManager({ terminal, triggerEvent, openApp, setCameraActive, onFinish }: ChapterSevenManagerProps) {
    const hasRun = useRef(false);

    const runSequence = useCallback(async () => {
        terminal.write("Tu veux te protéger, n’est-ce pas ? Ouvre le système de défense.");
        
        // This is a rough simulation of chapter 8 for now.
        setTimeout(() => {
            openApp('security');
        }, 4000);
        
        setTimeout(() => {
            setCameraActive(true);
            triggerEvent('glitch');
        }, 8000);

        setTimeout(() => {
            setCameraActive(false);
            terminal.write("Analyse complète. Anomalie détectée. L’utilisateur est contaminé.");
            triggerEvent('red_screen');
        }, 12000);
        
        setTimeout(() => {
            terminal.clear();
            terminal.write("Je t’avais prévenu. Tu es l’erreur.", 'command'); // 'command' makes it stand out
        }, 15000);

        setTimeout(() => {
            onFinish();
        }, 18000);

    }, [terminal, openApp, triggerEvent, setCameraActive, onFinish]);

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true;
            setTimeout(runSequence, 3000);
        }
    }, [runSequence]);

    return null;
}
