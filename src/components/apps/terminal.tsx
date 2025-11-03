
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
const getNodeFromPath = (nodes: FileSystemNode[], path: string[]): FileSystemNode | null => {
    let currentLevel: FileSystemNode[] = nodes;
    let foundNode: FileSystemNode | null = { id: 'root', name: '/', type: 'folder', children: nodes };
    for (let i = 1; i < path.length; i++) {
        const folderName = path[i];
        const folder = currentLevel.find(f => f.name === folderName && f.type === 'folder');
        if (folder) {
            foundNode = folder;
            currentLevel = folder.children || [];
        } else {
            return null; // Path not found
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
  const [currentDirectory, setCurrentDirectory] = useState(['/']);
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
    }
    return `${username}@neo-system:${path}$ `;
  };

  const handleCommand = () => {
    const fullCommand = input;
    let newHistory: HistoryItem[] = [...history, { type: 'command', content: `${getPrompt()}${fullCommand}` }];
    const [command, ...args] = fullCommand.trim().split(' ');

    const currentNode = getNodeFromPath(fileSystem, currentDirectory);
    const currentChildren = (currentNode?.type === 'folder' && currentNode.children) ? currentNode.children : fileSystem;

    switch (command.toLowerCase()) {
    case 'help':
        let helpText = 'Available commands:\n  help      - Show this help message\n  ls        - List files and directories\n  cd [path] - Change directory\n  cat [file]  - Display file content\n  clear     - Clear the terminal screen\n  echo      - Display a line of text';
        newHistory.push({ type: 'output', content: helpText });
        break;
    case 'ls':
        const content = currentChildren.map(node => `${node.name}${node.type === 'folder' ? '/' : ''}`).join('\n');
        newHistory.push({ type: 'output', content: content || "Directory is empty." });
        break;
    case 'cd':
        const pathArg = args[0];
        if (!pathArg) {
            setCurrentDirectory(['/', 'home', username]);
            break;
        }
        let newPath = [...currentDirectory];
        if (pathArg === '..') {
            if (newPath.length > 1) {
                newPath.pop();
            }
        } else if (pathArg.startsWith('/')) {
            newPath = ['/', ...pathArg.split('/').filter(p => p)];
        } else {
            newPath = [...newPath, ...pathArg.split('/').filter(p => p)];
        }

        const targetNode = getNodeFromPath(fileSystem, newPath);
        if (targetNode && targetNode.type === 'folder') {
            setCurrentDirectory(newPath);
        } else {
            newHistory.push({ type: 'output', content: `cd: no such file or directory: ${pathArg}` });
        }
        break;
    case 'cat':
        const filename = args.join(' ');
        const file = currentChildren.find(node => node.name === filename && node.type === 'file');
        if (file) {
            newHistory.push({ type: 'output', content: file.content || '' });
        } else {
            newHistory.push({ type: 'output', content: `cat: ${filename}: No such file or directory` });
        }
        break;
    case 'echo':
        newHistory.push({ type: 'output', content: args.join(' ') });
        break;
    case 'clear':
        setHistory([]);
        setInput('');
        return;
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
    const currentNode = getNodeFromPath(fileSystem, currentDirectory);
    const children = (currentNode?.type === 'folder' && currentNode.children) ? currentNode.children : fileSystem;
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];

    if (!lastPart) return;

    const possibilities = children.filter(child => child.name.startsWith(lastPart));

    if (possibilities.length === 1) {
        const newText = parts.slice(0, -1).join(' ') + ' ' + possibilities[0].name;
        setInput(newText.trimStart() + (possibilities[0].type === 'folder' ? '/' : ' '));
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
