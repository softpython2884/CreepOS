
'use client';

import { useState, useRef, useEffect, useCallback, createRef } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import AIChat from '@/components/apps/ai-chat';
import PhotoViewer from '@/components/apps/photo-viewer';
import DocumentFolder from '@/components/apps/document-folder';
import Browser from '@/components/apps/browser';
import { cn } from '@/lib/utils';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { SoundEvent, MusicEvent } from './audio-manager';
import { initialFileSystem, type FileSystemNode } from './apps/content';
import Draggable from 'react-draggable';

export type AppId = 'terminal' | 'chat' | 'photos' | 'documents' | 'browser';

type AppConfig = {
  [key in AppId]: {
    title: string;
    component: (props: any) => JSX.Element;
    width: number;
    height: number;
    props?: any;
  };
};

type OpenApp = {
  instanceId: number;
  appId: AppId;
  zIndex: number;
  x: number;
  y: number;
  nodeRef: React.RefObject<HTMLDivElement>;
};

interface DesktopProps {
  onSoundEvent: (event: SoundEvent) => void;
  onMusicEvent: (event: MusicEvent) => void;
  username: string;
}

export default function Desktop({ onSoundEvent, onMusicEvent, username }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const [currentFileSystem, setCurrentFileSystem] = useState<FileSystemNode[]>(initialFileSystem);

  const appConfig: AppConfig = {
    terminal: { title: 'Terminal', component: Terminal, width: 600, height: 400, props: {} },
    chat: { title: 'Néo', component: AIChat, width: 400, height: 600, props: {} },
    photos: { title: 'Photo Viewer', component: PhotoViewer, width: 600, height: 400, props: {} },
    documents: { title: 'Documents', component: DocumentFolder, width: 600, height: 400, props: { initialFileSystem: currentFileSystem, onSoundEvent: onSoundEvent } },
    browser: { title: 'Hypnet Explorer', component: Browser, width: 800, height: 600, props: { onSoundEvent: onSoundEvent } },
  };

  const openApp = useCallback((appId: AppId, options: { x?: number, y?: number } = {}) => {
    const instanceId = nextInstanceIdRef.current++;
    const config = appConfig[appId];
    
    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomYOffset = (Math.random() - 0.5) * 200;
    const x = options.x ?? (1920 / 2) - (config.width / 2) + randomXOffset;
    const y = options.y ?? (1080 / 2) - (config.height / 2) + randomYOffset;
    
    const newApp: OpenApp = { instanceId, appId, zIndex: nextZIndex, x, y, nodeRef: createRef<HTMLDivElement>() };

    setOpenApps(prev => [...prev, newApp]);
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
    onSoundEvent('click');
  }, [nextZIndex, onSoundEvent, appConfig]);

  const closeApp = useCallback((instanceId: number) => {
    onSoundEvent('close');
    setOpenApps(prev => {
        const newApps = prev.filter(app => app.instanceId !== instanceId);
        if (activeInstanceId === instanceId) {
            if (newApps.length > 0) {
                const nextActiveApp = newApps.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
                setActiveInstanceId(nextActiveApp.instanceId);
            } else {
                setActiveInstanceId(null);
            }
        }
        return newApps;
    });
  }, [activeInstanceId, onSoundEvent]);
  
  const bringToFront = (instanceId: number) => {
    if (instanceId === activeInstanceId) return;

    setOpenApps(prevApps => {
        const app = prevApps.find(a => a.instanceId === instanceId);
        if (!app) return prevApps;
        
        return prevApps.map(app => 
            app.instanceId === instanceId 
                ? { ...app, zIndex: nextZIndex } 
                : app
        );
    });
    
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
  };
  
  return (
    <main 
      className={cn(
        "h-full w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4",
      )}
      style={{ backgroundImage: `linear-gradient(hsl(var(--accent) / 0.05) 1px, transparent 1px), linear-gradient(to right, hsl(var(--accent) / 0.05) 1px, hsl(var(--background)) 1px)`, backgroundSize: `2rem 2rem` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      
        <>
            <h1 className="absolute top-8 text-4xl font-headline text-primary opacity-50 select-none pointer-events-none">CAUCHEMAR VIRTUEL</h1>
            {openApps.map((app) => {
                const currentAppConfig = appConfig[app.appId];
                const AppComponent = currentAppConfig.component;
                
                return (
                    <Draggable
                      key={app.instanceId}
                      handle=".handle"
                      defaultPosition={{x: app.x, y: app.y}}
                      bounds="parent"
                      nodeRef={app.nodeRef}
                      onStart={() => bringToFront(app.instanceId)}
                    >
                      <div ref={app.nodeRef} style={{ zIndex: app.zIndex, position: 'absolute' }}>
                          <Window title={currentAppConfig.title} onClose={() => closeApp(app.instanceId)} width={currentAppConfig.width} height={currentAppConfig.height}>
                              <AppComponent {...currentAppConfig.props}/>
                          </Window>
                      </div>
                    </Draggable>
                )
            })}
            <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} />
        </>
    </main>
  );
}
