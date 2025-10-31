'use client';

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';

export default function PurgeScreen() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.toLowerCase() === 'y') {
        setResponse('ACCESS DENIED.');
        setTimeout(() => {
          setResponse('TOO LATE.');
        }, 2000);
      } else {
        setInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-code flex flex-col items-center justify-center z-[9999] animate-in fade-in">
        <div className="text-center">
            <p className="text-2xl mb-4">PURGE SEQUENCE: 99%</p>
            <p className="text-xl mb-6">STOP PROCESS? (Y/N)</p>
            {response ? (
                <p className="text-2xl text-red-500 animate-in fade-in">{response}</p>
            ) : (
                <div className="flex items-center justify-center gap-2">
                    <span>&gt;</span>
                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value.slice(0, 1))}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="bg-transparent border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 w-8 text-center text-xl p-0"
                    />
                     <span className="animate-blink">_</span>
                </div>
            )}
        </div>
    </div>
  );
}
