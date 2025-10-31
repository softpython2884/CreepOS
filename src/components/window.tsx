import { useRef } from 'react';
import Draggable from 'react-draggable';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width: number;
  height: number;
}

export default function Window({ title, onClose, children, width, height }: WindowProps) {
  const nodeRef = useRef(null);
  return (
    <Draggable handle=".handle" nodeRef={nodeRef} positionOffset={{ x: '-50%', y: '-50%' }}>
        <div ref={nodeRef} style={{ width: `${width}px`, height: `${height}px`}}>
            <Card className="w-full h-full bg-card/80 backdrop-blur-md border-accent/20 shadow-2xl shadow-primary/20 flex flex-col animate-in fade-in zoom-in-90 duration-300">
            <CardHeader className="handle flex flex-row items-center justify-between p-2 pl-4 border-b bg-card/50 rounded-t-lg font-code cursor-move">
                <CardTitle className="text-sm font-medium select-none text-accent">{title}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/20" onClick={onClose} aria-label="Close window">
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
    </Draggable>
  );
}
