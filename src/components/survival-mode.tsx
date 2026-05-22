
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, ShieldOff, Wifi, WifiOff, Server, ServerOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoundEvent, AlertEvent } from './audio-manager';
import { loadGameState, saveGameState } from '@/lib/save-manager';
import { type FileSystemNode } from '@/lib/network/types';

interface SurvivalModeProps {
    onWin: () => void;
    onLose: () => void;
    onSoundEvent: (event: SoundEvent) => void;
    onAlertEvent: (event: AlertEvent) => void;
}

const SURVIVAL_DURATION = 120;
const FIREWALL_COOLDOWN = 20;
const FIREWALL_REPAIR_TIME = 5;
const VALID_PORTS = [80, 443, 22];

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

interface Defenses {
    proxy: boolean;
    firewall: boolean;
    ports: number[];
}

interface LogLine {
    text: string;
    kind: 'system' | 'attack' | 'player' | 'success' | 'error';
}

export default function SurvivalMode({ onWin, onLose, onSoundEvent, onAlertEvent }: SurvivalModeProps) {
    const [timeLeft, setTimeLeft] = useState(SURVIVAL_DURATION);
    const [defenses, setDefenses] = useState<Defenses>({
        proxy: true,
        firewall: true,
        ports: [80, 443, 22],
    });
    const [log, setLog] = useState<LogLine[]>([
        { text: 'INTRUSION DÉTECTÉE. Verrouillage du système...', kind: 'system' },
        { text: 'Tapez `help` pour la liste des commandes de défense.', kind: 'system' },
    ]);
    const [input, setInput] = useState('');
    const [firewallCooldown, setFirewallCooldown] = useState(0);
    const [firewallRepairing, setFirewallRepairing] = useState(0);
    const [username] = useState('Operator');
    const [breachedAt, setBreachedAt] = useState<number | null>(null);

    const logEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const append = useCallback((text: string, kind: LogLine['kind'] = 'system') => {
        setLog(prev => [...prev, { text, kind }]);
    }, []);

    const handleLose = useCallback(() => {
        const gameState = loadGameState(username);
        const updatedNetwork = gameState.network.map(pc => {
            if (pc.id === 'player-pc') {
                const newFileSystem = updateNodeByPath(pc.fileSystem, ['sys', 'XserverOS.sys'], () => null);
                return { ...pc, fileSystem: newFileSystem };
            }
            return pc;
        });
        saveGameState(username, { ...gameState, network: updatedNetwork });
        onLose();
    }, [onLose, username]);

    // Main timer + scripted attacks
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Cooldowns / repairs ticking
    useEffect(() => {
        const cd = setInterval(() => {
            setFirewallCooldown(c => (c > 0 ? c - 1 : 0));
            setFirewallRepairing(r => {
                if (r <= 0) return 0;
                const next = r - 1;
                if (next === 0) {
                    setDefenses(d => ({ ...d, firewall: true }));
                    setLog(prev => [...prev, { text: 'Firewall réactivé. Restez vigilant.', kind: 'success' }]);
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(cd);
    }, []);

    // Win/lose check + scripted attacker behaviour driven by remaining time
    useEffect(() => {
        if (timeLeft === SURVIVAL_DURATION - 1) {
            append('ATTAQUE: Le proxy distant ne répond plus.', 'attack');
            setDefenses(d => ({ ...d, proxy: false }));
            onSoundEvent('error');
        }
        if (timeLeft === SURVIVAL_DURATION - 15 && defenses.firewall) {
            append('ATTAQUE: Le firewall vient d\'être compromis.', 'attack');
            setDefenses(d => ({ ...d, firewall: false }));
            onSoundEvent('error');
        }
        if (timeLeft === SURVIVAL_DURATION - 35 && defenses.ports.length > 0) {
            append('ATTAQUE: Ports réseau forcés à la fermeture.', 'attack');
            setDefenses(d => ({ ...d, ports: [] }));
            onSoundEvent('error');
        }
        // Adversarial loop: keep breaking defenses after player repairs
        if (timeLeft > 0 && timeLeft < SURVIVAL_DURATION - 40 && timeLeft % 25 === 0 && defenses.firewall) {
            append('ATTAQUE: Nouvelle tentative — firewall à nouveau compromis.', 'attack');
            setDefenses(d => ({ ...d, firewall: false }));
            onSoundEvent('error');
        }
        if (timeLeft > 0 && timeLeft < SURVIVAL_DURATION - 50 && timeLeft % 35 === 0 && defenses.ports.length > 0) {
            append('ATTAQUE: Les ports viennent d\'être à nouveau fermés.', 'attack');
            setDefenses(d => ({ ...d, ports: [] }));
            onSoundEvent('error');
        }
        if (timeLeft === SURVIVAL_DURATION - 90) {
            append('ATTAQUE: Séquence d\'intrusion finale... porthack.bin en cours...', 'attack');
            onAlertEvent('scream');
        }

        if (timeLeft === 0 && breachedAt === null) {
            append('VICTOIRE: L\'attaquant abandonne. Connexion coupée.', 'success');
            onAlertEvent('stopAlert');
            const t = setTimeout(onWin, 1500);
            return () => clearTimeout(t);
        }

        // Breach: defences both down for more than 8 seconds → lose
        const allDown = !defenses.firewall && defenses.ports.length === 0;
        if (allDown && breachedAt === null && timeLeft < SURVIVAL_DURATION - 30) {
            setBreachedAt(timeLeft);
            append('CRITIQUE: Brèche détectée. Réparez firewall ET ports dans 8 secondes.', 'error');
        }
        if (!allDown && breachedAt !== null) {
            setBreachedAt(null);
            append('Brèche colmatée. Pression relâchée.', 'success');
        }
        if (breachedAt !== null && breachedAt - timeLeft >= 8) {
            append('CRITIQUE: Brèche du noyau. Accès attaquant validé.', 'error');
            onAlertEvent('stopAlert');
            const t = setTimeout(handleLose, 1500);
            return () => clearTimeout(t);
        }
    }, [timeLeft, defenses, breachedAt, append, onAlertEvent, onSoundEvent, onWin, handleLose]);

    // Auto-scroll log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [log]);

    // Keep input focused
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const runCommand = useCallback((raw: string) => {
        const cmd = raw.trim();
        if (!cmd) return;
        append(`> ${cmd}`, 'player');

        const [name, ...args] = cmd.split(/\s+/);
        const lower = name.toLowerCase();

        if (lower === 'help') {
            append('Commandes disponibles :', 'system');
            append('  firewall --reboot         : redémarre le firewall (cooldown 20s, durée 5s)', 'system');
            append('  ports --open 80,443,22    : rouvre les ports listés (subset autorisé)', 'system');
            append('  status                    : état des défenses', 'system');
            append('  clear                     : efface l\'historique', 'system');
            return;
        }

        if (lower === 'clear') {
            setLog([]);
            return;
        }

        if (lower === 'status') {
            append(`Proxy    : ${defenses.proxy ? 'EN LIGNE' : 'HORS LIGNE (irrécupérable)'}`, 'system');
            append(`Firewall : ${firewallRepairing > 0 ? `RÉPARATION (${firewallRepairing}s)` : defenses.firewall ? 'ACTIF' : 'COMPROMIS'}`, 'system');
            append(`Ports    : ${defenses.ports.length > 0 ? `OUVERTS [${defenses.ports.join(', ')}]` : 'FERMÉS'}`, 'system');
            append(`Temps restant : ${timeLeft}s`, 'system');
            return;
        }

        if (lower === 'firewall') {
            const wantsReboot = args.includes('--reboot');
            if (!wantsReboot) {
                append('Usage: firewall --reboot', 'error');
                return;
            }
            if (firewallRepairing > 0) {
                append(`Firewall déjà en réparation (${firewallRepairing}s restantes).`, 'error');
                return;
            }
            if (defenses.firewall) {
                append('Firewall déjà actif.', 'error');
                return;
            }
            if (firewallCooldown > 0) {
                append(`Outil en cooldown (${firewallCooldown}s).`, 'error');
                return;
            }
            append(`Redémarrage du firewall... ${FIREWALL_REPAIR_TIME}s.`, 'success');
            setFirewallRepairing(FIREWALL_REPAIR_TIME);
            setFirewallCooldown(FIREWALL_COOLDOWN);
            return;
        }

        if (lower === 'ports') {
            const openIdx = args.indexOf('--open');
            if (openIdx === -1) {
                append('Usage: ports --open 80,443,22', 'error');
                return;
            }
            const rest = args.slice(openIdx + 1).join(' ').replace(/[\[\]\s]/g, '');
            if (!rest) {
                append('Aucun port spécifié.', 'error');
                return;
            }
            const requested = rest.split(',').map(p => parseInt(p, 10)).filter(p => !isNaN(p));
            const valid = requested.filter(p => VALID_PORTS.includes(p));
            if (valid.length === 0) {
                append(`Ports invalides. Ports autorisés : ${VALID_PORTS.join(', ')}.`, 'error');
                return;
            }
            const newPorts = Array.from(new Set([...defenses.ports, ...valid])).sort((a, b) => a - b);
            setDefenses(d => ({ ...d, ports: newPorts }));
            append(`Ports rouverts : [${valid.join(', ')}].`, 'success');
            return;
        }

        append(`Commande non autorisée en mode confinement : ${name}`, 'error');
    }, [defenses, firewallCooldown, firewallRepairing, timeLeft, append]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const v = input;
        setInput('');
        runCommand(v);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const logColor: Record<LogLine['kind'], string> = {
        system: 'text-red-300/80',
        attack: 'text-red-500 font-bold',
        player: 'text-accent',
        success: 'text-green-400',
        error: 'text-orange-400',
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-black font-code relative overflow-hidden">
            {/* Static glitch background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-destructive/10 animate-pulse-slow" />
                <div className="absolute inset-0 bg-vignette" />
            </div>

            <div className="w-full max-w-4xl border-2 border-destructive rounded-lg p-6 shadow-2xl shadow-destructive/20 flex flex-col gap-4 text-destructive-foreground bg-black/80 z-10">
                <div className='text-center'>
                    <h1 className="text-4xl font-bold tracking-widest flex items-center justify-center gap-4 animate-pulse"><AlertTriangle />SYSTEM UNDER ATTACK</h1>
                    <p className="text-7xl font-bold mt-4">{formatTime(timeLeft)}</p>
                    <p className='mt-2 text-sm text-muted-foreground'>Tenez {SURVIVAL_DURATION}s. Utilisez le terminal pour défendre.</p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-6">
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", defenses.proxy ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {defenses.proxy ? <Wifi size={40} className="text-green-400" /> : <WifiOff size={40} className="text-destructive" />}
                        <h2 className="text-lg font-bold">Proxy</h2>
                        <p className={cn("font-bold", defenses.proxy ? 'text-green-400' : 'text-destructive')}>{defenses.proxy ? "ONLINE" : "OFFLINE"}</p>
                        <p className="text-xs text-center text-muted-foreground h-8">Verrouillé par l'attaquant.</p>
                    </div>

                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", defenses.firewall ? "border-green-400 bg-green-900/50" : firewallRepairing > 0 ? "border-yellow-400 bg-yellow-900/30" : "border-destructive bg-destructive/20")}>
                        {defenses.firewall ? <Shield size={40} className="text-green-400" /> : <ShieldOff size={40} className="text-destructive" />}
                        <h2 className="text-lg font-bold">Firewall</h2>
                        <p className={cn("font-bold", defenses.firewall ? 'text-green-400' : firewallRepairing > 0 ? 'text-yellow-400' : 'text-destructive')}>
                            {firewallRepairing > 0 ? `RÉPARATION (${firewallRepairing}s)` : defenses.firewall ? "ACTIVE" : "COMPROMIS"}
                        </p>
                        <p className="text-xs text-center text-muted-foreground h-8">{firewallCooldown > 0 ? `Cooldown: ${firewallCooldown}s` : '`firewall --reboot`'}</p>
                    </div>

                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", defenses.ports.length > 0 ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {defenses.ports.length > 0 ? <Server size={40} className="text-green-400" /> : <ServerOff size={40} className="text-destructive" />}
                        <h2 className="text-lg font-bold">Network Ports</h2>
                        <p className={cn("font-bold", defenses.ports.length > 0 ? 'text-green-400' : 'text-destructive')}>{defenses.ports.length > 0 ? `OUVERTS (${defenses.ports.length}/3)` : "FERMÉS"}</p>
                        <p className="text-xs text-center text-muted-foreground h-8">`ports --open 80,443,22`</p>
                    </div>
                </div>

                <div className="mt-2 h-48 bg-black/70 p-2 rounded-md border border-destructive/40 overflow-y-auto font-code text-sm">
                    {log.map((l, i) => (
                        <p key={i} className={cn('whitespace-pre-wrap animate-in fade-in', logColor[l.kind])}>{l.text}</p>
                    ))}
                    <div ref={logEndRef} />
                </div>

                <form onSubmit={onSubmit} className="flex items-center gap-2 border border-destructive/40 bg-black/60 px-3 py-2 rounded">
                    <span className="text-destructive">defense@confinement:~$</span>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-destructive-foreground font-code"
                        autoComplete="off"
                        spellCheck={false}
                    />
                </form>
            </div>
        </div>
    );
}
