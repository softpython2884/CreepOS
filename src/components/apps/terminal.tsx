
'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSystemNode } from './content';

interface HistoryItem {
  type: 'command' | 'output';
  content: string;
}

interface TerminalProps {
    fileSystem: FileSystemNode[];
    onFileSystemUpdate: (newFileSystem: FileSystemNode[]) => void;
    username: string;
    onSoundEvent?: (event: 'click') => void;
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

export default function Terminal({ fileSystem, onFileSystemUpdate, username, onSoundEvent }: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.1.0-beta]\n(c) Cauchemar Virtuel Corporation. All rights reserved." },
    { type: 'output', content: "Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState(['home', username]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getPrompt = () => {
    const homeDir = `home/${username}`;
    let path = currentDirectory.join('/');
    if (path.startsWith(homeDir)) {
      path = '~' + path.substring(homeDir.length);
    } else if (path === '') {
        path = '/';
    }
    return `${username}@neo-system:${path}$ `;
  };
  
  const resolvePath = (pathArg: string): string[] => {
    let newPath: string[];
    if (pathArg === '/') return [];
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
    let redirectPath = '';
    let redirectFilename = '';
    
    if (redirect) {
        const split = fullCommand.split(append ? '>>' : '>');
        commandPart = split[0].trim();
        const redirectArg = split[1].trim();
        const resolvedRedirectPath = resolvePath(redirectArg);
        redirectFilename = resolvedRedirectPath.pop() || '';
        redirectPath = resolvedRedirectPath.join('/');
    }
    
    const [command, ...args] = commandPart.trim().split(' ');
    
    const getCurrentNodeChildren = () => {
        let currentLevel: FileSystemNode[] = fileSystem;
        for (const part of currentDirectory) {
            const next = currentLevel?.find(c => c.name === part && c.type === 'folder');
            if (next && next.children) {
                currentLevel = next.children;
            } else {
                return [];
            }
        }
        return currentLevel;
    }

    const currentChildren = getCurrentNodeChildren();

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
        if (redirect && redirectFilename) {
             const resolvedRedirectPath = resolvePath(redirectPath);
             const newFileSystem = recursiveUpdate(fileSystem, resolvedRedirectPath, (items) => {
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
             onFileSystemUpdate(newFileSystem);
        } else {
            newHistory.push({ type: 'output', content: output });
        }
    }

    // --- Dynamic Command Execution ---
    const binFolder = fileSystem.find(node => node.name === 'bin' && node.type === 'folder');
    const executable = binFolder?.children?.find(file => file.name === `${command}.bin`);

    if (executable) {
        switch (executable.id) {
            case 'file-exploit':
                newHistory.push({ type: 'output', content: 'Exploit successful. Sub-system vulnerabilities detected.' });
                break;
            // Future executables can be added here
            default:
                newHistory.push({ type: 'output', content: `Execution of ${command} is not yet implemented.` });
                break;
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
                '  ls [path]      - List files and directories',
                '  cd <path>      - Change directory',
                '  cat <file>     - Display file content',
                '  touch <file>   - Create an empty file',
                '  echo <text>    - Display a line of text. Supports > and >> redirection.',
                '  cp <src> <dest> - Copy a file or directory',
                '  mv <src> <dest> - Move or rename a file or directory',
                '  rm <file>      - Remove a file',
                '  clear          - Clear the terminal screen',
            ].join('\n');
            newHistory.push({ type: 'output', content: helpText });
            break;
        }
        case 'ls': {
            const pathArg = args[0] || '.';
            const targetPath = resolvePath(pathArg);
            
            let targetNode: { children?: FileSystemNode[] } | null = { children: fileSystem };
            let currentPathResolved = true;

            for(const part of targetPath) {
                const nextNode = targetNode.children?.find(c => c.name === part && c.type === 'folder');
                if (nextNode) {
                    targetNode = nextNode;
                } else {
                    // Check if the last part is a file
                    const fileNode = targetNode.children?.find(c => c.name === part && c.type === 'file');
                    if(fileNode) {
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
            const pathArg = args[0];
            if (!pathArg || pathArg === '~' || pathArg === '~/') {
                setCurrentDirectory(['home', username]);
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
            handleOutput(args.join(' '));
            break;
        }
        case 'touch': {
            const filename = args[0];
            if (!filename) {
                newHistory.push({ type: 'output', content: 'touch: missing file operand' });
                break;
            }
            const path = resolvePath(filename);
            const newFileName = path.pop() || '';
            
            const existing = findNodeByPath(resolvePath(filename), fileSystem);
            if (existing) {
                // In UNIX, touch updates the timestamp, here we just do nothing.
                break;
            }
            
            const newFile: FileSystemNode = {
                id: `file-${Date.now()}`,
                name: newFileName,
                type: 'file',
                content: '',
            };

            const newFileSystem = recursiveUpdate(fileSystem, path, (items) => [...items, newFile]);
            onFileSystemUpdate(newFileSystem);
            break;
        }
        case 'cp': {
            const [sourceArg, destArg] = args;
            if (!sourceArg || !destArg) {
                newHistory.push({ type: 'output', content: 'cp: missing file operand' });
                break;
            }
        
            const sourcePath = resolvePath(sourceArg);
            const sourceName = sourcePath[sourcePath.length - 1];
            const sourceNode = findNodeByPath(sourcePath, fileSystem);
        
            if (!sourceNode || sourceNode.type === 'folder') { // Simplified: not handling recursive copy
                newHistory.push({ type: 'output', content: `cp: cannot stat '${sourceArg}': No such file or directory or it is a directory` });
                break;
            }
        
            let destPath = resolvePath(destArg);
            let destNode = findNodeByPath(destPath, fileSystem);
        
            let finalDestPath: string[];
            let finalFileName: string;
        
            if (destNode && destNode.type === 'folder') {
                finalDestPath = destPath;
                finalFileName = sourceName;
            } else {
                finalDestPath = destPath.slice(0, -1);
                finalFileName = destPath[destPath.length - 1];
            }

            const clonedFile: FileSystemNode = { ...JSON.parse(JSON.stringify(sourceNode)), id: `file-clone-${Date.now()}`, name: finalFileName };
        
            const newFileSystem = recursiveUpdate(fileSystem, finalDestPath, (items) => {
                const existingIndex = items.findIndex(item => item.name === finalFileName);
                if (existingIndex !== -1) {
                    if (items[existingIndex].isSystemFile) {
                        newHistory.push({ type: 'output', content: `cp: cannot overwrite system file '${finalFileName}'` });
                        return items;
                    }
                    const newItems = [...items];
                    newItems[existingIndex] = clonedFile;
                    return newItems;
                }
                return [...items, clonedFile];
            });

            if (JSON.stringify(newFileSystem) !== JSON.stringify(fileSystem)) {
                onFileSystemUpdate(newFileSystem);
            }
            break;
        }
        case 'mv': {
            const [sourceArg, destArg] = args;
            if (!sourceArg || !destArg) {
                newHistory.push({ type: 'output', content: 'mv: missing file operand' });
                break;
            }

            const sourcePath = resolvePath(sourceArg);
            const sourceName = sourcePath[sourcePath.length-1];
            const sourceParentPath = sourcePath.slice(0, -1);
            const sourceNode = findNodeByPath(sourcePath, fileSystem);

            if (!sourceNode) {
                newHistory.push({ type: 'output', content: `mv: cannot stat '${sourceArg}': No such file or directory` });
                break;
            }
            if (sourceNode.isSystemFile) {
                newHistory.push({ type: 'output', content: `mv: cannot move system file '${sourceName}'` });
                break;
            }
            
            // First, remove the source file
            let fsAfterDelete = fileSystem;
            const deleteUpdater = (items: FileSystemNode[]) => items.filter(item => item.id !== sourceNode.id);
            fsAfterDelete = recursiveUpdate(fileSystem, sourceParentPath, deleteUpdater);


            // Second, add it to the destination
            let destPath = resolvePath(destArg);
            let destNode = findNodeByPath(destPath, fsAfterDelete);

            let finalDestPath: string[];
            let finalFileName: string;

             if (destNode && destNode.type === 'folder') {
                finalDestPath = destPath;
                finalFileName = sourceName;
            } else {
                finalDestPath = destPath.slice(0, -1);
                finalFileName = destPath[destPath.length - 1];
            }
            
            const movedFile: FileSystemNode = { ...sourceNode, name: finalFileName };
            const finalFileSystem = recursiveUpdate(fsAfterDelete, finalDestPath, items => [...items, movedFile]);

            onFileSystemUpdate(finalFileSystem);
            break;
        }
        case 'rm': {
            const fileArg = args[0];
            if (!fileArg) {
                newHistory.push({ type: 'output', content: 'rm: missing operand' });
                break;
            }
            const filePath = resolvePath(fileArg);
            const fileName = filePath[filePath.length - 1];
            const parentPath = filePath.slice(0, -1);

            const fileNode = findNodeByPath(filePath, fileSystem);

            if (!fileNode) {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': No such file or directory` });
                break;
            }

            if (fileNode.type === 'folder') {
                // Simplified: not implementing recursive delete
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': Is a directory` });
                break;
            }
            
            if (fileNode.isSystemFile) {
                newHistory.push({ type: 'output', content: `rm: cannot remove '${fileArg}': Permission denied` });
                break;
            }

            const newFileSystem = recursiveUpdate(fileSystem, parentPath, items => items.filter(item => item.id !== fileNode.id));
            onFileSystemUpdate(newFileSystem);
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
