'use client';

import { useState, useEffect } from 'react';
import { epilogueMessages } from '../apps/content';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

interface EpilogueProps {
    onFinish: () => void;
}

export default function Epilogue({ onFinish }: EpilogueProps) {
    const [step, setStep] = useState(0);
    const [showCursor, setShowCursor] = useState(false);
    const [showByMe, setShowByMe] = useState(false);
    const [finalMessage, setFinalMessage] = useState<string | null>(null);

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];
        timers.push(setTimeout(() => setStep(1), 2000)); // RECONSTRUCTION
        timers.push(setTimeout(() => setStep(2), 4000)); // Would you like to restore...

        return () => timers.forEach(clearTimeout);
    }, []);

    const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key.toLowerCase() === 'y' && step === 2) {
            setStep(3); // Restore sequence
            const timers: NodeJS.Timeout[] = [];
            timers.push(setTimeout(() => setShowCursor(true), 1000));
            timers.push(setTimeout(() => setShowByMe(true), 2500));
            timers.push(setTimeout(() => setFinalMessage(epilogueMessages.epilogue), 4000));
            timers.push(setTimeout(() => setFinalMessage(epilogueMessages.finalWord), 7000));
            timers.push(setTimeout(onFinish, 11000));
            return () => timers.forEach(clearTimeout);
        }
    };
    
    if (step < 3) {
        return (
            <div className="fixed inset-0 bg-black text-white font-code flex items-center justify-center z-[9999]">
                <div className="text-center">
                    {step >= 1 && <p className="text-2xl animate-in fade-in">{epilogueMessages.reconstruction}</p>}
                    {step === 2 && (
                        <div className="mt-8 text-xl animate-in fade-in delay-500">
                             <p>{epilogueMessages.restoreQuery}</p>
                             <Input 
                                autoFocus
                                onKeyDown={handleInput}
                                className="bg-transparent border-none text-white focus-visible:ring-0 w-20 mx-auto text-center p-0 mt-2"
                             />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white text-black font-code flex items-center justify-center z-[9999] animate-in fade-in">
             <div className="text-center">
                <p className="text-xl">
                    <span>{epilogueMessages.welcome}</span>
                    {showCursor && <span className={cn("animate-typing-cursor-slow", showByMe && "hidden")}>|</span>}
                    {showByMe && <span className="animate-in fade-in">{epilogueMessages.byMe}</span>}
                </p>

                {finalMessage && (
                    <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-2xl text-gray-400 animate-in fade-in duration-1000">
                        {finalMessage}
                    </p>
                )}
             </div>
        </div>
    )

}
