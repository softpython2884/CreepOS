
'use client';

import { useState, useEffect, useRef } from 'react';
import { type PC } from '@/lib/network';
import { Server, Laptop, HardDrive, Smartphone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NetworkMapProps {
    network: PC[];
    hackedPcs: Set<string>;
}

type NodePosition = {
    id: string;
    x: number;
    y: number;
};

const iconMap: Record<PC['type'], React.ReactNode> = {
    Desktop: <Laptop className="w-8 h-8" />,
    Laptop: <Laptop className="w-8 h-8" />,
    Server: <Server className="w-8 h-8" />,
    WebServer: <Server className="w-8 h-8" />,
    Mobile: <Smartphone className="w-8 h-8" />,
};

export default function NetworkMap({ network, hackedPcs }: NetworkMapProps) {
    const [positions, setPositions] = useState<NodePosition[]>([]);
    const mapRef = useRef<SVGSVGElement>(null);
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (mapRef.current) {
            const { width, height } = mapRef.current.getBoundingClientRect();
            setMapDimensions({ width, height });

            // Simple circular layout algorithm
            const center = { x: width / 2, y: height / 2 };
            const radius = Math.min(width, height) / 2.5;
            const angleStep = (2 * Math.PI) / network.length;

            const newPositions = network.map((pc, index) => ({
                id: pc.id,
                x: center.x + radius * Math.cos(angleStep * index - Math.PI / 2),
                y: center.y + radius * Math.sin(angleStep * index - Math.PI / 2),
            }));
            setPositions(newPositions);
        }
    }, [network]);

    const getPosition = (id: string) => {
        return positions.find(p => p.id === id) || { x: 0, y: 0 };
    };

    return (
        <div className="h-full w-full bg-card/80 p-4">
             <svg ref={mapRef} className="w-full h-full">
                {/* Render Links */}
                <g>
                    {network.map(pc =>
                        pc.links?.map(linkId => {
                            const sourcePos = getPosition(pc.id);
                            const targetPos = getPosition(linkId);
                            if (!sourcePos || !targetPos) return null;
                            return (
                                <line
                                    key={`${pc.id}-${linkId}`}
                                    x1={sourcePos.x}
                                    y1={sourcePos.y}
                                    x2={targetPos.x}
                                    y2={targetPos.y}
                                    className="stroke-muted-foreground/30"
                                    strokeWidth="2"
                                />
                            );
                        })
                    )}
                </g>

                {/* Render PC nodes on top of links */}
                 {network.map(pc => {
                    const pos = getPosition(pc.id);
                    if (!pos) return null;

                    const isHacked = hackedPcs.has(pc.id);

                    return (
                        <g key={pc.id} transform={`translate(${pos.x}, ${pos.y})`}>
                            <foreignObject x="-40" y="-30" width="80" height="60">
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-20 h-[60px] flex flex-col items-center justify-center cursor-pointer group">
                                            <div className={cn(
                                                "p-2 rounded-full transition-colors",
                                                isHacked ? "bg-primary/20 text-accent" : "bg-secondary text-muted-foreground"
                                            )}>
                                                {iconMap[pc.type] || <Share2 />}
                                            </div>
                                            <p className={cn("text-xs mt-1 truncate", isHacked ? "text-accent" : "text-muted-foreground")}>{pc.name}</p>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="font-code text-sm">
                                            <p>IP: {pc.ip}</p>
                                            {isHacked ? (
                                                <>
                                                    <p>User: {pc.auth.user}</p>
                                                    <p>Pass: {pc.auth.pass}</p>
                                                </>
                                            ) : (
                                                <p>Status: Secure</p>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            </foreignObject>
                        </g>
                    );
                 })}
            </svg>
        </div>
    );
}

    