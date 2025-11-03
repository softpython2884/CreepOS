
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

// Helper to navigate the file system
const getNodeAndParentFromPath = (nodes: FileSystemNode[], path: string[]): { parent: FileSystemNode | null, node: FileSystemNode | null } => {
    let parent: FileSystemNode | null = null;
    let current: FileSystemNode | null = { id: 'root', name: '/', type: 'folder', children: nodes };
    for (let i = 1; i < path.length; i++) {
        const folderName = path[i];
        if (current && current.type === 'folder' && current.children) {
            const folder = current.children.find(f => f.name === folderName);
            if (folder) {
                parent = current;
                current = folder;
            } else {
                return { parent: null, node: null };
            }
        } else {
            return { parent: null, node: null };
        }
    }
    return { parent, node: current };
};

export default function Terminal({ fileSystem, onFileSystemUpdate, username, onSoundEvent }: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.1.0-beta]\n(c) Cauchemar Virtuel Corporation. All rights reserved." },
    { type: 'output', content: "Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState(['/', 'home', username]);
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
    const homeDir = `/home/${username}`;
    let path = currentDirectory.join('/').replace('//', '/');
    if (path.startsWith(homeDir)) {
      path = '~' + path.substring(homeDir.length);
    } else if (path === '') {
        path = '/';
    }
    return `${username}@neo-system:${path}$ `;
  };
  
  const resolvePath = (pathArg: string): string[] => {
    if (!pathArg) return currentDirectory;
    
    let newPath: string[];
    if (pathArg.startsWith('/')) {
      newPath = ['/', ...pathArg.split('/').filter(p => p)];
    } else {
      newPath = [...currentDirectory];
      pathArg.split('/').forEach(part => {
        if (part === '..') {
          if (newPath.length > 1) newPath.pop();
        } else if (part && part !== '.') {
          newPath.push(part);
        }
      });
    }
    return newPath;
  }

  const handleCommand = () => {
    const fullCommand = input;
    let newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${fullCommand}` }];

    const append = fullCommand.includes('>>');
    const redirect = fullCommand.includes('>');
    
    let commandPart = fullCommand;
    let redirectPath = '';
    
    if (redirect) {
        const split = fullCommand.split(append ? '>>' : '>');
        commandPart = split[0].trim();
        redirectPath = split[1].trim();
    }
    
    const [command, ...args] = commandPart.trim().split(' ');
    
    const { node: currentNode } = getNodeAndParentFromPath(fileSystem, currentDirectory);
    const currentChildren = (currentNode?.type === 'folder' && currentNode.children) ? currentNode.children : [];

    const handleOutput = (output: string) => {
        if (redirect && redirectPath) {
             const filePath = resolvePath(redirectPath);
             const fileName = filePath.pop()!;

            const findAndModify = (nodes: FileSystemNode[]): FileSystemNode[] => {
                return nodes.map(n => {
                    const nodePath = resolvePath(n.name)
                    
                    if (n.type === 'folder' && n.children && filePath.join('/').startsWith(nodePath.join('/'))) {
                         return { ...n, children: findAndModify(n.children) };
                    }
                    
                    if (n.name === fileName && n.type === 'file' && resolvePath(n.name).join('/') === filePath.concat(fileName).join('/')) {
                        return { ...n, content: append ? (n.content || '') + output + '\n' : output + '\n' };
                    }
                    return n;
                });
            };

            const findAndCreate = (path: string[], currentNodes: FileSystemNode[]): {success: boolean, newNodes: FileSystemNode[]} => {
                if (path.length === 1) { // at the target directory
                    const existing = currentNodes.find(n => n.name === fileName);
                    if (existing && existing.type === 'folder') {
                        newHistory.push({ type: 'output', content: `bash: ${fileName}: Is a directory` });
                        return { success: false, newNodes: fileSystem };
                    }
                    if (existing) { // Overwrite or append
                        return { 
                            success: true, 
                            newNodes: currentNodes.map(n => n.name === fileName ? {...n, content: append ? (n.content || '') + output + '\n' : output + '\n' } : n)
                        };
                    } else { // Create
                        const newFile: FileSystemNode = {
                            id: `file-${Date.now()}`,
                            name: fileName,
                            type: 'file',
                            content: output + '\n',
                        };
                        return { success: true, newNodes: [...currentNodes, newFile] };
                    }
                }
            
                const nextDirName = path[1];
                const nextDir = currentNodes.find(n => n.name === nextDirName && n.type === 'folder');
            
                if (nextDir && nextDir.children) {
                    const result = findAndCreate(path.slice(1), nextDir.children);
                    if (result.success) {
                        const newChildren = result.newNodes;
                        return {
                            success: true,
                            newNodes: currentNodes.map(n => n.id === nextDir.id ? { ...n, children: newChildren } : n)
                        };
                    }
                }
                return { success: false, newNodes: fileSystem };
            };

            const { node: parentDir } = getNodeAndParentFromPath(fileSystem, filePath);

            if (!parentDir || parentDir.type !== 'folder') {
                newHistory.push({ type: 'output', content: `bash: ${redirectPath}: No such file or directory` });
                setHistory(newHistory);
                setInput('');
                return;
            }

            const updateRecursively = (nodes: FileSystemNode[], path: string[], content: string): FileSystemNode[] => {
                if (path.length === 1) { // We are in the correct directory
                    const targetName = path[0];
                    const existingIndex = nodes.findIndex(n => n.name === targetName);
            
                    if (existingIndex > -1) {
                        if (nodes[existingIndex].type === 'folder') {
                            newHistory.push({ type: 'output', content: `bash: ${targetName}: Is a directory` });
                            return nodes;
                        }
                        const updatedNode = { ...nodes[existingIndex], content: append ? (nodes[existingIndex].content || '') + content + '\n' : content + '\n' };
                        const newNodes = [...nodes];
                        newNodes[existingIndex] = updatedNode;
                        return newNodes;
                    } else {
                        const newFile: FileSystemNode = { id: `file-${Date.now()}`, name: targetName, type: 'file', content: content + '\n' };
                        return [...nodes, newFile];
                    }
                }
            
                const currentDirName = path[0];
                const dirIndex = nodes.findIndex(n => n.name === currentDirName && n.type === 'folder');
            
                if (dirIndex > -1) {
                    const newChildren = updateRecursively(nodes[dirIndex].children || [], path.slice(1), content);
                    const newNode = { ...nodes[dirIndex], children: newChildren };
                    const newNodes = [...nodes];
                    newNodes[dirIndex] = newNode;
                    return newNodes;
                } else {
                     newHistory.push({ type: 'output', content: `bash: ${currentDirName}: No such file or directory` });
                     return nodes;
                }
            }
            
            const finalPath = filePath.slice(1);
            if (finalPath[finalPath.length -1] === '') finalPath.pop(); // remove trailing slash if any
            finalPath.push(fileName)

            const newFileSystem = updateRecursively(fileSystem, finalPath, output);
            onFileSystemUpdate(newFileSystem);
            
        } else {
            newHistory.push({ type: 'output', content: output });
        }
    }

    switch (command.toLowerCase()) {
        case 'help': {
            const helpText = [
                'Available commands:',
                '  help           - Show this help message',
                '  ls             - List files and directories',
                '  cd [path]      - Change directory',
                '  cat [file]     - Display file content',
                '  touch [file]   - Create an empty file',
                '  echo [text]    - Display a line of text',
                '  echo [t] > [f] - Write text t to file f',
                '  clear          - Clear the terminal screen',
            ].join('\n');
            newHistory.push({ type: 'output', content: helpText });
            break;
        }
        case 'ls': {
            const content = currentChildren.map(node => `${node.name}${node.type === 'folder' ? '/' : ''}`).join('\n');
            handleOutput(content || "Directory is empty.");
            break;
        }
        case 'cd': {
            const pathArg = args[0];
            if (!pathArg || pathArg === '~') {
                setCurrentDirectory(['/', 'home', username]);
                break;
            }
            
            const newPath = resolvePath(pathArg);

            const { node: targetNode } = getNodeAndParentFromPath(fileSystem, newPath);

            if (targetNode && targetNode.type === 'folder') {
                setCurrentDirectory(newPath);
            } else {
                newHistory.push({ type: 'output', content: `cd: no such file or directory: ${pathArg}` });
            }
            break;
        }
        case 'cat': {
            const filename = args.join(' ');
            const file = currentChildren.find(node => node.name === filename && node.type === 'file');
            if (file) {
                handleOutput(file.content || '');
            } else {
                 const dir = currentChildren.find(node => node.name === filename && node.type === 'folder');
                 if(dir) {
                    newHistory.push({ type: 'output', content: `cat: ${filename}: Is a directory` });
                 } else {
                    newHistory.push({ type: 'output', content: `cat: ${filename}: No such file or directory` });
                 }
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

            const existing = currentChildren.find(n => n.name === filename);
            if (existing) {
                // In a real shell, this updates timestamps. Here, we do nothing.
                break;
            }
            
            const newFile: FileSystemNode = {
                id: `file-${Date.now()}`,
                name: filename,
                type: 'file',
                content: '',
            };

            const updateRecursively = (nodes: FileSystemNode[], path: string[]): FileSystemNode[] => {
                if (path.length === 1) { // We are at the root
                     if (currentDirectory.length === 1 && currentDirectory[0] === '/') {
                        return [...nodes, newFile];
                     }
                }
                const dirName = path[1];
                return nodes.map(n => {
                    if (n.name === dirName && n.type === 'folder') {
                        if (path.length === 2) { // Target directory found
                            return { ...n, children: [...(n.children || []), newFile] };
                        }
                        return { ...n, children: updateRecursively(n.children || [], path.slice(1)) };
                    }
                    return n;
                });
            };

            const newFileSystem = updateRecursively(fileSystem, currentDirectory);
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
    const { node: currentNode } = getNodeAndParentFromPath(fileSystem, currentDirectory);
    const children = (currentNode?.type === 'folder' && currentNode.children) ? currentNode.children : [];
    
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];

    if (lastPart === undefined) return;

    const possibilities = children.filter(child => child.name.startsWith(lastPart));

    if (possibilities.length === 1) {
        const newText = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '') + possibilities[0].name;
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

    