'use client';

import { useState } from 'react';
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
  id: AppId;
  zIndex: number;
  x: number;
  y: number;
};

export default function Home() {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);

  const openApp = (appId: AppId) => {
    
    let appIsOpen = false;
    
    const updatedApps = openApps.map(app => {
        if (app.id === appId) {
            appIsOpen = true;
            return { ...app, zIndex: nextZIndex };
        }
        return app;
    });

    if (appIsOpen) {
        setOpenApps(updatedApps);
    } else {
        const appMeta = appConfig[appId];
        const appCount = openApps.filter(app => app.id === appId).length;
        const x = (window.innerWidth / 2) - (appMeta.width / 2) + (appCount * 30);
        const y = (window.innerHeight / 2) - (appMeta.height / 2) + (appCount * 30);

        setOpenApps([...openApps, { id: appId, zIndex: nextZIndex, x, y }]);
    }
    
    setActiveApp(appId);
    setNextZIndex(nextZIndex + 1);

    // Trigger a brief glitch effect when opening an app
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  };

  const closeApp = (appId: AppId) => {
    setOpenApps(openApps.filter(app => app.id !== appId));
    if (activeApp === appId) {
      const remainingApps = openApps.filter(app => app.id !== appId);
      if (remainingApps.length > 0) {
        // Find the app with the highest z-index to make it active
        const nextActiveApp = remainingApps.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
        setActiveApp(nextActiveApp.id);
      } else {
        setActiveApp(null);
      }
    }
  };

  const bringToFront = (appId: AppId) => {
    setOpenApps(openApps.map(app => {
      if (app.id === appId) {
        return { ...app, zIndex: nextZIndex };
      }
      return app;
    }));
    setActiveApp(appId);
    setNextZIndex(nextZIndex + 1);
  };

  return (
    <main 
      className={cn(
        "min-h-screen w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4",
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

      {openApps.map((app) => {
        const currentApp = appConfig[app.id];
        return (
            <div key={app.id} onMouseDown={() => bringToFront(app.id)} style={{ zIndex: app.zIndex, position: 'absolute', left: `${app.x}px`, top: `${app.y}px`}}>
                <Window title={currentApp.title} onClose={() => closeApp(app.id)} width={currentApp.width} height={currentApp.height}>
                    {currentApp.component}
                </Window>
            </div>
        )
      })}

      <Dock onAppClick={openApp} activeApp={activeApp} />
    </main>
  );
}
