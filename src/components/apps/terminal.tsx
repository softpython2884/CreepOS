'use client';

import { useState, useRef, useEffect, KeyboardEvent, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSystemNode, PC } from '@/lib/network/types';
import { network as initialNetworkData } from '@/lib/network';
import { type Email } from './email-client';

interface HistoryItem {
  type: 'command' | 'output' | 'confirmation';
  content: string;
  onConfirm?: (confirmed: boolean) => void;
}


interface TerminalProps {
    username: string;
    instanceId: number;
    onSoundEvent?: (event: 'click' | 'error') => void;
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
    saveGameState: () => void;
    resetGame: () => void;
    dangerLevel: number;
    machineState: string; // To know if we are in survival mode
    receiveEmail: (email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>) => void;
    onNeoExecute: () => void;
}

const PLAYER_PUBLIC_IP = '184.72.238.110';

const findNodeByPath = (path: string[], nodes: FileSystemNode[]): FileSystemNode | null => {
    if (path.length === 0) return { name: '/', type: 'folder', children: nodes, id: 'root' };

    let currentLevel: FileSystemNode[] | undefined = nodes;
    let foundNode: FileSystemNode | null = null;

    for (let i = 0; i < path.length; i++) {
        const part = path[i];
        if (!currentLevel) return null;

        const node = currentLevel.find(n => n.name === part);
        if (!node) return null;

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
    saveGameState,
    resetGame,
    dangerLevel,
    machineState,
    receiveEmail,
    onNeoExecute,
}: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.1.0-beta]\n(c) Cauchemar Virtuel Corporation. All rights reserved.", onConfirm: () => {} },
    { type: 'output', content: "Tapez 'help' pour une liste de commandes.", onConfirm: () => {} }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [isNeoInstalled, setIsNeoInstalled] = useState(false);
  
  // Network and FS state
  const [connectedIp, setConnectedIp] = useState<string>('127.0.0.1');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [history]);

  useEffect(() => {
    if (!isProcessing) {
        inputRef.current?.focus();
    }
  }, [isProcessing]);

  const getPrompt = () => {
    if (isAwaitingConfirmation) {
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

  const addRemoteLog = (message: string) => {
    if (connectedIp === '127.0.0.1') return;

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
          setHistory(prev => [...prev, { type: 'output', content: 'Impossible de se déconnecter de la machine locale.', onConfirm: () => {} }]);
          return;
      }

      onStopTrace();

      const logFile = findNodeByPath(['logs', 'access.log'], currentPc.fileSystem);
      const hasLogs = logFile && logFile.content && (logFile.content.includes('successful') || logFile.content.includes('disabled') || logFile.content.includes('opened'));

      if (hasLogs && currentPc.traceability) {
        handleIncreaseDanger(currentPc.traceability);
        addLog(`DANGER: Traces laissées sur ${currentPc.ip}. Niveau de danger augmenté de ${currentPc.traceability}%.`);
      }

      const previousHostName = currentPc.name;
      const previousIp = currentPc.ip;
      
      setConnectedIp('127.0.0.1');
      setIsAuthenticated(true);
      setCurrentDirectory([]);

      if (isCrash) {
           setHistory(prev => [...prev, { type: 'output', content: `Connexion à ${previousHostName} perdue. Hôte distant planté.`, onConfirm: () => {} }]);
           addLog(`EVENT: Connexion à ${previousIp} perdue à cause d'un crash distant.`);
      } else {
          setHistory(prev => [...prev, { type: 'output', content: `Déconnecté de ${previousHostName}.`, onConfirm: () => {} }]);
          addLog(`EVENT: Déconnecté de ${previousIp}.`);
      }
  }


  const runProgressBar = async (duration: number, text?: string) => {
    const barLength = 20;
    const interval = duration / barLength;
    let currentProgress = 0;
    
    setHistory(prev => [...prev, {type: 'output', content: '', onConfirm: () => {}}]); // Add an empty line to update

    while (currentProgress <= barLength) {
        const bar = '[' + '#'.repeat(currentProgress) + ' '.repeat(barLength - currentProgress) + ']';
        const percentage = Math.round((currentProgress / barLength) * 100);
        
        setHistory(prev => {
            const newHistory = [...prev];
            const content = text ? `${text} ${bar} ${percentage}%` : `${bar} ${percentage}%`;
            newHistory[newHistory.length - 1] = { type: 'output', content: content, onConfirm: () => {}};
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

    setHistory(prev => [...prev, {type: 'output', content: 'Initiation du scan profond...', onConfirm: () => {}}]);
    await new Promise(resolve => setTimeout(resolve, 500));
    setHistory(prev => [...prev, {type: 'output', content: '', onConfirm: () => {}}]); // Placeholder for the animation

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
            newHistory[newHistory.length - 1] = { type: 'output', content: `[${output}]`, onConfirm: () => {} };
            return newHistory;
        });
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { type: 'output', content: `Fragment de solution : [ ${solution} ]`, onConfirm: () => {} };
        return newHistory;
    });
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
        setHistory([...history, { type: 'command', content: getPrompt(), onConfirm: () => {} }]);
        return;
    };

    setIsProcessing(true);
    addLog(`COMMAND: Exécution de '${fullCommand}' sur ${connectedIp}`);
    setCommandHistory(prev => [fullCommand, ...prev]);
    setHistoryIndex(-1);

    let newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${fullCommand}`, onConfirm: () => {} }];
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
            setHistory(prev => [...prev, { type: 'output', content: `erreur : Redirection non implémentée pour cette commande.`, onConfirm: () => {} }]);
        } else {
            setHistory(prev => [...prev, { type: 'output', content: output, onConfirm: () => {} }]);
        }
    }
    
    const checkAuth = () => {
        if (!isAuthenticated) {
            setHistory(prev => [...prev, { type: 'output', content: 'erreur : Permission refusée. Vous n\'êtes pas authentifié.', onConfirm: () => {} }]);
            return false;
        }
        return true;
    }

    const checkAndTriggerTrace = (pc?: PC | null) => {
        const targetPc = pc || getCurrentPc();
        if (!targetPc) return false;

        const isDangerousAction = allExecutables.some(file => file.name.toLowerCase().startsWith(command.toLowerCase()))
          || command.toLowerCase() === 'solve';

        if (isDangerousAction) {
          if (targetPc.isDangerous) {
              onStartTrace(targetPc.name, 6, instanceId); // Default short trace for dangerous servers
          }
          else if (targetPc.traceTime > 0) {
              onStartTrace(targetPc.name, targetPc.traceTime, instanceId);
              return true;
          }
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
            addRemoteLog(`${portName} échoué sur le port ${portNumber}. Raison : Pare-feu actif.`);
            return;
        }
        if (currentTargetPC.proxy.enabled) {
            handleOutput(`${portName} échoué : Proxy actif détecté.`);
            addRemoteLog(`${portName} échoué sur le port ${portNumber}. Raison : Proxy actif.`);
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

    if (command.toLowerCase() === 'neo') {
        if (isNeoInstalled) {
            handleOutput('Configuration de NÉO déjà en cours...');
        } else {
            await runProgressBar(5000, 'Installation de NÉO...');
            handleOutput('Installation terminée. Initialisation...');
            onNeoExecute();
            setIsNeoInstalled(true);
        }
        setIsProcessing(false);
        return;
    }

    const isHackingTool = allExecutables.some(file => file.name.toLowerCase().startsWith(command.toLowerCase()));
    if (isHackingTool && command.toLowerCase() !== 'nano') {
        const executable = allExecutables.find(file => file.name.toLowerCase().startsWith(command.toLowerCase()));
        const cmdName = executable!.name.split('.')[0].toLowerCase();
        
        if (connectedIp === '127.0.0.1' && cmdName !== 'scan' && cmdName !== 'forkbomb') {
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
                    handleOutput(`Analyse du pare-feu terminée. Fragment de solution acquis.`);
                    addRemoteLog(`L'analyse du pare-feu depuis ${PLAYER_PUBLIC_IP} a révélé la solution : ${targetPC.firewall.solution}`);
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
            case 'forkbomb':
                if (connectedIp === '127.0.0.1') {
                    handleOutput('CRASH SYSTÈME IMMINENT. REDÉMARRAGE...');
                    addLog(`CRITIQUE: Forkbomb exécuté sur la machine locale. Redémarrage du système.`);
                    setTimeout(onReboot, 1000);
                } else {
                    if (targetPC) {
                        addRemoteLog(`CRITIQUE: XserverOS.sys non trouvé. Crash du système.`);
                        
                        setNetwork(currentNetwork => currentNetwork.map(pc => {
                            if (pc.id === targetPC!.id) {
                                const newFileSystem = updateNodeByPath(pc.fileSystem, ['sys', 'XserverOS.sys'], (node) => ({ ...node, content: 'NOYAU SYSTÈME CORROMPU' }));
                                return { ...pc, fileSystem: newFileSystem };
                            }
                            return pc;
                        }));

                        disconnect(true);
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
                '  mv <src> <dest> - Déplace ou renomme un fichier (auth requise)',
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
                const content = targetNode.children?.map(node => `${node.name}${node.type === 'folder' ? '/' : ''}`).join('  ');
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
                setCurrentDirectory(newPath);
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
                if (file.type === 'file') {
                    handleOutput(file.content || '');
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
                        setHistory(prevHist => [...prevHist, {type: 'command', content: confirmed ? 'y' : 'n', onConfirm: () => {}}]);
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
                                        if (file.name.endsWith('.log')) {
                                            filesCleared.push(file);
                                            newFs = updateNodeByPath(newFs, filePath, (node) => ({ ...node, content: `Log effacé depuis ${PLAYER_PUBLIC_IP} le ${new Date().toISOString()}\n` }));
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
                                newHistoryItems.push({ type: 'output', content: `${filesToRemove.length} fichier(s) supprimé(s).`, onConfirm: () => {} });
                                addLog(`EVENT: ${filesToRemove.length} fichiers supprimés de ${connectedIp}:${'/' + currentDirectory.join('/')}`);
                                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: ${filesToRemove.length} fichier(s) supprimé(s) par l'utilisateur depuis ${PLAYER_PUBLIC_IP} dans /${currentDirectory.join('/')}`);
                            }
                            if (filesCleared.length > 0) {
                                newHistoryItems.push({ type: 'output', content: `Contenu de ${filesCleared.length} fichier(s) log effacé.`, onConfirm: () => {} });
                                addLog(`EVENT: ${filesCleared.length} logs effacés sur ${connectedIp}`);
                                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: ${filesCleared.length} fichier(s) log effacé(s) par l'utilisateur depuis ${PLAYER_PUBLIC_IP}.`);
                            }
                            if (filesToRemove.length === 0 && filesCleared.length === 0) {
                                newHistoryItems.push({ type: 'output', content: "rm: aucun fichier amovible trouvé dans ce répertoire.", onConfirm: () => {} });
                            }
                            setHistory(prev => [...prev, ...newHistoryItems]);

                        } else {
                            setHistory(prev => [...prev, { type: 'output', content: 'Opération annulée.', onConfirm: () => {} }]);
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

            if (!fileNode) {
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
                    addRemoteLog(`CRITIQUE: XserverOS.sys non trouvé. Crash du système.`);
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
            
            const isAccessLog = fileNode.name.endsWith('.log');
            const updater = isAccessLog ? (node: FileSystemNode) => ({ ...node, content: `Log effacé depuis ${PLAYER_PUBLIC_IP} le ${new Date().toISOString()}\n` }) : () => null;

            setNetwork(currentNetwork => currentNetwork.map(pc => {
                if (pc.ip === connectedIp) {
                    const newFs = updateNodeByPath(pc.fileSystem, filePath, updater);
                    return { ...pc, fileSystem: newFs };
                }
                return pc;
            }));

            if(isAccessLog) {
                handleOutput(`Contenu de '${fileArg}' effacé`);
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: Fichier log '${fileArg}' effacé par l'utilisateur depuis ${PLAYER_PUBLIC_IP}.`);
                addLog(`EVENT: Fichier log '${fileArg}' sur ${connectedIp} effacé.`);
            } else {
                handleOutput(`'${fileArg}' supprimé`);
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: Fichier supprimé par l'utilisateur depuis ${PLAYER_PUBLIC_IP}: ${filePath.join('/')}`);
                addLog(`EVENT: Fichier '${fileArg}' sur ${connectedIp} supprimé.`);
            }

            break;
        }
        case 'cp':
        case 'mv': {
            if (!checkAuth()) break;
        
            const [sourceArg, destArg] = args;
            if (!sourceArg || !destArg) {
                handleOutput(`${command}: opérande manquant`);
                break;
            }
        
            // --- Parse Paths ---
            let sourcePC = getCurrentPc();
            let destPC = sourcePC;
            const playerPC = network.find(p => p.id === 'player-pc');
        
            let sourcePathArg = sourceArg;
            let destPathArg = destArg;
        
            if (destArg.startsWith('local:')) {
                destPC = playerPC;
                destPathArg = destArg.substring(6);
            }
        
            if (!sourcePC || !destPC) {
                handleOutput(`${command}: erreur système: machine introuvable.`);
                break;
            }
        
            const sourceFS = personalizeFileSystem(sourcePC.fileSystem, sourcePC.auth.user);
            let destFS = personalizeFileSystem(destPC.fileSystem, destPC.auth.user);
        
            // --- Handle wildcard (*) ---
            if (sourceArg.endsWith('*')) {
                const sourceDirArg = sourceArg.slice(0, -1);
                const sourcePath = resolvePath(sourceDirArg);
                const sourceDirNode = findNodeByPath(sourcePath, sourceFS);
        
                if (!sourceDirNode || sourceDirNode.type !== 'folder' || !sourceDirNode.children) {
                    handleOutput(`${command}: impossible d'accéder à '${sourceArg}': Pas un répertoire valide`);
                    break;
                }
        
                const destPath = resolvePath(destPathArg);
                const destDirNode = findNodeByPath(destPath, destFS);
        
                if (!destDirNode || destDirNode.type !== 'folder') {
                    handleOutput(`${command}: la destination '${destArg}' n'est pas un répertoire`);
                    break;
                }
        
                const filesToCopy = sourceDirNode.children.filter(f => f.type === 'file');
        
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
                addLog(`EVENT: ${filesToCopy.length} fichiers copiés de ${sourcePC.ip}:${sourceDirArg} vers ${destPC.ip}:${destPathArg}`);
                break;
            }
        
            // --- Handle single file ---
            const sourcePath = resolvePath(sourcePathArg);
            const sourceNode = findNodeByPath(sourcePath, sourceFS);
        
            if (!sourceNode) {
                handleOutput(`${command}: impossible d'accéder à '${sourceArg}': Aucun fichier ou dossier de ce type`);
                break;
            }
            if (sourceNode.type === 'folder') {
                handleOutput(`${command}: impossible de copier des répertoires pour l'instant.`);
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
                newFileName = destPath[destPath.length - 1];
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
            const solution = args[0];
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1' || !targetPC) {
                handleOutput('solve : Doit être connecté à un système distant.');
            } else if (!targetPC.firewall.enabled) {
                handleOutput('Le pare-feu n\'est pas actif.');
            } else {
                checkAndTriggerTrace();
                if (targetPC.firewall.solution === solution) {
                    setNetwork(currentNetwork => currentNetwork.map(pc => pc.id === targetPC.id ? { ...pc, firewall: { ...pc.firewall, enabled: false } } : pc));
                    handleOutput('Pare-feu désactivé.');
                    addRemoteLog(`Pare-feu désactivé depuis ${PLAYER_PUBLIC_IP} avec la solution : ${solution}.`);
                } else {
                     handleOutput('Solution incorrecte.');
                     addRemoteLog(`Tentative de solution de pare-feu incorrecte '${solution}' depuis ${PLAYER_PUBLIC_IP}.`);
                }
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
        const mainCommands = ['help', 'ls', 'cd', 'cat', 'echo', 'rm', 'mv', 'cp', 'connect', 'disconnect', 'dc', 'login', 'solve', 'clear', 'reboot', 'save', 'reset-game', 'danger', 'scan', 'nano', 'neo'];
        const allCommands = [...new Set([...mainCommands, ...executables])];
        const possibilities = allCommands.filter(cmd => cmd.startsWith(lastPart));

        if (possibilities.length === 1) {
            setInput(possibilities[0] + ' ');
        } else if (possibilities.length > 1) {
            const newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${input}`, onConfirm: () => {} }, { type: 'output', content: possibilities.join('  '), onConfirm: () => {} }];
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

    const possibilities = targetNode.children.filter(child => child.name.startsWith(partialName));

    if (possibilities.length === 1) {
        const completion = possibilities[0];
        const newText = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '') + pathPrefix + completion.name;
        setInput(newText + (completion.type === 'folder' ? '/' : ' '));
    } else if (possibilities.length > 1) {
        const newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${input}`, onConfirm: () => {} }, { type: 'output', content: possibilities.map(p => p.name).join('  '), onConfirm: () => {} }];
        setHistory(newHistory);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isProcessing) {
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
      <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
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
        </div>
      </ScrollArea>
      <div className="flex items-center mt-2">
        {!isProcessing && (
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
      </div>
    </div>
  );
}
