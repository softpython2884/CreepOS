'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { documents } from './content';

interface HistoryItem {
  type: 'command' | 'output';
  content: string;
}

interface TerminalProps {
    isDefenseMode?: boolean;
    isPanicMode?: boolean;
    onPanicSolved?: () => void;
}

const defenseLog = `
[ERR] Conflit de signature : attendu 'SENTINEL_SIG_734', reçu 'NEO_SIG_FINAL'
[WARN] Tentative de purge de la mémoire... Échec.
[INFO] Verrouillage des protocoles non essentiels.
[INFO] Terminal restreint activé.
`;

export default function Terminal({ isDefenseMode = false, isPanicMode = false, onPanicSolved }: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "Virtual Nightmare OS v1.3. Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [history]);

  useEffect(() => {
    if (isPanicMode) {
        setHistory([{ type: 'output', content: 'SYSTEM PANIC: Awaiting user input...' }]);
        setIsSafeMode(false); // Reset safemode state on new panic
        inputRef.current?.focus();
    }
  }, [isPanicMode])

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = () => {
    if (isLocked) return;
    const newHistory: HistoryItem[] = [...history, { type: 'command', content: input }];
    const [command, ...args] = input.trim().toLowerCase().split(' ');

    const availableDocs = [
        ...documents.filter(d => ['log_dev_001.txt', 'obs_neo.txt', 'AVERTISSEMENT.txt'].includes(d.title)),
    ];
    
    if (isPanicMode) {
        switch (command) {
            case 'safemode':
                if (args[0] === '--enable') {
                    setIsSafeMode(true);
                    newHistory.push({ type: 'output', content: 'Safe mode enabled. System reboot is now possible.' });
                } else {
                    newHistory.push({ type: 'output', content: 'Invalid argument for safemode. Use --enable.' });
                }
                break;
            case 'reboot':
                if (isSafeMode) {
                    newHistory.push({ type: 'output', content: 'Rebooting system...' });
                    onPanicSolved?.();
                } else {
                    newHistory.push({ type: 'output', content: 'Cannot reboot. Enable safe mode first.' });
                }
                break;
            default:
                newHistory.push({ type: 'output', content: `FATAL ERROR: Command '${input}' not recognized. System integrity compromised.` });
        }

    } else {
        switch (command) {
        case 'help':
            let helpText = 'Available commands: help, ls, cat [filename], clear';
            if (isDefenseMode) {
                helpText = 'Available commands: help, log, clear'
            }
            newHistory.push({ type: 'output', content: helpText });
            break;
        case 'ls':
            if (isDefenseMode) {
                newHistory.push({ type: 'output', content: `command not found: ${command}` });
                break;
            }
            const fileList = availableDocs.map(doc => doc.title).join('\n');
            newHistory.push({ type: 'output', content: fileList });
            break;
        case 'cat':
            if (isDefenseMode) {
                newHistory.push({ type: 'output', content: `command not found: ${command}` });
                break;
            }
            const filename = args.join(' ');
            const doc = availableDocs.find(d => d.title === filename);
            if (doc) {
            newHistory.push({ type: 'output', content: doc.content });
            } else {
            newHistory.push({ type: 'output', content: `cat: ${filename}: No such file or directory` });
            }
            break;
        case 'log':
            if (isDefenseMode) {
                newHistory.push({ type: 'output', content: defenseLog });
            } else {
                newHistory.push({ type: 'output', content: `command not found: ${command}` });
            }
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
    }


    setHistory(newHistory);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand();
    }
  };

  return (
    <div className="h-full bg-black/80 text-green-400 font-code p-4 flex flex-col" onClick={() => inputRef.current?.focus()}>
      <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
        <div className="pr-4">
          {history.map((item, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {item.type === 'command' && <span className="text-accent/80">$&gt; </span>}
              <span className={item.type === 'output' ? 'text-muted-foreground' : ''}>{item.content}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
      {!isLocked && (
        <div className="flex items-center mt-2">
            <span className="text-accent">$&gt;</span>
            <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-green-400 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 h-6 p-0 ml-2"
            autoComplete="off"
            />
        </div>
      )}
    </div>
  );
}
