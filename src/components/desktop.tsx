'use client';

import { useState, useRef, useEffect } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import AIChat from '@/components/apps/ai-chat';
import PhotoViewer from '@/components/apps/photo-viewer';
import DocumentFolder from '@/components/apps/document-folder';
import Browser from '@/components/apps/browser';
import { cn } from '@/lib/utils';

export type AppId = 'terminal' | 'chat' | 'photos' | 'documents' | 'browser';

const appConfig: Record<AppId, { title: string; component: JSX.Element; width: number; height: number; }> = {
  terminal: { title: 'Terminal', component: <Terminal />, width: 600, height: 400 },
  chat: { title: 'AI Assistant [L\'Ombre]', component: <AIChat />, width: 600, height: 400 },
  photos: { title: 'Photo Viewer', component: <PhotoViewer />, width: 600, height: 400 },
  documents: { title: 'Documents', component: <DocumentFolder />, width: 600, height: 400 },
  browser: { title: 'Web Browser', component: <Browser />, width: 800, height: 600 },
};

type OpenApp = {
  instanceId: number;
  appId: AppId;
  zIndex: number;
};

export default function Desktop() {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [nextInstanceId, setNextInstanceId] = useState(0);
  const desktopRef = useRef<HTMLDivElement>(null);


  const openApp = (appId: AppId) => {
    const instanceId = nextInstanceId;
    const newApp: OpenApp = {
        instanceId: instanceId,
        appId: appId,
        zIndex: nextZIndex,
    };

    setOpenApps(prev => [...prev, newApp]);
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
    setNextInstanceId(prev => prev + 1);

    // Trigger a brief glitch effect when opening an app
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  };

  const closeApp = (instanceId: number) => {
    setOpenApps(openApps.filter(app => app.instanceId !== instanceId));
    if (activeInstanceId === instanceId) {
      const remainingApps = openApps.filter(app => app.instanceId !== instanceId);
      if (remainingApps.length > 0) {
        // Find the app with the highest z-index to make it active
        const nextActiveApp = remainingApps.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
        setActiveInstanceId(nextActiveApp.instanceId);
      } else {
        setActiveInstanceId(null);
      }
    }
  };

  const bringToFront = (instanceId: number) => {
    if (instanceId === activeInstanceId) return;
    setOpenApps(openApps.map(app => {
      if (app.instanceId === instanceId) {
        return { ...app, zIndex: nextZIndex };
      }
      return app;
    }));
    setActiveInstanceId(instanceId);
    setNextZIndex(nextZIndex + 1);
  };

  return (
    <main 
      ref={desktopRef}
      className={cn(
        "h-full w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4",
        isGlitching && 'animate-glitch'
      )}
      style={{
        backgroundImage: `linear-gradient(hsl(var(--accent) / 0.05) 1px, transparent 1px), linear-gradient(to right, hsl(var(--accent) / 0.05) 1px, hsl(var(--background)) 1px)`,
        backgroundSize: `2rem 2rem`
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      
      <h1 className="absolute top-8 text-4xl font-headline text-primary opacity-50 select-none pointer-events-none">
        CAUCHEMAR VIRTUEL
      </h1>

      {openApps.map((app, index) => {
        const currentApp = appConfig[app.appId];
        let initialX = 0;
        let initialY = 0;

        if (desktopRef.current) {
            const desktopRect = desktopRef.current.getBoundingClientRect();
            initialX = (desktopRect.width / 2) - (currentApp.width / 2) + (index * 30);
            initialY = (desktopRect.height / 2) - (currentApp.height / 2) + (index * 30);
        }
        
        return (
            <div key={app.instanceId} onMouseDown={() => bringToFront(app.instanceId)} style={{ zIndex: app.zIndex, position: 'absolute' }}>
                <Window 
                  title={currentApp.title} 
                  onClose={() => closeApp(app.instanceId)} 
                  width={currentApp.width} 
                  height={currentApp.height}
                  initialX={initialX}
                  initialY={initialY}
                >
                    {currentApp.component}
                </Window>
            </div>
        )
      })}

      <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} />
    </main>
  );
}
