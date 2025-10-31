'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { chatWithAI, generateInitialHint } from '@/app/actions';
import { Bot, User, CornerDownLeft, BrainCircuit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import type { GeoJSON } from 'geojson';
import type * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";


interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

interface AIChatProps {
    location: GeoJSON.Point | null;
    isChapterOne?: boolean;
}

const initialActionState = { response: undefined, error: undefined };
const chapterOneWelcome = "Bonjour, D.C. Omen. Je suis Néo, votre assistant personnel. Je suis là pour vous aider dans toutes vos tâches quotidiennes. Je vous laisse découvrir votre nouvel environnement.";

export default function AIChat({ location, isChapterOne = false }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatState, chatFormAction, isChatPending] = useActionState(chatWithAI, initialActionState);
  const [hintState, hintFormAction, isHintPending] = useActionState(generateInitialHint, initialActionState);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const addMessage = (sender: 'user' | 'ai', text: string) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, text }]);
  };

  useEffect(() => {
    if (isChapterOne) {
        addMessage('ai', chapterOneWelcome);
        setTimeout(() => {
          setIsReadOnly(true);
        }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChapterOne]);

  useEffect(() => {
    if (chatState.response) {
      addMessage('ai', chatState.response);
    }
    if (chatState.error) {
      toast({ variant: 'destructive', title: 'AI Error', description: chatState.error });
    }
  }, [chatState]);

  useEffect(() => {
    if (hintState.response) {
      addMessage('ai', hintState.response);
    }
    if (hintState.error) {
      toast({ variant: 'destructive', title: 'Hint Error', description: hintState.error });
    }
  }, [hintState]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleFormSubmit = (formData: FormData) => {
    if (isReadOnly) return;
    const prompt = formData.get('prompt') as string;
    if (prompt.trim()) {
      addMessage('user', prompt);
      if (location) {
        formData.append('location', JSON.stringify(location));
      }
      chatFormAction(formData);
      formRef.current?.reset();
    }
  };
  
  const handleHintClick = () => {
    if (isReadOnly) return;
    const formData = new FormData();
    formData.append('userPrompt', 'I am stuck, please give me a hint.');
    addMessage('user', 'I need a hint.');
    hintFormAction(formData);
  }

  const isPending = isChatPending || isHintPending;

  return (
    <div className="h-full flex flex-col bg-card font-code">
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="space-y-4 p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.sender === 'ai' && <Bot className="w-6 h-6 text-accent flex-shrink-0 mt-1" />}
              <div className={cn('max-w-sm rounded-lg px-4 py-2 text-sm whitespace-pre-wrap', msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                {msg.text}
              </div>
              {msg.sender === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />}
            </div>
          ))}
          {isPending && (
             <div className="flex items-start gap-3 justify-start animate-in fade-in duration-500">
                <Bot className="w-6 h-6 text-accent animate-pulse" />
                <div className="max-w-sm rounded-lg px-4 py-2 text-sm bg-secondary flex items-center space-x-1">
                    <span className="h-2 w-2 bg-muted-foreground/30 rounded-full animate-pulse delay-0"></span>
                    <span className="h-2 w-2 bg-muted-foreground/30 rounded-full animate-pulse delay-200"></span>
                    <span className="h-2 w-2 bg-muted-foreground/30 rounded-full animate-pulse delay-400"></span>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <form ref={formRef} action={handleFormSubmit} className="flex items-center gap-2">
          <Input 
            name="prompt" 
            placeholder={isReadOnly ? "Connection lost..." : "Message Néo..."}
            className="flex-1 bg-input border-0 focus-visible:ring-1 focus-visible:ring-ring" 
            autoComplete="off" 
            disabled={isPending || isReadOnly} 
          />
          <Button type="submit" size="icon" disabled={isPending || isReadOnly}>
            <CornerDownLeft size={16} />
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={handleHintClick} disabled={isPending || isReadOnly} aria-label="Get a hint">
            <BrainCircuit size={16}/>
          </Button>
        </form>
      </div>
    </div>
  );
}
