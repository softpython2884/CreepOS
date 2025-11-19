'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Power, Monitor, Ratio, RefreshCw, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import Desktop from '@/components/desktop';
import AudioManager, { MusicEvent, SoundEvent } from '@/components/audio-manager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { loadGameState, deleteGameState } from '@/lib/save-manager';
import { network as initialNetworkData } from '@/lib/network';
import SurvivalMode from '@/components/survival-mode';
import CinematicScreen from '@/components/cinematic-screen';

type MachineState = 'standby' | 'cinematic' | 'off' | 'bios' | 'booting' | 'login' | 'desktop' | 'recovery' | 'bsod' | 'survival';

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

const StandbyScreen = ({ onInteract }: { onInteract: () => void }) => (
    <div 
        className="w-full h-full flex flex-col justify-center items-center bg-black font-code cursor-pointer"
        onClick={onInteract}
    >
        <p className="text-xl text-foreground animate-pulse">[ Cliquez pour commencer ]</p>
    </div>
);

const OffScreen = ({ onStart, onRatioChange, currentRatio }: { onStart: () => void; onRatioChange: (ratio: number) => void; currentRatio: number }) => {
    const [selectedRatio, setSelectedRatio] = useState<string | number>(currentRatio.toString());
    const [isCustomRatio, setIsCustomRatio] = useState(false);
    const [customWidth, setCustomWidth] = useState(1920);
    const [customHeight, setCustomHeight] = useState(1080);
    
    const handleRatioSelection = (value: string) => {
        if (value === 'custom') {
            setIsCustomRatio(true);
        } else {
            setIsCustomRatio(false);
            const numericValue = parseFloat(value);
            onRatioChange(numericValue);
            setSelectedRatio(numericValue);
        }
    };
    
    useEffect(() => {
        if(isCustomRatio && customWidth > 0 && customHeight > 0) {
            onRatioChange(customWidth/customHeight);
        }
    }, [customWidth, customHeight, isCustomRatio, onRatioChange]);

    const handleAutoDetect = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setCustomWidth(w);
        setCustomHeight(h);
        onRatioChange(w/h);
    }
    
    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-black font-code">
            <div className="w-[450px] border border-accent/20 bg-card/50 rounded-lg p-6 shadow-2xl shadow-primary/10 flex flex-col gap-4">
                <h1 className="text-xl font-bold text-accent text-center tracking-widest">NEO-SYSTEM : BREACH</h1>
                <div className="flex flex-col gap-4 mt-4">
                    <div className='flex items-center gap-2'>
                        <Ratio className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Display Ratio:</span>
                        <Select onValueChange={handleRatioSelection} defaultValue={currentRatio.toString()}>
                            <SelectTrigger className="flex-1 bg-input/50">
                                <SelectValue placeholder="Select ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {ratios.map(r => (
                                    <SelectItem key={r.value} value={r.value.toString()}>{r.name}</SelectItem>
                                ))}
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isCustomRatio && (
                        <div className="flex flex-col gap-2 p-3 border border-input rounded-md animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <Input type="number" placeholder="Width" value={customWidth} onChange={e => setCustomWidth(parseInt(e.target.value))} className="bg-secondary/50"/>
                                <span className="text-muted-foreground">x</span>
                                <Input type="number" placeholder="Height" value={customHeight} onChange={e => setCustomHeight(parseInt(e.target.value))} className="bg-secondary/50"/>
                            </div>
                            <Button variant="secondary" size="sm" className="w-full" onClick={handleAutoDetect}>
                                <RefreshCw className="mr-2" size={14}/>
                                Auto-detect
                            </Button>
                        </div>
                    )}
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


const BootScreen = ({ onBootComplete, onRecovery, username }: { onBootComplete: () => void; onRecovery: () => void; username: string; }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    
    useEffect(() => {
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < bootLines.length) {
                setLines(prev => [...prev, bootLines[i]]);
                setProgress(p => p + (100 / (bootLines.length + 1) ));
            } else {
                // Final check: XserverOS
                const savedState = loadGameState(username);
                const playerPc = savedState.network.find(p => p.id === 'player-pc');
                const sysFolder = playerPc?.fileSystem.find(f => f.name === 'sys');
                const xserverFile = sysFolder?.children?.find(f => f.name === 'XserverOS.sys');

                if (!xserverFile) {
                    setError('CRITICAL ERROR: XserverOS.sys not found. Cannot boot desktop environment.');
                    setTimeout(() => {
                        setLines(prev => [...prev, 'CRITICAL ERROR: XserverOS.sys not found. Cannot boot desktop environment.']);
                        setProgress(100);
                        setTimeout(onRecovery, 2000);
                    }, 1000);
                } else {
                    setLines(prev => [...prev, 'Welcome, Operator.']);
                    setProgress(100);
                    setTimeout(onBootComplete, 1200);
                }
                clearInterval(intervalId);
            }
            i++;
        }, 600);

        return () => clearInterval(intervalId);
    }, [onBootComplete, onRecovery, username]);

    return (
      <div className="bg-black p-8 w-full h-full flex flex-col justify-center text-green-400 font-code cursor-none">
        <div className="whitespace-pre-wrap text-lg">
          {lines.filter(line => typeof line === 'string').map((line, i) => (
            <p key={i} className={cn(line.startsWith('CRITICAL') ? 'text-red-500' : '')}>{line}</p>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-4">
            <Progress value={progress} className="h-2 bg-green-900/50 border border-green-700/50" indicatorClassName={cn("bg-green-400", error && 'bg-red-500')} />
            <span className='text-lg'>{Math.round(progress)}%</span>
        </div>
        {progress >= 100 && !error &&(
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
        <div className="w-full h-full flex items-center justify-center bg-background font-code animate-in fade-in">
            <div className="w-[400px] text-foreground border-2 border-accent/50 p-1 bg-card/30">
                <form onSubmit={handleLogin} className="border border-accent/30 p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-accent tracking-[0.2em]">NEO-SYSTEM</h1>
                        <p className="text-sm text-accent/70">AUTHENTIFICATION REQUISE</p>
                    </div>
                    
                    <div className="grid grid-cols-[120px_1fr] items-center gap-x-4 gap-y-3">
                        <label htmlFor="username">UTILISATEUR :</label>
                        <Input 
                            id="username"
                            value={username}
                            readOnly
                            className="bg-input/50 border-accent/30 focus-visible:ring-accent"
                        />
                        
                        <label htmlFor="password">MOT DE PASSE :</label>
                        <Input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-input/50 border-accent/30 focus-visible:ring-accent tracking-widest" 
                            placeholder="********"
                            autoFocus
                        />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <Button type="submit" variant="outline" className="bg-accent/10 hover:bg-accent hover:text-accent-foreground border-accent/30">
                            CONNEXION
                        </Button>
                    </div>

                    {error && <p className="mt-4 text-sm text-destructive text-center animate-in fade-in">ERREUR: Authentification échouée.</p>}
                </form>
            </div>
        </div>
    );
};

const RecoveryScreen = ({ onReboot }: { onReboot: () => void }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([
        'SubSystem Recovery Mode',
        'Kernel not found or unable to mount.',
        'Type "help" for a list of commands.'
    ]);

    const handleCommand = () => {
        const newHistory = [...history, `> ${input}`];
        if (input.trim().toLowerCase() === 'restore_kernel') {
            const playerPcTemplate = initialNetworkData.find(p => p.id === 'player-pc');
            const xserverFileTemplate = playerPcTemplate?.fileSystem.find(f => f.name === 'sys')?.children?.find(f => f.name === 'XserverOS.sys');
            
            if(xserverFileTemplate) {
                // This is a bit of a hack. We modify localStorage directly.
                const gameState = JSON.parse(localStorage.getItem('gameState_Operator') || '{}');
                const playerPc = gameState.network.find((p:any) => p.id === 'player-pc');
                const sysFolder = playerPc.fileSystem.find((f:any) => f.name === 'sys');
                if (sysFolder && !sysFolder.children.some((f:any) => f.name === 'XserverOS.sys')) {
                    sysFolder.children.push(xserverFileTemplate);
                    localStorage.setItem('gameState_Operator', JSON.stringify(gameState));
                }
            }
            
            newHistory.push('Restoring kernel from backup...');
            newHistory.push('Restore complete. System will now reboot.');
            setHistory(newHistory);
            setTimeout(onReboot, 2000);

        } else if (input.trim().toLowerCase() === 'help') {
            newHistory.push('Available commands:');
            newHistory.push('  restore_kernel   - Restores the system kernel from the recovery partition.');
            newHistory.push('  reset_game       - Deletes all save data and reboots.');
        } else if (input.trim().toLowerCase() === 'reset_game') {
            deleteGameState('Operator');
            newHistory.push('All save data deleted. System will now reboot.');
            setHistory(newHistory);
            setTimeout(onReboot, 2000);
        }
        else {
            newHistory.push(`Command not found: ${input}`);
        }
        setHistory(newHistory);
        setInput('');
    }

    return (
        <div className="w-full h-full p-8 bg-black text-red-500 font-code flex flex-col">
            <div className="flex-grow overflow-y-auto">
                {history.map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <div className="flex items-center">
                <span>&gt;&nbsp;</span>
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCommand()}
                    className="bg-transparent border-none text-red-500 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 h-6 p-0 ml-1"
                    autoFocus
                />
            </div>
        </div>
    );
};

const BsodScreen = ({ onReboot }: { onReboot: () => void }) => {

    useEffect(() => {
        const timer = setTimeout(onReboot, 7000);
        return () => clearTimeout(timer);
    }, [onReboot]);

    return (
        <div className="w-full h-full p-8 sm:p-16 bg-[#0000AA] text-white font-code flex flex-col justify-center items-center text-center">
            <Skull className="h-24 w-24 mb-8 animate-pulse" />
            <h1 className="text-3xl font-bold mb-4">A fatal exception has occurred.</h1>
            <p className="text-lg">The system can no longer operate safely.</p>
            <p className="text-lg mt-4">ERROR: 0E : 016F : BFF9B3D4 - KERNEL_DELETED_BY_TRACE</p>
            <p className="text-lg mt-8">System will reboot automatically.</p>
        </div>
    )
}


export default function Home() {
    const [machineState, setMachineState] = useState<MachineState>('standby');
    const [username] = useState('Operator');
    const [soundEvent, setSoundEvent] = useState<SoundEvent>(null);
    const [musicEvent, setMusicEvent] = useState<MusicEvent>('none');
    const [aspectRatio, setAspectRatio] = useState(16/9);
    const [scale, setScale] = useState(1);


    const handleUserInteraction = () => {
        // Check if the intro has been played.
        try {
            const hasPlayedIntro = localStorage.getItem('hasPlayedIntro_v1');
            if (hasPlayedIntro) {
                setMachineState('off');
            } else {
                setMusicEvent('cinematic');
                setMachineState('cinematic');
            }
        } catch (e) {
            // localStorage might be disabled
            setMachineState('off');
        }
    }


    const updateScale = useCallback(() => {
        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
        if (windowWidth === 0 || windowHeight === 0) return;

        // Determine base viewport width, but cap it at 1920
        const viewportWidth = Math.min(windowWidth, 1920);
        const viewportHeight = viewportWidth / aspectRatio;

        const scaleX = windowWidth / viewportWidth;
        const scaleY = windowHeight / viewportHeight;

        // The final scale is the minimum of the two, ensuring it fits
        const calculatedScale = Math.min(scaleX, scaleY);
        setScale(calculatedScale);

        const left = (windowWidth - viewportWidth * calculatedScale) / 2;
        const top = (windowHeight - viewportHeight * calculatedScale) / 2;

        const root = document.documentElement;
        root.style.setProperty('--viewport-width', `${viewportWidth}px`);
        root.style.setProperty('--viewport-height', `${viewportHeight}px`);
        root.style.setProperty('--viewport-scale', calculatedScale.toString());
        root.style.setProperty('--viewport-left', `${left}px`);
        root.style.setProperty('--viewport-top', `${top}px`);
    }, [aspectRatio]);

    useEffect(() => {
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
    }, [updateScale]);
    
    const handleStartSystem = () => {
        setSoundEvent('fan');
        setMachineState('bios');
    }

    const handleCinematicComplete = () => {
        try {
            localStorage.setItem('hasPlayedIntro_v1', 'true');
        } catch (e) {
            // localStorage might be disabled
        }
        setMusicEvent('none');
        setMachineState('off');
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
        setSoundEvent('fan');
        setMachineState('bios');
    }

    const renderState = () => {
        switch (machineState) {
            case 'standby':
                return <StandbyScreen onInteract={handleUserInteraction} />;
            case 'cinematic':
                 return <CinematicScreen onComplete={handleCinematicComplete} />;
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
                        <BootScreen onBootComplete={() => setMachineState('login')} onRecovery={() => setMachineState('recovery')} username={username}/>
                    </div>
                );
            case 'login':
                return (
                    <div className="w-full h-full flex flex-col justify-center items-center">
                        <LoginScreen onLogin={handleLogin} />
                    </div>
                );
            case 'recovery':
                return (
                    <div className="w-full h-full bg-black">
                        <RecoveryScreen onReboot={handleReboot} />
                    </div>
                );
            case 'bsod':
                return (
                    <div className="w-full h-full bg-black">
                        <BsodScreen onReboot={handleReboot} />
                    </div>
                );
            case 'survival':
                return <SurvivalMode 
                    onWin={() => { 
                        setMachineState('desktop'); 
                        setMusicEvent('calm'); 
                    }} 
                    onLose={() => {
                        setSoundEvent('bsod');
                        setMachineState('bsod');
                    }} 
                    onSoundEvent={setSoundEvent}
                />;
            case 'desktop':
                return <Desktop onSoundEvent={setSoundEvent} onMusicEvent={setMusicEvent} username={username} onReboot={handleReboot} setMachineState={setMachineState} scale={scale}/>;
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
                {renderState()}
                <AudioManager soundEvent={soundEvent} musicEvent={musicEvent} onEnd={() => setSoundEvent(null)} />
            </div>
        </main>
    );
}
