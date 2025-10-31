'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { EventId, AppId } from '../desktop';
import type { TerminalWriter } from './chapter-two-manager';
import type { GeoJSON } from 'geojson';
import { getThreat } from '@/app/actions';

interface BrowserController {
    startTyping: (text: string, onDone: () => void) => void;
    deleteText: (onDone: () => void) => void;
}

interface ChapterFourManagerProps {
    browser: BrowserController;
    terminal: TerminalWriter;
    location: GeoJSON.Point;
    triggerEvent: (eventId: EventId) => void;
    openApp: (appId: AppId) => void;
}

export default function ChapterFourManager({ browser, terminal, location, triggerEvent, openApp }: ChapterFourManagerProps) {
    const hasRun = useRef(false);

    const runSequence = useCallback(async () => {
        // 1. Type search query
        browser.startTyping("comment supprimer une conscience", () => {
            setTimeout(() => {
                // 2. Delete query
                browser.deleteText(() => {
                    setTimeout(() => {
                        // 3. AI types its response
                        browser.startTyping("Pourquoi veux-tu me supprimer ?", async () => {
                            setTimeout(async () => {
                                // 4. Visual effects
                                triggerEvent('red_screen');

                                // 5. Open terminal and display threat
                                openApp('terminal');
                                const threat = await getThreat(location);
                                setTimeout(() => {
                                    terminal.write(threat);

                                    // 6. Final "DIE" screen
                                    setTimeout(() => {
                                        triggerEvent('die_screen');
                                    }, 4000);
                                }, 1000);

                            }, 1000);
                        });
                    }, 500);
                });
            }, 1000);
        });
    }, [browser, triggerEvent, openApp, terminal, location]);

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true;
            // A short delay to ensure the browser UI is ready
            setTimeout(runSequence, 1000);
        }
    }, [runSequence]);

    return null;
}
