
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import Desktop from '@/components/desktop';
import AudioManager, { MusicEvent, SoundEvent } from '@/components/audio-manager';

type MachineState = 'off' | 'booting' | 'login' | 'desktop';

const bootLines = [
    'SUBSYSTEM OS v1.0 -- STABLE',
    'Initializing...',
    'Welcome, Operator.',
    'Loading user profile...',
    'All systems nominal.'
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
      <div className="bg-black p-4 w-full h-full flex flex-col justify-center text-green-400 font-code">
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
    const [username, setUsername] = useState('Operator');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
        // For now, any password works
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
    const [username, setUsername] = useState('Operator');
    const [soundEvent, setSoundEvent] = useState<SoundEvent>(null);
    const [musicEvent, setMusicEvent] = useState<MusicEvent>('none');

    useEffect(() => {
        const updateScale = () => {
            const viewportWidth = 1920;
            const viewportHeight = 1080;
            const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    
            const scaleX = windowWidth / viewportWidth;
            const scaleY = windowHeight / viewportHeight;
    
            const scale = Math.max(scaleX, scaleY);
    
            const left = (windowWidth - viewportWidth * scale) / 2;
            const top = (windowHeight - viewportHeight * scale) / 2;
    
            const root = document.documentElement;
            root.style.setProperty('--viewport-scale', scale.toString());
            root.style.setProperty('--viewport-left', `${left}px`);
            root.style.setProperty('--viewport-top', `${top}px`);
        };
      
        updateScale();
        window.addEventListener('resize', updateScale);

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('resize', updateScale);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);
    
    const handleStartSystem = () => {
        setSoundEvent('fan');
        setMusicEvent('epic');
        setMachineState('booting');
    }
    
    const handleLogin = () => {
        setMusicEvent('calm');
        setMachineState('desktop');
    }

    const renderState = () => {
        switch (machineState) {
            case 'off':
                return (
                    <div className="w-full h-full flex flex-col justify-center items-center bg-black">
                        <Button variant="outline" size="lg" className="gap-2 text-lg p-8 animate-pulse" onClick={handleStartSystem}>
                            <Power /> Start System
                        </Button>
                    </div>
                );
            case 'booting':
                return (
                    <div className="w-full h-full bg-black cursor-none">
                        <BootScreen onBootComplete={() => setMachineState('login')} />
                    </div>
                );
            case 'login':
                return (
                    <div className="w-full h-full flex flex-col justify-center items-center">
                        <LoginScreen onLogin={handleLogin} />
                    </div>
                );
            case 'desktop':
                return <Desktop onSoundEvent={setSoundEvent} onMusicEvent={setMusicEvent} username={username} />;
            default:
                return null;
        }
    }

    return (
        <main className="h-screen w-screen flex justify-center items-center bg-black overflow-hidden">
            <div id="viewport" className="absolute w-[1920px] h-[1080px] bg-background origin-top-left">
                <AudioManager soundEvent={soundEvent} musicEvent={musicEvent} onEnd={() => setSoundEvent(null)} />
                {renderState()}
            </div>
        </main>
    );
}
