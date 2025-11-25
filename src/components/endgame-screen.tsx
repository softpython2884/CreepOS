
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function EndgameScreen({ lines, onComplete }: { lines: string[], onComplete: () => void }) {
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        setCurrentLineIndex(0);
    }, []);

    useEffect(() => {
        if (currentLineIndex === -1) return;

        if (currentLineIndex >= lines.length) {
            // All lines have been shown
            setTimeout(onComplete, 1000);
            return;
        }

        const line = lines[currentLineIndex];
        
        setShowText(true);

        const timer = setTimeout(() => {
            setShowText(false);
            setTimeout(() => setCurrentLineIndex(i => i + 1), 1500); // Wait for fade out
        }, 3000); // Show each line for 3 seconds
        
        return () => clearTimeout(timer);

    }, [currentLineIndex, onComplete, lines]);

    const currentLine = lines[currentLineIndex];

    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-black font-code text-destructive cursor-none overflow-hidden">
            <div className={cn(
                "transition-opacity duration-1000 text-center",
                showText ? 'opacity-100' : 'opacity-0'
            )}>
                {currentLine && (
                    <p className="text-4xl font-bold">{currentLine}</p>
                )}
            </div>
        </div>
    );
}
