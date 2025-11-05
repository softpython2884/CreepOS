
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Power, Monitor, Ratio } from 'lucide-react';
import { cn } from '@/lib/utils';
import Desktop from '@/components/desktop';
import AudioManager, { MusicEvent, SoundEvent } from '@/components/audio-manager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

type MachineState = 'off' | 'bios' | 'booting' | 'login' | 'desktop';

const biosLines = [
    'NEO-SYSTEM BIOS v1.0.3',
    'Copyright (C) 2024 VIRTUAL NIGHTMARE Corp.',
    '',
    'Main Processor: Quantum Core @ 4.2THz',
    'Memory Testing: 65536M OK',
    '',
    'Detecting drives...',
    '  Primary Drive: /dev/sys_storage',
    '  Secondary Drive: Not Detected',
    '',
    'Initializing boot sequence from Primary Drive...',
];

const bootLines = [
    'NEO-SYS KERNEL v2.1.0-beta',
    'Checking system integrity...',
    'Loading drivers [OK]',
    'Mounting file systems [OK]',
    'Initializing subsystem interface...',
    'Welcome, Operator.',
];

const ratios = [
    { name: '16:9 (Widescreen)', value: 16/9 },
    { name: '16:10 (Widescreen)', value: 16/10 },
    { name: '21:9 (Ultrawide)', value: 21/9 },
    { name: '4:3 (Standard)', value: 4/3 },
    { name: '3:2 (Photography)', value: 3/2 },
    { name: '1:1 (Square)', value: 1/1 },
    { name: '9:16 (Vertical)', value: 9/16 },
];

const OffScreen = ({ onStart, onRatioChange, currentRatio }: { onStart: () => void; onRatioChange: (ratio: number) => void; currentRatio: number }) => {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-black font-code">
            <div className="w-[450px] border border-accent/20 bg-card/50 rounded-lg p-6 shadow-2xl shadow-primary/10 flex flex-col gap-4">
                <h1 className="text-xl font-bold text-accent text-center tracking-widest">NEO-SYSTEM : BREACH</h1>
                <div className="flex flex-col gap-4 mt-4">
                    <div className='flex items-center gap-2'>
                        <Ratio className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Display Ratio:</span>
                        <Select onValueChange={(value) => onRatioChange(parseFloat(value))} defaultValue={currentRatio.toString()}>
                            <SelectTrigger className="flex-1 bg-input/50">
                                <SelectValue placeholder="Select ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {ratios.map(r => (
                                    <SelectItem key={r.value} value={r.value.toString()}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button variant="outline" size="lg" className="gap-2 text-lg p-8 mt-4" onClick={onStart}>
                    <Power /> INITIALIZE SYSTEM
                </Button>
            </div>
        </div>
    );
};

const BiosScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);
    
    useEffect(() => {
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < biosLines.length) {
                setLines(prev => [...prev, biosLines[i]]);
            } else {
                clearInterval(intervalId);
                setTimeout(onComplete, 1000);
            }
            i++;
        }, 200);

        return () => clearInterval(intervalId);
    }, [onComplete]);

    return (
        <div className="bg-black p-8 w-full h-full text-gray-300 font-code cursor-none">
            <div className="whitespace-pre-wrap text-lg">
                {lines.map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>
        </div>
    );
};


const BootScreen = ({ onBootComplete }: { onBootComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < bootLines.length) {
                setLines(prev => [...prev, bootLines[i]]);
                setProgress(p => p + (100 / bootLines.length));
            } else {
                clearInterval(intervalId);
                setTimeout(onBootComplete, 1200);
            }
            i++;
        }, 600);

        return () => clearInterval(intervalId);
    }, [onBootComplete]);

    return (
      <div className="bg-black p-8 w-full h-full flex flex-col justify-center text-green-400 font-code cursor-none">
        <div className="whitespace-pre-wrap text-lg">
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-4">
            <Progress value={progress} className="h-2 bg-green-900/50 border border-green-700/50" indicatorClassName="bg-green-400" />
            <span className='text-lg'>{Math.round(progress)}%</span>
        </div>
        {progress >= 100 && (
            <p className='mt-4 text-xl animate-pulse'>Boot sequence complete. Handing over control...</p>
        )}
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
                <h1 className="text-2xl font-headline text-primary opacity-70 mb-2">NEO-SYSTEM</h1>
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
    const [aspectRatio, setAspectRatio] = useState(16/9);

    useEffect(() => {
        const updateScale = () => {
            const viewportBaseWidth = 1920;
            const viewportWidth = viewportBaseWidth;
            const viewportHeight = viewportWidth / aspectRatio;

            const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    
            const scaleX = windowWidth / viewportWidth;
            const scaleY = windowHeight / viewportHeight;
    
            const scale = Math.min(scaleX, scaleY);
    
            const left = (windowWidth - viewportWidth * scale) / 2;
            const top = (windowHeight - viewportHeight * scale) / 2;
    
            const root = document.documentElement;
            root.style.setProperty('--viewport-width', `${viewportWidth}px`);
            root.style.setProperty('--viewport-height', `${viewportHeight}px`);
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
    }, [aspectRatio]);
    
    const handleStartSystem = () => {
        setSoundEvent('fan');
        setMachineState('bios');
    }

    const handleBiosComplete = () => {
        setMusicEvent('epic');
        setMachineState('booting');
    }
    
    const handleLogin = () => {
        setMusicEvent('calm');
        setMachineState('desktop');
    }
    
    const handleReboot = () => {
        setMusicEvent('none');
        setMachineState('off');
    }

    const renderState = () => {
        switch (machineState) {
            case 'off':
                return (
                    <OffScreen onStart={handleStartSystem} onRatioChange={setAspectRatio} currentRatio={aspectRatio}/>
                );
            case 'bios':
                return (
                    <div className="w-full h-full bg-black">
                        <BiosScreen onComplete={handleBiosComplete} />
                    </div>
                );
            case 'booting':
                return (
                    <div className="w-full h-full bg-black">
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
                return <Desktop onSoundEvent={setSoundEvent} onMusicEvent={setMusicEvent} username={username} onReboot={handleReboot} />;
            default:
                return null;
        }
    }

    return (
        <main className="h-screen w-screen flex justify-center items-center bg-black overflow-hidden">
            <div 
                id="viewport" 
                className="absolute bg-background origin-top-left"
            >
                <AudioManager soundEvent={soundEvent} musicEvent={musicEvent} onEnd={() => setSoundEvent(null)} />
                {renderState()}
            </div>
        </main>
    );
}
