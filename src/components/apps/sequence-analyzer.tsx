'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  isRotatable?: boolean;
  rotation?: number; // 0-5
  connections?: number[]; // [0, 1, 2, 3, 4, 5]
  targetRotation?: number;
};

const puzzles: Record<string, { starts: any[], ends: any[], rotatables?: any[] }> = {
    DELTA7: {
        starts: [{ q: -2, r: 0, color: '#3b82f6' }, {q: 2, r: -2, color: '#22c55e'}],
        ends: [{ q: 2, r: 2, color: '#3b82f6' }, {q: -1, r: 3, color: '#22c55e'}],
    },
    MEMO_BIN: {
        starts: [
            { q: -4, r: 0, color: '#3b82f6' }, // Blue
            { q: 0, r: -4, color: '#22c55e' }, // Green
            { q: 4, r: -4, color: '#ef4444' }, // Red
        ],
        ends: [
            { q: 4, r: 0, color: '#3b82f6' }, // Blue
            { q: 0, r: 4, color: '#22c55e' }, // Green
            { q: -4, r: 4, color: '#ef4444' }, // Red
        ],
    }
};

const HEX_SIZE = 40;

const Hexagon = ({ hex, onClick, onRotate }: { hex: Hex; onClick?: () => void; onRotate?: () => void; }) => {
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
      if (hex.isPath) return hex.pathColor;
      return 'hsl(var(--border))';
  }
  
  const handleClick = () => {
    if(hex.isRotatable) onRotate?.();
    else onClick?.();
  }

  return (
    <g transform={`translate(${x}, ${y})`} onClick={handleClick} className="cursor-pointer transition-opacity duration-300 hover:opacity-80">
      <polygon points={points} fill={getFill()} stroke={getStroke()} strokeWidth="2" />
      {hex.isRotatable && hex.connections && (
          <g transform={`rotate(${hex.rotation! * 60})`}>
              {hex.connections.map(conn => {
                  const angle = Math.PI / 180 * (60 * conn);
                  const endX = HEX_SIZE * 0.7 * Math.cos(angle);
                  const endY = HEX_SIZE * 0.7 * Math.sin(angle);
                  return <line key={conn} x1="0" y1="0" x2={endX} y2={endY} stroke={hex.isPath ? hex.pathColor : "hsl(var(--foreground))"} strokeWidth="4" />
              })}
          </g>
      )}
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
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const size = 4; // Grid size
    
    const checkWinCondition = useCallback((currentCompleted: string[], currentGrid: Hex[]) => {
        const allPathsDone = currentCompleted.length === puzzle.starts.length;
        
        if (allPathsDone) {
            const winMessages = [`NÉO: Analyse terminée. Stabilité de la mémoire à 100%. Données restaurées.`];
            if (puzzleId === 'DELTA7') {
                winMessages.push(`NÉO: Fichier 'rapport_sequences_delta7.txt' généré dans /documents.`);
            }
            setNeoMessages(prev => [...prev, ...winMessages]);
            setTimeout(() => onAnalysisComplete(puzzleId), 1000);
        }
    }, [puzzle.starts, puzzleId, onAnalysisComplete]);

    const buildGrid = useCallback(() => {
        const newGrid: Hex[] = [];
        for (let q = -size; q <= size; q++) {
            for (let r = -size; r <= size; r++) {
                const s = -q - r;
                if (s >= -size && s <= size) {
                    const start = puzzle.starts.find(p => p.q === q && p.r === r);
                    const end = puzzle.ends.find(p => p.q === q && p.r === r);
                    const rotatable = puzzle.rotatables?.find(p => p.q === q && p.r === r);

                    newGrid.push({
                        q, r, s,
                        isStart: !!start,
                        isEnd: !!end,
                        color: start?.color || end?.color,
                        isRotatable: !!rotatable,
                        connections: rotatable?.connections,
                        rotation: rotatable ? 0 : undefined,
                        targetRotation: rotatable?.targetRotation,
                    });
                }
            }
        }
        setGrid(newGrid);
        setCompletedPaths([]);
        setCurrentPath([]);
        setActiveColor(null);
    }, [puzzle]);

    useEffect(() => {
        buildGrid();
    }, [buildGrid]);

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
                    
                    const finalGrid = grid.map(h => {
                        const pathNode = newPath.find(p => p.q === h.q && p.r === h.r);
                        return pathNode ? { ...h, isPath: true, pathColor: activeColor } : h;
                    });
                    setGrid(finalGrid);
                    
                    setActiveColor(null);
                    setCurrentPath([]);
                    checkWinCondition(newCompletedPaths, finalGrid);
                 }
            } else {
                 if (!isAdjacent) setNeoMessages(prev => [...prev, `NÉO: Erreur. Le noeud n'est pas adjacent.`]);
                 if (isAlreadyInPath) setNeoMessages(prev => [...prev, `NÉO: Erreur. Boucle détectée. Réinitialisation du chemin.`]);
                 setCurrentPath([]);
                 setActiveColor(null);
            }
        }
    };
    
    const handleRotate = (q: number, r: number) => {
        let newGrid: Hex[] = [];
        setGrid(g => {
            newGrid = g.map(h => {
                if (h.q === q && h.r === r && h.isRotatable) {
                    const newRotation = ((h.rotation ?? 0) + 1) % 6;
                    return { ...h, rotation: newRotation };
                }
                return h;
            });
            return newGrid;
        });

        checkWinCondition(completedPaths, newGrid);
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
    
    const resetPuzzle = () => {
        setNeoMessages(["NÉO: Réinitialisation du puzzle."]);
        buildGrid();
    }
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [neoMessages]);
    
    return (
        <div className="w-full h-full bg-card font-code text-sm flex">
            <div className="w-64 border-r bg-secondary/30 p-2 flex flex-col">
                <h3 className="font-bold text-accent mb-2 p-2 flex-shrink-0">Console NÉO</h3>
                <ScrollArea className="flex-grow bg-black/30 rounded-md" ref={scrollAreaRef}>
                    <div className="p-2">
                        {neoMessages.map((msg, i) => <p key={i} className="animate-in fade-in">{msg}</p>)}
                    </div>
                </ScrollArea>
                <div className='p-2 mt-2'>
                    <Button variant="outline" size="sm" onClick={resetPuzzle} className="w-full">
                        <RotateCcw className="mr-2"/>
                        Réinitialiser
                    </Button>
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex-1 relative">
                     <svg width="100%" height="100%" viewBox="-400 -300 800 600">
                        {gridWithCurrentPath.map((hex, i) => (
                          <Hexagon 
                            key={`${hex.q}-${hex.r}`}
                            hex={hex} 
                            onClick={() => handleHexClick(hex)}
                            onRotate={() => handleRotate(hex.q, hex.r)}
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
