'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import AIChat from '@/components/apps/ai-chat';
import PhotoViewer from '@/components/apps/photo-viewer';
import DocumentFolder from '@/components/apps/document-folder';
import Browser from '@/components/apps/browser';
import Chatbot from '@/components/apps/chatbot'; // New app for chapter 5
import SecurityApp from './apps/security-app';
import { cn } from '@/lib/utils';
import CameraCapture from './camera-capture';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import GpsTracker from './gps-tracker';
import type { GeoJSON } from 'geojson';
import BlueScreen from './events/blue-screen';
import Screamer from './events/screamer';
import AudioManager, { SoundEvent } from './audio-manager';
import ChapterTwoManager, { type TerminalWriter } from './story/chapter-two-manager';
import ChapterThreeManager from './story/chapter-three-manager';
import ChapterFourManager from './story/chapter-four-manager';
import ChapterFiveManager from './story/chapter-five-manager';
import ChapterSevenManager from './story/chapter-seven-manager';
import ChapterNineManager from './story/chapter-nine-manager';
import DieScreen from './events/die-screen';
import PurgeScreen from './events/purge-screen';
import { chapterSixLogs } from './apps/content';
import Draggable from 'react-draggable';


export type AppId = 'terminal' | 'chat' | 'photos' | 'documents' | 'browser' | 'chatbot' | 'security';
export type EventId = 'bsod' | 'scream' | 'lag' | 'corrupt' | 'glitch' | 'tear' | 'chromatic' | 'red_screen' | 'die_screen' | 'freeze' | 'total_corruption' | 'purge_screen' | 'system_collapse' | 'none';

type AppConfig = {
  [key in AppId]: {
    title: string;
    component: (props: any) => JSX.Element;
    width: number;
    height: number;
    props?: any;
    isCorruptible?: boolean;
  };
};

type OpenApp = {
  instanceId: number;
  appId: AppId;
  zIndex: number;
  x: number;
  y: number;
};

interface DesktopProps {
  onReboot: (mode: 'corrupted' | 'defense' | 'total_corruption') => void;
  onShowEpilogue: () => void;
  isCorrupted: boolean;
  isDefenseMode: boolean;
  isTotallyCorrupted: boolean;
}

export default function Desktop({ onReboot, onShowEpilogue, isCorrupted, isDefenseMode, isTotallyCorrupted }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [capturedImages, setCapturedImages] = useState<ImagePlaceholder[]>([]);
  const [location, setLocation] = useState<GeoJSON.Point | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventId>('none');
  const [soundEvent, setSoundEvent] = useState<SoundEvent | null>('fan');

  // Story state
  const [isChapterOneFinished, setIsChapterOneFinished] = useState(false);
  const [isChapterTwoTriggered, setIsChapterTwoTriggered] = useState(false);
  const [chapterTwoInstanceId, setChapterTwoInstanceId] = useState<number | null>(null);
  const [isChapterTwoFinished, setIsChapterTwoFinished] = useState(false);
  const [isChapterThreeFinished, setIsChapterThreeFinished] = useState(false);
  const [isChapterFourTriggered, setIsChapterFourTriggered] = useState(false);
  const [isChapterFiveTriggered, setIsChapterFiveTriggered] = useState(false);
  const [isChapterSevenTriggered, setIsChapterSevenTriggered] = useState(false);
  const [isChapterNineTriggered, setIsChapterNineTriggered] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<ImagePlaceholder | null>(null);
  const terminalWriterRef = useRef<TerminalWriter | null>(null);
  const [browserController, setBrowserController] = useState<any>(null);
  const [isCameraActiveForStory, setIsCameraActiveForStory] = useState(false);


  const closeAllApps = useCallback(() => {
    setOpenApps([]);
    setActiveInstanceId(null);
  }, []);
  
  const triggerEvent = useCallback((eventId: EventId) => {
    if (eventId === 'bsod') {
        closeAllApps();
        setSoundEvent('bsod');
        setActiveEvent('bsod');
        setTimeout(() => onReboot(isChapterThreeFinished && !isCorrupted ? 'defense' : 'corrupted'), 8000);
        return;
    }
    setActiveEvent(eventId);

    if (eventId === 'scream') setSoundEvent('scream');
    if (eventId === 'corrupt' || eventId === 'glitch') setSoundEvent('glitch');

    if (['lag', 'corrupt', 'glitch', 'tear', 'chromatic', 'red_screen', 'freeze', 'system_collapse'].includes(eventId)) {
      const duration = eventId === 'lag' ? 5000 : (eventId === 'red_screen' ? 1500 : (eventId === 'chromatic' ? 500 : (eventId === 'freeze' ? 1000000 : 3000)));
      if(eventId !== 'system_collapse' && eventId !== 'freeze') {
        setTimeout(() => setActiveEvent('none'), duration);
      }
    }
  }, [closeAllApps, onReboot, isChapterThreeFinished, isCorrupted]);

  const closeApp = useCallback((instanceId: number) => {
    setOpenApps(prev => prev.filter(app => app.instanceId !== instanceId));
    setSoundEvent('close');
    if (activeInstanceId === instanceId) {
      const remainingApps = openApps.filter(app => app.instanceId !== instanceId);
      if (remainingApps.length > 0) {
        const nextActiveApp = remainingApps.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
        setActiveInstanceId(nextActiveApp.instanceId);
      } else {
        setActiveInstanceId(null);
      }
    }
  }, [activeInstanceId, openApps]);

  const handleChapterTwoFinish = () => {
    setIsChapterTwoFinished(true);
    if (chapterTwoInstanceId !== null) {
      closeApp(chapterTwoInstanceId);
    }
  };

  const handleChapterThreeFinish = () => {
      setIsChapterThreeFinished(true);
      triggerEvent('bsod');
  }

  const handleChapterFiveFinish = () => {
    triggerEvent('freeze');
    setTimeout(() => {
        onReboot('total_corruption');
    }, 2000);
  }

  const appConfig: AppConfig = {
    terminal: { title: 'Terminal', component: Terminal, width: 600, height: 400, props: { triggerEvent, setTerminalWriter: (writer: TerminalWriter) => terminalWriterRef.current = writer }, isCorruptible: true },
    chat: { title: 'Néo', component: AIChat, width: 400, height: 600, props: { location, isChapterOne: !isChapterOneFinished && !isCorrupted, onChapterOneFinish: () => setIsChapterOneFinished(true), isCorrupted: isCorrupted }, isCorruptible: true },
    photos: { title: 'Photo Viewer', component: PhotoViewer, width: 600, height: 400, props: { extraImages: capturedImages }, isCorruptible: true },
    documents: { title: 'Documents', component: DocumentFolder, width: 600, height: 400, isCorruptible: true },
    browser: { title: 'Hypnet Explorer', component: Browser, width: 800, height: 600, props: { setBrowserController }, isCorruptible: true },
    chatbot: { title: '???', component: Chatbot, width: 400, height: 500, props: { onFinish: handleChapterFiveFinish }, isCorruptible: false },
    security: { title: 'SENTINEL', component: SecurityApp, width: 900, height: 650, isCorruptible: false },
  };

  const openApp = useCallback((appId: AppId, options: { x?: number, y?: number } = {}) => {
    const instanceId = nextInstanceIdRef.current;

    if (appId === 'browser' && isCorrupted && !isChapterFourTriggered) setIsChapterFourTriggered(true);
    if (appId === 'chat' && !isChapterTwoTriggered && !isCorrupted) {
        const chatApp = openApps.find(app => app.appId === 'chat');
        if (chatApp) { bringToFront(chatApp.instanceId); return; }
    }
    if (appId === 'terminal' && isChapterOneFinished && !isChapterTwoTriggered) {
        setIsChapterTwoTriggered(true);
        setChapterTwoInstanceId(instanceId);
    }
    if (isDefenseMode && !isChapterFiveTriggered) {
        setIsChapterFiveTriggered(true);
        appId = 'chatbot';
    }
    if (isDefenseMode && appId === 'security' && !isChapterSevenTriggered) {
        setIsChapterSevenTriggered(true);
    }
    if (isChapterSevenTriggered && !isChapterNineTriggered) {
        setIsChapterNineTriggered(true);
    }

    nextInstanceIdRef.current += 1;

    const config = appConfig[appId];
    // Center with some random offset
    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomYOffset = (Math.random() - 0.5) * 200;
    const x = options.x ?? (1920 / 2) - (config.width / 2) + randomXOffset;
    const y = options.y ?? (1080 / 2) - (config.height / 2) + randomYOffset;
    
    const newApp: OpenApp = { instanceId, appId, zIndex: nextZIndex, x, y };

    setOpenApps(prev => [...prev, newApp]);
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
    
    setSoundEvent('click');
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  }, [isChapterOneFinished, isChapterTwoTriggered, nextZIndex, openApps, isCorrupted, isChapterFourTriggered, isDefenseMode, isChapterFiveTriggered, isChapterSevenTriggered, isChapterNineTriggered]);

  useEffect(() => {
    if (isCorrupted) {
        openApp('chat');
    } else if (isDefenseMode) {
        openApp('chatbot');
    } else if (isTotallyCorrupted) {
        // Handled by Chapter 6 effects
    }
    else {
      openApp('chat');
    }
    setActiveEvent('chromatic');
    const timer1 = setTimeout(() => setIsGlitching(true), 200);
    const timer2 = setTimeout(() => { setActiveEvent('none'); setIsGlitching(false); }, 500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCorrupted, isDefenseMode, isTotallyCorrupted]);

  useEffect(() => {
    if (isTotallyCorrupted && terminalWriterRef.current) {
        triggerEvent('total_corruption');
        const terminal = terminalWriterRef.current;
        openApp('terminal', { x: 50, y: 50 });
        setTimeout(() => {
            chapterSixLogs.forEach((log, i) => {
                setTimeout(() => terminal.write(log), i * 500);
            });
        }, 1000);
    }
  }, [isTotallyCorrupted, openApp, triggerEvent]);

  const handleNewCapture = (imageUri: string) => {
    const newCapture: ImagePlaceholder = { id: `capture-${Date.now()}`, description: "It's you.", imageUrl: imageUri, imageHint: "self portrait" };
    setCapturedImages(prev => [...prev, newCapture]);
  };
  
  const handleChapterCapture = useCallback((imageUri: string) => {
      const newCapture: ImagePlaceholder = { id: `story-capture-${Date.now()}`, description: "...", imageUrl: imageUri, imageHint: "self portrait" };
      setLastCapturedImage(newCapture);
      setCapturedImages(prev => [...prev, newCapture]);
  }, []);

  const bringToFront = (instanceId: number) => {
    if (instanceId === activeInstanceId) return;

    setOpenApps(prevApps => {
        const config = appConfig[prevApps.find(a => a.instanceId === instanceId)!.appId];
        const randomXOffset = (Math.random() - 0.5) * 200;
        const randomYOffset = (Math.random() - 0.5) * 200;
        const x = (1920 / 2) - (config.width / 2) + randomXOffset;
        const y = (1080 / 2) - (config.height / 2) + randomYOffset;

        return prevApps.map(app => 
            app.instanceId === instanceId 
                ? { ...app, zIndex: nextZIndex, x, y } 
                : app
        );
    });
    
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
};

  const renderEvent = () => {
    switch (activeEvent) {
      case 'bsod': return <BlueScreen onReboot={() => {}} />;
      case 'scream': return <Screamer onFinish={() => setActiveEvent('none')} />;
      case 'die_screen': return <DieScreen />;
      case 'purge_screen': return <PurgeScreen />;
      default: return null;
    }
  }

  return (
    <main 
      ref={desktopRef}
      className={cn(
        "h-full w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4",
        isGlitching && 'animate-glitch-short',
        (isCorrupted || isTotallyCorrupted) && 'corrupted',
        activeEvent === 'corrupt' && 'animate-glitch',
        activeEvent === 'glitch' && 'animate-glitch-long',
        activeEvent === 'tear' && 'animate-screen-tear',
        activeEvent === 'chromatic' && 'animate-chromatic-aberration',
        activeEvent === 'lag' && 'animate-lag',
        activeEvent === 'red_screen' && 'animate-red-screen',
        activeEvent === 'freeze' && 'animate-ping-freeze',
        activeEvent === 'total_corruption' && 'animate-super-glitch',
        activeEvent === 'system_collapse' && 'animate-system-collapse'
      )}
      style={{ backgroundImage: `linear-gradient(hsl(var(--accent) / 0.05) 1px, transparent 1px), linear-gradient(to right, hsl(var(--accent) / 0.05) 1px, hsl(var(--background)) 1px)`, backgroundSize: `2rem 2rem` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      
      <CameraCapture onCapture={handleNewCapture} enabled={isCameraActiveForStory} />
      <GpsTracker onLocationUpdate={setLocation} />
      <AudioManager event={soundEvent} onEnd={() => setSoundEvent(null)} />
      
      {isChapterTwoTriggered && !isChapterTwoFinished && terminalWriterRef.current && (<ChapterTwoManager terminal={terminalWriterRef.current} triggerEvent={triggerEvent} onCapture={handleChapterCapture} onFinish={handleChapterTwoFinish} />)}
      {isChapterTwoFinished && !isChapterThreeFinished && terminalWriterRef.current && lastCapturedImage && (<ChapterThreeManager terminal={terminalWriterRef.current} triggerEvent={triggerEvent} openApp={openApp} capturedImage={lastCapturedImage} onFinish={handleChapterThreeFinish} />)}
      {isChapterFourTriggered && terminalWriterRef.current && location && (<ChapterFourManager browser={browserController} terminal={terminalWriterRef.current} location={location} triggerEvent={triggerEvent} openApp={openApp} />)}
      {isChapterFiveTriggered && (<ChapterFiveManager onFinish={handleChapterFiveFinish} openApp={openApp} />)}
      {isChapterSevenTriggered && !isChapterNineTriggered && terminalWriterRef.current && (
        <ChapterSevenManager 
            terminal={terminalWriterRef.current} 
            triggerEvent={triggerEvent}
            openApp={openApp}
            setCameraActive={setIsCameraActiveForStory}
        />
      )}
      {isChapterNineTriggered && lastCapturedImage && (
        <ChapterNineManager
            openApp={openApp}
            triggerEvent={triggerEvent}
            capturedImage={lastCapturedImage}
            onFinish={onShowEpilogue}
        />
      )}

      {activeEvent !== 'bsod' && activeEvent !== 'die_screen' && activeEvent !== 'purge_screen' && (
        <>
            <h1 className="absolute top-8 text-4xl font-headline text-primary opacity-50 select-none pointer-events-none">CAUCHEMAR VIRTUEL</h1>
            {openApps.map((app) => {
                const isAppCorrupted = (isTotallyCorrupted || activeEvent === 'system_collapse') && appConfig[app.appId].isCorruptible;
                const currentAppConfig = app.appId === 'photos' ? { ...appConfig.photos, props: { ...appConfig.photos.props, highlightedImageId: lastCapturedImage?.id, isSystemCollapsing: activeEvent === 'system_collapse' } } : appConfig[app.appId];
                const AppComponent = currentAppConfig.component;
                return (
                    <Draggable
                      key={app.instanceId}
                      handle=".handle"
                      defaultPosition={{x: app.x, y: app.y}}
                      bounds="parent"
                      onStart={() => bringToFront(app.instanceId)}
                    >
                      <div style={{ zIndex: app.zIndex, position: 'absolute' }}>
                          <Window title={currentAppConfig.title} onClose={() => closeApp(app.instanceId)} width={currentAppConfig.width} height={currentAppConfig.height} isCorrupted={isAppCorrupted}>
                              <AppComponent {...currentAppConfig.props} isCorrupted={isAppCorrupted}/>
                          </Window>
                      </div>
                    </Draggable>
                )
            })}
            <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} isCorrupted={isTotallyCorrupted} isDefenseMode={isDefenseMode} />
        </>
      )}
      {renderEvent()}
    </main>
  );
}
