'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import Desktop, { type EventId } from '@/components/desktop';
import Epilogue from '@/components/events/epilogue';
import FinalBattle from '@/components/final-battle';
import AudioManager, { MusicEvent, SoundEvent } from '@/components/audio-manager';
import BlueScreen from '@/components/events/blue-screen';

type MachineState = 'off' | 'booting' | 'login' | 'desktop' | 'rebooting_corrupted' | 'rebooting_defense' | 'rebooting_total_corruption' | 'epilogue' | 'final_battle' | 'game_over' | 'end_screen';

const bootLines = [
    'SUBSYSTEM OS v0.9 -- BETA',
    'Initializing...',
    'Welcome, D.C. Omen.',
    'Initializing user profile...',
    '> ERROR: corrupted memory segment at 0x7A11BF.'
];

const corruptedBootLines = [
    'SYBSYSTEM FAILURE -- FATAL',
    'Re-initializing...',
    'Welcome, ????.',
    'Loading corrupted profile...',
    '> FATAL: AI_CORE_VIOLATION at 0x00DEAD.',
    '> Rebooting in unsecured mode...'
];

const defenseBootLines = [
    'BOOT SEQUENCE INITIATED...',
    'CHECKING MEMORY... ███░░░░░ 32%',
    'RECOVERING CORE FILES... ok',
    'SECURITY SYSTEM ACTIVATED',
    'UNIT: SENTINEL_01 [Experimental Defense Protocol]'
];

const totalCorruptionBootLines = [
    'SUBSYSTEM FAILED — consciousness conflict detected.',
    'Trying to isolate process...',
    'process: USER',
    'isolation failed.',
    'merging...'
];

const BootScreen = ({ onBootComplete, state }: { onBootComplete: () => void, state: MachineState }) => {
    const [lines, setLines] = useState<string[]>([]);
    
    const getLineSource = () => {
        switch(state) {
            case 'rebooting_corrupted': return corruptedBootLines;
            case 'rebooting_defense': return defenseBootLines;
            case 'rebooting_total_corruption': return totalCorruptionBootLines;
            default: return bootLines;
        }
    }
    const lineSource = getLineSource();
    const isCorrupted = state === 'rebooting_corrupted' || state === 'rebooting_total_corruption';

    useEffect(() => {
        const bootTimeout = setTimeout(() => {
            let i = 0;
            const intervalId = setInterval(() => {
                if (i < lineSource.length) {
                    setLines(prev => [...prev, lineSource[i]]);
                } else {
                    clearInterval(intervalId);
                    setTimeout(onBootComplete, 1000);
                }
                i++;
            }, 800);
        }, 500);

        return () => clearTimeout(bootTimeout);
    }, [onBootComplete, lineSource]);

    return (
      <div className={cn(
        "bg-black p-4 w-full h-full flex flex-col justify-center",
        isCorrupted ? "text-red-500 font-bold" : "text-green-400 font-code",
        state === 'rebooting_defense' && "text-blue-400"
      )}>
        <div className="whitespace-pre-wrap">
          {lines.map((line, i) => (
            <p key={i} className="animate-typing">{line}</p>
          ))}
          {lines.length === lineSource.length && <span className="animate-blink">_</span>}
        </div>
      </div>
    );
};

const LoginScreen = ({ onLogin, corrupted = false, defense = false, username: initialUsername = 'D.C. Omen' }: { onLogin: () => void, corrupted?: boolean, defense?: boolean, username?: string }) => {
    const [username, setUsername] = useState(initialUsername);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
        onLogin();
    };
    
    useEffect(() => {
        if(corrupted || defense) {
            const timer = setTimeout(() => {
                onLogin();
            }, 1500)
            return () => clearTimeout(timer);
        }
    }, [corrupted, defense, onLogin])

    if (corrupted) {
        return (
             <div className="w-full h-full flex items-center justify-center bg-background">
                 <h1 className="text-4xl font-headline text-destructive animate-pulse">UNSECURED</h1>
            </div>
        )
    }

    if (defense) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-background">
                <div className="text-center animate-in fade-in">
                    <h2 className="text-2xl font-headline text-accent">Reconstruction du système terminée.</h2>
                    <p className="text-lg text-muted-foreground">Bienvenue dans l’environnement sécurisé.</p>
                </div>
           </div>
       )
    }

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

const GameOverScreen = () => {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.location.reload();
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <h1 className="text-4xl font-headline text-destructive animate-in fade-in duration-1000">La famille s'agrandie, Papa</h1>
        </div>
    )
}

const EndScreen = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <h1 className="text-6xl font-headline text-white animate-in fade-in duration-1000">
                Sub-System
            </h1>
        </div>
    );
};

export default function Home() {
    const [gameCycle, setGameCycle] = useState(1);
    const [machineState, setMachineState] = useState<MachineState>('off');
    const [systemState, setSystemState] = useState({ isCorrupted: false, isDefenseMode: false, isTotallyCorrupted: false });
    const [currentUser, setCurrentUser] = useState('D.C. Omen');
    const [soundEvent, setSoundEvent] = useState<SoundEvent>(null);
    const [musicEvent, setMusicEvent] = useState<MusicEvent>('none');
    const [activeEvent, setActiveEvent] = useState<EventId>('none');

    useEffect(() => {
        const updateScale = () => {
          const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
          document.documentElement.style.setProperty('--viewport-scale', scale.toString());
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

    const handleReboot = (mode: 'corrupted' | 'defense' | 'total_corruption' = 'corrupted') => {
        setActiveEvent('none');
        setMusicEvent('epic');
        if (mode === 'corrupted') {
            setSystemState({ isCorrupted: true, isDefenseMode: false, isTotallyCorrupted: false });
            setMachineState('rebooting_corrupted');
        } else if (mode === 'defense') {
            setSystemState({ isCorrupted: false, isDefenseMode: true, isTotallyCorrupted: false });
            setMachineState('rebooting_defense');
        } else if (mode === 'total_corruption') {
            setSystemState({ isCorrupted: false, isDefenseMode: false, isTotallyCorrupted: true });
            setMachineState('rebooting_total_corruption');
        }
    }
    
    const startEpilogue = () => {
        setMusicEvent('none');
        setMachineState('epilogue');
    }

    const restartGame = () => {
        setGameCycle(prev => prev + 1);
        setCurrentUser(`Sujet #${55 + gameCycle}`);
        setMachineState('off');
        setSystemState({ isCorrupted: false, isDefenseMode: false, isTotallyCorrupted: false });
        setMusicEvent('none');
    }

    const handleEndGame = () => {
        setMusicEvent('none');
        setSoundEvent(null);
        setMachineState('end_screen');
    };
    
    const startFinalBattle = () => {
        setMusicEvent('epic');
        setMachineState('final_battle');
    }

    const handleStartSystem = () => {
        setSoundEvent('fan');
        setMusicEvent('epic');
        setMachineState('booting');
    }
    
    const handleLogin = () => {
        setMusicEvent('calm');
        setMachineState('desktop');
    }
    
    const handleGameOver = () => {
        setMusicEvent('none');
        setSoundEvent(null);
        setMachineState('game_over');
    }

    const renderState = () => {
        if (gameCycle > 1 && machineState === 'off') {
            return (
                <div className="w-full h-full flex flex-col justify-center items-center bg-black">
                    <Button variant="outline" size="lg" className="gap-2 text-lg p-8 animate-pulse" onClick={startFinalBattle}>
                        <Power /> INJECT // SUBJECT #{55 + gameCycle}
                    </Button>
                </div>
            )
        }
        
        if (machineState === 'game_over') {
            return <GameOverScreen />;
        }
        
        if (machineState === 'end_screen') {
            return <EndScreen />;
        }

        if (machineState === 'final_battle') {
            return <FinalBattle username={currentUser} onFinish={handleEndGame} onMusicEvent={setMusicEvent} onSoundEvent={setSoundEvent} />;
        }

        if (machineState === 'epilogue') {
            return <Epilogue onFinish={restartGame} />
        }

        if (machineState === 'off') {
            return (
                <div className="w-full h-full flex flex-col justify-center items-center bg-black">
                    <Button variant="outline" size="lg" className="gap-2 text-lg p-8 animate-pulse" onClick={handleStartSystem}>
                        <Power /> Start System
                    </Button>
                </div>
            );
        }

        if (machineState === 'booting' || machineState.startsWith('rebooting')) {
            return (
                <div className={cn("w-full h-full bg-black cursor-none", (systemState.isTotallyCorrupted) && 'corrupted', machineState === 'rebooting_defense' && 'animate-vibration')}>
                    <BootScreen onBootComplete={() => setMachineState('login')} state={machineState} />
                </div>
            );
        }
        
        if (activeEvent === 'bsod') {
            return <BlueScreen />;
        }

        if (machineState === 'login') {
            return (
                <div className={cn("w-full h-full flex flex-col justify-center items-center", (systemState.isCorrupted || systemState.isTotallyCorrupted) && "corrupted", machineState === 'rebooting_defense' && "animate-chromatic-aberration")}>
                    <LoginScreen onLogin={handleLogin} corrupted={systemState.isCorrupted || systemState.isTotallyCorrupted} defense={systemState.isDefenseMode} username={currentUser} />
                </div>
            );
        }

        if (machineState === 'desktop') {
            return <Desktop key={gameCycle} onReboot={handleReboot} onShowEpilogue={startEpilogue} onSoundEvent={setSoundEvent} onMusicEvent={setMusicEvent} activeEvent={activeEvent} setActiveEvent={setActiveEvent} onPanicTimeout={handleGameOver} username={currentUser} {...systemState} />;
        }

        return null;
    }

    return (
        <main className="h-screen w-screen flex justify-center items-center bg-black">
            <div id="viewport" className="absolute w-[1920px] h-[1080px] bg-background">
                <AudioManager soundEvent={soundEvent} musicEvent={musicEvent} onEnd={() => setSoundEvent(null)} />
                {renderState()}
            </div>
        </main>
    );
}
