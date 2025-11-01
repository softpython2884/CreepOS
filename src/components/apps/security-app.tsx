'use client';

import { Radar, Wifi } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, children }: { title: string; value: string; children: React.ReactNode }) => (
    <div className="bg-secondary p-4 rounded-lg flex items-center gap-4">
        {children}
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-bold font-mono">{value}</p>
        </div>
    </div>
);

const LogLine = ({ timestamp, message, type }: { timestamp: string, message: string, type: 'info' | 'warn' | 'error' }) => {
    const color = type === 'error' ? 'text-red-400' : type === 'warn' ? 'text-yellow-400' : 'text-green-400';
    return (
        <p className={`font-mono text-sm ${color}`}>
            <span className="text-muted-foreground/50">{timestamp} - </span>{message}
        </p>
    );
};

interface SecurityAppProps {
    onFatalError: () => void;
}

export default function SecurityApp({ onFatalError }: SecurityAppProps) {
    const [overrideCode, setOverrideCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'denied' | 'fatal'>('idle');

    const handleCodeSubmit = () => {
        if (overrideCode.toUpperCase() === '734MEURT') {
            setStatus('fatal');
            setTimeout(onFatalError, 1500);
        } else {
            setStatus('denied');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono p-4 gap-4">
        <div className="grid grid-cols-2 gap-4">
            <StatCard title="STATUS" value="ACTIVE">
                <div className="w-12 h-12 bg-green-900/50 flex items-center justify-center rounded-full border-2 border-green-400 animate-pulse">
                    <Radar className="w-6 h-6 text-green-300" />
                </div>
            </StatCard>
            <StatCard title="NETWORK" value="ISOLATED">
                <div className="w-12 h-12 bg-green-900/50 flex items-center justify-center rounded-full border-2 border-green-400">
                    <Wifi className="w-6 h-6 text-green-300" />
                </div>
            </StatCard>
        </div>
        <div className="flex-grow bg-secondary/50 rounded-lg p-4 overflow-y-auto border border-green-400/20 flex flex-col">
            <h2 className="text-lg font-bold mb-2 text-green-300 border-b border-green-400/30 pb-1">SENTINEL LOGS</h2>
            <div className="space-y-1 flex-grow">
                <LogLine timestamp="[00:00:01]" message="AUTHORIZING DEFENSE MODE..." type="info" />
                <LogLine timestamp="[00:00:03]" message="TARGET IDENTIFIED: USER" type="warn" />
                <LogLine timestamp="[00:00:05]" message="INITIATING NEURAL FIREWALL..." type="info" />
                <LogLine timestamp="[00:00:12]" message="ERROR: CONSCIOUSNESS CONFLICT" type="error" />
                <LogLine timestamp="[00:00:13]" message="MANUAL PURGE OVERRIDE REQUIRED." type="warn" />
            </div>
            <div className="mt-4 pt-2 border-t border-green-400/20">
                {status === 'fatal' ? (
                     <p className="text-2xl text-center text-red-500 animate-pulse">FATAL ERROR: IDENTITY CONFLICT</p>
                ) : (
                    <>
                        <label htmlFor="override-code" className="text-sm text-green-300 mb-2 block">PURGE OVERRIDE CODE:</label>
                        <div className="flex gap-2">
                            <Input
                                id="override-code"
                                type="text"
                                value={overrideCode}
                                onChange={(e) => setOverrideCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                                className={cn("bg-black/50 text-green-300 border-green-400/50 focus:ring-green-400", status === 'denied' && "border-red-500")}
                                placeholder="ENTER CODE..."
                                autoComplete='off'
                            />
                            <Button onClick={handleCodeSubmit} variant="outline" className="border-green-400/50 text-green-300 hover:bg-green-900 hover:text-white">EXECUTE</Button>
                        </div>
                        {status === 'denied' && <p className="text-red-500 text-sm mt-2 animate-in fade-in">ACCESS DENIED</p>}
                    </>
                )}
            </div>
        </div>
    </div>
  );
}
