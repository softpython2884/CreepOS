
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const commands = [
    'INITIATING REVERSE TRACE...',
    'TARGET IP: 127.0.0.1',
    'BYPASSING LOCAL PROXY...',
    'CONNECTION ESTABLISHED. ANALYZING SIGNATURE...',
    'SIGNATURE FOUND: "OPERATOR"',
    'DECRYPTING PACKET STREAM...',
    'PACKET HEADERS: [OK]',
    'PAYLOAD: [ENCRYPTED]',
    'BRUTE-FORCING ENCRYPTION KEY...',
    'MATCH FOUND. APPLYING COUNTER-MEASURES.',
    'REINFORCING FIREWALL RULES...',
    'ISOLATING TARGET NODE...',
    'TRACE COMPLETE. SYSTEM LOCKDOWN IN 3..2..1..',
];

const typingSpeed = 50; // ms per character
const commandDelay = 800; // ms between commands

interface TracerTerminalProps {
    title: string;
    startDelay?: number;
}

export default function TracerTerminal({ title, startDelay = 0 }: TracerTerminalProps) {
    const [lines, setLines] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            let commandIndex = 0;

            const typeCommand = () => {
                if (commandIndex >= commands.length) {
                    setIsComplete(true);
                    return;
                }

                const command = commands[commandIndex];
                let charIndex = 0;
                setLines(prev => [...prev, '']); // Add a new line for the command

                const typeChar = () => {
                    if (charIndex < command.length) {
                        setLines(prev => {
                            const newLines = [...prev];
                            newLines[newLines.length - 1] = command.substring(0, charIndex + 1);
                            return newLines;
                        });
                        charIndex++;
                        setTimeout(typeChar, typingSpeed);
                    } else {
                        commandIndex++;
                        setTimeout(typeCommand, commandDelay);
                    }
                };

                typeChar();
            };

            typeCommand();

        }, startDelay);

        return () => clearTimeout(startTimeout);
    }, [startDelay]);


    return (
        <div className="w-[450px] h-[150px] bg-destructive/20 border-2 border-destructive-foreground/50 rounded-md font-code text-destructive-foreground text-xs p-2 flex flex-col animate-in fade-in slide-in-from-left-10 duration-500">
            <div className="flex-shrink-0 text-center border-b border-destructive-foreground/30 pb-1 mb-1">
                {title}
            </div>
            <div className="flex-grow overflow-hidden">
                {lines.map((line, i) => (
                    <p key={i} className={cn("whitespace-nowrap", (i === lines.length - 1 && !isComplete) && 'animate-typing-cursor-slow border-r-2 border-current')}>{`> ${line}`}</p>
                ))}
            </div>
        </div>
    );
}
