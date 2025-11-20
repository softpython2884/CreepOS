

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Cpu, RotateCcw, GitFork, Forward, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '../ui/scroll-area';

type Tool = 'FORWARD' | 'ROTATE' | 'SPLIT';
type Hex = {
  q: number;
  r: number;
  s: number;
  isStart?: boolean;
  isEnd?: boolean;
  color?: string;
  isPath?: boolean;
  isBlock?: boolean;
  isCorrectedBlock?: boolean;
  pathColor?: string;
  solution?: Tool;
};

const puzzles = [
    {
        starts: [{ q: -2, r: 0, color: 'blue' }, {q: 2, r: -2, color: 'green'}],
        ends: [{ q: 2, r: 2, color: 'blue' }, {q: -1, r: 3, color: 'green'}],
        blocks: [
            { q: 0, r: 1, solution: 'ROTATE' },
            { q: 1, r: -1, solution: 'SPLIT' },
            { q: 0, r: -2, solution: 'FORWARD' },
        ]
    }
];

const HEX_SIZE = 40;

const Hexagon = ({ hex, onClick, onDrop, onDragOver, selectedTool }: { hex: Hex; onClick: () => void; onDrop: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; selectedTool: Tool | null; }) => {
  const x = HEX_SIZE * (3 / 2 * hex.q);
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
  
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle_deg = 60 * i - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    return `${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`;
  }).join(' ');

  const getFill = () => {
    if (hex.isPath) return hex.pathColor;
    if (hex.isCorrectedBlock) return 'hsl(var(--accent))';
    if (hex.isStart || hex.isEnd) return hex.color;
    if (hex.isBlock) return 'hsl(var(--destructive))';
    return 'hsl(var(--secondary) / 0.5)';
  }

  const getStroke = () => {
      if (hex.isPath) return 'hsl(var(--foreground))';
      return 'hsl(var(--border))';
  }

  return (
    <g transform={`translate(${x}, ${y})`} onDrop={onDrop} onDragOver={onDragOver} onClick={onClick} className="cursor-pointer transition-opacity duration-300 hover:opacity-80">
      <polygon points={points} fill={getFill()} stroke={getStroke()} strokeWidth="2" />
       {hex.isBlock && !hex.isCorrectedBlock && <AlertCircle className="text-white" x="-10" y="-10" size={20} />}
    </g>
  );
};


export default function SequenceAnalyzer({ onAnalysisComplete, onClose }: { onAnalysisComplete: () => void, onClose: () => void }) {
    const [puzzle, setPuzzle] = useState(puzzles[0]);
    const [grid, setGrid] = useState<Hex[]>([]);
    const [currentPath, setCurrentPath] = useState<Hex[]>([]);
    const [activeColor, setActiveColor] = useState<string | null>(null);
    const [completedPaths, setCompletedPaths] = useState<string[]>([]);
    const [neoMessages, setNeoMessages] = useState<string[]>([]);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    const size = 4; // Grid size

    useMemo(() => {
        const newGrid: Hex[] = [];
        for (let q = -size; q <= size; q++) {
            for (let r = -size; r <= size; r++) {
                const s = -q - r;
                if (s >= -size && s <= size) {
                    const start = puzzle.starts.find(p => p.q === q && p.r === r);
                    const end = puzzle.ends.find(p => p.q === q && p.r === r);
                    const block = puzzle.blocks.find(b => b.q === q && b.r === r);
                    newGrid.push({
                        q, r, s,
                        isStart: !!start,
                        isEnd: !!end,
                        color: start?.color || end?.color,
                        isBlock: !!block,
                        solution: block?.solution,
                    });
                }
            }
        }
        setGrid(newGrid);
    }, [puzzle]);

    const handleHexClick = (hex: Hex) => {
        // Start a new path
        if (hex.isStart && !completedPaths.includes(hex.color!) && !activeColor) {
            setActiveColor(hex.color!);
            setCurrentPath([hex]);
            return;
        }

        // Continue the current path
        if (activeColor) {
            const lastHex = currentPath[currentPath.length - 1];
            const isAdjacent = Math.abs(lastHex.q - hex.q) + Math.abs(lastHex.r - hex.r) + Math.abs(lastHex.s - hex.s) === 2;
            const isAlreadyInPath = currentPath.find(h => h.q === hex.q && h.r === hex.r);

            if (isAdjacent && !isAlreadyInPath && !hex.isBlock) {
                 const newPath = [...currentPath, hex];
                 setCurrentPath(newPath);

                 // Check if path is complete
                 if (hex.isEnd && hex.color === activeColor) {
                    const newCompletedPaths = [...completedPaths, activeColor];
                    setCompletedPaths(newCompletedPaths);
                    setActiveColor(null);
                    setCurrentPath([]);
                    setGrid(g => g.map(h => {
                        const pathNode = newPath.find(p => p.q === h.q && p.r === h.r);
                        return pathNode ? { ...h, isPath: true, pathColor: activeColor } : h;
                    }));

                    if (newCompletedPaths.length === puzzle.starts.length) {
                        setNeoMessages(prev => [...prev, "NÉO: Analyse terminée. Stabilité de la mémoire à 100%. Un rapport a été généré dans vos documents."]);
                        onAnalysisComplete();
                    }
                 }
            }
        }
    };
    
    const analyzePath = () => {
        if (!activeColor || currentPath.length === 0) return;

        const lastHex = currentPath[currentPath.length - 1];
        const neighbors = grid.filter(h => Math.abs(lastHex.q - h.q) + Math.abs(lastHex.r - h.r) + Math.abs(lastHex.s - h.s) === 2);
        const blockedNeighbor = neighbors.find(n => n.isBlock && !n.isCorrectedBlock);

        if (blockedNeighbor) {
            setNeoMessages(prev => [...prev, `NÉO: Corruption détectée. La séquence requiert une fonction '${blockedNeighbor.solution}'.`]);
        } else {
            setNeoMessages(prev => [...prev, `NÉO: Aucun blocage direct détecté. Le chemin semble valide ou une autre approche est nécessaire.`]);
        }
    };

    const handleDragStart = (e: React.DragEvent, tool: Tool) => {
        e.dataTransfer.setData("tool", tool);
        setSelectedTool(tool);
    };

    const handleDrop = (e: React.DragEvent, hex: Hex) => {
        e.preventDefault();
        const tool = e.dataTransfer.getData("tool") as Tool;
        if (hex.isBlock && hex.solution === tool) {
            setGrid(g => g.map(h => (h.q === hex.q && h.r === hex.r) ? { ...h, isCorrectedBlock: true, isBlock: false } : h));
            setNeoMessages(prev => [...prev, `NÉO: Opérateur '${tool}' appliqué. Corruption corrigée.`]);
        } else if (hex.isBlock) {
             setNeoMessages(prev => [...prev, `NÉO: Erreur. L'opérateur '${tool}' est incorrect pour ce nœud.`]);
        }
        setSelectedTool(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const gridWithCurrentPath = useMemo(() => {
        return grid.map(hex => {
            const pathHex = currentPath.find(p => p.q === hex.q && p.r === hex.r);
            if (pathHex) {
                return { ...hex, isPath: true, pathColor: activeColor! };
            }
            return hex;
        });
    }, [grid, currentPath, activeColor]);


    const tools: { name: Tool, icon: React.ReactNode }[] = [
        { name: 'FORWARD', icon: <Forward /> },
        { name: 'ROTATE', icon: <RotateCcw /> },
        { name: 'SPLIT', icon: <GitFork /> },
    ];
    
    return (
        <div className="w-full h-full bg-card font-code text-sm flex">
            <div className="w-64 border-r bg-secondary/30 p-2 flex flex-col">
                <h3 className="font-bold text-accent mb-2 p-2 flex-shrink-0">Console NÉO</h3>
                <ScrollArea className="flex-grow bg-black/30 rounded-md">
                    <div className="p-2">
                        {neoMessages.map((msg, i) => <p key={i} className="animate-in fade-in">{msg}</p>)}
                    </div>
                </ScrollArea>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex-1 relative">
                     <svg width="100%" height="100%" viewBox="-400 -300 800 600">
                        {gridWithCurrentPath.map((hex, i) => (
                          <Hexagon 
                            key={i} 
                            hex={hex} 
                            onClick={() => handleHexClick(hex)}
                            onDrop={(e) => handleDrop(e, hex)}
                            onDragOver={handleDragOver}
                            selectedTool={selectedTool}
                          />
                        ))}
                    </svg>
                </div>
                <div className="h-36 border-t bg-secondary/30 flex p-4 items-center gap-8">
                    <div className="flex-1">
                        <div className="w-full">
                            <p className="text-center text-muted-foreground mb-2">Stabilité de la séquence</p>
                            <div className="w-full bg-border rounded-full h-2.5">
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(completedPaths.length / puzzle.starts.length) * 100}%` }}></div>
                            </div>
                        </div>
                        <Button onClick={analyzePath} disabled={!activeColor} className="w-full mt-4">
                            <Cpu className="mr-2" /> Analyser le chemin
                        </Button>
                    </div>

                    <div className="w-48">
                        <h3 className="text-lg font-bold text-accent text-center mb-2">Opérateurs</h3>
                        <TooltipProvider>
                            <div className="grid grid-cols-3 gap-2">
                                {tools.map(({ name, icon }) => (
                                    <Tooltip key={name}>
                                        <TooltipTrigger asChild>
                                            <div 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, name)}
                                                onDragEnd={() => setSelectedTool(null)}
                                                className={cn("p-2 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing", selectedTool === name && "border-accent ring-2 ring-accent")}>
                                                {icon}
                                                <span className="text-xs">{name}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>Opérateur logique: {name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}
