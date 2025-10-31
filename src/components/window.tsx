import { X, Skull } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

interface WindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width: number;
  height: number;
  isCorrupted?: boolean;
}

export default function Window({ title, onClose, children, width, height, isCorrupted = false }: WindowProps) {
  
  return (
    <div
      style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
      }}
      className="animate-in fade-in zoom-in-90 duration-300"
    >
      <Card className={cn("w-full h-full bg-card/80 backdrop-blur-md border-accent/20 shadow-2xl shadow-primary/20 flex flex-col", isCorrupted && "border-destructive animate-glitch")}>
      <CardHeader className={cn("handle flex flex-row items-center justify-between p-2 pl-4 border-b bg-card/50 rounded-t-lg font-code cursor-move", isCorrupted && "cursor-default")}>
          <CardTitle className={cn("text-sm font-medium select-none text-accent", isCorrupted && "text-destructive flex items-center gap-2")}>
          {isCorrupted && <Skull size={14}/>}
          {isCorrupted ? "CORRUPTED" : title}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/20 cursor-pointer" onClick={onClose} aria-label="Close window">
          <X size={16} />
          </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden relative">
          <div className="absolute inset-0">
          {children}
          </div>
      </CardContent>
      </Card>
    </div>
  );
}
