
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Cpu, RotateCcw, GitFork, Forward, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    if (hex.isCorrectedBlock) return 'hsl(var(--accent))';
    if (hex.isStart || hex.isEnd) return hex.color;
    if (hex.isPath) return 'hsl(var(--primary))';
    if (hex.isBlock) return 'hsl(var(--destructive))';
    return 'hsl(var(--secondary) / 0.5)';
  }

  return (
    <g transform={`translate(${x}, ${y})`} onDrop={onDrop} onDragOver={onDragOver} onClick={onClick} className="cursor-pointer">
      <polygon points={points} fill={getFill()} stroke="hsl(var(--border))" strokeWidth="2" />
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
        if ((hex.isStart && !completedPaths.includes(hex.color!)) || (hex.isPath && !hex.isEnd)) {
            if (!activeColor) {
                // Start a new path
                setActiveColor(hex.color!);
                setCurrentPath([hex]);
            } else if (activeColor === (hex.isStart ? hex.color : hex.pathColor)) {
                // Continue path
                const lastHex = currentPath[currentPath.length - 1];
                const isAdjacent = Math.abs(lastHex.q - hex.q) + Math.abs(lastHex.r - hex.r) + Math.abs(lastHex.s - hex.s) === 2;
                
                if (isAdjacent && !currentPath.find(h => h.q === hex.q && h.r === hex.r)) {
                    const newPath = [...currentPath, hex];
                    setCurrentPath(newPath);
                    if (hex.isEnd && hex.color === activeColor) {
                        // Path complete
                        setCompletedPaths(prev => [...prev, activeColor!]);
                        setActiveColor(null);
                        setCurrentPath([]);
                         setGrid(g => g.map(h => newPath.some(p => p.q === h.q && p.r === h.r) ? { ...h, isPath: true, pathColor: activeColor } : h));

                        if (completedPaths.length + 1 === puzzle.starts.length) {
                            setNeoMessages(prev => [...prev, "NÉO: Analyse terminée. Stabilité de la mémoire à 100%. Un rapport a été généré sur votre bureau."]);
                            onAnalysisComplete();
                        }
                    }
                }
            }
        }
    };
    
    const analyzePath = () => {
        const lastHex = currentPath[currentPath.length - 1];
        const neighbors = grid.filter(h => Math.abs(lastHex.q - h.q) + Math.abs(lastHex.r - h.r) + Math.abs(lastHex.s - h.s) === 2);
        const blockedNeighbor = neighbors.find(n => n.isBlock && !n.isCorrectedBlock);

        if (blockedNeighbor) {
            setNeoMessages(prev => [...prev, `NÉO: Corruption détectée. La séquence requiert une fonction '${blockedNeighbor.solution}'.`]);
        } else {
            setNeoMessages(prev => [...prev, `NÉO: Aucun blocage direct détecté. Essayez une autre approche.`]);
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
            setGrid(g => g.map(h => h.q === hex.q && h.r === hex.r ? { ...h, isCorrectedBlock: true } : h));
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
            <div className="w-48 border-r bg-secondary/30 p-4 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-accent">Opérateurs</h3>
                <TooltipProvider>
                    <div className="flex flex-col gap-3">
                        {tools.map(({ name, icon }) => (
                            <Tooltip key={name}>
                                <TooltipTrigger asChild>
                                    <div 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, name)}
                                        onDragEnd={() => setSelectedTool(null)}
                                        className={cn("p-3 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing", selectedTool === name && "border-accent ring-2 ring-accent")}>
                                        {icon}
                                        <span>{name}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Opérateur logique: {name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="p-4 flex-1 relative">
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
                <div className="h-48 border-t bg-secondary/30 flex">
                    <div className="w-1/2 p-4 border-r">
                        <h3 className="font-bold text-accent mb-2">Console NÉO</h3>
                        <div className="h-full overflow-y-auto">
                            {neoMessages.map((msg, i) => <p key={i} className="animate-in fade-in">{msg}</p>)}
                        </div>
                    </div>
                    <div className="w-1/2 p-4 flex flex-col justify-center items-center gap-4">
                         <div className="w-full">
                            <p className="text-center text-muted-foreground">Stabilité de la séquence</p>
                            <div className="w-full bg-border rounded-full h-2.5 mt-1">
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(completedPaths.length / puzzle.starts.length) * 100}%` }}></div>
                            </div>
                        </div>
                        <Button onClick={analyzePath} disabled={!activeColor}>
                            <Cpu className="mr-2" /> Analyser le chemin
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

