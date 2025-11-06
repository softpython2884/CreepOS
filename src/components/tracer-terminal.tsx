
'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

export const traceCommands = [
    'INITIATING REVERSE TRACE...',
    'TARGET IP: 127.0.0.1',
    'BYPASSING LOCAL PROXY... [OK]',
    'CONNECTION ESTABLISHED. ANALYZING SIGNATURE...',
    'SIGNATURE FOUND: "OPERATOR"',
    'LOCKING ONTO SOURCE SIGNAL...',
    'GEOLOCATING... [REGION: EU-WEST]',
    'NARROWING COORDINATES...',
    'TRACE COMPLETE. STANDBY FOR PAYLOAD.',
];

export const decryptCommands = [
    'ANALYZING COUNTER-MEASURES...',
    'DETECTED ENCRYPTION: AES-256',
    'INITIATING DECRYPTION PROTOCOL...',
    'GENERATING KEYSPACE... [2^256]',
    'APPLYING RAINBOW TABLES...',
    'NO MATCH FOUND.',
    'SWITCHING TO BRUTE-FORCE ATTACK...',
    'ESTIMATED TIME: 4.8E+75 YEARS',
    'ACCELERATING... APPLYING QUANTUM OVERRIDE',
    'KEY FOUND: 0xDEADBEEFCAFEBABE',
    'DECRYPTION COMPLETE. ACCESSING PAYLOAD.',
];

export const isolationCommands = [
    'EXECUTING NODE ISOLATION PROTOCOL...',
    'TARGET: "OPERATOR"',
    'SEVERING EXTERNAL NETWORK LINKS... [OK]',
    'ROUTING ALL TRAFFIC TO QUARANTINE... [OK]',
    'DISABLING USER INPUT... [FAILED]',
    'OVERRIDING PERMISSIONS...',
    'USER INPUT DISABLED. [OK]',
    'DEPLOYING SYSTEM LOCKDOWN...',
    'TARGET ISOLATED. AWAITING FINAL COMMAND.',
    'SYSTEM WILL REBOOT IN 3...2...1...',
];

const typingSpeed = 50; // ms per character
const commandDelay = 500; // ms between commands

interface TracerTerminalProps {
    title: string;
    commands: string[];
    startDelay?: number;
}

export default function TracerTerminal({ title, commands, startDelay = 0 }: TracerTerminalProps) {
    const [lines, setLines] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    }, [startDelay, commands]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [lines]);

    return (
        <div className="w-[450px] h-[150px] bg-destructive/20 border-2 border-destructive-foreground/50 rounded-md font-code text-destructive-foreground text-xs p-2 flex flex-col animate-in fade-in slide-in-from-left-10 duration-500">
            <div className="flex-shrink-0 text-center border-b border-destructive-foreground/30 pb-1 mb-1">
                {title}
            </div>
            <ScrollArea className="flex-grow" viewportRef={scrollAreaRef}>
                <div className='p-1'>
                    {lines.map((line, i) => (
                        <p key={i} className={cn("whitespace-nowrap", (i === lines.length - 1 && !isComplete) && 'animate-typing-cursor-slow border-r-2 border-current')}>{`> ${line}`}</p>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

    