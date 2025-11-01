'use client';

import { Terminal, Bot, Image as ImageIcon, Folder, Globe, ShieldQuestion, Skull, ShieldAlert } from 'lucide-react';
import type { AppId } from '@/components/desktop';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DockProps {
  onAppClick: (appId: AppId) => void;
  openApps: { instanceId: number; appId: AppId }[];
  activeInstanceId: number | null;
  isCorrupted?: boolean;
  isDefenseMode?: boolean;
}

const apps: { id: AppId; name: string; icon: JSX.Element, corruptedIcon: JSX.Element, defenseIcon?: JSX.Element }[] = [
  { id: 'chat', name: 'AI Assistant', icon: <Bot />, corruptedIcon: <Skull className="text-destructive" /> },
  { id: 'terminal', name: 'Terminal', icon: <Terminal />, corruptedIcon: <Terminal className="animate-pulse text-destructive" /> },
  { id: 'documents', name: 'Documents', icon: <Folder />, corruptedIcon: <Folder className="animate-pulse text-destructive" /> },
  { id: 'photos', name: 'Photo Viewer', icon: <ImageIcon />, corruptedIcon: <ImageIcon className="animate-pulse text-destructive" /> },
  { id: 'browser', name: 'Browser', icon: <Globe />, corruptedIcon: <Globe className="animate-pulse text-destructive" /> },
  { id: 'security', name: 'SENTINEL', icon: <ShieldAlert />, corruptedIcon: <ShieldAlert className="text-destructive" />, defenseIcon: <ShieldAlert className="text-blue-400 animate-pulse" /> },
];

export default function Dock({ onAppClick, openApps, activeInstanceId, isCorrupted = false, isDefenseMode = false }: DockProps) {
  
  const displayedApps = apps.filter(app => {
    if (isDefenseMode) {
        return ['terminal', 'security'].includes(app.id);
    }
    if (isCorrupted) {
        return true;
    }
    // In normal mode, don't show the security app
    return app.id !== 'security';
  });

  return (
    <TooltipProvider delayDuration={0}>
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center justify-center gap-3 rounded-lg border bg-card/50 p-2 backdrop-blur-sm shadow-lg">
          {displayedApps.map((app) => {
            const isActive = openApps.some(openApp => openApp.appId === app.id && openApp.instanceId === activeInstanceId);
            const getIcon = () => {
                if (isDefenseMode && app.defenseIcon) return app.defenseIcon;
                if (isCorrupted) return app.corruptedIcon;
                return app.icon;
            }
            return (
                <Tooltip key={app.id}>
                <TooltipTrigger asChild>
                    <button
                    onClick={() => onAppClick(app.id)}
                    className={cn(
                        'relative flex h-12 w-12 items-center justify-center rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        'text-foreground',
                        isCorrupted && "animate-glitch"
                    )}
                    aria-label={`Open ${app.name}`}
                    >
                    {getIcon()}
                    {openApps.some(openApp => openApp.appId === app.id) && (
                        <span className={cn(
                            "absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full",
                            isActive ? 'bg-accent-foreground' : 'bg-muted-foreground'
                        )}></span>
                    )}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{app.name}</p>
                </TooltipContent>
                </Tooltip>
            )
          })}
        </div>
      </footer>
    </TooltipProvider>
  );
}

    