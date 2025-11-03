
'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistoryItem {
  type: 'command' | 'output';
  content: string;
}

export default function Terminal() {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', content: "SUBSYSTEM OS [Version 2.0.0]\n(c) Cauchemar Virtuel Corporation. All rights reserved." },
    { type: 'output', content: "Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
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

  const handleCommand = () => {
    const newHistory: HistoryItem[] = [...history, { type: 'command', content: input }];
    const [command, ...args] = input.trim().toLowerCase().split(' ');

    switch (command) {
    case 'help':
        let helpText = 'Available commands: help, ls, cat [filename], clear, echo [text]';
        newHistory.push({ type: 'output', content: helpText });
        break;
    case 'ls':
        newHistory.push({ type: 'output', content: 'home\nsys\nbin\nlogs' });
        break;
    case 'cat':
        const filename = args.join(' ');
        newHistory.push({ type: 'output', content: `cat: ${filename}: No such file or directory. Try using the file explorer.` });
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
    </div>
  );
}
