
'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { network } from '@/lib/network';
import { FileSystemNode, PC } from '@/lib/network/types';

interface HistoryItem {
  type: 'command' | 'output';
  content: string;
}

interface TerminalProps {
    username: string;
    onSoundEvent?: (event: 'click') => void;
    onOpenFileEditor: (path: string[], content: string) => void;
    onHack: (pcId: string) => void;
    hackedPcs: Set<string>;
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

export default function Terminal({ username, onSoundEvent, onOpenFileEditor, onHack, hackedPcs }: TerminalProps) {
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
  const [networkState, setNetworkState] = useState<PC[]>([]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const personalizeFileSystem = (nodes: FileSystemNode[], user: string): FileSystemNode[] => {
      return JSON.parse(JSON.stringify(nodes).replace(/<user>/g, user));
  };
    
  useEffect(() => {
    const initialNetworkState = JSON.parse(JSON.stringify(network)); // Deep copy
    setNetworkState(initialNetworkState);
    const playerPc = initialNetworkState.find((p: PC) => p.id === 'player-pc');
    if (playerPc) {
        setFileSystem(personalizeFileSystem(playerPc.fileSystem, username));
    }
  }, [username]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

    const getCurrentPc = () => {
        return networkState.find(pc => pc.ip === connectedIp);
    }

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

  const handleCommand = () => {
    const fullCommand = input.trim();
    if (fullCommand === '') {
        setHistory([...history, { type: 'command', content: getPrompt() }]);
        return;
    };

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
    
    const recursiveUpdate = (nodes: FileSystemNode[], path: string[], updater: (items: FileSystemNode[]) => FileSystemNode[]): FileSystemNode[] => {
        if (path.length === 0) {
            return updater(nodes);
        }

        const [current, ...rest] = path;
        return nodes.map(node => {
            if (node.name === current && node.type === 'folder') {
                return { ...node, children: recursiveUpdate(node.children || [], rest, updater) };
            }
            return node;
        });
    };

    const handleOutput = (output: string) => {
        if ((redirect || append) && redirectPathArg && connectedIp === '127.0.0.1') {
             const resolvedRedirectPath = resolvePath(redirectPathArg);
             const redirectFilename = resolvedRedirectPath.pop() || '';
             const parentPath = resolvedRedirectPath;

             const newFileSystem = recursiveUpdate(fileSystem, parentPath, (items) => {
                const existingIndex = items.findIndex(item => item.name === redirectFilename);
                if (existingIndex !== -1) {
                    const newItems = [...items];
                    const existingFile = newItems[existingIndex];
                    if (existingFile.isSystemFile) {
                        newHistory.push({ type: 'output', content: `error: Permission denied: ${redirectFilename} is a system file.`});
                        return items;
                    }
                    newItems[existingIndex] = { ...existingFile, content: append ? (existingFile.content || '') + '\n' + output : output };
                    return newItems;
                }
                const newFile: FileSystemNode = { id: `file-${Date.now()}`, name: redirectFilename, type: 'file', content: output };
                return [...items, newFile];
             });
             setFileSystem(newFileSystem);
        } else if (redirect || append) {
            newHistory.push({ type: 'output', content: `error: Permission denied: Cannot write to remote file system.`});
        }
        else {
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

    // --- Special case for non-auth commands on remote systems ---
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
        } else if (targetPC.requiredPorts > 0) {
             newHistory.push({ type: 'output', content: `PortHack failed: ${targetPC.requiredPorts} open ports required. Cannot breach security.` });
        } else {
            newHistory.push({ type: 'output', content: `PortHack successful on ${targetPC.ip}. Firewall breached.` });
            newHistory.push({ type: 'output', content: `  Password cracked: ${targetPC.auth.pass}` });
            onHack(targetPC.id);
        }
        setHistory(newHistory);
        setInput('');
        return;
    }


    // --- Dynamic Command Execution from local /bin ---
    const playerPcFs = networkState.find(p => p.id === 'player-pc')?.fileSystem;
    const localBinFolder = playerPcFs ? personalizeFileSystem(playerPcFs, username).find(node => node.name === 'bin' && node.type === 'folder') : undefined;
    const executable = localBinFolder?.children?.find(file => file.name === `${command}.bin` || file.name === `${command}.exe`);

    if (executable) {
        if (command === 'nano') {
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
        } else if (command.toLowerCase() === 'scan') {
            if (!checkAuth()) { setHistory(newHistory); setInput(''); return; }
            const currentPc = getCurrentPc();
            if (currentPc && currentPc.links) {
                const linkedPcs = currentPc.links.map(linkId => networkState.find(p => p.id === linkId)).filter(Boolean) as PC[];
                if (linkedPcs.length > 0) {
                    const output = ['Scanning network... Found linked devices:', ...linkedPcs.map(pc => `  - ${pc.name} (${pc.ip})`)].join('\n');
                    handleOutput(output);
                } else {
                    handleOutput('No linked devices found.');
                }
            } else {
                handleOutput('Scan failed: could not determine current network segment.');
            }
        } else if (command.toLowerCase() === 'firewallanalyzer') {
            const targetPC = getCurrentPc();
            if (connectedIp === '127.0.0.1' || !targetPC) {
                newHistory.push({ type: 'output', content: 'FirewallAnalyzer: Must be connected to a remote system.' });
            } else if (!targetPC.firewall.enabled) {
                newHistory.push({ type: 'output', content: 'Firewall is not active.' });
            } else {
                 newHistory.push({ type: 'output', content: `Analyzing firewall... Solution found: ${targetPC.firewall.solution}` });
            }
        } else {
             newHistory.push({ type: 'output', content: `Execution of ${command} is not yet implemented.` });
        }

        setHistory(newHistory);
        setInput('');
        return;
    }
    // --- End Dynamic Command Execution ---


    switch (command.toLowerCase()) {
        case 'help': {
            const helpText = [
                'Available commands:',
                '  help           - Show this help message',
                '  ls [path]      - List files and directories (auth required)',
                '  cd <path>      - Change directory (auth required)',
                '  cat <file>     - Display file content (auth required)',
                '  echo <text>    - Display a line of text. Supports > and >> redirection.',
                '  touch <file>   - Create an empty file (local system only)',
                '  rm <file>      - Remove a file (local system only)',
                '  nano <file>    - Open a simple text editor (local system only)',
                '',
                'Network commands:',
                '  connect <ip>   - Connect to a remote system',
                '  disconnect / dc- Disconnect from the current remote system',
                '  login <user> <pass> - Authenticate to a connected system',
                '  scan           - Scan the network for linked devices (auth required)',
                '',
                'Hacking tools:',
                '  porthack       - Attempts to crack the password of a connected system',
                '  FirewallAnalyzer - Analyzes an active firewall for its solution',
                '  solve <solution> - Attempts to disable a firewall with a solution key',
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
                handleOutput(content || "");
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
            const filename = args[0];
            if (!filename) {
                newHistory.push({ type: 'output', content: 'touch: missing file operand' });
                break;
            }
            const path = resolvePath(filename);
            const newFileName = path.pop() || '';
            const parentPath = path;
            
            const existing = findNodeByPath(resolvePath(filename), fileSystem);
            if (existing) {
                break;
            }
            
            const newFile: FileSystemNode = {
                id: `file-${Date.now()}`,
                name: newFileName,
                type: 'file',
                content: '',
            };

            const newFileSystem = recursiveUpdate(fileSystem, parentPath, (items) => [...items, newFile]);
            setFileSystem(newFileSystem);
            break;
        }
        case 'rm': {
            if(!checkAuth()) break;
            if (connectedIp !== '127.0.0.1') {
                 newHistory.push({ type: 'output', content: `rm: cannot remove files on remote systems.` });
                 break;
            }
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
            
            if (fileNode.isSystemFile) {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': Permission denied` });
                break;
            }
            
            const parentPath = filePath.slice(0, -1);
            const newFileSystem = recursiveUpdate(fileSystem, parentPath, items => items.filter(item => item.id !== fileNode.id));
            setFileSystem(newFileSystem);
            break;
        }
        case 'connect': {
            const targetIp = args[0];

            if (!targetIp) {
                newHistory.push({ type: 'output', content: 'connect: missing target IP address' });
                break;
            }
            if (targetIp === connectedIp) {
                newHistory.push({ type: 'output', content: `connect: already connected to ${targetIp}` });
                break;
            }

            const targetPC = networkState.find(pc => pc.ip === targetIp);
            
            if (!targetPC) {
                newHistory.push({ type: 'output', content: `connect: unable to resolve host ${targetIp}` });
                break;
            }
            
            const currentPc = getCurrentPc();
            if (!currentPc?.links?.includes(targetPC.id)) {
                 newHistory.push({ type: 'output', content: `connect: unable to resolve host ${targetIp}` });
                 break;
            }
            
            setConnectedIp(targetIp);
            setIsAuthenticated(false);
            setFileSystem(personalizeFileSystem(targetPC.fileSystem, targetPC.auth.user));
            setCurrentDirectory([]);
            newHistory.push({ type: 'output', content: `Connection established to ${targetPC.name} (${targetPC.ip}).` });
            newHistory.push({ type: 'output', content: `Use 'login' to authenticate.` });
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
            } else {
                newHistory.push({ type: 'output', content: 'Authentication failed.' });
            }
            break;
        }
        case 'dc':
        case 'disconnect': {
            if (connectedIp === '127.0.0.1') {
                newHistory.push({ type: 'output', content: 'Cannot disconnect from local machine.' });
            } else {
                const previousHostName = getCurrentPc()?.name;
                const playerPc = networkState.find(p => p.id === 'player-pc');
                setConnectedIp('127.0.0.1');
                setIsAuthenticated(true);
                if (playerPc) {
                    setFileSystem(personalizeFileSystem(playerPc.fileSystem, username));
                }
                setCurrentDirectory(['home', username]);
                newHistory.push({ type: 'output', content: `Disconnected from ${previousHostName}.` });
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
                targetPC.firewall.enabled = false;
                setNetworkState([...networkState]); // Force re-render
                newHistory.push({ type: 'output', content: 'Firewall disabled.' });
            } else {
                 newHistory.push({ type: 'output', content: 'Incorrect solution.' });
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
     if (!isAuthenticated) return;

    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];
    if (lastPart === undefined) return;

    const pathPrefix = lastPart.substring(0, lastPart.lastIndexOf('/') + 1);
    const partialName = lastPart.substring(lastPart.lastIndexOf('/') + 1);
    
    const targetDir = resolvePath(pathPrefix || '.');
    
    let currentLevel: FileSystemNode[] | undefined = fileSystem;
    for (const part of targetDir) {
        const next = currentLevel?.find(n => n.name === part && n.type === 'folder');
        currentLevel = next?.children;
        if (!currentLevel) break;
    }

    if (!currentLevel) return;

    const possibilities = currentLevel.filter(child => child.name.startsWith(partialName));

    if (possibilities.length === 1) {
        const newText = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '') + pathPrefix + possibilities[0].name;
        setInput(newText + (possibilities[0].type === 'folder' ? '/' : ' '));
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
