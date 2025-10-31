'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import Desktop from '@/components/desktop';

type MachineState = 'off' | 'booting' | 'login' | 'desktop';

const bootLines = [
    'SUBSYSTEM OS v0.9 -- BETA',
    'Initializing...',
    'Welcome, D.C. Omen.',
    'Initializing user profile...',
    '> ERROR: corrupted memory segment at 0x7A11BF.'
];

const BootScreen = ({ onBootComplete }: { onBootComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const bootTimeout = setTimeout(() => {
            let i = 0;
            const intervalId = setInterval(() => {
                if (i < bootLines.length) {
                    setLines(prev => [...prev, bootLines[i]]);
                } else {
                    clearInterval(intervalId);
                    setTimeout(onBootComplete, 1000);
                }
                i++;
            }, 800);
        }, 500);

        return () => clearTimeout(bootTimeout);
    }, [onBootComplete]);

    return (
      <div className="bg-black text-green-400 font-code p-4 w-full h-full flex flex-col justify-center">
        <div className="whitespace-pre-wrap">
          {lines.map((line, i) => (
            <p key={i} className="animate-typing">{line}</p>
          ))}
          {lines.length === bootLines.length && <span className="animate-blink">_</span>}
        </div>
      </div>
    );
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [username, setUsername] = useState('D.C. Omen');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
        // Any password is correct
        onLogin();
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-background">
            <form onSubmit={handleLogin} className="w-full max-w-xs text-center p-8 bg-card rounded-lg shadow-2xl shadow-primary/20 animate-in fade-in zoom-in-95">
                <h1 className="text-2xl font-headline text-primary opacity-70 mb-2">SUBSYSTEM OS</h1>
                <p className="text-sm text-muted-foreground mb-6">Enter credentials to proceed</p>
                <div className="relative mb-4">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 text-center" 
                        placeholder="Username"
                        readOnly
                    />
                </div>
                <div className="relative mb-6">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 text-center tracking-widest" 
                        placeholder="••••••••"
                        autoFocus
                    />
                </div>
                <Button type="submit" className="w-full">
                    Log In
                </Button>
                {error && <p className="mt-4 text-sm text-destructive animate-in fade-in">Authentication failed.</p>}
            </form>
        </div>
    );
};

export default function Home() {
    const [machineState, setMachineState] = useState<MachineState>('off');

    const renderState = () => {
        if (machineState === 'off') {
            return (
                <div className="w-full h-full flex flex-col justify-center items-center bg-black">
                    <Button variant="outline" size="lg" className="gap-2 text-lg p-8 animate-pulse" onClick={() => setMachineState('booting')}>
                        <Power /> Start System
                    </Button>
                </div>
            );
        }

        if (machineState === 'booting') {
            return (
                <div className="w-full h-full bg-black">
                    <BootScreen onBootComplete={() => setMachineState('login')} />
                </div>
            );
        }

        if (machineState === 'login') {
            return (
                <div className="w-full h-full flex flex-col justify-center items-center">
                    <LoginScreen onLogin={() => setMachineState('desktop')} />
                </div>
            );
        }

        if (machineState === 'desktop') {
            return <Desktop />;
        }

        return null;
    }

    return (
        <main className="min-h-screen w-full flex justify-center items-center bg-black">
            <div id="viewport" className="relative w-[1920px] h-[1080px] max-w-full max-h-full scale-[.8] sm:scale-100 bg-background overflow-hidden">
                {renderState()}
            </div>
        </main>
    );
}
