
'use client';

import { Terminal, Bot, Image as ImageIcon, Folder, Globe } from 'lucide-react';
import type { AppId } from '@/components/desktop';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DockProps {
  onAppClick: (appId: AppId) => void;
  openApps: { instanceId: number; appId: AppId }[];
  activeInstanceId: number | null;
}

const apps: { id: AppId; name: string; icon: JSX.Element }[] = [
  { id: 'chat', name: 'Néo Assistant', icon: <Bot /> },
  { id: 'terminal', name: 'Terminal', icon: <Terminal /> },
  { id: 'documents', name: 'Documents', icon: <Folder /> },
  { id: 'photos', name: 'Photo Viewer', icon: <ImageIcon /> },
  { id: 'browser', name: 'Hypnet Explorer', icon: <Globe /> },
];

export default function Dock({ onAppClick, openApps, activeInstanceId }: DockProps) {
  
  return (
    <TooltipProvider delayDuration={0}>
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center justify-center gap-3 rounded-lg border bg-card/50 p-2 backdrop-blur-sm shadow-lg">
          {apps.map((app) => {
            const isActive = openApps.some(openApp => openApp.appId === app.id && openApp.instanceId === activeInstanceId);
            
            return (
                <Tooltip key={app.id}>
                <TooltipTrigger asChild>
                    <button
                    onClick={() => onAppClick(app.id)}
                    className={cn(
                        'relative flex h-12 w-12 items-center justify-center rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        'text-foreground',
                    )}
                    aria-label={`Open ${app.name}`}
                    >
                    {app.icon}
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
