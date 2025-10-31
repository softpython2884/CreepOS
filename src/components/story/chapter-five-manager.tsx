'use client';

import { useEffect, useRef } from 'react';
import { type AppId } from '../desktop';

interface ChapterFiveManagerProps {
    openApp: (appId: AppId) => void;
    onFinish: () => void;
}

export default function ChapterFiveManager({ openApp, onFinish }: ChapterFiveManagerProps) {
    const hasRun = useRef(false);

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true;
            // The chatbot is opened automatically by the desktop in defense mode.
            // This manager's primary role is to listen for the end signal from the chatbot component.
            // The `onFinish` prop is passed to the Chatbot component, which will call it.
        }
    }, [openApp]);

    return null;
}
