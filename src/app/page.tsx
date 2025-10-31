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

const appConfig: Record<AppId, { title: string; component: JSX.Element }> = {
  terminal: { title: 'Terminal', component: <Terminal /> },
  chat: { title: 'AI Assistant [L\'Ombre]', component: <AIChat /> },
  photos: { title: 'Photo Viewer', component: <PhotoViewer /> },
  documents: { title: 'Documents', component: <DocumentFolder /> },
  browser: { title: 'Web Browser', component: <Browser /> },
};

export default function Home() {
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);

  const openApp = (appId: AppId) => {
    setActiveApp(appId);
    // Trigger a brief glitch effect when opening an app
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  };

  const closeApp = () => {
    setActiveApp(null);
  };

  const currentApp = activeApp ? appConfig[activeApp] : null;

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

      {currentApp && (
        <Window title={currentApp.title} onClose={closeApp}>
          {currentApp.component}
        </Window>
      )}

      <Dock onAppClick={openApp} activeApp={activeApp} />
    </main>
  );
}
