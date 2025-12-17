
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const creditLines = [
    { text: 'NEO-SYSTEM : BREACH', duration: 4000, className: 'text-4xl font-bold' },
    { text: 'Game design & développement par Enzo Prados', duration: 3000, className: 'text-2xl' },
    { text: 'Développé lors du Hackathon Holberton School', duration: 4000, className: 'text-2xl' },
    { text: 'Remerciements au jury et aux mentors', duration: 4000, className: 'text-2xl' },
    { text: 'Musiques par Suno AI & Pixabay', duration: 3000, className: 'text-xl' },
    { text: 'Merci d\'avoir joué.', duration: 5000, className: 'text-3xl italic' },
    { text: 'À bientôt pour la suite…', duration: 5000, className: 'text-3xl italic' },
];

export default function CreditsScreen({ onComplete }: { onComplete: () => void }) {
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        setCurrentLineIndex(0);
    }, []);

    useEffect(() => {
        if (currentLineIndex === -1) return;

        if (currentLineIndex >= creditLines.length) {
            setTimeout(onComplete, 1000);
            return;
        }

        const line = creditLines[currentLineIndex];
        
        setShowText(true);

        const timer = setTimeout(() => {
            setShowText(false);
            setTimeout(() => setCurrentLineIndex(i => i + 1), 1500); // Wait for fade out
        }, line.duration);
        
        return () => clearTimeout(timer);

    }, [currentLineIndex, onComplete]);

    const currentLine = creditLines[currentLineIndex];

    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-black font-code text-foreground cursor-none overflow-hidden">
            <div className={cn(
                "transition-opacity duration-1000 text-center",
                showText ? 'opacity-100' : 'opacity-0'
            )}>
                {currentLine && (
                    <p className={cn(currentLine.className)}>{currentLine.text}</p>
                )}
            </div>
        </div>
    );
}
