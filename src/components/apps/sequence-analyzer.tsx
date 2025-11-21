

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cpu, RotateCcw, GitFork, Forward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type Hex = {
  q: number;
  r: number;
  s: number;
  isStart?: boolean;
  isEnd?: boolean;
  color?: string;
  isPath?: boolean;
  pathColor?: string;
};

const puzzles: Record<string, { starts: any[], ends: any[] }> = {
    DELTA7: {
        starts: [{ q: -2, r: 0, color: 'blue' }, {q: 2, r: -2, color: 'green'}],
        ends: [{ q: 2, r: 2, color: 'blue' }, {q: -1, r: 3, color: 'green'}],
    },
};

const HEX_SIZE = 40;

const Hexagon = ({ hex, onClick }: { hex: Hex; onClick: () => void; }) => {
  const x = HEX_SIZE * (3 / 2 * hex.q);
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
  
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle_deg = 60 * i - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    return `${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`;
  }).join(' ');

  const getFill = () => {
    if (hex.isPath) return hex.pathColor;
    if (hex.isStart || hex.isEnd) return hex.color;
    return 'hsl(var(--secondary) / 0.5)';
  }

  const getStroke = () => {
      if (hex.isPath) return 'hsl(var(--foreground))';
      return 'hsl(var(--border))';
  }

  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} className="cursor-pointer transition-opacity duration-300 hover:opacity-80">
      <polygon points={points} fill={getFill()} stroke={getStroke()} strokeWidth="2" />
    </g>
  );
};


export default function SequenceAnalyzer({ puzzleId = 'DELTA7', onAnalysisComplete, onClose }: { puzzleId?: string, onAnalysisComplete: (puzzleId: string) => void, onClose: () => void }) {
    const [puzzle] = useState(puzzles[puzzleId] || puzzles['DELTA7']);
    const [grid, setGrid] = useState<Hex[]>([]);
    const [currentPath, setCurrentPath] = useState<Hex[]>([]);
    const [activeColor, setActiveColor] = useState<string | null>(null);
    const [completedPaths, setCompletedPaths] = useState<string[]>([]);
    const [neoMessages, setNeoMessages] = useState<string[]>(["NÉO: Initialisation de l'analyseur. Veuillez tracer les chemins de données."]);
    
    const size = 4; // Grid size

    useEffect(() => {
        const newGrid: Hex[] = [];
        for (let q = -size; q <= size; q++) {
            for (let r = -size; r <= size; r++) {
                const s = -q - r;
                if (s >= -size && s <= size) {
                    const start = puzzle.starts.find(p => p.q === q && p.r === r);
                    const end = puzzle.ends.find(p => p.q === q && p.r === r);
                    newGrid.push({
                        q, r, s,
                        isStart: !!start,
                        isEnd: !!end,
                        color: start?.color || end?.color,
                    });
                }
            }
        }
        setGrid(newGrid);
        setCompletedPaths([]);
        setCurrentPath([]);
        setActiveColor(null);
    }, [puzzle]);
    
    const checkWinCondition = useCallback((currentCompletedPaths: string[]) => {
        if (currentCompletedPaths.length === puzzle.starts.length) {
            setNeoMessages(prev => [...prev, "NÉO: Analyse terminée. Stabilité de la mémoire à 100%. Un rapport a été généré dans vos documents."]);
            onAnalysisComplete(puzzleId);
        }
    }, [puzzle.starts, puzzleId, onAnalysisComplete]);

    const handleHexClick = (hex: Hex) => {
        if (hex.isStart && !completedPaths.includes(hex.color!) && !activeColor) {
            setActiveColor(hex.color!);
            setCurrentPath([hex]);
            setNeoMessages(prev => [...prev, `NÉO: Chemin '${hex.color}' initié.`]);
            return;
        }

        if (activeColor) {
            const lastHex = currentPath[currentPath.length - 1];
            const isAdjacent = Math.abs(lastHex.q - hex.q) + Math.abs(lastHex.r - hex.r) + Math.abs(lastHex.s - hex.s) === 2;
            const isAlreadyInPath = currentPath.some(h => h.q === hex.q && h.r === hex.r);

            if (isAdjacent && !isAlreadyInPath) {
                 const newPath = [...currentPath, hex];
                 setCurrentPath(newPath);

                 if (hex.isEnd && hex.color === activeColor) {
                    setNeoMessages(prev => [...prev, `NÉO: Chemin '${activeColor}' complété.`]);
                    
                    const newCompletedPaths = [...completedPaths, activeColor];
                    setCompletedPaths(newCompletedPaths);
                    
                    setGrid(g => g.map(h => {
                        const pathNode = newPath.find(p => p.q === h.q && p.r === h.r);
                        return pathNode ? { ...h, isPath: true, pathColor: activeColor } : h;
                    }));

                    setActiveColor(null);
                    setCurrentPath([]);
                    
                    checkWinCondition(newCompletedPaths);
                 }
            } else {
                 if (!isAdjacent) {
                    setNeoMessages(prev => [...prev, `NÉO: Erreur. Le noeud n'est pas adjacent.`]);
                 }
                 if (isAlreadyInPath) {
                     setNeoMessages(prev => [...prev, `NÉO: Erreur. Boucle détectée. Réinitialisation du chemin.`]);
                 }
                 setCurrentPath([]);
                 setActiveColor(null);
            }
        }
    };

    const gridWithCurrentPath = useMemo(() => {
        if (!activeColor) return grid;
        return grid.map(hex => {
            const pathHex = currentPath.find(p => p.q === hex.q && p.r === hex.r);
            if (pathHex) {
                return { ...hex, isPath: true, pathColor: activeColor };
            }
            return hex;
        });
    }, [grid, currentPath, activeColor]);
    
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
                          />
                        ))}
                    </svg>
                </div>
                <div className="h-24 border-t bg-secondary/30 flex p-4 items-center justify-center">
                    <div className="w-full max-w-sm">
                        <p className="text-center text-muted-foreground mb-2">Stabilité de la séquence</p>
                        <div className="w-full bg-border rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(completedPaths.length / puzzle.starts.length) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
