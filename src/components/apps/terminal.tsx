
'use client';

import { useState, useRef, useEffect, KeyboardEvent, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSystemNode, PC } from '@/lib/network/types';
import { network as initialNetworkData } from '@/lib/network';
import { type Email } from './email-client';
import { CallScript } from '@/lib/call-system/types';
import { supervisorChapter2Email } from '@/lib/call-system/scripts/supervisor-chapter2';
import { blackwireChapter3Mission } from '@/lib/call-system/scripts/blackwire-chapter3-mission';
import { chapter9IntroEmail } from '@/lib/call-system/scripts/chapter6-intro';
import { finalCallScript } from '@/lib/call-system/scripts/final-call';
import { directorCallback } from '@/lib/call-system/scripts/director-callback';


interface HistoryItem {
  type: 'command' | 'output' | 'confirmation';
  content: string;
  onConfirm?: (confirmed: boolean) => void;
}


interface TerminalProps {
    username: string;
    instanceId: number;
    onSoundEvent?: (event: 'click' | 'error' | 'glitch') => void;
    onOpenFileEditor: (path: string[], content: string) => void;
    network: PC[];
    setNetwork: React.Dispatch<React.SetStateAction<PC[]>>;
    hackedPcs: Set<string>;
    onHack: (pcId: string, ip: string) => void;
    onDiscovered: (pcId: string) => void;
    onReboot: () => void;
    addLog: (message: string) => void;
    handleIncreaseDanger: (amount: number) => void;
    onStartTrace: (targetName: string, time: number, sourceInstanceId: number) => void;
    onStopTrace: () => void;
    onPauseTrace: (isPaused: boolean) => void;
    saveGameState: () => void;
    resetGame: () => void;
    dangerLevel: number;
    machineState: string; // To know if we are in survival mode
    receiveEmail: (email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>) => void;
    onNeoExecute: (terminal: { showProgress: (duration: number, text: string) => Promise<void>, writeOutput: (output: string) => void }) => Promise<void>;
    triggerCall: (script: CallScript) => void;
    onNeoWakeup: () => void;
    onEndGame: (endType?: 'credits' | 'wait_for_death' | 'self_destruct' | 'flee' | 'true_ending', lines?: string[]) => void;
    onUnhide: (ip: string, path: string[]) => void;
}

const PLAYER_PUBLIC_IP = '184.72.238.110';
const DIRECTOR_IP = '203.0.113.1'; // IP from corporate-proxy

const findNodeByPath = (path: string[], nodes: FileSystemNode[]): FileSystemNode | null => {
    if (path.length === 0) return { name: '/', type: 'folder', children: nodes, id: 'root' };

    let currentLevel: FileSystemNode[] | undefined = nodes;
    let foundNode: FileSystemNode | null = null;

    for (let i = 0; i < path.length; i++) {
        const part = path[i];
        if (!currentLevel) return null;

        const node = currentLevel.find(n => n.name === part);
        if (!node || (node.isHidden && i < path.length - 1)) return null; // Can't traverse hidden folders

        if (i === path.length - 1) {
            foundNode = node;
        } else if (node.type === 'folder') {
            currentLevel = node.children;
        } else {
            return null; // Path part is a file before the end of the path
        }
    }
    return foundNode;
};


const updateNodeByPath = (
    nodes: FileSystemNode[],
    path: string[],
    updater: (node: FileSystemNode) => FileSystemNode | null
  ): FileSystemNode[] => {
    if (path.length === 0) return nodes;
  
    const nodeName = path[0];
    
    // If we're at the target node (and it's in the root)
    if (path.length === 1) {
      const nodeIndex = nodes.findIndex(n => n.name === nodeName);
      if (nodeIndex === -1) return nodes; // Node not found
  
      const updatedNode = updater(nodes[nodeIndex]);
  
      const newNodes = [...nodes];
      if (updatedNode === null) {
        newNodes.splice(nodeIndex, 1); // Remove node
      } else {
        newNodes[nodeIndex] = updatedNode; // Update node
      }
      return newNodes;
    }
  
    // Recurse into the next folder in the path
    const folderIndex = nodes.findIndex(node => node.name === nodeName && node.type === 'folder');
    if (folderIndex === -1) return nodes; // Path is invalid
  
    const folderToUpdate = nodes[folderIndex];
    if (!folderToUpdate.children) return nodes; // Folder has no children to update
  
    const updatedChildren = updateNodeByPath(folderToUpdate.children, path.slice(1), updater);
    
    // If children array is different, it means an update happened
    if (updatedChildren !== folderToUpdate.children) {
        const newNodes = [...nodes];
        newNodes[folderIndex] = {
            ...folderToUpdate,
            children: updatedChildren,
        };
        return newNodes;
    }
    
    return nodes; // No changes
};


const addNodeByPath = (nodes: FileSystemNode[], path: string[], newNode: FileSystemNode): FileSystemNode[] => {
    if (path.length === 0) {
        if (nodes.find(n => n.name === newNode.name)) {
            // Overwrite existing file
            return nodes.map(n => n.name === newNode.name ? newNode : n);
        }
        return [...nodes, newNode];
    }
    const folderName = path[0];
    return nodes.map(node => {
        if (node.name === folderName && node.type === 'folder' && node.children) {
            return {
                ...node,
                children: addNodeByPath(node.children, path.slice(1), newNode)
            };
        }
        return node;
    });
};


const personalizeFileSystem = (nodes: FileSystemNode[], user: string): FileSystemNode[] => {
    return JSON.parse(JSON.stringify(nodes).replace(/<user>/g, user));
};

export default function Terminal({ 
    username, 
    instanceId,
    onSoundEvent, 
    onOpenFileEditor, 
    network, 
    setNetwork, 
    hackedPcs, 
    onHack,
    onDiscovered,
    onReboot, 
    addLog, 
    handleIncreaseDanger,
    onStartTrace,
    onStopTrace,
    onPauseTrace,
    saveGameState,
    resetGame,
    dangerLevel,
    machineState,
    receiveEmail,
    onNeoExecute,
    triggerCall,
    onNeoWakeup,
    onEndGame,
    onUnhide,
}: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.1.0-beta]\n(c) Cauchemar Virtuel Corporation. All rights reserved." },
    { type: 'output', content: "Tapez 'help' pour une liste de commandes." }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [isIcebreakerActive, setIsIcebreakerActive] = useState(false);
  const [icebreakerCooldown, setIcebreakerCooldown] = useState(0);
  const [icebreakerTimeLeft, setIcebreakerTimeLeft] = useState(0);

  
  // Network and FS state
  const [connectedIp, setConnectedIp] = useState<string>('127.0.0.1');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentPc = useCallback(() => {
      return network.find(pc => pc.ip === connectedIp);
  }, [network, connectedIp]);

  const fileSystem = useMemo(() => {
      const pc = getCurrentPc();
      if (pc) {
          return personalizeFileSystem(pc.fileSystem, pc.auth.user);
      }
      return [];
  }, [getCurrentPc]);
  
  const allExecutables = useMemo(() => {
    const playerPcFs = network.find(p => p.id === 'player-pc')?.fileSystem;
    if (!playerPcFs) return [];
    const binFolder = playerPcFs.find(node => node.name === 'bin' && node.type === 'folder');
    return binFolder?.children?.filter(f => f.type === 'file' && (f.name.endsWith('.bin') || f.name.endsWith('.exe'))) || [];
  }, [network]);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [history]);

  useEffect(() => {
    if (!isProcessing) {
        inputRef.current?.focus();
    }
  }, [isProcessing]);
  
  useEffect(() => {
    let icebreakerTimer: NodeJS.Timeout;
    if (isIcebreakerActive && icebreakerTimeLeft > 0) {
      icebreakerTimer = setTimeout(() => setIcebreakerTimeLeft(t => t - 1), 1000);
    } else if (isIcebreakerActive && icebreakerTimeLeft <= 0) {
      setIsIcebreakerActive(false);
      onPauseTrace(false);
      setIcebreakerCooldown(Date.now() + 10000); // 10 second cooldown
      setHistory(prev => [...prev, { type: 'output', content: '--- ICEBREAKER DÉSENGAGÉ. Reprise de la trace. ---' }]);
    }
    return () => clearTimeout(icebreakerTimer);
  }, [isIcebreakerActive, icebreakerTimeLeft, onPauseTrace]);


  const getPrompt = () => {
    if (isAwaitingConfirmation || isIcebreakerActive) {
        return '';
    }

    const currentPc = getCurrentPc();
    const hostName = currentPc?.name || 'neo-system';
    
    let user;
    if (isAuthenticated) {
        user = currentPc?.auth.user || username;
    } else {
        user = '(unauthenticated)';
    }

    const path = '/' + currentDirectory.join('/');
    
    return `${user}@${hostName}:${path}$ `;
  };
  
  const resolvePath = (pathArg: string): string[] => {
    if (!pathArg) return [...currentDirectory];
    
    let newPath: string[];
    
    const baseDir = (pathArg && pathArg.startsWith('/')) ? [] : [...currentDirectory];
    
    const parts = (pathArg || '').split('/').filter(p => p && p !== '.');
    
    newPath = baseDir;

    parts.forEach(part => {
        if (part === '..') {
            if (newPath.length > 0) newPath.pop();
        } else {
            newPath.push(part);
        }
    });

    return newPath;
  }

  const findParentDirectory = (path: string[], fs: FileSystemNode[]): FileSystemNode[] | null => {
      if (path.length <= 1) return fs;
      
      let currentLevel: FileSystemNode[] | undefined = fs;
      for (let i = 0; i < path.length - 1; i++) {
          if (!currentLevel) return null;
          const folder = currentLevel.find(n => n.name === path[i] && n.type === 'folder');
          if (folder) {
              currentLevel = folder.children;
          } else {
              return null;
          }
      }
      return currentLevel || null;
  }

  const addRemoteLog = (message: string, isSilent = false) => {
    if (connectedIp === '127.0.0.1' || isSilent) return;

    const timestamp = new Date().toUTCString();
    const logEntry = `[${timestamp}] - ${message}`;

    setNetwork(currentNetwork =>
        currentNetwork.map(pc => {
            if (pc.ip === connectedIp) {
                const newFileSystem = updateNodeByPath(pc.fileSystem, ['logs', 'access.log'], (node) => {
                    if (node.type === 'file') {
                        return { ...node, content: (node.content || '') + logEntry + '\n' };
                    }
                    return node;
                });
                return { ...pc, fileSystem: newFileSystem };
            }
            return pc;
        })
    );
  };

  const disconnect = (isCrash = false) => {
      const currentPc = getCurrentPc();
      if (!currentPc || connectedIp === '127.0.0.1') {
          setHistory(prev => [...prev, { type: 'output', content: 'Impossible de se déconnecter de la machine locale.' }]);
          return;
      }

      onStopTrace();

      const logFile = findNodeByPath(['logs', 'access.log'], currentPc.fileSystem);
      const traces = (logFile?.content?.match(new RegExp(PLAYER_PUBLIC_IP, 'g')) || []).length;
      
      if (traces > 0 && currentPc.traceability) {
        let dangerMultiplier = 0;
        if (traces >= 20) {
            dangerMultiplier = 1;
        } else if (traces >= 5) {
            dangerMultiplier = 0.8;
        } else if (traces > 1) {
            dangerMultiplier = 0.25
        } else if (traces === 1) {
            dangerMultiplier = 0.03
        }

        let dangerToAdd = Math.ceil(currentPc.traceability * dangerMultiplier);

        if (currentPc.isDangerous) {
            dangerToAdd *= 2; // Double danger for dangerous servers
        }

        handleIncreaseDanger(dangerToAdd);
        addLog(`DANGER: ${traces} trace(s) laissée(s) sur ${currentPc.ip}${currentPc.isDangerous ? ' (serveur DANGEREUX)' : ''}. Niveau de danger augmenté de ${dangerToAdd}%.`);
      }

      const previousHostName = currentPc.name;
      const previousIp = currentPc.ip;
      
      setConnectedIp('127.0.0.1');
      setIsAuthenticated(true);
      setCurrentDirectory([]);

      if (isCrash) {
           setHistory(prev => [...prev, { type: 'output', content: `Connexion à ${previousHostName} perdue. Hôte distant planté.` }]);
           addLog(`EVENT: Connexion à ${previousIp} perdue à cause d'un crash distant.`);
      } else {
          setHistory(prev => [...prev, { type: 'output', content: `Déconnecté de ${previousHostName}.` }]);
          addLog(`EVENT: Déconnecté de ${previousIp}.`);
      }
  }


  const runProgressBar = async (duration: number, text?: string) => {
    const barLength = 20;
    const interval = duration / barLength;
    let currentProgress = 0;
    
    setHistory(prev => [...prev, {type: 'output', content: ''}]); // Add an empty line to update

    while (currentProgress <= barLength) {
        const bar = '[' + '#'.repeat(currentProgress) + ' '.repeat(barLength - currentProgress) + ']';
        const percentage = Math.round((currentProgress / barLength) * 100);
        
        setHistory(prev => {
            const newHistory = [...prev];
            const content = text ? `${text} ${bar} ${percentage}%` : `${bar} ${percentage}%`;
            newHistory[newHistory.length - 1] = { type: 'output', content: content};
            return newHistory;
        });

        await new Promise(resolve => setTimeout(resolve, interval));
        currentProgress++;
    }
  };

  const runAnalyzeMinigame = async (solution: string) => {
    const duration = 4000;
    const interval = 100;
    const steps = duration / interval;
    const revealedChars = new Array(solution.length).fill(null);
    let revealedCount = 0;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomChar = () => chars[Math.floor(Math.random() * chars.length)];

    setHistory(prev => [...prev, {type: 'output', content: 'Initiation du scan profond...'}]);
    await new Promise(resolve => setTimeout(resolve, 500));
    setHistory(prev => [...prev, {type: 'output', content: ''}]); // Placeholder for the animation

    for (let i = 0; i < steps; i++) {
        let output = '';
        for (let j = 0; j < solution.length; j++) {
            if (revealedChars[j] !== null) {
                output += ` ${solution[j]} `;
            } else {
                output += ` ${randomChar()} `;
            }
        }

        if (i > 0 && i % Math.floor(steps / solution.length) === 0 && revealedCount < solution.length) {
            let nextIndexToReveal;
            do {
                nextIndexToReveal = Math.floor(Math.random() * solution.length);
            } while (revealedChars[nextIndexToReveal] !== null);
            
            revealedChars[nextIndexToReveal] = solution[nextIndexToReveal];
            revealedCount++;
        }

        setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { type: 'output', content: `[${output}]` };
            return newHistory;
        });
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { type: 'output', content: `Fragment de solution : [ ${solution} ]` };
        return newHistory;
    });
  };

  const runForkbombVisuals = async (isDestruct: boolean) => {
    const lines = [
      'CRITICAL PAYLOAD DEPLOYED: FORKBOMB',
      '====================================',
      'Injecting into process table...',
      'Spawning child processes recursively...',
      '0x00A1: process(fork) -> child(0x00B2)',
      '0x00B2: process(fork) -> child(0x00C3)',
      '0x00C3: process(fork) -> child(0x00D4)',
      'MEMORY SATURATION IMMINENT...',
      ...Array.from({ length: 5 }, () => `MEM_ALLOC_ERR @ 0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`),
      'OVERRIDING SYSTEM KERNEL...',
      isDestruct ? 'DESTRUCTIVE FLAG DETECTED. PURGING MEMORY SECTORS.' : 'Non-destructive mode. Logs will be volatile.',
      '       ...          ',
      '      (o o)         ',
      '  ---ooO-(_)-Ooo---   ',
      'SYSTEM CRITICAL FAILURE',
      isDestruct ? 'TARGET NEUTRALIZED. CONNECTION WILL BE SEVERED.' : 'SYSTEM CRASH IMMINENT. DISCONNECTING.',
    ];
  
    for (const line of lines) {
      setHistory(prev => [...prev, { type: 'output', content: line }]);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
    }
  };


  const handleCommand = async () => {
    const fullCommand = input.trim();
    if (isAwaitingConfirmation) {
        const lastHistoryItem = history[history.length-1];
        if (lastHistoryItem.type === 'confirmation' && lastHistoryItem.onConfirm) {
            lastHistoryItem.onConfirm(fullCommand.toLowerCase() === 'y');
        }
        setIsAwaitingConfirmation(false);
        setInput('');
        return;
    }
    
    if (fullCommand === '') {
        setHistory([...history, { type: 'command', content: getPrompt() }]);
        return;
    };

    setIsProcessing(true);
    addLog(`COMMAND: Exécution de '${fullCommand}' sur ${connectedIp}`);
    setCommandHistory(prev => [fullCommand, ...prev]);
    setHistoryIndex(-1);

    let newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${fullCommand}` }];
    setHistory(newHistory);
    setInput('');

    const append = fullCommand.includes('>>');
    const redirect = fullCommand.includes('>');
    
    let commandPart = fullCommand;
    let redirectPathArg = '';
    
    if (redirect || append) {
        const split = fullCommand.split(append ? '>>' : '>');
        commandPart = split[0].trim();
        redirectPathArg = split[1].trim();
    }
    
    const [command, ...args] = commandPart.trim().split(' ');
    
    const handleOutput = (output: string) => {
        if ((redirect || append) && redirectPathArg) {
            setHistory(prev => [...prev, { type: 'output', content: `erreur : Redirection non implémentée pour cette commande.` }]);
        } else {
            setHistory(prev => [...prev, { type: 'output', content: output }]);
        }
    }
    
    const checkAuth = () => {
        if (!isAuthenticated) {
            setHistory(prev => [...prev, { type: 'output', content: 'erreur : Permission refusée. Vous n\'êtes pas authentifié.' }]);
            return false;
        }
        return true;
    }

    const checkAndTriggerTrace = (pc?: PC | null) => {
        const targetPc = pc || getCurrentPc();
        if (!targetPc) return false;

        const isDangerousCommand = allExecutables.some(file => file.name.toLowerCase().startsWith(command.toLowerCase()))
          || command.toLowerCase() === 'solve'
          || command.toLowerCase() === 'porthack';

        if (isDangerousCommand && targetPc.traceTime > 0) {
            onStartTrace(targetPc.name, targetPc.traceTime, instanceId);
            return true;
        }
        return false;
    }

    const handlePortHack = async (portNumber: number, portName: string) => {
        if (connectedIp === '127.0.0.1') {
            handleOutput(`${portName}: Doit être connecté à un système distant.`);
            return;
        }
    
        let currentTargetPC: PC | undefined;
        setNetwork(currentNetwork => {
            currentTargetPC = currentNetwork.find(p => p.ip === connectedIp);
            return currentNetwork;
        });
        await new Promise(r => setTimeout(r,0)); // wait for state to propagate
        
        if (!currentTargetPC) {
            handleOutput('Erreur critique : Système cible déconnecté.');
            return;
        }
    
        if (currentTargetPC.firewall.enabled) {
            handleOutput(`${portName} échoué : Pare-feu actif détecté.`);
            addRemoteLog(`${portName} échoué sur le port ${portNumber}. Raison : Pare-feu actif.`, true);
            return;
        }
        if (currentTargetPC.proxy.enabled) {
            handleOutput(`${portName} échoué : Proxy actif détecté.`);
            addRemoteLog(`${portName} échoué sur le port ${portNumber}. Raison : Proxy actif.`, true);
            return;
        }
        const port = currentTargetPC.ports.find(p => p.port === portNumber);
        if (!port) {
            handleOutput(`${portName} échoué : Port ${portNumber} non trouvé sur ce système.`);
            return;
        }
        if (port.isOpen) {
            handleOutput(`Port ${portNumber} est déjà ouvert.`);
            return;
        }
      
        checkAndTriggerTrace();

        handleOutput(`Exécution de l'exploit ${portName}...`);
        await runProgressBar(3000);
  
        setNetwork(currentNetwork => 
            currentNetwork.map(pc => {
                if (pc.id === currentTargetPC!.id) {
                    const newPorts = pc.ports.map(p => p.port === portNumber ? { ...p, isOpen: true } : p);
                    return { ...pc, ports: newPorts };
                }
                return pc;
            })
        );
  
        handleOutput(`Le port ${port.service} (${portNumber}) est maintenant ouvert.`);
        addRemoteLog(`Port ${portNumber} (${port.service}) ouvert depuis ${PLAYER_PUBLIC_IP}.`);
    };

    async function handleSolveCommand() {
        const targetPC = getCurrentPc();
        if (!targetPC || connectedIp === '127.0.0.1') {
            handleOutput('solve: doit être exécuté sur un système distant.');
            return;
        }
    
        if (!targetPC.firewall.solution) {
            handleOutput('Ce système n\'a pas de pare-feu configurable.');
            return;
        }
    
        checkAndTriggerTrace(targetPC);
        
        const solution = args[0];
        if (targetPC.firewall.solution === solution) {
            setNetwork(currentNetwork => currentNetwork.map(pc => 
                pc.id === targetPC.id ? { ...pc, firewall: { ...pc.firewall, enabled: false } } : pc
            ));
            handleOutput('Pare-feu désactivé.');
            addRemoteLog(`Pare-feu désactivé depuis ${PLAYER_PUBLIC_IP} avec la solution : ${solution}.`);
        } else {
             handleOutput('Solution incorrecte.');
             addRemoteLog(`Tentative de solution de pare-feu incorrecte '${solution}' depuis ${PLAYER_PUBLIC_IP}.`);
        }
    }

    if (command.toLowerCase() === 'neo') {
        const playerPC = network.find(pc => pc.id === 'player-pc');
        const neoBin = findNodeByPath(['bin', 'neo.bin'], playerPC?.fileSystem || []);

        if (!neoBin) {
            handleOutput('Erreur : paquet NÉO introuvable. Téléchargez-le d\'abord.');
        } else {
            await onNeoExecute({
                showProgress: runProgressBar,
                writeOutput: handleOutput
            });
        }
        setIsProcessing(false);
        return;
    }


    const isHackingTool = allExecutables.some(file => file.name.toLowerCase().startsWith(command.toLowerCase()));
    if (isHackingTool && command.toLowerCase() !== 'nano') {
        const executable = allExecutables.find(file => file.name.toLowerCase().startsWith(command.toLowerCase()));
        const cmdName = executable!.name.split('.')[0].toLowerCase();
        
        if (connectedIp === '127.0.0.1' && cmdName !== 'scan' && cmdName !== 'forkbomb' && cmdName !== 'icebreaker') {
            handleOutput(`Cet outil doit être exécuté sur un système distant.`);
            setIsProcessing(false);
            return;
        }
       
        let targetPC: PC | undefined = getCurrentPc();
        checkAndTriggerTrace(targetPC);
       
        switch(cmdName) {
            case 'scan':
                if(!checkAuth()) { setIsProcessing(false); return; }
                const scanTarget = getCurrentPc();
                if (scanTarget && scanTarget.links) {
                    const linkedPcs = scanTarget.links.map(linkId => network.find(p => p.id === linkId)).filter(Boolean) as PC[];
                    if (linkedPcs.length > 0) {
                        linkedPcs.forEach(pc => onDiscovered(pc.id));
                        const output = ['Scan du réseau... Appareils liés trouvés :', ...linkedPcs.map(pc => `  - ${pc.name} (${pc.ip})`)].join('\n');
                        handleOutput(output);
                    } else {
                        handleOutput('Aucun appareil lié trouvé.');
                    }
                } else {
                    handleOutput('Scan échoué : impossible de déterminer le segment réseau actuel.');
                }
                break;
            case 'probe':
                if (!targetPC) {
                    handleOutput('probe : Doit être connecté à un système distant.');
                } else {
                    handleOutput(`Sondage de ${targetPC.ip}...`);
                    await runProgressBar(2000);
                    const secInfo = [
                        `Résultats de la sonde de sécurité pour ${targetPC.ip}:`,
                        `  Pare-feu: ${targetPC.firewall.enabled ? `ACTIF (Complexité: ${targetPC.firewall.complexity})` : 'INACTIF'}`,
                        `  Proxy: ${targetPC.proxy.enabled ? `ACTIF (Niveau: ${targetPC.proxy.level})` : 'INACTIF'}`,
                        `  Temps de traçage: ${targetPC.traceTime > 0 ? `${targetPC.traceTime}s` : 'N/A'}`,
                        `  Ports requis pour PortHack: ${targetPC.requiredPorts}`
                    ];

                    if (targetPC.ports.length > 0) {
                        secInfo.push('\n  Ports disponibles:');
                        targetPC.ports.forEach(p => {
                            secInfo.push(`    - ${p.port} (${p.service}): ${p.isOpen ? 'OUVERT' : 'FERMÉ'}`);
                        });
                    } else {
                        secInfo.push('  Aucun port scannable détecté.');
                    }
                    addRemoteLog(`INFO: Système ${targetPC.ip} sondé depuis ${PLAYER_PUBLIC_IP}.`);
                    handleOutput(secInfo.join('\n'));
                }
                break;
            case 'porthack':
                 if (!targetPC) {
                    handleOutput('porthack: erreur critique, pas de système cible.');
                } else if (hackedPcs.has(targetPC.id)) {
                    handleOutput(`porthack: Système ${targetPC.ip} déjà piraté. Mot de passe : ${targetPC.auth.pass}`);
                } else if (targetPC.firewall.enabled) {
                    handleOutput(`ERREUR: Pare-feu actif détecté. Connexion terminée.`);
                    addRemoteLog(`PortHack échoué. Raison : Pare-feu actif.`);
                } else if (targetPC.proxy.enabled) {
                    handleOutput(`ERREUR: Proxy actif détecté. Connexion renvoyée.`);
                    addRemoteLog(`PortHack échoué. Raison : Proxy actif.`);
                } else {
                    handleOutput(`Lancement de la séquence PortHack...`);
                    await runProgressBar(5000);
                    const openPorts = targetPC.ports.filter(p => p.isOpen).length;
                    if (openPorts >= targetPC.requiredPorts) {
                        handleOutput(`PortHack réussi sur ${targetPC.ip}. Pare-feu percé.\n  Mot de passe craqué : ${targetPC.auth.pass}`);
                        addRemoteLog(`PortHack réussi. Accès root obtenu depuis ${PLAYER_PUBLIC_IP}.`);
                        onHack(targetPC.id, targetPC.ip);
                    } else {
                        handleOutput(`PortHack échoué: ${targetPC.requiredPorts} port(s) ouvert(s) requis. (${openPorts}/${targetPC.requiredPorts} ouverts)`);
                        addRemoteLog(`PortHack échoué. Raison : Ports ouverts insuffisants.`);
                    }
                }
                break;
            case 'analyze':
                if (!targetPC) {
                    handleOutput('analyze : Doit être connecté à un système distant.');
                } else if (!targetPC.firewall.enabled) {
                    handleOutput('Le pare-feu n\'est pas actif.');
                } else {
                    await runAnalyzeMinigame(targetPC.firewall.solution || 'INCONNU');
                    setNetwork(currentNetwork => currentNetwork.map(pc => 
                        pc.id === targetPC!.id ? { ...pc, firewall: { ...pc.firewall, enabled: false } } : pc
                    ));
                    handleOutput(`Analyse du pare-feu terminée. Pare-feu désactivé.`);
                    addRemoteLog(`L'analyse du pare-feu depuis ${PLAYER_PUBLIC_IP} a désactivé le pare-feu.`);
                }
                break;
            case 'overload':
                if (!targetPC) {
                    handleOutput('overload : Doit être connecté à un système distant.');
                } else if (!targetPC.proxy.enabled) {
                    handleOutput('Le proxy n\'est pas actif.');
                } else {
                    const requiredNodes = targetPC.proxy.level;
                    const availableNodes = hackedPcs.size;
                    
                    handleOutput(`Surcharge du proxy... (Requis: ${requiredNodes} nœuds, Disponibles: ${availableNodes})`);
                    await runProgressBar(targetPC.proxy.level * 2000);

                    if (availableNodes >= requiredNodes) {
                        setNetwork(currentNetwork => currentNetwork.map(pc => pc.id === targetPC!.id ? { ...pc, proxy: { ...pc.proxy, enabled: false } } : pc));
                        handleOutput(`Proxy désactivé sur ${targetPC.ip}.`);
                        addRemoteLog(`Proxy sur ${targetPC.ip} désactivé via surcharge depuis ${PLAYER_PUBLIC_IP}.`);
                    } else {
                        handleOutput(`Surcharge échouée. Nœuds insuffisants.`);
                        addRemoteLog(`Surcharge du proxy échouée. Requis ${requiredNodes} nœuds, disponibles ${availableNodes}.`);
                    }
                }
                break;
            case 'ftpbounce': await handlePortHack(21, 'FTPBounce'); break;
            case 'sshbounce': await handlePortHack(22, 'SSHBounce'); break;
            case 'smtpoverflow': await handlePortHack(25, 'SMTPOverflow'); break;
            case 'webserverworm': await handlePortHack(80, 'WebServerWorm'); break;
            case 'icebreaker':
                if (machineState !== 'desktop') {
                    handleOutput('icebreaker: Aucune trace active à contrer.');
                } else if (Date.now() < icebreakerCooldown) {
                    const cooldownLeft = Math.ceil((icebreakerCooldown - Date.now()) / 1000);
                    handleOutput(`icebreaker: Système en cours de rechargement. Disponible dans ${cooldownLeft}s.`);
                } else {
                    setIsIcebreakerActive(true);
                    onPauseTrace(true);
                    setIcebreakerTimeLeft(20);
                    handleOutput('--- ICEBREAKER ENGAGED. Trace en pause pour 20 secondes. ---');
                }
                break;
            case 'forkbomb':
                const isDestruct = args.includes('--destruct');
                onSoundEvent?.('glitch');
                await runForkbombVisuals(isDestruct);
                
                if (connectedIp === '127.0.0.1') {
                    addLog(`CRITIQUE: Forkbomb exécuté sur la machine locale. Crash système imminent.`);
                    setTimeout(() => {
                        onSoundEvent?.('bsod');
                        onReboot();
                    }, 1000);
                } else if (targetPC) {
                    const targetName = targetPC.name;
                    disconnect(true); // Disconnect immediately
                    
                    setNetwork(currentNetwork => currentNetwork.map(pc => {
                        if (pc.id === targetPC!.id) {
                            let updatedPc = { ...pc, isDangerous: true };
                            if (isDestruct) {
                                updatedPc.isDestroyed = true;
                            }
                            return updatedPc;
                        }
                        return pc;
                    }));

                    addLog(`EVENT: Forkbomb a effacé les logs sur ${targetName}.`);
                    if (isDestruct) {
                        addLog(`CRITICAL: ${targetName} a été définitivement détruit.`);
                    }
                }
                break;
        }
        setIsProcessing(false);
        return;
    }


    switch (command.toLowerCase()) {
        case 'help': {
            const commandList = [
                '  help           - Affiche ce message d\'aide',
                '  ls [path]      - Liste les fichiers et répertoires (auth requise)',
                '  cd <path>      - Change de répertoire (auth requise)',
                '  cat <file>     - Affiche le contenu d\'un fichier (auth requise)',
                '  echo <text>    - Affiche une ligne de texte. Supporte > et >> redirection.',
                '  nano <file>    - Crée ou édite un fichier texte (auth requise)',
                '  rm <file>      - Supprime un fichier ou vide son contenu (auth requise)',
                '  rm *           - Supprime tous les fichiers du répertoire actuel (auth requise)',
                '  cp <src> <dest> - Copie un fichier ou un dossier (auth requise)',
                '  scp <src> <dest> - Copie un fichier du local vers le distant (auth requise)',
                '  mv <src> <dest> - Déplace ou renomme un fichier (auth requise)',
                '  unhide <dir>   - Révèle un répertoire caché (systèmes spéciaux uniquement)',
                '  reboot         - Redémarre le système actuel',
                '  save           - Sauvegarde l\'état actuel du jeu (local uniquement)',
                '  reset-game --confirm - Supprime les données de sauvegarde et redémarre (local uniquement)',
                '  danger         - Affiche le niveau de danger de traçage actuel',
                '',
                'Commandes réseau:',
                '  connect <ip>   - Se connecte à un système distant',
                '  disconnect / dc- Se déconnecte du système distant actuel',
                '  login <user> <pass> - S\'authentifie sur un système connecté',
                '  solve <solution> - Tente de désactiver un pare-feu avec une solution.',
                '  call <ip> [--secure|--notsecure] - Lance un appel vers une IP',
                '',
                'Outils de piratage (généralement exécutés depuis votre machine sur une cible distante):',
            ];

            const availableTools = allExecutables.map(e => `  ${e.name.split('.')[0]}`.padEnd(17, ' ') + `- ${e.content}`).join('\n');

            const helpText = [
                'Commandes disponibles:',
                ...commandList,
                availableTools,
                '',
                '  clear          - Efface l\'écran du terminal',
            ].join('\n');
            handleOutput(helpText);
            break;
        }
        case 'ls': {
            if(!checkAuth()) break;
            const pathArg = args[0] || '';
            const targetPath = resolvePath(pathArg);
            const targetNode = findNodeByPath(targetPath, fileSystem);
            
            if (targetNode?.type === 'folder') {
                const content = targetNode.children?.filter(node => !node.isHidden).map(node => `${node.name}${node.type === 'folder' ? '/' : ''}`).join('  ');
                handleOutput(content || "(vide)");
            } else if (targetNode?.type === 'file') {
                 handleOutput(targetNode.name);
            } else {
                 handleOutput(`ls: impossible d'accéder à '${pathArg}': Aucun fichier ou dossier de ce type`);
            }
            break;
        }
        case 'cd': {
            if(!checkAuth()) break;
            const pathArg = args[0];
            if (!pathArg || pathArg === '~' || (pathArg === '~/')) {
                setCurrentDirectory([]);
                break;
            }
             if (pathArg === '/') {
                setCurrentDirectory([]);
                break;
            }
            
            const newPath = resolvePath(pathArg);
            const targetNode = findNodeByPath(newPath, fileSystem);
            
            if (targetNode && targetNode.type === 'folder') {
                if (targetNode.isHidden) {
                     handleOutput(`cd: pas de tel fichier ou dossier: ${pathArg}`);
                } else {
                    setCurrentDirectory(newPath);
                }
            } else {
                handleOutput(`cd: pas de tel fichier ou dossier: ${pathArg}`);
            }
            break;
        }
        case 'cat': {
            if(!checkAuth()) break;
            const filename = args.join(' ');
            if (!filename) {
                handleOutput(`cat: opérande fichier manquant`);
                break;
            }
            const path = resolvePath(filename);
            const file = findNodeByPath(path, fileSystem);
            
            if (file) {
                 if (file.isHidden) {
                    handleOutput(`cat: ${filename}: Aucun fichier ou dossier de ce type`);
                    break;
                }
                if (file.type === 'file') {
                    if (file.name.endsWith('.zip')) {
                        handleOutput(`[CONTENU DE L'ARCHIVE DECLASSIFIE]\n\n${file.content || ''}`);
                    } else {
                        handleOutput(file.content || '');
                    }
                } else {
                    handleOutput(`cat: ${filename}: Est un dossier`);
                }
            } else {
                handleOutput(`cat: ${filename}: Aucun fichier ou dossier de ce type`);
            }
            break;
        }
        case 'echo': {
            if(!checkAuth()) break;
            handleOutput(args.join(' '));
            break;
        }
        case 'nano':
            if (!checkAuth()) { setIsProcessing(false); return; }
            const pathArg = args[0];
            if (!pathArg) {
                handleOutput(`nano: opérande fichier manquant`);
            } else {
                const filePath = resolvePath(pathArg);
                const file = findNodeByPath(filePath, fileSystem);
                if (file && file.type === 'folder') {
                    handleOutput(`nano: impossible d'éditer le dossier '${pathArg}'`);
                } else {
                     onOpenFileEditor(filePath, file?.content || '');
                }
            }
            break;
        case 'rm': {
            if (!checkAuth()) break;

            const fileArg = args[0];
            if (!fileArg) {
                handleOutput('rm: opérande manquant');
                break;
            }

            if (fileArg === '*') {
                setHistory(prev => [...prev, {
                    type: 'confirmation',
                    content: 'Êtes-vous sûr de vouloir supprimer tous les fichiers de ce répertoire ? (y/n)',
                    onConfirm: async (confirmed) => {
                        setHistory(prevHist => [...prevHist, {type: 'command', content: confirmed ? 'y' : 'n'}]);
                        if (confirmed) {
                            let filesToRemove: FileSystemNode[] = [];
                            let filesCleared: FileSystemNode[] = [];

                            setNetwork(currentNetwork => {
                                const newNetwork = [...currentNetwork];
                                const pcIndex = newNetwork.findIndex(pc => pc.ip === connectedIp);
                                if (pcIndex === -1) return currentNetwork;

                                const pcToUpdate = newNetwork[pcIndex];
                                const parentDirNode = findNodeByPath(currentDirectory, pcToUpdate.fileSystem);
                                if (!parentDirNode || !parentDirNode.children) return currentNetwork;
                                
                                let newFs = pcToUpdate.fileSystem;
                                const childrenCopy = [...parentDirNode.children];

                                for (const file of childrenCopy) {
                                    if (file.type === 'file' && !file.isSystemFile) {
                                        const filePath = [...currentDirectory, file.name];
                                        if (file.name.endsWith('access.log')) {
                                            filesCleared.push(file);
                                            newFs = updateNodeByPath(newFs, filePath, (node) => ({ ...node, content: `` }));
                                        } else {
                                            filesToRemove.push(file);
                                            newFs = updateNodeByPath(newFs, filePath, () => null);
                                        }
                                    }
                                }

                                newNetwork[pcIndex] = { ...pcToUpdate, fileSystem: newFs };
                                return newNetwork;
                            });

                            // Await state update before logging
                            await new Promise(resolve => setTimeout(resolve, 0));

                            const newHistoryItems: HistoryItem[] = [];
                            if (filesToRemove.length > 0) {
                                newHistoryItems.push({ type: 'output', content: `${filesToRemove.length} fichier(s) supprimé(s).` });
                                addLog(`EVENT: ${filesToRemove.length} fichiers supprimés de ${connectedIp}:${'/' + currentDirectory.join('/')}`);
                                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: ${filesToRemove.length} fichier(s) supprimé(s) par l'utilisateur depuis ${PLAYER_PUBLIC_IP} dans /${currentDirectory.join('/')}`);
                            }
                            if (filesCleared.length > 0) {
                                newHistoryItems.push({ type: 'output', content: `Contenu de ${filesCleared.length} fichier(s) log effacé.` });
                                addLog(`EVENT: ${filesCleared.length} logs effacés sur ${connectedIp}`);
                                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: ${filesCleared.length} fichier(s) log effacé(s) par l'utilisateur depuis ${PLAYER_PUBLIC_IP}.`, true);
                            }
                            if (filesToRemove.length === 0 && filesCleared.length === 0) {
                                newHistoryItems.push({ type: 'output', content: "rm: aucun fichier amovible trouvé dans ce répertoire." });
                            }
                            setHistory(prev => [...prev, ...newHistoryItems]);

                        } else {
                            setHistory(prev => [...prev, { type: 'output', content: 'Opération annulée.' }]);
                        }
                        setIsProcessing(false);
                    }
                }]);
                setIsProcessing(false); // Pause processing until confirmation
                setIsAwaitingConfirmation(true);
                return; // Important: exit handler to wait for user input
            }

            const filePath = resolvePath(fileArg);
            const fileNode = findNodeByPath(filePath, fileSystem);

            if (!fileNode || fileNode.isHidden) {
                handleOutput(`rm: impossible de supprimer '${fileArg}': Aucun fichier ou dossier de ce type`);
                break;
            }
            if (fileNode.type === 'folder') {
                handleOutput(`rm: impossible de supprimer '${fileArg}': Est un dossier. Utilisez rmdir (non implémenté).`);
                break;
            }
            
            if (fileNode.name === 'XserverOS.sys') {
                handleOutput(`ATTENTION: Ceci est un fichier système critique. Le supprimer causera une instabilité du système.`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setNetwork(currentNetwork => {
                    return currentNetwork.map(pc => {
                        if (pc.ip === connectedIp) {
                            const newFs = updateNodeByPath(pc.fileSystem, filePath, () => null);
                            return { ...pc, fileSystem: newFs };
                        }
                        return pc;
                    });
                });
                
                if (connectedIp === '127.0.0.1') {
                   setTimeout(() => {
                       saveGameState();
                       addLog(`CRITIQUE: XserverOS.sys supprimé de la machine locale. Le prochain redémarrage échouera.`);
                       handleOutput('Suppression de XserverOS.sys terminée.');
                    }, 100);
                } else {
                    addRemoteLog(`CRITIQUE: Forkbomb exécuté. Crash du système.`);
                    disconnect(true);
                }
                break;
            }

            if (fileNode.isSystemFile) {
                handleOutput(`rm: impossible de supprimer '${fileArg}': Permission refusée`);
                if (connectedIp !== '127.0.0.1') {
                    addRemoteLog(`SÉCURITÉ: Tentative de suppression du fichier système ${fileNode.name} depuis ${PLAYER_PUBLIC_IP} refusée.`);
                }
                break;
            }
            
            const isAccessLog = fileNode.name.endsWith('access.log');
            const updater = isAccessLog ? (node: FileSystemNode) => ({ ...node, content: `` }) : () => null;

            setNetwork(currentNetwork => currentNetwork.map(pc => {
                if (pc.ip === connectedIp) {
                    const newFs = updateNodeByPath(pc.fileSystem, filePath, updater);
                    return { ...pc, fileSystem: newFs };
                }
                return pc;
            }));

            if(isAccessLog) {
                handleOutput(`Contenu de '${fileArg}' effacé`);
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: Fichier log '${fileArg}' effacé par l'utilisateur depuis ${PLAYER_PUBLIC_IP}.`, true);
                addLog(`EVENT: Fichier log '${fileArg}' sur ${connectedIp} effacé.`);
            } else {
                handleOutput(`'${fileArg}' supprimé`);
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: Fichier supprimé par l'utilisateur depuis ${PLAYER_PUBLIC_IP}: ${filePath.join('/')}`);
                addLog(`EVENT: Fichier '${fileArg}' sur ${connectedIp} supprimé.`);
            }

            break;
        }
        case 'scp': {
            if (!checkAuth()) break;
        
            const [sourceArg, destArg] = args;
            if (!sourceArg || !destArg) {
                handleOutput(`scp: opérande manquant`);
                break;
            }
        
            if (!sourceArg.startsWith('local:')) {
                handleOutput(`scp: la source doit être locale (ex: local:/path/to/file)`);
                break;
            }
        
            if (connectedIp === '127.0.0.1') {
                handleOutput(`scp: ne peut pas copier sur la machine locale elle-même`);
                break;
            }
        
            const localPathArg = sourceArg.substring(6);
            const playerPC = network.find(p => p.id === 'player-pc');
            if (!playerPC) {
                handleOutput(`scp: erreur critique: impossible de trouver la machine locale`);
                break;
            }
            const localFS = personalizeFileSystem(playerPC.fileSystem, username);
        
            // --- Handle wildcard (*) ---
            if (localPathArg.endsWith('*')) {
                const sourceDirArg = localPathArg.slice(0, -1);
                const sourcePath = resolvePath(sourceDirArg);
                const sourceDirNode = findNodeByPath(sourcePath, localFS);
        
                if (!sourceDirNode || sourceDirNode.type !== 'folder' || !sourceDirNode.children) {
                    handleOutput(`scp: impossible d'accéder à '${sourceArg}': Pas un répertoire valide`);
                    break;
                }
        
                const destPath = resolvePath(destArg);
                const destDirNode = findNodeByPath(destPath, fileSystem);
        
                if (!destDirNode || destDirNode.type !== 'folder') {
                    handleOutput(`scp: la destination '${destArg}' n'est pas un répertoire`);
                    break;
                }
        
                const filesToCopy = sourceDirNode.children.filter(f => f.type === 'file' && !f.isHidden);
                if (filesToCopy.length === 0) {
                    handleOutput(`scp: aucun fichier à copier dans '${sourceArg}'`);
                    break;
                }
        
                setNetwork(currentNetwork => currentNetwork.map(pc => {
                    if (pc.ip === connectedIp) {
                        let newFs = pc.fileSystem;
                        filesToCopy.forEach(file => {
                            const copiedNode = { ...JSON.parse(JSON.stringify(file)), id: `${file.id}-copy-${Date.now()}` };
                            newFs = addNodeByPath(newFs, destPath, copiedNode);
                        });
                        return { ...pc, fileSystem: newFs };
                    }
                    return pc;
                }));
        
                handleOutput(`${filesToCopy.length} fichiers copiés vers ${destArg}`);
                addRemoteLog(`EVENT: ${filesToCopy.length} fichiers reçus de ${PLAYER_PUBLIC_IP} dans ${destArg}`);
                break;
            }
        
            // --- Handle single file ---
            const sourcePath = resolvePath(localPathArg);
            const sourceNode = findNodeByPath(sourcePath, localFS);
        
            if (!sourceNode || sourceNode.isHidden) {
                handleOutput(`scp: impossible d'accéder à '${sourceArg}': Aucun fichier ou dossier de ce type`);
                break;
            }
            if (sourceNode.type === 'folder') {
                handleOutput(`scp: impossible de copier des répertoires pour l'instant.`);
                break;
            }
        
            let destPath = resolvePath(destArg);
            let destNode = findNodeByPath(destPath, fileSystem);
        
            let finalDestPath: string[];
            let newFileName: string;
        
            if (destNode && destNode.type === 'folder') {
                finalDestPath = destPath;
                newFileName = sourceNode.name;
            } else {
                finalDestPath = destPath.slice(0, -1);
                newFileName = destPath[destPath.length - 1] || sourceNode.name;
            }
        
            const copiedNode = { ...JSON.parse(JSON.stringify(sourceNode)), id: `${sourceNode.id}-copy-${Date.now()}`, name: newFileName };
        
            setNetwork(currentNetwork => currentNetwork.map(pc => {
                if (pc.ip === connectedIp) {
                    const newFs = addNodeByPath(pc.fileSystem, finalDestPath, copiedNode);
                    return { ...pc, fileSystem: newFs };
                }
                return pc;
            }));
            
            handleOutput(`'${sourceArg}' copié vers '${destArg}'`);
            addRemoteLog(`EVENT: Fichier ${newFileName} reçu de ${PLAYER_PUBLIC_IP} dans ${finalDestPath.join('/') || '/'}`);
            break;
        }
        case 'cp': {
            if (!checkAuth()) break;
        
            const [sourceArg, destArg] = args;
            if (!sourceArg || !destArg) {
                handleOutput(`${command}: opérande manquant`);
                break;
            }
        
            const isWildcard = sourceArg.endsWith('*');
            const sourcePathArg = isWildcard ? sourceArg.slice(0, -1) : sourceArg;
            
            const sourcePath = resolvePath(sourcePathArg);
            const sourceDirNode = findNodeByPath(sourcePath, fileSystem);
        
            const isDestLocal = destArg.startsWith('local:');
            const destPathArg = isDestLocal ? destArg.substring(6) : destArg;
        
            let destPC = getCurrentPc();
            if(isDestLocal) {
                destPC = network.find(p => p.id === 'player-pc');
            }
            if(!destPC) {
                handleOutput(`cp: erreur critique: PC de destination introuvable`);
                break;
            }
            const destFS = personalizeFileSystem(destPC.fileSystem, destPC.auth.user);
            const destPath = resolvePath(destPathArg);
            const destDirNode = findNodeByPath(destPath, destFS);
        
            if (!destDirNode || destDirNode.type !== 'folder') {
                handleOutput(`cp: la destination '${destArg}' n'est pas un répertoire valide`);
                break;
            }
        
            if (isWildcard) {
                if (!sourceDirNode || sourceDirNode.type !== 'folder' || !sourceDirNode.children) {
                    handleOutput(`cp: impossible d'accéder à '${sourceArg}': Pas un répertoire valide`);
                    break;
                }
                const filesToCopy = sourceDirNode.children.filter(f => f.type === 'file' && !f.isHidden);
                if (filesToCopy.length === 0) {
                    handleOutput(`cp: aucun fichier à copier dans '${sourceArg}'`);
                    break;
                }
        
                setNetwork(currentNetwork => currentNetwork.map(pc => {
                    if (pc.id === destPC!.id) {
                        let newFs = pc.fileSystem;
                        filesToCopy.forEach(file => {
                            const copiedNode = { ...JSON.parse(JSON.stringify(file)), id: `${file.id}-copy-${Date.now()}` };
                            newFs = addNodeByPath(newFs, destPath, copiedNode);
                        });
                        return { ...pc, fileSystem: newFs };
                    }
                    return pc;
                }));
        
                handleOutput(`${filesToCopy.length} fichiers copiés vers ${destArg}`);
            } else {
                const sourceNode = findNodeByPath(sourcePath, fileSystem);
                if (!sourceNode || sourceNode.isHidden) {
                    handleOutput(`cp: impossible d'accéder à '${sourceArg}': Aucun fichier ou dossier de ce type`);
                    break;
                }
                if (sourceNode.type === 'folder') {
                    handleOutput(`cp: impossible de copier des répertoires pour l'instant.`);
                    break;
                }
        
                const copiedNode = { ...JSON.parse(JSON.stringify(sourceNode)), id: `${sourceNode.id}-copy-${Date.now()}`, name: sourceNode.name };
        
                setNetwork(currentNetwork => currentNetwork.map(pc => {
                    if (pc.id === destPC!.id) {
                        const newFs = addNodeByPath(pc.fileSystem, destPath, copiedNode);
                        return { ...pc, fileSystem: newFs };
                    }
                    return pc;
                }));
                handleOutput(`'${sourceArg}' copié vers '${destArg}'`);
            }
            break;
        }
        case 'mv': {
            if (!checkAuth()) break;
        
            const [sourceArg, destArg] = args;
            if (!sourceArg || !destArg) {
                handleOutput(`${command}: opérande manquant`);
                break;
            }
        
            const sourcePC = getCurrentPc();
            if (!sourcePC) {
                handleOutput(`${command}: erreur système: machine introuvable.`);
                break;
            }
        
            let destPC = sourcePC;
            let destPathArg = destArg;
            const playerPC = network.find(p => p.id === 'player-pc');
        
            if (destArg.startsWith('local:')) {
                if (!playerPC) {
                     handleOutput(`${command}: erreur critique: impossible de trouver la machine locale`);
                     break;
                }
                destPC = playerPC;
                destPathArg = destArg.substring(6);
            }
        
            const sourceFS = personalizeFileSystem(sourcePC.fileSystem, sourcePC.auth.user);
            const destFS = (destPC.id === sourcePC.id) ? sourceFS : personalizeFileSystem(destPC.fileSystem, destPC.auth.user);
        
            const sourcePath = resolvePath(sourceArg);
            const sourceNode = findNodeByPath(sourcePath, sourceFS);
        
            if (!sourceNode || sourceNode.isHidden) {
                handleOutput(`${command}: impossible d'accéder à '${sourceArg}': Aucun fichier ou dossier de ce type`);
                break;
            }
            if (sourceNode.type === 'folder') {
                handleOutput(`${command}: impossible de copier/déplacer des répertoires pour l'instant.`);
                break;
            }
        
            let destPath = resolvePath(destPathArg);
            let destNode = findNodeByPath(destPath, destFS);
        
            let finalDestPath: string[];
            let newFileName: string;
        
            if (destNode && destNode.type === 'folder') {
                finalDestPath = destPath;
                newFileName = sourceNode.name;
            } else {
                finalDestPath = destPath.slice(0, -1);
                newFileName = destPath[destPath.length - 1] || sourceNode.name;
            }
        
            const copiedNode = { ...JSON.parse(JSON.stringify(sourceNode)), id: `${sourceNode.id}-copy-${Date.now()}`, name: newFileName };
        
            setNetwork(currentNetwork => currentNetwork.map(pc => {
                let updatedPC = pc;
                if (command === 'mv' && pc.id === sourcePC.id) {
                    const newFs = updateNodeByPath(pc.fileSystem, sourcePath, () => null);
                    updatedPC = { ...pc, fileSystem: newFs };
                }
                if (pc.id === destPC!.id) {
                    const newFs = addNodeByPath(updatedPC.fileSystem, finalDestPath, copiedNode);
                    updatedPC = { ...updatedPC, fileSystem: newFs };
                }
                return updatedPC;
            }));
            
            handleOutput(`'${sourceArg}' ${command === 'mv' ? 'déplacé' : 'copié'} vers '${destArg}'`);
            break;
        }
        case 'unhide': {
            if (!checkAuth()) break;
            const dirArg = args[0];
            if (!dirArg) {
                handleOutput('unhide: opérande manquant. Utilisation: unhide <répertoire>');
                break;
            }
            const currentPc = getCurrentPc();
            if (!currentPc) break;
            const path = resolvePath(dirArg);
            onUnhide(currentPc.ip, path);
            handleOutput(`Commande unhide exécutée pour le répertoire '${dirArg}'.`);
            break;
        }
        case 'connect': {
            if (isProcessing) break;
            const targetIp = args[0];

            if (!targetIp) {
                handleOutput('connect: adresse IP cible manquante');
                break;
            }

            const targetPC = network.find(pc => pc.ip === targetIp);
            
            if (!targetPC) {
                handleOutput(`connect: impossible de résoudre l'hôte ${targetIp}`);
                break;
            }
             if (targetPC.ip === connectedIp) {
                handleOutput(`connect: déjà connecté à ${targetIp}`);
                break;
            }
            if (targetPC.isDestroyed) {
                handleOutput(`connect: CRITICAL ERROR: HOST UNREACHABLE`);
                break;
            }
            
            setConnectedIp(targetIp);
            setIsAuthenticated(false);
            setCurrentDirectory([]);
            onDiscovered(targetPC.id);
            handleOutput(`Connexion établie à ${targetPC.name} (${targetPC.ip}).`);
            handleOutput(`Utilisez 'login' pour vous authentifier.`);
            addLog(`EVENT: Connexion établie à ${targetPC.name} (${targetPC.ip})`);
            addRemoteLog(`Connexion établie depuis ${PLAYER_PUBLIC_IP}.`);
            break;
        }
        case 'login': {
            if (connectedIp === '127.0.0.1') {
                handleOutput('login: impossible de se connecter à la machine locale.');
                break;
            }
            if (isAuthenticated) {
                handleOutput('login: déjà authentifié.');
                break;
            }

            const [userArg, passArg] = args;
            if (!userArg || !passArg) {
                handleOutput('login: opérande utilisateur ou mot de passe manquant.');
                break;
            }
            
            const targetPC = getCurrentPc();
            if (targetPC && targetPC.auth.user === userArg && targetPC.auth.pass === passArg) {
                setIsAuthenticated(true);
                setCurrentDirectory([]);
                handleOutput('Authentification réussie.');
                addRemoteLog(`AUTH: Connexion réussie pour l'utilisateur ${userArg} depuis ${PLAYER_PUBLIC_IP}.`);
                addLog(`AUTH: Authentifié sur ${targetPC.ip} en tant que ${userArg}.`);
            } else {
                handleOutput('Authentification échouée.');
                addRemoteLog(`AUTH: Tentative de connexion échouée pour l'utilisateur ${userArg} depuis ${PLAYER_PUBLIC_IP}.`);
            }
            break;
        }
        case 'dc':
        case 'disconnect': {
            disconnect();
            break;
        }
        case 'reboot': {
            if (connectedIp === '127.0.0.1') {
                 handleOutput('Le système va redémarrer MAINTENANT !');
                 addLog(`CRITIQUE: Redémarrage du système local initié.`);
                 setTimeout(onReboot, 1000);
            } else {
                handleOutput(`Redémarrage du système distant...`);
                addRemoteLog(`COMMANDE: Redémarrage initié depuis ${PLAYER_PUBLIC_IP}.`);
                disconnect();
            }
            break;
        }
        case 'danger':
            handleOutput(`Niveau de danger actuel : ${dangerLevel}%`);
            break;
        case 'save': {
            if (connectedIp !== '127.0.0.1') {
                handleOutput('save: ne peut être exécuté que sur la machine locale.');
                break;
            }
            saveGameState();
            handleOutput('État du jeu sauvegardé.');
            break;
        }
        case 'reset-game': {
            if (connectedIp !== '127.0.0.1') {
                handleOutput('reset-game: ne peut être exécuté que sur la machine locale.');
                break;
            }
            if (args[0] === '--confirm') {
                resetGame();
                handleOutput('Données de sauvegarde supprimées. Le système va redémarrer.');
            } else {
                handleOutput('Ceci est une action destructive. Tapez `reset-game --confirm` pour continuer.');
            }
            break;
        }
        case 'solve': {
            await handleSolveCommand();
            break;
        }
        case 'call': {
            const ipArg = args.find(a => !a.startsWith('--'));
            const isSecure = args.includes('--secure');
            const isNotSecure = args.includes('--notsecure');

            if (!ipArg) {
                handleOutput('call: IP de destination manquante. Utilisation : call <ip> [--secure|--notsecure]');
                break;
            }

            if (ipArg === DIRECTOR_IP && isSecure) {
                handleOutput('Appel sécurisé vers le Directeur en cours...');
                triggerCall(directorCallback);
                break;
            }
            
            if (ipArg === '10.0.0.4' && isSecure) {
                const updateServer = network.find(pc => pc.ip === '10.0.0.4');
                const payload = findNodeByPath(['schism.payload'], updateServer?.fileSystem || []);
                if (payload) {
                    handleOutput('Payload de schisme activé... Déclenchement de la séquence finale...');
                    addLog('EVENT: La VRAIE FIN est déclenchée.');
                    onEndGame('true_ending');
                } else {
                    handleOutput(`call: Erreur - 'schism.payload' introuvable sur la cible.`);
                }
                break;
            }
            
            if (ipArg === '198.51.100.17' && isNotSecure) {
                const backdoorPC = network.find(pc => pc.ip === '198.51.100.17');
                const backdoorFile = findNodeByPath(['backdoor.sys'], backdoorPC?.fileSystem || []);

                if(backdoorFile) {
                    handleOutput('Séquence de la porte dérobée activée... Le système est compromis.');
                    addLog('EVENT: Chapitre 3 initié via la porte dérobée.');
                    triggerCall(blackwireChapter3Mission);
                } else {
                    handleOutput(`call: Le script requis 'backdoor.sys' est introuvable sur la cible.`);
                }
                break;
            }

            if (ipArg === DIRECTOR_IP && isSecure) {
                handleOutput('Appel sécurisé vers le Directeur en cours...');
                // This would trigger a call script. For now, a placeholder.
                handleOutput('Fonctionnalité de script d\'appel non entièrement implémentée.');
            } else {
                handleOutput(`call: Impossible de joindre ${ipArg}. Vérifiez l'IP et les protocoles.`);
            }
            break;
        }
        case 'debug-skip': {
             if (args[0] === 'mission1') {
                handleOutput('DEBUG: Skipping to post-Mission 1...');
                
                // Simulate file upload
                setNetwork(currentNetwork => currentNetwork.map(pc => {
                    if (pc.id === 'blackwire-dropzone') {
                        const newFs = addNodeByPath(pc.fileSystem, ['upload'], {
                            id: 'mission-data-debug',
                            name: 'mission_data.zip',
                            type: 'file',
                            content: 'DEBUGGED'
                        });
                        return { ...pc, fileSystem: newFs };
                    }
                    return pc;
                }));
                
                const successEmail = {
                    sender: 'recruit@blackwire.net',
                    subject: 'Re: Preuve de compétence (DEBUG)',
                    body: "Bien joué. Le fichier est là où il doit être. Le code est correct.\n\nConsidérez ceci comme votre admission. Vous êtes une Recrue de Blackwire maintenant. Ne nous décevez pas.\n\n- Blackwire"
                };
                
                setTimeout(() => {
                    receiveEmail(successEmail);
                    setTimeout(() => receiveEmail(supervisorChapter2Email), 1000);
                }, 500);

            } else if (args[0] === 'backdoor') {
                handleOutput('DEBUG: Skipping to backdoor mission call...');
                triggerCall(blackwireChapter3Mission);
            } else if (args[0] === 'nihil') {
                handleOutput('DEBUG: Skipping to final assault mission...');
                receiveEmail(chapter9IntroEmail);
            } else if (args[0] === 'final') {
                handleOutput('DEBUG: Skipping to final call...');
                triggerCall(finalCallScript);
            } else {
                handleOutput('DEBUG: Unknown skip point. Use `debug-skip mission1` or `debug-skip backdoor` or `debug-skip nihil` or `debug-skip final`');
            }
            break;
        }
        case 'clear': {
            setHistory([]);
            setInput('');
            setIsProcessing(false);
            return;
        }
        case '':
            break;
        default:
            handleOutput(`commande non trouvée: ${command}`);
            break;
    }


    setIsProcessing(false);
  };

  const handleTabCompletion = () => {
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];

    if (lastPart === undefined) return;

    // Command completion
    if (parts.length === 1) {
        const executables = allExecutables.map(f => f.name.split('.')[0].toLowerCase());
        const mainCommands = ['help', 'ls', 'cd', 'cat', 'echo', 'rm', 'mv', 'cp', 'scp', 'connect', 'disconnect', 'dc', 'login', 'solve', 'clear', 'reboot', 'save', 'reset-game', 'danger', 'scan', 'nano', 'neo', 'call', 'unhide'];
        const allCommands = [...new Set([...mainCommands, ...executables])];
        const possibilities = allCommands.filter(cmd => cmd.startsWith(lastPart));

        if (possibilities.length === 1) {
            setInput(possibilities[0] + ' ');
        } else if (possibilities.length > 1) {
            const newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${input}` }, { type: 'output', content: possibilities.join('  ') }];
            setHistory(newHistory);
        }
        return;
    }
     
    // File/Path completion
    if (!isAuthenticated) return;
    
    const pathPrefix = lastPart.substring(0, lastPart.lastIndexOf('/') + 1);
    const partialName = lastPart.substring(lastPart.lastIndexOf('/') + 1);
    
    const targetDir = resolvePath(pathPrefix || '.');
    const targetNode = findNodeByPath(targetDir, fileSystem);
    
    if (!targetNode?.children) return;

    const possibilities = targetNode.children.filter(child => child.name.startsWith(partialName) && !child.isHidden);

    if (possibilities.length === 1) {
        const completion = possibilities[0];
        const newText = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '') + pathPrefix + completion.name;
        setInput(newText + (completion.type === 'folder' ? '/' : ' '));
    } else if (possibilities.length > 1) {
        const newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${input}` }, { type: 'output', content: possibilities.map(p => p.name).join('  ') }];
        setHistory(newHistory);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isIcebreakerActive && e.key.toLowerCase() === 'c') {
        setIsIcebreakerActive(false);
        onPauseTrace(false);
        setIcebreakerCooldown(Date.now() + 10000);
        setHistory(prev => [...prev, { type: 'output', content: '--- ICEBREAKER DÉSENGAGÉ. Reprise de la trace. ---' }]);
        setIcebreakerTimeLeft(0);
        return;
    }

    if (isProcessing || isIcebreakerActive) {
        e.preventDefault();
        return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if(commandHistory.length > 0) {
            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if(historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        } else {
            setHistoryIndex(-1);
            setInput('');
        }
    }
  };

  return (
    <div className="h-full bg-black/80 text-green-400 font-code p-4 flex flex-col" onClick={() => inputRef.current?.focus()}>
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="pr-4">
          {history.map((item, index) => (
            <div key={index} className="whitespace-pre-wrap break-words">
              {item.type === 'command' ? (
                <span className="text-muted-foreground">{item.content}</span>
              ) : item.type === 'confirmation' ? (
                 <div className="text-yellow-400">
                    <span>{item.content}</span>
                 </div>
              ) : (
                <span>{item.content}</span>
              )}
            </div>
          ))}
          {isIcebreakerActive && (
              <div className="text-cyan-400 animate-pulse">
                  {`--- ICEBREAKER ENGAGED. Trace en pause. [Appuyez sur C pour désengager] ---`}
              </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center mt-2">
        {!isProcessing && !isIcebreakerActive && (
          <>
            <span className="text-muted-foreground">{getPrompt()}</span>
            <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-green-400 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 h-6 p-0 ml-1"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            />
          </>
        )}
         {isIcebreakerActive && (
            <Input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-green-400 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 h-6 p-0 ml-1 opacity-0 cursor-default"
            autoFocus
            />
        )}
      </div>
    </div>
  );
}

    