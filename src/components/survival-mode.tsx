'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldOff, Wifi, WifiOff, Server, ServerOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoundEvent } from './audio-manager';
import { PC } from '@/lib/network/types';
import { saveGameState } from '@/lib/save-manager';
import Desktop from './desktop';

interface SurvivalModeProps {
    onWin: () => void;
    onLose: () => void;
    onSoundEvent: (event: SoundEvent) => void;
    username: string;
    network: PC[];
    setNetwork: (network: PC[]) => void;
    hackedPcs: Set<string>;
}

const SURVIVAL_DURATION = 120; // 2 minutes

const updateNodeByPath = (
  nodes: any[],
  path: string[],
  updater: (node: any) => any | null
): any[] => {
  if (path.length === 0) return nodes;
  const nodeName = path[0];
  
  if (path.length === 1) {
      const nodeIndex = nodes.findIndex(n => n.name === nodeName);
      if (nodeIndex !== -1) {
          const updatedNode = updater(nodes[nodeIndex]);
          const newNodes = [...nodes];
          if (updatedNode === null) {
              newNodes.splice(nodeIndex, 1);
          } else {
              newNodes[nodeIndex] = updatedNode;
          }
          return newNodes;
      }
  }

  return nodes.map(node => {
      if (node.name === nodeName && node.type === 'folder' && node.children) {
          return {
              ...node,
              children: updateNodeByPath(node.children, path.slice(1), updater),
          };
      }
      return node;
  });
};


export default function SurvivalMode({ onWin, onLose, onSoundEvent, username, network, setNetwork, hackedPcs }: SurvivalModeProps) {
    const [timeLeft, setTimeLeft] = useState(SURVIVAL_DURATION);
    const [defenses, setDefenses] = useState({
        proxy: true,
        firewall: true,
        ports: [80, 443, 22] // Example player ports
    });
    const [log, setLog] = useState<string[]>(['INTRUSION DETECTED. Locking down system...']);

    const handleLose = () => {
        const updatedNetwork = network.map(pc => {
            if (pc.id === 'player-pc') {
                const newFileSystem = updateNodeByPath(pc.fileSystem, ['sys', 'XserverOS.sys'], () => null);
                return { ...pc, fileSystem: newFileSystem };
            }
            return pc;
        });
        setNetwork(updatedNetwork);
        saveGameState(username, { network: updatedNetwork, hackedPcs });
        onLose();
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    clearInterval(timer);
                    onSoundEvent('stopScream');
                    onWin();
                    return 0;
                }
                
                // Attacker Script
                if (newTime === SURVIVAL_DURATION - 10) {
                    setDefenses(d => ({ ...d, proxy: false }));
                    setLog(l => [...l, 'ATTACK: Remote proxy disabled.']);
                    onSoundEvent('error');
                }
                if (newTime === SURVIVAL_DURATION - 30) {
                    setDefenses(d => ({ ...d, firewall: false }));
                    setLog(l => [...l, 'ATTACK: System firewall compromised.']);
                    onSoundEvent('error');
                }
                 if (newTime === SURVIVAL_DURATION - 60) {
                    setDefenses(d => ({ ...d, ports: [] }));
                    setLog(l => [...l, 'ATTACK: Network ports forced closed.']);
                    onSoundEvent('error');
                }
                 if (newTime === SURVIVAL_DURATION - 90) {
                    setLog(l => [...l, 'ATTACK: Final intrusion sequence initiated... porthack.bin running...']);
                    onSoundEvent('scream');
                }
                if (newTime < SURVIVAL_DURATION - 90 && (!defenses.firewall || defenses.ports.length === 0)) {
                    clearInterval(timer);
                    setLog(l => [...l, 'CRITICAL: System breach. Kernel access granted to attacker.']);
                    setTimeout(handleLose, 2000);
                    return newTime;
                }

                return newTime;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            onSoundEvent('stopScream');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defenses.firewall, defenses.ports]);
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-black font-code">
            {/* Desktop is rendered in the background to allow terminal usage */}
            <div className="absolute inset-0 opacity-30">
                <Desktop 
                    onSoundEvent={onSoundEvent} 
                    onMusicEvent={() => {}} 
                    username={username} 
                    onReboot={onLose} 
                    setMachineState={() => {}} 
                    playerDefenses={defenses}
                    setPlayerDefenses={setDefenses}
                    machineState='survival'
                />
            </div>
            
            <div className="w-full max-w-4xl border-2 border-destructive rounded-lg p-6 shadow-2xl shadow-destructive/20 flex flex-col gap-4 text-destructive-foreground bg-black/80 z-10">
                <div className='text-center'>
                    <h1 className="text-4xl font-bold tracking-widest flex items-center justify-center gap-4 animate-pulse"><AlertTriangle />SYSTEM UNDER ATTACK</h1>
                    <p className="text-7xl font-bold mt-4">{formatTime(timeLeft)}</p>
                    <p className='mt-2'>Survive until the timer runs out. Use the terminal to defend.</p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-6">
                    {/* Proxy Status */}
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", defenses.proxy ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {defenses.proxy ? <Wifi size={48} className="text-green-400" /> : <WifiOff size={48} className="text-destructive" />}
                        <h2 className="text-xl font-bold">Proxy</h2>
                        <p className={cn("font-bold text-lg", defenses.proxy ? 'text-green-400' : 'text-destructive')}>{defenses.proxy ? "ONLINE" : "OFFLINE"}</p>
                        <p className="text-xs text-center text-muted-foreground mt-2 h-8">Attacker has locked this system.</p>
                    </div>

                    {/* Firewall Status */}
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", defenses.firewall ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {defenses.firewall ? <Shield size={48} className="text-green-400" /> : <ShieldOff size={48} className="text-destructive" />}
                        <h2 className="text-xl font-bold">Firewall</h2>
                        <p className={cn("font-bold text-lg", defenses.firewall ? 'text-green-400' : 'text-destructive')}>{defenses.firewall ? "ACTIVE" : "COMPROMISED"}</p>
                        <p className="text-xs text-center text-muted-foreground mt-2 h-8">Use: `firewall --reboot`</p>
                    </div>

                    {/* Ports Status */}
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", defenses.ports.length > 0 ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {defenses.ports.length > 0 ? <Server size={48} className="text-green-400" /> : <ServerOff size={48} className="text-destructive" />}
                        <h2 className="text-xl font-bold">Network Ports</h2>
                        <p className={cn("font-bold text-lg", defenses.ports.length > 0 ? 'text-green-400' : 'text-destructive')}>{defenses.ports.length > 0 ? `OPEN (${defenses.ports.length}/3)` : "CLOSED"}</p>
                        <p className="text-xs text-center text-muted-foreground mt-2 h-8">Use: `ports --open [80, 443, 22]`</p>
                    </div>
                </div>

                <div className='mt-6 h-32 bg-black/50 p-2 rounded-md overflow-y-auto'>
                    {log.map((l, i) => <p key={i} className='text-sm text-red-400 animate-in fade-in'>{`> ${l}`}</p>)}
                </div>
            </div>
        </div>
    );
}
