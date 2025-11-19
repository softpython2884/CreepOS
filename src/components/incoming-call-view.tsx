'use client';

import { Phone, PhoneIncoming, X } from 'lucide-react';
import { Button } from './ui/button';

interface IncomingCallViewProps {
  interlocutor: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallView({
  interlocutor,
  onAccept,
  onDecline,
}: IncomingCallViewProps) {
  return (
    <div className="w-[350px] bg-card/80 backdrop-blur-md border border-accent/20 shadow-2xl rounded-lg font-code text-sm flex flex-col items-center gap-4 p-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3">
            <PhoneIncoming className="text-accent animate-pulse" size={24} />
            <h2 className="text-2xl font-bold text-accent">Appel Entrant</h2>
        </div>

        <p className="text-lg text-foreground mt-2">{interlocutor}</p>
        
        <div className="flex justify-around w-full mt-6">
            <div className="flex flex-col items-center gap-2">
                <Button size="icon" className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-500" onClick={onAccept}>
                    <Phone size={32} />
                </Button>
                <span className="text-green-400">Décrocher</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                 <Button size="icon" variant="destructive" className="h-16 w-16 rounded-full" onClick={onDecline}>
                    <X size={40} />
                </Button>
                <span className="text-destructive">Refuser</span>
            </div>
        </div>
    </div>
  );
}
