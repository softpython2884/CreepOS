'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import AIChat from '@/components/apps/ai-chat';
import PhotoViewer from '@/components/apps/photo-viewer';
import DocumentFolder from '@/components/apps/document-folder';
import Browser from '@/components/apps/browser';
import { cn } from '@/lib/utils';
import CameraCapture from './camera-capture';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import GpsTracker from './gps-tracker';
import type { GeoJSON } from 'geojson';
import BlueScreen from './events/blue-screen';
import Screamer from './events/screamer';
import AudioManager, { SoundEvent } from './audio-manager';
import ChapterTwoManager, { type TerminalWriter } from './story/chapter-two-manager';


export type AppId = 'terminal' | 'chat' | 'photos' | 'documents' | 'browser';
export type EventId = 'bsod' | 'scream' | 'lag' | 'corrupt' | 'glitch' | 'tear' | 'chromatic' | 'none';

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
};

export default function Desktop() {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [nextInstanceId, setNextInstanceId] = useState(0);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [capturedImages, setCapturedImages] = useState<ImagePlaceholder[]>([]);
  const [location, setLocation] = useState<GeoJSON.Point | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventId>('none');
  const [soundEvent, setSoundEvent] = useState<SoundEvent | null>('fan');

  // Story state
  const [isChapterTwoTriggered, setIsChapterTwoTriggered] = useState(false);
  const terminalWriterRef = useRef<TerminalWriter | null>(null);
  
  const triggerEvent = useCallback((eventId: EventId) => {
    setActiveEvent(eventId);

    // Trigger sounds for specific events
    if (eventId === 'scream') setSoundEvent('scream');
    if (eventId === 'corrupt' || eventId === 'glitch') setSoundEvent('glitch');
    if (eventId === 'bsod') setSoundEvent('bsod');


    if (['lag', 'corrupt', 'glitch', 'tear', 'chromatic'].includes(eventId)) {
      // These events are temporary visual effects
      const duration = eventId === 'lag' ? 5000 : (eventId === 'chromatic' ? 500 : 3000);
      setTimeout(() => setActiveEvent('none'), duration);
    }
    // 'bsod' and 'scream' will be reset by their own components
  }, []);

  const appConfig: AppConfig = {
    terminal: { 
        title: 'Terminal', 
        component: Terminal, 
        width: 600, 
        height: 400,
        props: { 
            triggerEvent,
            setTerminalWriter: (writer: TerminalWriter) => terminalWriterRef.current = writer,
        }
    },
    chat: { 
        title: 'Néo', 
        component: AIChat, 
        width: 600, 
        height: 400,
        props: { location, isChapterOne: true }
    },
    photos: { 
        title: 'Photo Viewer', 
        component: PhotoViewer, 
        width: 600, 
        height: 400,
        props: { extraImages: capturedImages }
    },
    documents: { title: 'Documents', component: DocumentFolder, width: 600, height: 400 },
    browser: { title: 'Web Browser', component: Browser, width: 800, height: 600 },
  };

  const openApp = (appId: AppId) => {
    if (appId === 'terminal' && !isChapterTwoTriggered) {
        setIsChapterTwoTriggered(true);
    }
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
    
    setSoundEvent('click');
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  };

  // Chapter 1 Effects on Login
  useEffect(() => {
    // Open the chat app on startup for the story
    openApp('chat');

    setActiveEvent('chromatic');
    const timer1 = setTimeout(() => setIsGlitching(true), 200);
    const timer2 = setTimeout(() => {
      setActiveEvent('none');
      setIsGlitching(false);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewCapture = (imageUri: string) => {
    const newCapture: ImagePlaceholder = {
      id: `capture-${Date.now()}`,
      description: "It's you.",
      imageUrl: imageUri,
      imageHint: "self portrait"
    };
    setCapturedImages(prev => [...prev, newCapture]);
  };
  
  const handleChapterTwoCapture = useCallback((imageUri: string) => {
      setCapturedImages(prev => [...prev, {
          id: `story-capture-${Date.now()}`,
          description: "...",
          imageUrl: imageUri,
          imageHint: "self portrait"
      }]);
  }, []);

  const closeApp = (instanceId: number) => {
    setOpenApps(openApps.filter(app => app.instanceId !== instanceId));
    setSoundEvent('close');
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

  const renderEvent = () => {
    switch (activeEvent) {
      case 'bsod':
        return <BlueScreen />; // This event will lock the screen, no need to reset from here
      case 'scream':
        return <Screamer onFinish={() => setActiveEvent('none')} />;
      default:
        return null;
    }
  }

  return (
    <main 
      ref={desktopRef}
      className={cn(
        "h-full w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4",
        isGlitching && 'animate-glitch-short',
        activeEvent === 'corrupt' && 'animate-glitch',
        activeEvent === 'glitch' && 'animate-glitch-long',
        activeEvent === 'tear' && 'animate-screen-tear',
        activeEvent === 'chromatic' && 'animate-chromatic-aberration',
        activeEvent === 'lag' && 'animate-lag'
      )}
      style={{
        backgroundImage: `linear-gradient(hsl(var(--accent) / 0.05) 1px, transparent 1px), linear-gradient(to right, hsl(var(--accent) / 0.05) 1px, hsl(var(--background)) 1px)`,
        backgroundSize: `2rem 2rem`
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      
      <CameraCapture onCapture={handleNewCapture} enabled={false} />
      <GpsTracker onLocationUpdate={setLocation} />
      <AudioManager event={soundEvent} onEnd={() => setSoundEvent(null)} />
      {isChapterTwoTriggered && terminalWriterRef.current && (
          <ChapterTwoManager 
              terminal={terminalWriterRef.current}
              triggerEvent={triggerEvent}
              onCapture={handleChapterTwoCapture}
          />
      )}

      {activeEvent !== 'bsod' && (
        <>
            <h1 className="absolute top-8 text-4xl font-headline text-primary opacity-50 select-none pointer-events-none">
                CAUCHEMAR VIRTUEL
            </h1>
            {openApps.map((app, index) => {
                const currentAppConfig = appConfig[app.appId];
                const AppComponent = currentAppConfig.component;
                
                let initialX = 0;
                let initialY = 0;

                if (desktopRef.current) {
                    const desktopRect = desktopRef.current.getBoundingClientRect();
                    const jitterX = (Math.random() - 0.5) * 40;
                    const jitterY = (Math.random() - 0.5) * 40;
                    initialX = (desktopRect.width / 2) - (currentAppConfig.width / 2) + jitterX;
                    initialY = (desktopRect.height / 2) - (currentAppConfig.height / 2) + jitterY;
                }
                
                return (
                    <div key={app.instanceId} onMouseDown={() => bringToFront(app.instanceId)} style={{ zIndex: app.zIndex, position: 'absolute' }}>
                        <Window 
                          title={currentAppConfig.title} 
                          onClose={() => closeApp(app.instanceId)} 
                          width={currentAppConfig.width} 
                          height={currentAppConfig.height}
                          initialX={initialX}
                          initialY={initialY}
                        >
                            <AppComponent {...currentAppConfig.props} />
                        </Window>
                    </div>
                )
            })}
            <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} />
        </>
      )}

      {renderEvent()}

    </main>
  );
}
