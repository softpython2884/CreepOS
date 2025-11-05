
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, Laptop, Smartphone, Link as LinkIcon, ShieldCheck } from 'lucide-react';
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

const Node = ({ pc, x, y, isHacked }: { pc: PC; x: number; y: number; isHacked: boolean }) => (
    <motion.div
        initial={{ x, y, scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
        className="absolute"
        style={{ x, y }}
    >
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className={cn(
                        "w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 border-2 transition-colors",
                        isHacked ? "bg-accent/20 border-accent text-accent" : "bg-secondary/50 border-border text-muted-foreground"
                    )}>
                        {iconMap[pc.type]}
                        <p className="text-xs font-bold truncate w-20 text-center">{pc.name}</p>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-code">{pc.ip}</p>
                    {isHacked && <p className="text-green-400 flex items-center gap-1"><ShieldCheck size={14}/> Access Granted</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </motion.div>
);

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
        const width = 800;
        const height = 600;
        
        // Simple circular layout
        const radius = Math.min(width, height) / 2 - 80;
        const centerX = width / 2 - 48;
        const centerY = height / 2 - 48;
        const angleStep = (2 * Math.PI) / network.length;

        network.forEach((pc, i) => {
            const angle = i * angleStep;
            nodePositions[pc.id] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
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

    return (
        <div className="h-full w-full bg-card/80 p-4 relative overflow-hidden">
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
                    if (!fromNode || !toNode) return null;
                    return <Link key={i} from={fromNode} to={toNode} />;
                })}
            </svg>

            {network.map(pc => {
                const pos = nodes[pc.id];
                if (!pos) return null;
                return <Node key={pc.id} pc={pc} x={pos.x} y={pos.y} isHacked={hackedPcs.has(pc.id)} />;
            })}
        </div>
    );
}
