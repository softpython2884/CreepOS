'use client';

import { cn } from '@/lib/utils';
import { Phone, Shield, ShieldOff, User } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Call, CallMessage, CallChoice } from '@/lib/call-system/types';
import { useEffect, useRef } from 'react';

interface CallViewProps {
  call: Call;
  onPlayerChoice: (choiceId: string) => void;
  onClose: () => void;
}

export default function CallView({ call, onPlayerChoice, onClose }: CallViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [call.messages]);

  return (
    <div className="w-[400px] h-[500px] bg-card/80 backdrop-blur-md border border-accent/20 shadow-2xl rounded-lg font-code text-sm flex flex-col animate-in fade-in slide-in-from-top-4">
      {/* Header */}
      <div className="p-2 border-b border-accent/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="text-accent" size={16} />
          <p className="font-bold text-accent">{call.interlocutor}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded",
          call.isSecure ? 'bg-green-800/50 text-green-300' : 'bg-destructive/50 text-destructive-foreground'
        )}>
          {call.isSecure ? <Shield size={12} /> : <ShieldOff size={12} />}
          <span>{call.isSecure ? 'SECURE' : 'UNSECURE'}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaRef}>
        <div className="flex flex-col gap-4">
          {call.messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-2 max-w-[85%] animate-in fade-in",
                msg.speaker === 'Operator' ? 'self-end flex-row-reverse' : 'self-start'
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                msg.speaker === 'Operator'
                  ? 'bg-primary/50'
                  : 'bg-secondary/50'
              )}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Choices / End Call */}
      <div className="p-2 border-t border-accent/20">
        {call.isFinished ? (
            <div className='flex flex-col items-center gap-2'>
                <p className='text-muted-foreground text-xs'>- Liaison coupée -</p>
                <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
                    Fermer
                </Button>
            </div>
        ) : (
            <div className="flex flex-col gap-2">
                {call.choices.map((choice) => (
                <Button
                    key={choice.id}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto whitespace-normal"
                    onClick={() => onPlayerChoice(choice.id)}
                >
                    {choice.text}
                </Button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
