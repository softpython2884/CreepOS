
'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveLogsProps {
    logs: string[];
}

export default function LiveLogs({ logs }: LiveLogsProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="h-full bg-card/90 text-sm text-foreground p-2 font-code">
            <ScrollArea className="h-full" viewportRef={scrollAreaRef}>
                <div className="p-2 whitespace-pre-wrap">
                    {logs.map((log, index) => (
                        <p key={index} className="animate-in fade-in">
                            <span className="text-muted-foreground/50 mr-2">{index.toString().padStart(4, '0')}</span>
                            {log}
                        </p>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
