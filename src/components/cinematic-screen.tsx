'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const lines = [
    { text: 'Productions Forge Network', duration: 3000, className: 'text-2xl' },
    { text: 'Créé par Enzo Prados', duration: 3000, className: 'text-2xl' },
    { text: 'Powered by Google', duration: 2000, className: 'text-lg' },
    { text: 'Avec nos remerciements à Holberton School Fréjus, son personnel et ses étudiants.', duration: 5000, className: 'text-lg' },
    { text: '2025 — Centre de recherche NEXUS', duration: 4000, className: 'text-xl tracking-widest', typing: true },
    { text: 'Docteur Omen — Résidence temporaire, mission : Participant au projet NÉO', duration: 5000, className: 'text-xl tracking-widest', typing: true },
    { text: 'Tu crois connaître la recherche. Tu te trompes souvent.', duration: 4000, className: 'text-xl italic text-accent', typing: true },
    { text: "On t'a demandé de venir sans poser de questions.", duration: 4000, className: 'text-xl italic text-accent', typing: true },
    { text: 'Tu as pris tes clés.', duration: 2000, className: 'text-xl italic text-accent', typing: true },
    { text: 'Tu as pris ce job.', duration: 4000, className: 'text-xl italic text-accent', typing: true },
];

const TypingEffect = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText(''); // Reset on text change
        if (text) {
            let i = 0;
            const intervalId = setInterval(() => {
                setDisplayedText(text.substring(0, i + 1));
                i++;
                if (i > text.length) {
                    clearInterval(intervalId);
                    onComplete();
                }
            }, 60);
            return () => clearInterval(intervalId);
        }
    }, [text, onComplete]);

    return <p className="border-r-2 border-current animate-typing-cursor-slow">{displayedText}</p>;
};


export default function CinematicScreen({ onComplete }: { onComplete: () => void }) {
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [showText, setShowText] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        setCurrentLineIndex(0);
    }, []);
    
    useEffect(() => {
        if (currentLineIndex === -1) return;

        if (currentLineIndex >= lines.length) {
            setShowText(false);
            setTimeout(onComplete, 1000);
            return;
        }

        const line = lines[currentLineIndex];
        
        setShowText(true);

        if(line.typing) {
            setIsTyping(true);
        } else {
            setIsTyping(false);
            const timer = setTimeout(() => {
                setShowText(false);
                setTimeout(() => setCurrentLineIndex(i => i + 1), 1000);
            }, line.duration);
            return () => clearTimeout(timer);
        }

    }, [currentLineIndex, onComplete]);
    
    const handleTypingComplete = () => {
        const line = lines[currentLineIndex];
        setTimeout(() => {
            setShowText(false);
            setIsTyping(false);
            setTimeout(() => setCurrentLineIndex(i => i + 1), 1000);
        }, line.duration - (line.text.length * 60)); // Adjust wait time
    };

    const currentLine = lines[currentLineIndex];

    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-black font-code text-foreground cursor-none">
            <div className={cn(
                "transition-opacity duration-1000 text-center",
                showText ? 'opacity-100' : 'opacity-0'
            )}>
                {currentLine && (
                    isTyping ? (
                         <div className={cn(currentLine.className)}>
                            <TypingEffect text={currentLine.text} onComplete={handleTypingComplete} />
                        </div>
                    ) : (
                        <p className={cn(currentLine.className)}>{currentLine.text}</p>
                    )
                )}
            </div>
        </div>
    );
}