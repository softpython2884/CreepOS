'use client';

import { useState, useRef, useEffect, KeyboardEvent, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { documents } from './content';
import type { EventId } from '../desktop';
import { type TerminalWriter } from '../story/chapter-two-manager';

interface HistoryItem {
  type: 'command' | 'output';
  content: string;
}

interface TerminalProps {
    triggerEvent: (eventId: EventId) => void;
    setTerminalWriter: (writer: TerminalWriter) => void;
}

export default function Terminal({ triggerEvent, setTerminalWriter }: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "Virtual Nightmare OS v1.3. Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const writer: TerminalWriter = {
      write: (content: string, type: 'output' | 'command' = 'output') => {
        setHistory(prev => [...prev, { type, content }]);
      },
      clear: () => setHistory([]),
      lock: (locked: boolean) => setIsLocked(locked),
    };
    setTerminalWriter(writer);
  }, [setTerminalWriter]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = () => {
    if (isLocked) return;
    const newHistory: HistoryItem[] = [...history, { type: 'command', content: input }];
    const [command, ...args] = input.trim().split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        newHistory.push({ type: 'output', content: 'Available commands: help, ls, cat [filename], clear, bsod, scream, lag, corrupt, glitch, tear, chromatic' });
        break;
      case 'ls':
        const fileList = documents.map(doc => doc.title).join('\n');
        newHistory.push({ type: 'output', content: fileList });
        break;
      case 'cat':
        const filename = args.join(' ');
        const doc = documents.find(d => d.title === filename);
        if (doc) {
          newHistory.push({ type: 'output', content: doc.content });
        } else {
          newHistory.push({ type: 'output', content: `cat: ${filename}: No such file or directory` });
        }
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'bsod':
        triggerEvent('bsod');
        newHistory.push({ type: 'output', content: 'FATAL_SYSTEM_ERROR' });
        break;
      case 'scream':
        triggerEvent('scream');
        newHistory.push({ type: 'output', content: 'Unknown resource requested.' });
        break;
      case 'lag':
        triggerEvent('lag');
        newHistory.push({ type: 'output', content: 'System unresponsive. Please wait...' });
        break;
      case 'corrupt':
        triggerEvent('corrupt');
        newHistory.push({ type: 'output', content: 'WARNING: File system integrity compromised.' });
        break;
      case 'glitch':
        triggerEvent('glitch');
        newHistory.push({ type: 'output', content: 'Display driver unstable.' });
        break;
      case 'tear':
        triggerEvent('tear');
        newHistory.push({ type: 'output', content: 'VSYNC failure.' });
        break;
      case 'chromatic':
        triggerEvent('chromatic');
        newHistory.push({ type: 'output', content: 'Color calibration error.' });
        break;
      case '':
        break;
      default:
        newHistory.push({ type: 'output', content: `command not found: ${command}` });
        break;
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
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
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
