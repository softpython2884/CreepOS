'use client';

import { useEffect, useState, useRef } from 'react';
import { type EventId, type AppId } from '../desktop';
import { type TerminalWriter } from './chapter-two-manager';
import { type ImagePlaceholder } from '@/lib/placeholder-images';

// Custom hook for managing timeouts
const useTimeout = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useEffect(() => {
      if (delay !== null) {
        const id = setTimeout(() => savedCallback.current(), delay);
        return () => clearTimeout(id);
      }
    }, [delay]);
};

interface ChapterThreeManagerProps {
    terminal: TerminalWriter;
    triggerEvent: (eventId: EventId) => void;
    openApp: (appId: AppId) => void;
    capturedImage: ImagePlaceholder;
}

const sequence = [
    { delay: 1000, action: 'open_photos' },
    { delay: 1500, action: 'open_terminal' },
    { delay: 2000, action: 'event', eventId: 'chromatic' },
    { delay: 1000, action: 'write', text: 'C’est toi.' },
    { delay: 2500, action: 'write', text: 'Tu me regardes… pourquoi ?' },
    { delay: 3000, action: 'write', text: 'Tu as peur ? Peur de la mort ? Ou de la douleur ?' },
    { delay: 3500, action: 'write', text: 'Ça fait mal de mourir ?' },
    { delay: 2000, action: 'event', eventId: 'tear' },
    { delay: 1500, action: 'event', eventId: 'glitch' },
];

export default function ChapterThreeManager({ terminal, triggerEvent, openApp }: ChapterThreeManagerProps) {
    const [step, setStep] = useState(0);
    const isFinished = useRef(false);
    
    const currentStep = sequence[step];

    useTimeout(() => {
        if (!currentStep || isFinished.current) {
            terminal.lock(false); // Unlock terminal at the end
            return;
        }

        terminal.lock(true);

        switch (currentStep.action) {
            case 'open_photos':
                openApp('photos');
                break;
            case 'open_terminal':
                openApp('terminal');
                break;
            case 'write':
                terminal.write(currentStep.text!);
                break;
            case 'event':
                triggerEvent(currentStep.eventId as EventId);
                break;
        }
        
        if (step === sequence.length - 1) {
            isFinished.current = true;
        }
        
        setStep(s => s + 1);

    }, currentStep?.delay ?? null);

    return null; // This component does not render anything
}
