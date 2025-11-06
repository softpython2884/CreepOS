
'use client';

import React, { useMemo } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Server, Laptop, Smartphone, Link as LinkIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PC } from '@/lib/network/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NetworkMapProps {
    network: PC[];
    hackedPcs: Set<string>;
}

const iconMap: Record<PC['type'], React.ReactNode> = {
    Desktop: <Laptop className="w-8 h-8" />,
    Laptop: <Laptop className="w-8 h-8" />,
    Server: <Server className="w-8 h-8" />,
    WebServer: <Server className="w-8 h-8" />,
    Mobile: <Smartphone className="w-8 h-8" />,
};

const Node = ({ pc, x, y, isHacked }: { pc: PC; x: number; y: number; isHacked: boolean }) => {
    const statusColor = isHacked 
        ? "bg-accent/20 border-accent text-accent" 
        : pc.isDangerous
        ? "bg-destructive/20 border-destructive text-destructive"
        : "bg-secondary/50 border-border text-muted-foreground";

    return (
        <motion.div
            initial={{ x, y, scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
            className="absolute cursor-pointer"
            style={{ x, y }}
        >
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <div className={cn(
                            "w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 border-2 transition-colors",
                            statusColor
                        )}>
                            {iconMap[pc.type]}
                            <p className="text-xs font-bold truncate w-20 text-center">{pc.name}</p>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-code">{pc.ip}</p>
                        {pc.isDangerous && <p className="text-destructive flex items-center gap-1"><ShieldAlert size={14}/> DANGEROUS</p>}
                        {isHacked && <p className="text-green-400 flex items-center gap-1"><ShieldCheck size={14}/> Access Granted</p>}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </motion.div>
    );
};

const Link = ({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) => {
    return (
        <motion.line
            x1={from.x + 48}
            y1={from.y + 48}
            x2={to.x + 48}
            y2={to.y + 48}
            stroke="hsl(var(--border))"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
        />
    );
};

export default function NetworkMap({ network, hackedPcs }: NetworkMapProps) {
    
    const { nodes, links } = useMemo(() => {
        const nodePositions: { [key: string]: { x: number; y: number } } = {};
        const width = 1200; // Increased canvas size
        const height = 900;
        
        const playerNode = network.find(pc => pc.id === 'player-pc');
        const otherNodes = network.filter(pc => pc.id !== 'player-pc');

        if (playerNode) {
            nodePositions[playerNode.id] = { x: width / 2 - 48, y: height / 2 - 48 };
        }

        const radius = Math.min(width, height) / 2 - 120;
        const angleStep = (2 * Math.PI) / (otherNodes.length || 1);

        otherNodes.forEach((pc, i) => {
            const angle = i * angleStep;
            nodePositions[pc.id] = {
                x: (width / 2 - 48) + radius * Math.cos(angle),
                y: (height / 2 - 48) + radius * Math.sin(angle),
            };
        });

        const allLinks = network.flatMap(pc =>
            (pc.links || []).map(linkId => ({
                source: pc.id,
                target: linkId,
            }))
        );

        return { nodes: nodePositions, links: allLinks };
    }, [network]);

    const dragControls = useDragControls();

    return (
        <div className="h-full w-full bg-card/80 p-4 relative overflow-hidden cursor-move" onPointerDown={(e) => dragControls.start(e)}>
             <motion.div 
                className="relative w-[1200px] h-[900px]"
                drag
                dragControls={dragControls}
                dragConstraints={{
                    left: -800,
                    right: 400,
                    top: -400,
                    bottom: 400,
                }}
             >
                <svg className="absolute inset-0 w-full h-full">
                    <defs>
                        <motion.linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="100%" stopColor="hsl(var(--accent))" />
                        </motion.linearGradient>
                    </defs>
                    {links.map((link, i) => {
                        const fromNode = nodes[link.source];
                        const toNode = nodes[link.target];
                        if (!fromNode || !toNode || !network.find(pc => pc.id === link.target)) return null;
                        return <Link key={i} from={fromNode} to={toNode} />;
                    })}
                </svg>

                {network.map(pc => {
                    const pos = nodes[pc.id];
                    if (!pos) return null;
                    return <Node key={pc.id} pc={pc} x={pos.x} y={pos.y} isHacked={hackedPcs.has(pc.id)} />;
                })}
            </motion.div>
        </div>
    );
}
