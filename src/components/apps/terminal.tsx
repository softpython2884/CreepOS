
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
    onSoundEvent?: (event: 'click') => void;
    onOpenFileEditor: (path: string[], content: string) => void;
    network: PC[];
    setNetwork: (network: PC[]) => void;
    hackedPcs: Set<string>;
    onHack: (pcId: string, ip: string) => void;
    onReboot: () => void;
    addLog: (message: string) => void;
    onIncreaseDanger: (amount: number) => void;
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

export default function Terminal({ username, onSoundEvent, onOpenFileEditor, network, setNetwork, hackedPcs, onHack, onReboot, addLog, onIncreaseDanger }: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.1.0-beta]\n(c) Cauchemar Virtuel Corporation. All rights reserved." },
    { type: 'output', content: "Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Network and FS state
  const [connectedIp, setConnectedIp] = useState<string>('127.0.0.1');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentDirectory, setCurrentDirectory] = useState(['home', username]);
  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>([]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pc = network.find(p => p.ip === connectedIp);
    if (pc) {
      const userForFs = connectedIp === '127.0.0.1' ? username : pc.auth.user;
      setFileSystem(personalizeFileSystem(pc.fileSystem, userForFs));
    }
  }, [connectedIp, network, username]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

    const getCurrentPc = () => {
        return network.find(pc => pc.ip === connectedIp);
    }
    
    const allExecutables = useMemo(() => {
      const playerPcFs = initialNetworkData.find(p => p.id === 'player-pc')?.fileSystem;
      if (!playerPcFs) return [];
      const binFolder = personalizeFileSystem(playerPcFs, username).find(node => node.name === 'bin' && node.type === 'folder');
      return binFolder?.children?.filter(f => f.type === 'file' && (f.name.endsWith('.bin') || f.name.endsWith('.exe'))) || [];
    }, [username]);

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

    setNetwork(
      network.map(pc => {
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

      const logFile = findNodeByPath(['logs', 'access.log'], currentPc.fileSystem);
      const hasLogs = logFile && logFile.content && (logFile.content.includes('successful') || logFile.content.includes('disabled') || logFile.content.includes('opened'));

      if (hasLogs && currentPc.traceability) {
        onIncreaseDanger(currentPc.traceability);
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


  const handleCommand = () => {
    const fullCommand = input.trim();
    if (fullCommand === '') {
        setHistory([...history, { type: 'command', content: getPrompt() }]);
        return;
    };

    addLog(`COMMAND: Executed '${fullCommand}' on ${connectedIp}`);
    setCommandHistory(prev => [fullCommand, ...prev]);
    setHistoryIndex(-1);

    let newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${fullCommand}` }];

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
            newHistory.push({ type: 'output', content: `error: Redirection not yet implemented for this command.` });
        } else {
            newHistory.push({ type: 'output', content: output });
        }
    }
    
    const checkAuth = () => {
        if (!isAuthenticated) {
            newHistory.push({ type: 'output', content: 'error: Permission denied. You are not authenticated.' });
            return false;
        }
        return true;
    }

    const handlePortHack = (portNumber: number, portName: string) => {
      const targetPC = getCurrentPc();
      if (connectedIp === '127.0.0.1' || !targetPC) {
        newHistory.push({ type: 'output', content: `${portName}: Must be connected to a remote system.` });
        return;
      }
      if (targetPC.firewall.enabled) {
        newHistory.push({ type: 'output', content: `${portName} failed: Active firewall detected.` });
        addRemoteLog(`HACK: ${portName} failed on port ${portNumber}. Reason: Firewall active.`);
        return;
      }
      if (targetPC.proxy.enabled) {
        newHistory.push({ type: 'output', content: `${portName} failed: Active proxy detected.` });
        addRemoteLog(`HACK: ${portName} failed on port ${portNumber}. Reason: Proxy active.`);
        return;
      }
      const port = targetPC.ports.find(p => p.port === portNumber);
      if (!port) {
        newHistory.push({ type: 'output', content: `${portName} failed: Port ${portNumber} not found on this system.` });
        return;
      }
      if (port.isOpen) {
        newHistory.push({ type: 'output', content: `Port ${portNumber} is already open.` });
        return;
      }
  
      setNetwork(network.map(pc => {
        if (pc.id === targetPC.id) {
          const newPorts = pc.ports.map(p => p.port === portNumber ? { ...p, isOpen: true } : p);
          return { ...pc, ports: newPorts };
        }
        return pc;
      }));
  
      newHistory.push({ type: 'output', content: `${port.service} port (${portNumber}) is now open.` });
      addRemoteLog(`HACK: Port ${portNumber} (${port.service}) opened by ${username}.`);
    };

    // --- Special cases for non-auth commands on remote systems ---
    if (command.toLowerCase() === 'porthack') {
        const targetPC = getCurrentPc();
        if (connectedIp === '127.0.0.1') {
            newHistory.push({ type: 'output', content: 'porthack: cannot run on local machine.' });
        } else if (!targetPC) {
            newHistory.push({ type: 'output', content: 'porthack: critical error, no target system.' });
        } else if (hackedPcs.has(targetPC.id)) {
            newHistory.push({ type: 'output', content: `porthack: System ${targetPC.ip} already breached. Password: ${targetPC.auth.pass}` });
        } else if (targetPC.firewall.enabled) {
            newHistory.push({ type: 'output', content: `ERROR: Active firewall detected. Connection terminated.`});
            addRemoteLog(`HACK: PortHack failed. Reason: Firewall active.`);
        } else if (targetPC.proxy.enabled) {
            newHistory.push({ type: 'output', content: `ERROR: Active proxy detected. Connection bounced.` });
            addRemoteLog(`HACK: PortHack failed. Reason: Proxy active.`);
        } else {
            const openPorts = targetPC.ports.filter(p => p.isOpen).length;
            if (openPorts >= targetPC.requiredPorts) {
                newHistory.push({ type: 'output', content: `PortHack successful on ${targetPC.ip}. Firewall breached.` });
                newHistory.push({ type: 'output', content: `  Password cracked: ${targetPC.auth.pass}` });
                addRemoteLog(`HACK: PortHack successful. Root access gained by ${username}.`);
                onHack(targetPC.id, targetPC.ip);
            } else {
                newHistory.push({ type: 'output', content: `PortHack failed: ${targetPC.requiredPorts} open port(s) required. (${openPorts}/${targetPC.requiredPorts} open)` });
                addRemoteLog(`HACK: PortHack failed. Reason: Insufficient open ports.`);
            }
        }
        setHistory(newHistory);
        setInput('');
        return;
    }

    const executable = allExecutables.find(file => file.name.startsWith(command.toLowerCase()) && (file.name.endsWith('.bin') || file.name.endsWith('.exe')));

    if (executable) {
        const cmdName = executable.name.split('.')[0].toLowerCase();
        if (cmdName === 'nano') {
            if (!checkAuth()) { setHistory(newHistory); setInput(''); return; }
            const pathArg = args[0];
            if (!pathArg) {
                newHistory.push({ type: 'output', content: `nano: missing file operand` });
            } else {
                const filePath = resolvePath(pathArg);
                if (connectedIp !== '127.0.0.1') {
                    newHistory.push({ type: 'output', content: `nano: cannot edit files on remote systems yet.` });
                } else {
                    const file = findNodeByPath(filePath, fileSystem);
                    if (file && file.type === 'folder') {
                        newHistory.push({ type: 'output', content: `nano: cannot edit directory '${pathArg}'` });
                    } else {
                        onOpenFileEditor(filePath, file?.content || '');
                    }
                }
            }
        } else if (cmdName === 'scan') {
             if (!checkAuth()) { setHistory(newHistory); setInput(''); return; }
            const currentPc = getCurrentPc();
            if (currentPc && currentPc.links) {
                const linkedPcs = currentPc.links.map(linkId => network.find(p => p.id === linkId)).filter(Boolean) as PC[];
                if (linkedPcs.length > 0) {
                    const output = ['Scanning network... Found linked devices:', ...linkedPcs.map(pc => `  - ${pc.name} (${pc.ip})`)].join('\n');
                    handleOutput(output);
                } else {
                    handleOutput('No linked devices found.');
                }
            } else {
                handleOutput('Scan failed: could not determine current network segment.');
            }
        } else if (cmdName === 'analyze') {
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1' || !targetPC) {
                newHistory.push({ type: 'output', content: 'analyze: Must be connected to a remote system.' });
            } else if (!targetPC.firewall.enabled) {
                newHistory.push({ type: 'output', content: 'Firewall is not active.' });
            } else {
                 newHistory.push({ type: 'output', content: `Analyzing firewall... Solution found: ${targetPC.firewall.solution}` });
                 addRemoteLog(`HACK: Firewall analysis by ${username} revealed solution: ${targetPC.firewall.solution}`);
            }
        } else if (cmdName === 'probe') {
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1' || !targetPC) {
                newHistory.push({ type: 'output', content: 'probe: Must be connected to a remote system.' });
            } else {
                const secInfo = [
                    `Security Probe results for ${targetPC.ip}:`,
                    `  Firewall: ${targetPC.firewall.enabled ? `ACTIVE (Complexity: ${targetPC.firewall.complexity})` : 'INACTIVE'}`,
                    `  Proxy: ${targetPC.proxy.enabled ? `ACTIVE (Level: ${targetPC.proxy.level})` : 'INACTIVE'}`,
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
                newHistory.push({ type: 'output', content: secInfo.join('\n') });
            }
        } else if (cmdName === 'overload') {
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1' || !targetPC) {
                newHistory.push({ type: 'output', content: 'overload: Must be connected to a remote system.' });
            } else if (!targetPC.proxy.enabled) {
                newHistory.push({ type: 'output', content: 'Proxy is not active.' });
            } else {
                const requiredNodes = targetPC.proxy.level;
                const availableNodes = hackedPcs.size;
                if (availableNodes >= requiredNodes) {
                    setNetwork(network.map(pc => pc.id === targetPC.id ? { ...pc, proxy: { ...pc.proxy, enabled: false } } : pc));
                    newHistory.push({ type: 'output', content: `Proxy disabled on ${targetPC.ip}.` });
                    addRemoteLog(`HACK: Proxy on ${targetPC.ip} disabled via overload by ${username}.`);
                } else {
                    newHistory.push({ type: 'output', content: `Overload failed. Insufficient nodes. Required: ${requiredNodes}, Available: ${availableNodes}` });
                    addRemoteLog(`HACK: Proxy overload failed. Required ${requiredNodes} nodes, have ${availableNodes}.`);
                }
            }
        } else if (cmdName.toLowerCase() === 'ftpbounce') {
            handlePortHack(21, 'FTPBounce');
        } else if (cmdName.toLowerCase() === 'sshbounce') {
            handlePortHack(22, 'SSHBounce');
        } else if (cmdName.toLowerCase() === 'smtpoverflow') {
            handlePortHack(25, 'SMTPOverflow');
        } else if (cmdName.toLowerCase() === 'webserverworm') {
            handlePortHack(80, 'WebServerWorm');
        } else if (cmdName.toLowerCase() === 'forkbomb') {
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1') {
                newHistory.push({ type: 'output', content: 'SYSTEM CRASH IMMINENT. REBOOTING...' });
                addLog(`CRITICAL: Forkbomb executed on local machine. System rebooting.`);
                setTimeout(onReboot, 1000);
            } else if (targetPC) {
                addRemoteLog(`CRITICAL: Forkbomb executed by ${username}. System crashing.`);
                
                const newFileSystem = updateNodeByPath(targetPC.fileSystem, ['sys', 'XserverOS.sys'], (node) => ({ ...node, content: 'SYSTEM KERNEL CORRUPTED' }));
                setNetwork(network.map(pc => pc.id === targetPC.id ? {...pc, fileSystem: newFileSystem} : pc));

                disconnect(true);
            }
        }
        else {
             newHistory.push({ type: 'output', content: `Execution of ${command} is not yet implemented.` });
        }

        setHistory(newHistory);
        setInput('');
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
                '',
                'Network commands:',
                '  connect <ip>   - Connect to a remote system',
                '  disconnect / dc- Disconnect from the current remote system',
                '  login <user> <pass> - Authenticate to a connected system',
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
            newHistory.push({ type: 'output', content: helpText });
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
                 newHistory.push({ type: 'output', content: `ls: cannot access '${pathArg}': No such file or directory` });
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
                newHistory.push({ type: 'output', content: `cd: no such file or directory: ${pathArg}` });
            }
            break;
        }
        case 'cat': {
            if(!checkAuth()) break;
            const filename = args.join(' ');
            if (!filename) {
                newHistory.push({ type: 'output', content: `cat: missing file operand` });
                break;
            }
            const path = resolvePath(filename);
            const file = findNodeByPath(path, fileSystem);
            
            if (file) {
                if (file.type === 'file') {
                    handleOutput(file.content || '');
                } else {
                    newHistory.push({ type: 'output', content: `cat: ${filename}: Is a directory` });
                }
            } else {
                newHistory.push({ type: 'output', content: `cat: ${filename}: No such file or directory` });
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
                 newHistory.push({ type: 'output', content: `touch: cannot create files on remote systems.` });
                 break;
            }
            newHistory.push({ type: 'output', content: `touch: This command is not fully implemented. Use 'nano' to create and edit files.` });
            break;
        }
        case 'rm': {
            if(!checkAuth()) break;
            
            const fileArg = args[0];
            if (!fileArg) {
                newHistory.push({ type: 'output', content: 'rm: missing operand' });
                break;
            }
            const filePath = resolvePath(fileArg);

            const fileNode = findNodeByPath(filePath, fileSystem);

            if (!fileNode) {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': No such file or directory` });
                break;
            }

            if (fileNode.type === 'folder') {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': Is a directory` });
                break;
            }
            
            if (fileNode.name === 'XserverOS.sys') {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': Operation not permitted. This is a critical system file.` });
                if (connectedIp !== '127.0.0.1') {
                    addRemoteLog(`SECURITY: Denied attempt to remove critical system file XserverOS.sys by ${username}.`);
                }
                break;
            }

            if (fileNode.isSystemFile) {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': Permission denied` });
                break;
            }
            
            const isAccessLog = fileNode.name === 'access.log';
            const updater = isAccessLog ? (node: FileSystemNode) => ({ ...node, content: `Log cleared by ${username} at ${new Date().toISOString()}\n` }) : () => null;

            setNetwork(prevNetwork => prevNetwork.map(pc => {
                if (pc.ip === connectedIp) {
                    const newFs = updateNodeByPath(pc.fileSystem, filePath, updater);
                    return { ...pc, fileSystem: newFs };
                }
                return pc;
            }));

            if(isAccessLog) {
                newHistory.push({ type: 'output', content: `Cleared content of '${fileArg}'` });
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: Log file '${fileArg}' cleared by user ${username}.`);
                addLog(`EVENT: Log file '${fileArg}' on ${connectedIp} cleared.`);
            } else {
                newHistory.push({ type: 'output', content: `Removed '${fileArg}'` });
                if (connectedIp !== '127.0.0.1') addRemoteLog(`EVENT: File removed by user ${username}: ${filePath.join('/')}`);
                addLog(`EVENT: File '${fileArg}' on ${connectedIp} removed.`);
            }

            break;
        }
        case 'connect': {
            const targetIp = args[0];

            if (!targetIp) {
                newHistory.push({ type: 'output', content: 'connect: missing target IP address' });
                break;
            }

            const targetPC = network.find(pc => pc.ip === targetIp);
            
            if (!targetPC) {
                newHistory.push({ type: 'output', content: `connect: unable to resolve host ${targetIp}` });
                break;
            }
             if (targetPC.ip === connectedIp) {
                newHistory.push({ type: 'output', content: `connect: already connected to ${targetIp}` });
                break;
            }
            
            setConnectedIp(targetIp);
            setIsAuthenticated(false);
            setCurrentDirectory([]);
            newHistory.push({ type: 'output', content: `Connection established to ${targetPC.name} (${targetPC.ip}).` });
            newHistory.push({ type: 'output', content: `Use 'login' to authenticate.` });
            addLog(`EVENT: Connection established to ${targetPC.name} (${targetPC.ip})`);
            addRemoteLog(`Connection established from unknown source.`);
            break;
        }
        case 'login': {
            const [userArg, passArg] = args;
            if (connectedIp === '127.0.0.1') {
                newHistory.push({ type: 'output', content: 'login: cannot login to local machine.' });
                break;
            }
            if (isAuthenticated) {
                newHistory.push({ type: 'output', content: 'login: already authenticated.' });
                break;
            }
            if (!userArg || !passArg) {
                newHistory.push({ type: 'output', content: 'login: missing user or password operand.' });
                break;
            }
            
            const targetPC = getCurrentPc();
            if (targetPC && targetPC.auth.user === userArg && targetPC.auth.pass === passArg) {
                setIsAuthenticated(true);
                setCurrentDirectory([]);
                newHistory.push({ type: 'output', content: 'Authentication successful.' });
                addRemoteLog(`AUTH: Login successful as user ${userArg}.`);
                addLog(`AUTH: Authenticated on ${targetPC.ip} as ${userArg}.`);
            } else {
                newHistory.push({ type: 'output', content: 'Authentication failed.' });
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
                 newHistory.push({ type: 'output', content: 'System is going down for reboot NOW!' });
                 addLog(`CRITICAL: Local system reboot initiated.`);
                 setTimeout(onReboot, 1000);
            } else {
                newHistory.push({ type: 'output', content: `Rebooting remote system...` });
                addRemoteLog(`COMMAND: Reboot initiated by user ${username}.`);
                disconnect();
            }
            break;
        }
        case 'solve': {
            const solution = args[0];
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1' || !targetPC) {
                newHistory.push({ type: 'output', content: 'solve: Must be connected to a remote system.' });
            } else if (!targetPC.firewall.enabled) {
                newHistory.push({ type: 'output', content: 'Firewall is not active.' });
            } else if (targetPC.firewall.solution === solution) {
                setNetwork(network.map(pc => pc.id === targetPC.id ? { ...pc, firewall: { ...pc.firewall, enabled: false } } : pc));
                newHistory.push({ type: 'output', content: 'Firewall disabled.' });
                addRemoteLog(`HACK: Firewall disabled by ${username} with solution: ${solution}.`);
            } else {
                 newHistory.push({ type: 'output', content: 'Incorrect solution.' });
                 addRemoteLog(`HACK: Incorrect firewall solution '${solution}' attempt by ${username}.`);
            }
            break;
        }
        case 'clear': {
            setHistory([]);
            setInput('');
            return;
        }
        case '':
            break;
        default:
            newHistory.push({ type: 'output', content: `command not found: ${command}` });
            break;
    }


    setHistory(newHistory);
    setInput('');
  };

  const handleTabCompletion = () => {
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];

    if (lastPart === undefined) return;

    // Command completion
    if (parts.length === 1) {
        const executables = allExecutables.map(f => f.name.split('.')[0].toLowerCase());
        const mainCommands = ['help', 'ls', 'cd', 'cat', 'echo', 'touch', 'rm', 'connect', 'disconnect', 'dc', 'login', 'solve', 'clear', 'reboot'];
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
      </div>
    </div>
  );
}

    

    