
'use client';

import { useState, useRef, useEffect, KeyboardEvent, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSystemNode, PC } from '@/lib/network/types';
import { network as initialNetworkData } from '@/lib/network';

interface HistoryItem {
  type: 'command' | 'output';
  content: string;
}

interface TerminalProps {
    username: string;
    instanceId: number;
    onSoundEvent?: (event: 'click') => void;
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
}

const findNodeByPath = (path: string[], nodes: FileSystemNode[]): FileSystemNode | null => {
    if (path.length === 0) return null;

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
    dangerLevel
}: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.1.0-beta]\n(c) Cauchemar Virtuel Corporation. All rights reserved." },
    { type: 'output', content: "Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Network and FS state
  const [connectedIp, setConnectedIp] = useState<string>('127.0.0.1');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentDirectory, setCurrentDirectory] = useState(['home', username]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentPc = useCallback(() => {
      return network.find(pc => pc.ip === connectedIp);
  }, [network, connectedIp]);

  const fileSystem = useMemo(() => {
      const pc = getCurrentPc();
      if (pc) {
          const userForFs = connectedIp === '127.0.0.1' ? username : pc.auth.user;
          return personalizeFileSystem(pc.fileSystem, userForFs);
      }
      return [];
  }, [getCurrentPc, connectedIp, username]);
  
  const allExecutables = useMemo(() => {
    const playerPcFs = initialNetworkData.find(p => p.id === 'player-pc')?.fileSystem;
    if (!playerPcFs) return [];
    const binFolder = personalizeFileSystem(playerPcFs, username).find(node => node.name === 'bin' && node.type === 'folder');
    return binFolder?.children?.filter(f => f.type === 'file' && (f.name.endsWith('.bin') || f.name.endsWith('.exe'))) || [];
  }, [username]);

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
    const currentPc = getCurrentPc();
    const hostName = currentPc?.name || 'neo-system';
    
    let user;
    if (isAuthenticated) {
        user = currentPc?.auth.user || username;
    } else {
        user = '(unauthenticated)';
    }

    let path = currentDirectory.join('/');
    if (connectedIp === '127.0.0.1' && currentDirectory.join('/').startsWith(`home/${username}`)) {
        path = '~' + path.substring(`home/${username}`.length);
    } else if (path === '' || !isAuthenticated) {
        path = '/';
    }
    
    return `${user}@${hostName}:${path}$ `;
  };
  
  const resolvePath = (pathArg: string): string[] => {
    if (!pathArg) return [...currentDirectory];
    
    let newPath: string[];
    
    if (pathArg.startsWith('/')) {
        newPath = pathArg.split('/').filter(p => p);
    } else {
        newPath = [...currentDirectory];
        pathArg.split('/').forEach(part => {
            if (part === '..') {
                if (newPath.length > 0) newPath.pop();
            } else if (part && part !== '.') {
                newPath.push(part);
            }
        });
    }
    return newPath;
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
          setHistory(prev => [...prev, { type: 'output', content: 'Cannot disconnect from local machine.' }]);
          return;
      }

      onStopTrace();

      const logFile = findNodeByPath(['logs', 'access.log'], currentPc.fileSystem);
      const hasLogs = logFile && logFile.content && (logFile.content.includes('successful') || logFile.content.includes('disabled') || logFile.content.includes('opened'));

      if (hasLogs && currentPc.traceability) {
        handleIncreaseDanger(currentPc.traceability);
        addLog(`DANGER: Traces left on ${currentPc.ip}. Danger level increased by ${currentPc.traceability}%.`);
      }

      const previousHostName = currentPc.name;
      const previousIp = currentPc.ip;
      
      setConnectedIp('127.0.0.1');
      setIsAuthenticated(true);
      setCurrentDirectory(['home', username]);

      if (isCrash) {
           setHistory(prev => [...prev, { type: 'output', content: `Connection to ${previousHostName} lost. Remote host crashed.` }]);
           addLog(`EVENT: Connection to ${previousIp} lost due to remote crash.`);
      } else {
          setHistory(prev => [...prev, { type: 'output', content: `Disconnected from ${previousHostName}.` }]);
          addLog(`EVENT: Disconnected from ${previousIp}.`);
      }
  }


  const runProgressBar = async (duration: number) => {
    const barLength = 20;
    const interval = duration / barLength;
    let currentProgress = 0;
    
    setHistory(prev => [...prev, {type: 'output', content: ''}]); // Add an empty line to update

    while (currentProgress <= barLength) {
        const bar = '[' + '#'.repeat(currentProgress) + ' '.repeat(barLength - currentProgress) + ']';
        const percentage = Math.round((currentProgress / barLength) * 100);
        
        setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { type: 'output', content: `${bar} ${percentage}%`};
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

    setHistory(prev => [...prev, {type: 'output', content: 'Initiating deep scan...'}]);
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
        newHistory[newHistory.length - 1] = { type: 'output', content: `Solution Fragment: [ ${solution} ]` };
        return newHistory;
    });
  };


  const handleCommand = async () => {
    const fullCommand = input.trim();
    if (fullCommand === '') {
        setHistory([...history, { type: 'command', content: getPrompt() }]);
        return;
    };

    setIsProcessing(true);
    addLog(`COMMAND: Executed '${fullCommand}' on ${connectedIp}`);
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
            setHistory(prev => [...prev, { type: 'output', content: `error: Redirection not yet implemented for this command.` }]);
        } else {
            setHistory(prev => [...prev, { type: 'output', content: output }]);
        }
    }
    
    const checkAuth = () => {
        if (!isAuthenticated) {
            setHistory(prev => [...prev, { type: 'output', content: 'error: Permission denied. You are not authenticated.' }]);
            return false;
        }
        return true;
    }

    const checkAndTriggerTrace = (pc?: PC | null) => {
        const targetPc = pc || getCurrentPc();
        if (targetPc && targetPc.traceTime > 0) {
            onStartTrace(targetPc.name, targetPc.traceTime, instanceId);
            return true;
        }
        if (targetPc && targetPc.isDangerous) {
            onStartTrace(targetPc.name, 6, instanceId);
        }
        return false;
    }

    const handlePortHack = async (portNumber: number, portName: string) => {
        if (connectedIp === '127.0.0.1') {
            handleOutput(`${portName}: Must be connected to a remote system.`);
            return;
        }
    
        let currentTargetPC: PC | undefined;
        setNetwork(currentNetwork => {
            currentTargetPC = currentNetwork.find(p => p.ip === connectedIp);
            return currentNetwork;
        });
        await new Promise(r => setTimeout(r,0)); // wait for state to propagate
        
        if (!currentTargetPC) {
            handleOutput('Critical error: Target system disconnected.');
            return;
        }
    
        if (currentTargetPC.firewall.enabled) {
            handleOutput(`${portName} failed: Active firewall detected.`);
            addRemoteLog(`HACK: ${portName} failed on port ${portNumber}. Reason: Firewall active.`);
            return;
        }
        if (currentTargetPC.proxy.enabled) {
            handleOutput(`${portName} failed: Active proxy detected.`);
            addRemoteLog(`HACK: ${portName} failed on port ${portNumber}. Reason: Proxy active.`);
            return;
        }
        const port = currentTargetPC.ports.find(p => p.port === portNumber);
        if (!port) {
            handleOutput(`${portName} failed: Port ${portNumber} not found on this system.`);
            return;
        }
        if (port.isOpen) {
            handleOutput(`Port ${portNumber} is already open.`);
            return;
        }
      
        checkAndTriggerTrace();

        handleOutput(`Running ${portName} exploit...`);
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
  
        handleOutput(`${port.service} port (${portNumber}) is now open.`);
        addRemoteLog(`HACK: Port ${portNumber} (${port.service}) opened by ${username}.`);
    };

    // --- Special cases for non-auth commands on remote systems ---
    const isHackingTool = allExecutables.some(file => file.name.toLowerCase().startsWith(command.toLowerCase())) || command.toLowerCase() === 'solve';

    if (isHackingTool && connectedIp !== '127.0.0.1') {
        const executable = allExecutables.find(file => file.name.toLowerCase().startsWith(command.toLowerCase()));
        const cmdName = command.toLowerCase() === 'solve' ? 'solve' : executable!.name.split('.')[0].toLowerCase();
        
        let targetPC: PC | undefined = getCurrentPc();
       
        switch(cmdName) {
            case 'scan':
                 const scanTarget = getCurrentPc();
                if (scanTarget && scanTarget.links) {
                    const linkedPcs = scanTarget.links.map(linkId => network.find(p => p.id === linkId)).filter(Boolean) as PC[];
                    if (linkedPcs.length > 0) {
                        const output = ['Scanning network... Found linked devices:', ...linkedPcs.map(pc => `  - ${pc.name} (${pc.ip})`)].join('\n');
                        handleOutput(output);
                    } else {
                        handleOutput('No linked devices found.');
                    }
                } else {
                    handleOutput('Scan failed: could not determine current network segment.');
                }
                break;
            case 'probe':
                if (!targetPC) {
                    handleOutput('probe: Must be connected to a remote system.');
                } else {
                    checkAndTriggerTrace();
                    handleOutput(`Probing ${targetPC.ip}...`);
                    await runProgressBar(2000);
                    const secInfo = [
                        `Security Probe results for ${targetPC.ip}:`,
                        `  Firewall: ${targetPC.firewall.enabled ? `ACTIVE (Complexity: ${targetPC.firewall.complexity})` : 'INACTIVE'}`,
                        `  Proxy: ${targetPC.proxy.enabled ? `ACTIVE (Level: ${targetPC.proxy.level})` : 'INACTIVE'}`,
                        `  Trace Time: ${targetPC.traceTime > 0 ? `${targetPC.traceTime}s` : 'N/A'}`,
                        `  Ports required for PortHack: ${targetPC.requiredPorts}`
                    ];

                    if (targetPC.ports.length > 0) {
                        secInfo.push('\n  Available Ports:');
                        targetPC.ports.forEach(p => {
                            secInfo.push(`    - ${p.port} (${p.service}): ${p.isOpen ? 'OPEN' : 'CLOSED'}`);
                        });
                    } else {
                        secInfo.push('  No scannable ports detected.');
                    }
                    addRemoteLog(`INFO: System ${targetPC.ip} probed by ${username}.`);
                    handleOutput(secInfo.join('\n'));
                }
                break;
            case 'porthack':
                 if (!targetPC) {
                    handleOutput('porthack: critical error, no target system.');
                } else if (hackedPcs.has(targetPC.id)) {
                    handleOutput(`porthack: System ${targetPC.ip} already breached. Password: ${targetPC.auth.pass}`);
                } else if (targetPC.firewall.enabled) {
                    handleOutput(`ERROR: Active firewall detected. Connection terminated.`);
                    addRemoteLog(`HACK: PortHack failed. Reason: Firewall active.`);
                } else if (targetPC.proxy.enabled) {
                    handleOutput(`ERROR: Active proxy detected. Connection bounced.`);
                    addRemoteLog(`HACK: PortHack failed. Reason: Proxy active.`);
                } else {
                    checkAndTriggerTrace();
                    handleOutput(`Initiating PortHack sequence...`);
                    await runProgressBar(5000);
                    const openPorts = targetPC.ports.filter(p => p.isOpen).length;
                    if (openPorts >= targetPC.requiredPorts) {
                        handleOutput(`PortHack successful on ${targetPC.ip}. Firewall breached.\n  Password cracked: ${targetPC.auth.pass}`);
                        addRemoteLog(`HACK: PortHack successful. Root access gained by ${username}.`);
                        onHack(targetPC.id, targetPC.ip);
                    } else {
                        handleOutput(`PortHack failed: ${targetPC.requiredPorts} open port(s) required. (${openPorts}/${targetPC.requiredPorts} open)`);
                        addRemoteLog(`HACK: PortHack failed. Reason: Insufficient open ports.`);
                    }
                }
                break;
            case 'analyze':
                if (!targetPC) {
                    handleOutput('analyze: Must be connected to a remote system.');
                } else if (!targetPC.firewall.enabled) {
                    handleOutput('Firewall is not active.');
                } else {
                    checkAndTriggerTrace();
                    await runAnalyzeMinigame(targetPC.firewall.solution || 'UNKNOWN');
                    handleOutput(`Firewall analysis complete. Solution fragment acquired.`);
                    addRemoteLog(`HACK: Firewall analysis by ${username} revealed solution: ${targetPC.firewall.solution}`);
                }
                break;
            case 'overload':
                if (!targetPC) {
                    handleOutput('overload: Must be connected to a remote system.');
                } else if (!targetPC.proxy.enabled) {
                    handleOutput('Proxy is not active.');
                } else {
                    checkAndTriggerTrace();
                    const requiredNodes = targetPC.proxy.level;
                    const availableNodes = hackedPcs.size;
                    
                    handleOutput(`Overloading proxy... (Requires: ${requiredNodes} nodes, Have: ${availableNodes})`);
                    await runProgressBar(targetPC.proxy.level * 2000);

                    if (availableNodes >= requiredNodes) {
                        setNetwork(currentNetwork => currentNetwork.map(pc => pc.id === targetPC!.id ? { ...pc, proxy: { ...pc.proxy, enabled: false } } : pc));
                        handleOutput(`Proxy disabled on ${targetPC.ip}.`);
                        addRemoteLog(`HACK: Proxy on ${targetPC.ip} disabled via overload by ${username}.`);
                    } else {
                        handleOutput(`Overload failed. Insufficient nodes.`);
                        addRemoteLog(`HACK: Proxy overload failed. Required ${requiredNodes} nodes, have ${availableNodes}.`);
                    }
                }
                break;
            case 'solve':
                const solution = args[0];
                if (!targetPC) {
                    handleOutput('solve: Must be connected to a remote system.');
                } else if (!targetPC.firewall.enabled) {
                    handleOutput('Firewall is not active.');
                } else {
                    checkAndTriggerTrace();
                    if (targetPC.firewall.solution === solution) {
                        setNetwork(currentNetwork => currentNetwork.map(pc => pc.id === targetPC!.id ? { ...pc, firewall: { ...pc.firewall, enabled: false } } : pc));
                        handleOutput('Firewall disabled.');
                        addRemoteLog(`HACK: Firewall disabled by ${username} with solution: ${solution}.`);
                    } else {
                         handleOutput('Incorrect solution.');
                         addRemoteLog(`HACK: Incorrect firewall solution '${solution}' attempt by ${username}.`);
                    }
                }
                break;
            case 'ftpbounce': await handlePortHack(21, 'FTPBounce'); break;
            case 'sshbounce': await handlePortHack(22, 'SSHBounce'); break;
            case 'smtpoverflow': await handlePortHack(25, 'SMTPOverflow'); break;
            case 'webserverworm': await handlePortHack(80, 'WebServerWorm'); break;
            default:
                 handleOutput(`Execution of ${command} is not implemented as a hacking tool.`);
        }
        setIsProcessing(false);
        return;
    }


    switch (command.toLowerCase()) {
        case 'help': {
            const commandList = [
                '  help           - Show this help message',
                '  ls [path]      - List files and directories (auth required)',
                '  cd <path>      - Change directory (auth required)',
                '  cat <file>     - Display file content (auth required)',
                '  echo <text>    - Display a line of text. Supports > and >> redirection.',
                '  touch <file>   - Create an empty file (local system only)',
                '  rm <file>      - Remove a file or clear its content (auth required)',
                '  reboot         - Reboots the current system',
                '  save           - Save current game state (local only)',
                '  reset-game --confirm - Deletes save data and reboots (local only)',
                '  danger         - Shows current trace danger level',
                '',
                'Network commands:',
                '  connect <ip>   - Connect to a remote system',
                '  disconnect / dc- Disconnect from the current remote system',
                '  login <user> <pass> - Authenticate to a connected system',
                '  solve <solution> - Attempt to disable a firewall with a solution.',
                '',
                'Hacking tools (run from your machine):',
            ];

            const availableTools = allExecutables.map(e => `  ${e.name.split('.')[0]}`.padEnd(17, ' ') + `- ${e.content}`).join('\n');

            const helpText = [
                'Available commands:',
                ...commandList,
                availableTools,
                '',
                '  clear          - Clear the terminal screen',
            ].join('\n');
            handleOutput(helpText);
            break;
        }
        case 'ls': {
            if(!checkAuth()) break;
            const pathArg = args[0] || '.';
            const targetPath = resolvePath(pathArg);
            
            let targetNode: { children?: FileSystemNode[] } | null = { children: fileSystem };
            let currentPathResolved = true;

            for(const part of targetPath) {
                if (!targetNode?.children) {
                    currentPathResolved = false;
                    break;
                }
                const nextNode = targetNode.children.find(c => c.name === part && c.type === 'folder');
                if (nextNode) {
                    targetNode = nextNode;
                } else {
                    const fileNode = targetNode.children.find(c => c.name === part && c.type === 'file');
                    if(fileNode && targetPath[targetPath.length-1] === part) {
                        targetNode = null;
                        handleOutput(fileNode.name);
                    } else {
                        currentPathResolved = false;
                    }
                    break;
                }
            }

            if (currentPathResolved && targetNode && targetNode.children) {
                const content = targetNode.children.map(node => `${node.name}${node.type === 'folder' ? '/' : ''}`).join('  ');
                handleOutput(content || "(empty)");
            } else if (!currentPathResolved) {
                 handleOutput(`ls: cannot access '${pathArg}': No such file or directory`);
            }
            break;
        }
        case 'cd': {
            if(!checkAuth()) break;
            const pathArg = args[0];
            if (!pathArg || pathArg === '~' || pathArg === '~/') {
                if (connectedIp === '127.0.0.1') {
                    setCurrentDirectory(['home', username]);
                } else {
                    setCurrentDirectory([]); // Root for remote
                }
                break;
            }
             if (pathArg === '/') {
                setCurrentDirectory([]);
                break;
            }
            
            const newPath = resolvePath(pathArg);

            let targetNode: FileSystemNode | null | { children?: FileSystemNode[] } = { children: fileSystem };
            let isValid = true;
            for(const part of newPath) {
                const folder = targetNode.children?.find(c => c.name === part && c.type === 'folder');
                if (folder) {
                    targetNode = folder;
                } else {
                    isValid = false;
                    break;
                }
            }
            
            if (isValid) {
                setCurrentDirectory(newPath);
            } else {
                handleOutput(`cd: no such file or directory: ${pathArg}`);
            }
            break;
        }
        case 'cat': {
            if(!checkAuth()) break;
            const filename = args.join(' ');
            if (!filename) {
                handleOutput(`cat: missing file operand`);
                break;
            }
            const path = resolvePath(filename);
            const file = findNodeByPath(path, fileSystem);
            
            if (file) {
                if (file.type === 'file') {
                    handleOutput(file.content || '');
                } else {
                    handleOutput(`cat: ${filename}: Is a directory`);
                }
            } else {
                handleOutput(`cat: ${filename}: No such file or directory`);
            }
            break;
        }
        case 'echo': {
            if(!checkAuth()) break;
            handleOutput(args.join(' '));
            break;
        }
        case 'touch': {
            if(!checkAuth()) break;
            if (connectedIp !== '127.0.0.1') {
                 handleOutput(`touch: cannot create files on remote systems.`);
                 break;
            }
            handleOutput(`touch: This command is not fully implemented. Use 'nano' to create and edit files.`);
            break;
        }
        case 'nano':
            if (!checkAuth()) { setIsProcessing(false); return; }
            const pathArg = args[0];
            if (!pathArg) {
                handleOutput(`nano: missing file operand`);
            } else {
                const filePath = resolvePath(pathArg);
                if (connectedIp !== '127.0.0.1') {
                    handleOutput(`nano: cannot edit files on remote systems yet.`);
                } else {
                    const file = findNodeByPath(filePath, fileSystem);
                    if (file && file.type === 'folder') {
                        handleOutput(`nano: cannot edit directory '${pathArg}'`);
                    } else {
                        onOpenFileEditor(filePath, file?.content || '');
                    }
                }
            }
            break;
        case 'forkbomb':
            if (!checkAuth()) { setIsProcessing(false); return; }
            if (connectedIp === '127.0.0.1') {
                handleOutput('SYSTEM CRASH IMMINENT. REBOOTING...');
                addLog(`CRITICAL: Forkbomb executed on local machine. System rebooting.`);
                setTimeout(onReboot, 1000);
            } else {
                let targetPC = getCurrentPc();
                if (targetPC) {
                    addRemoteLog(`CRITICAL: Forkbomb executed by ${username}. System crashing.`);
                    
                    setNetwork(currentNetwork => currentNetwork.map(pc => {
                        if (pc.id === targetPC!.id) {
                            const newFileSystem = updateNodeByPath(pc.fileSystem, ['sys', 'XserverOS.sys'], (node) => ({ ...node, content: 'SYSTEM KERNEL CORRUPTED' }));
                            return { ...pc, fileSystem: newFileSystem };
                        }
                        return pc;
                    }));

                    disconnect(true);
                }
            }
            break;
        case 'rm': {
            if (!checkAuth()) break;

            const fileArg = args[0];
            if (!fileArg) {
                handleOutput('rm: missing operand');
                break;
            }
            const filePath = resolvePath(fileArg);
            const fileNode = findNodeByPath(filePath, fileSystem);

            if (!fileNode) {
                handleOutput(`rm: cannot remove '${fileArg}': No such file or directory`);
                break;
            }
            if (fileNode.type === 'folder') {
                handleOutput(`rm: cannot remove '${fileArg}': Is a directory`);
                break;
            }
            
            if (fileNode.name === 'XserverOS.sys') {
                handleOutput(`WARNING: This is a critical system file. Deleting it will cause system instability.`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (connectedIp === '127.0.0.1') {
                    setNetwork(currentNetwork => {
                        const newNetwork = currentNetwork.map(pc => {
                            if (pc.ip === connectedIp) {
                                const newFs = updateNodeByPath(pc.fileSystem, filePath, () => null);
                                return { ...pc, fileSystem: newFs };
                            }
                            return pc;
                        });
                        return newNetwork;
                    });
                    
                    setTimeout(() => {
                        saveGameState();
                        addLog(`CRITICAL: XserverOS.sys deleted from local machine. Next reboot will fail.`);
                        handleOutput('Deletion of XserverOS.sys complete.');
                    }, 100);

                } else {
                    addRemoteLog(`CRITICAL: XserverOS.sys deleted by ${username}. System crashing.`);
                    setNetwork(currentNetwork => currentNetwork.map(pc => {
                        if (pc.ip === connectedIp) {
                            const newFs = updateNodeByPath(pc.fileSystem, filePath, () => null);
                            return { ...pc, fileSystem: newFs };
                        }
                        return pc;
                    }));
                    disconnect(true);
                }
                break;
            }

            if (fileNode.isSystemFile) {
                handleOutput(`rm: cannot remove '${fileArg}': Permission denied`);
                if (connectedIp !== '127.0.0.1') {
                    addRemoteLog(`SECURITY: Denied attempt to remove system file ${fileNode.name} by ${username}.`);
                }
                break;
            }
            
            const isAccessLog = fileNode.name === 'access.log';
            const updater = isAccessLog ? (node: FileSystemNode) => ({ ...node, content: `Log cleared by ${username} at ${new Date().toISOString()}\n` }) : () => null;

            setNetwork(currentNetwork => currentNetwork.map(pc => {
                if (pc.ip === connectedIp) {
                    const newFs = updateNodeByPath(pc.fileSystem, filePath, updater);
                    return { ...pc, fileSystem: newFs };
                }
                return pc;
            }));

            if(isAccessLog) {
                handleOutput(`Cleared content of '${fileArg}'`);
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: Log file '${fileArg}' cleared by user ${username}.`);
                addLog(`EVENT: Log file '${fileArg}' on ${connectedIp} cleared.`);
            } else {
                handleOutput(`Removed '${fileArg}'`);
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: File removed by user ${username}: ${filePath.join('/')}`);
                addLog(`EVENT: File '${fileArg}' on ${connectedIp} removed.`);
            }

            break;
        }
        case 'connect': {
            const targetIp = args[0];

            if (!targetIp) {
                handleOutput('connect: missing target IP address');
                break;
            }

            const targetPC = network.find(pc => pc.ip === targetIp);
            
            if (!targetPC) {
                handleOutput(`connect: unable to resolve host ${targetIp}`);
                break;
            }
             if (targetPC.ip === connectedIp) {
                handleOutput(`connect: already connected to ${targetIp}`);
                break;
            }
            
            setConnectedIp(targetIp);
            setIsAuthenticated(false);
            setCurrentDirectory([]);
            onDiscovered(targetPC.id);
            handleOutput(`Connection established to ${targetPC.name} (${targetPC.ip}).`);
            handleOutput(`Use 'login' to authenticate.`);
            addLog(`EVENT: Connection established to ${targetPC.name} (${targetPC.ip})`);
            addRemoteLog(`Connection established from unknown source.`);
            checkAndTriggerTrace(targetPC);
            break;
        }
        case 'login': {
            if (connectedIp === '127.0.0.1') {
                handleOutput('login: cannot login to local machine.');
                break;
            }
            if (isAuthenticated) {
                handleOutput('login: already authenticated.');
                break;
            }

            const [userArg, passArg] = args;
            if (!userArg || !passArg) {
                handleOutput('login: missing user or password operand.');
                break;
            }
            
            const targetPC = getCurrentPc();
            if (targetPC && targetPC.auth.user === userArg && targetPC.auth.pass === passArg) {
                setIsAuthenticated(true);
                setCurrentDirectory([]);
                handleOutput('Authentication successful.');
                addRemoteLog(`AUTH: Login successful as user ${userArg}.`);
                addLog(`AUTH: Authenticated on ${targetPC.ip} as ${userArg}.`);
            } else {
                handleOutput('Authentication failed.');
                addRemoteLog(`AUTH: Failed login attempt with user ${userArg}.`);
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
                 handleOutput('System is going down for reboot NOW!');
                 addLog(`CRITICAL: Local system reboot initiated.`);
                 setTimeout(onReboot, 1000);
            } else {
                handleOutput(`Rebooting remote system...`);
                addRemoteLog(`COMMAND: Reboot initiated by user ${username}.`);
                disconnect();
            }
            break;
        }
        case 'scan': {
            const scanTarget = getCurrentPc();
            if (scanTarget && scanTarget.links) {
                const linkedPcs = scanTarget.links.map(linkId => network.find(p => p.id === linkId)).filter(Boolean) as PC[];
                if (linkedPcs.length > 0) {
                    const output = ['Scanning network... Found linked devices:', ...linkedPcs.map(pc => `  - ${pc.name} (${pc.ip})`)].join('\n');
                    handleOutput(output);
                } else {
                    handleOutput('No linked devices found.');
                }
            } else {
                handleOutput('Scan failed: could not determine current network segment.');
            }
            break;
        }
        case 'danger':
            handleOutput(`Current danger level: ${dangerLevel}%`);
            break;
        case 'save': {
            if (connectedIp !== '127.0.0.1') {
                handleOutput('save: can only be run on local machine.');
                break;
            }
            saveGameState();
            handleOutput('Game state saved.');
            break;
        }
        case 'reset-game': {
            if (connectedIp !== '127.0.0.1') {
                handleOutput('reset-game: can only be run on local machine.');
                break;
            }
            if (args[0] === '--confirm') {
                resetGame();
                handleOutput('Save data deleted. System will reboot.');
            } else {
                handleOutput('This is a destructive action. Type `reset-game --confirm` to proceed.');
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
            handleOutput(`command not found: ${command}`);
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
        const mainCommands = ['help', 'ls', 'cd', 'cat', 'echo', 'touch', 'rm', 'connect', 'disconnect', 'dc', 'login', 'solve', 'clear', 'reboot', 'save', 'reset-game', 'danger', 'scan'];
        const allCommands = [...new Set([...mainCommands, ...executables])];
        const possibilities = allCommands.filter(cmd => cmd.startsWith(lastPart));

        if (possibilities.length === 1) {
            setInput(possibilities[0] + ' ');
        } else if (possibilities.length > 1) {
            const newHistory = [...history, { type: 'command', content: `${getPrompt()}${input}` }, { type: 'output', content: possibilities.join('  ') }];
            setHistory(newHistory);
        }
        return;
    }
     
    // File/Path completion
    if (!isAuthenticated) return;
    
    const pathPrefix = lastPart.substring(0, lastPart.lastIndexOf('/') + 1);
    const partialName = lastPart.substring(lastPart.lastIndexOf('/') + 1);
    
    const targetDir = resolvePath(pathPrefix || '.');
    
    let currentLevel: FileSystemNode[] | undefined = fileSystem;
    for (const part of targetDir) {
        if (!currentLevel) break;
        const next = currentLevel.find(n => n.name === part && n.type === 'folder');
        currentLevel = next?.children;
    }

    if (!currentLevel) return;

    const possibilities = currentLevel.filter(child => child.name.startsWith(partialName));

    if (possibilities.length === 1) {
        const completion = possibilities[0];
        const newText = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '') + pathPrefix + completion.name;
        setInput(newText + (completion.type === 'folder' ? '/' : ' '));
    } else if (possibilities.length > 1) {
        const newHistory = [...history, { type: 'command', content: `${getPrompt()}${input}` }, { type: 'output', content: possibilities.map(p => p.name).join('  ') }];
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
              ) : (
                <span className={item.type === 'output' ? '' : ''}>{item.content}</span>
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
