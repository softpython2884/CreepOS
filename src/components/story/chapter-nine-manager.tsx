'use client';

import { useEffect, useState, useRef } from 'react';
import { type AppId, type EventId } from '../desktop';
import { chapterNineSpam } from '../apps/content';
import { type ImagePlaceholder } from '@/lib/placeholder-images';

interface ChapterNineManagerProps {
    openApp: (appId: AppId, options?: { x?: number, y?: number }) => void;
    triggerEvent: (eventId: EventId) => void;
    capturedImage: ImagePlaceholder;
    onFinish: () => void;
}

const COUNTDOWN_SECONDS = 45;

export default function ChapterNineManager({ openApp, triggerEvent, capturedImage, onFinish }: ChapterNineManagerProps) {
    const hasRun = useRef(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true;
            triggerEvent('system_collapse');

            // Start countdown
            intervalRef.current = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);

            // Start window spam
            const appIds: AppId[] = ['terminal', 'photos', 'chat', 'browser'];
            const spamInterval = setInterval(() => {
                const randomAppId = appIds[Math.floor(Math.random() * appIds.length)];
                openApp(randomAppId, {
                    x: Math.random() * (1920 - 400),
                    y: Math.random() * (1080 - 600)
                });
            }, 200);

            return () => {
                clearInterval(spamInterval);
            };
        }
    }, [openApp, triggerEvent]);

    useEffect(() => {
        if (countdown === 5) {
            triggerEvent('freeze');
        }
        if (countdown <= 0) {
            clearInterval(intervalRef.current);
            onFinish();
        }
    }, [countdown, triggerEvent, onFinish]);

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9998] text-center pointer-events-none">
            <h1 className="text-5xl font-bold text-destructive animate-pulse-strong">
                SYSTEM COLLAPSE IN: 00:{countdown.toString().padStart(2, '0')}
            </h1>
        </div>
    );
}
