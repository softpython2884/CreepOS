'use client';

import { useState, useRef, useEffect, useCallback, createRef } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import AIChat from '@/components/apps/ai-chat';
import PhotoViewer from '@/components/apps/photo-viewer';
import DocumentFolder from '@/components/apps/document-folder';
import Browser from '@/components/apps/browser';
import Chatbot from '@/components/apps/chatbot';
import SecurityApp from './apps/security-app';
import SystemStatus from './apps/system-status'; // New App
import { cn } from '@/lib/utils';
import CameraCapture from './camera-capture';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import GpsTracker from './gps-tracker';
import type { GeoJSON } from 'geojson';
import BlueScreen from './events/blue-screen';
import Screamer from './events/screamer';
import AudioManager, { SoundEvent } from './audio-manager';
import PurgeScreen from './events/purge-screen';
import Epilogue from './events/epilogue';
import { chapterSixLogs, initialFileSystem, chapterTwoFiles, chapterFourFiles, type FileSystemNode } from './apps/content';
import Draggable from 'react-draggable';
import { type TerminalWriter } from './story/chapter-two-manager';


export type AppId = 'terminal' | 'chat' | 'photos' | 'documents' | 'browser' | 'chatbot' | 'security' | 'systemStatus';
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
  nodeRef: React.RefObject<HTMLDivElement>;
};

interface DesktopProps {
  onReboot: (mode: 'corrupted' | 'defense' | 'total_corruption') => void;
  onShowEpilogue: () => void;
  isCorrupted: boolean;
  isDefenseMode: boolean;
  isTotallyCorrupted: boolean;
  username: string;
}

export default function Desktop({ onReboot, onShowEpilogue, isCorrupted, isDefenseMode, isTotallyCorrupted, username }: DesktopProps) {
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
  const [currentFileSystem, setCurrentFileSystem] = useState<FileSystemNode[]>([...initialFileSystem, ...chapterTwoFiles]);

  // Story state
  const [isChapterOneFinished, setIsChapterOneFinished] = useState(false);
  const [isChapterTwoFinished, setIsChapterTwoFinished] = useState(false);
  const [isChapterThreeFinished, setIsChapterThreeFinished] = useState(false);
  const [isChapterFourTriggered, setIsChapterFourTriggered] = useState(false);
  const [isChapterFiveTriggered, setIsChapterFiveTriggered] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<ImagePlaceholder | null>(null);
  const terminalWriterRef = useRef<TerminalWriter | null>(null);
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
        setTimeout(() => onReboot('corrupted'), 8000);
        return;
    }
    setActiveEvent(eventId);

    if (eventId === 'scream') setSoundEvent('scream');
    if (eventId === 'corrupt' || eventId === 'glitch') setSoundEvent('glitch');

    if (['lag', 'corrupt', 'glitch', 'tear', 'chromatic', 'red_screen', 'freeze', 'system_collapse'].includes(eventId)) {
      const duration = eventId === 'lag' ? 5000 : (eventId === 'red_screen' ? 1500 : (eventId === 'chromatic' ? 500 : (eventId === 'freeze' ? 1000000 : 3000)));
      if(eventId !== 'system_collapse' && eventId !== 'freeze' && eventId !== 'die_screen') {
        setTimeout(() => setActiveEvent('none'), duration);
      }
    }
  }, [closeAllApps, onReboot]);

  const closeApp = useCallback((instanceId: number) => {
    setSoundEvent('close');
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
}, [activeInstanceId]);

  const handleChapterOneFinish = () => {
    setIsChapterOneFinished(true);
    const chatApp = openApps.find(app => app.appId === 'chat');
    if (chatApp) {
        setTimeout(() => closeApp(chatApp.instanceId), 1000);
    }
  };

  const handleBackdoorSuccess = useCallback(() => {
    triggerEvent('bsod');
  }, [triggerEvent]);


  const handleChapterFiveFinish = () => {
    triggerEvent('freeze');
    setTimeout(() => {
        onReboot('total_corruption');
    }, 2000);
  }

  const handleCorruptionFinish = () => {
    onReboot('defense');
  };
  
  const appConfig: AppConfig = {
    terminal: { title: 'Terminal', component: Terminal, width: 600, height: 400, props: { triggerEvent, setTerminalWriter: (writer: TerminalWriter) => terminalWriterRef.current = writer }, isCorruptible: true },
    chat: { title: 'Néo', component: AIChat, width: 400, height: 600, props: { location, isCorrupted: isCorrupted && !isTotallyCorrupted, onCorruptionFinish: handleCorruptionFinish }, isCorruptible: true },
    photos: { title: 'Photo Viewer', component: PhotoViewer, width: 600, height: 400, props: { extraImages: capturedImages }, isCorruptible: true },
    documents: { title: 'Documents', component: DocumentFolder, width: 600, height: 400, props: { initialFileSystem: currentFileSystem, onFolderUnlocked: (folderId: string) => { if (folderId === 'folder-archives') setIsChapterTwoFinished(true)} }, isCorruptible: true },
    browser: { title: 'Hypnet Explorer', component: Browser, width: 800, height: 600, props: { onBackdoorSuccess: handleBackdoorSuccess }, isCorruptible: true },
    chatbot: { title: '???', component: Chatbot, width: 400, height: 500, props: { onFinish: handleChapterFiveFinish }, isCorruptible: false },
    security: { title: 'SENTINEL', component: SecurityApp, width: 900, height: 650, isCorruptible: false },
    systemStatus: { title: 'System Status', component: SystemStatus, width: 450, height: 250, props: { isDefenseMode: isDefenseMode, username: username }, isCorruptible: false },
  };

  const openApp = useCallback((appId: AppId, options: { x?: number, y?: number } = {}) => {
    const instanceId = nextInstanceIdRef.current;
    
    // Chapter triggers
    if (appId === 'documents' && isChapterOneFinished) {
        // This is handled by folder unlock now
    }
    if (appId === 'browser' && isCorrupted && !isChapterFourTriggered) {
        setIsChapterFourTriggered(true);
        setCurrentFileSystem(prev => [...prev, ...chapterFourFiles]);
    }
    if (isDefenseMode && !isChapterFiveTriggered) {
        setIsChapterFiveTriggered(true);
        appId = 'chatbot'; // Force open chatbot
    }
    if (isTotallyCorrupted) {
      if (openApps.length === 0) { // Prevent loop
          onShowEpilogue();
      }
      return;
    }


    nextInstanceIdRef.current += 1;

    const config = appConfig[appId];
    // Center with some random offset
    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomYOffset = (Math.random() - 0.5) * 200;
    const x = options.x ?? (1920 / 2) - (config.width / 2) + randomXOffset;
    const y = options.y ?? (1080 / 2) - (config.height / 2) + randomYOffset;
    
    const newApp: OpenApp = { instanceId, appId, zIndex: nextZIndex, x, y, nodeRef: createRef<HTMLDivElement>() };

    setOpenApps(prev => [...prev, newApp]);
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
    
    setSoundEvent('click');
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  }, [isChapterOneFinished, nextZIndex, isCorrupted, isChapterFourTriggered, isDefenseMode, isChapterFiveTriggered, isTotallyCorrupted, appConfig, onShowEpilogue, openApps]);

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


  useEffect(() => {
    if (isCorrupted && !isChapterFourTriggered) {
        setIsChapterFourTriggered(true);
        setCurrentFileSystem(prev => [...prev, ...chapterFourFiles]);
        openApp('chat', { 
            x: (1920 / 2) - (appConfig.chat.width / 2),
            y: (1080 / 2) - (appConfig.chat.height / 2)
        });
    } else if (isDefenseMode) {
        openApp('systemStatus', { x: 50, y: 50 });
        openApp('security', { x: 550, y: 50 });
        openApp('chatbot');
    } else if (isTotallyCorrupted) {
        onShowEpilogue();
    }
    else {
      // Normal start - Chapter 1
      if (openApps.length === 0 && !isChapterOneFinished) {
        openApp('systemStatus', { x: 50, y: 50 });
        openApp('chat', { x: 550, y: 100 });
      }
    }
    
    if (isCorrupted || isDefenseMode || isTotallyCorrupted) {
        setActiveEvent('chromatic');
        const timer1 = setTimeout(() => setIsGlitching(true), 200);
        const timer2 = setTimeout(() => { setActiveEvent('none'); setIsGlitching(false); }, 500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCorrupted, isDefenseMode, isTotallyCorrupted]);

  useEffect(() => {
    if (isTotallyCorrupted && terminalWriterRef.current) {
        triggerEvent('total_corruption');
        const terminal = terminalWriterRef.current;
        setTimeout(() => {
            chapterSixLogs.forEach((log, i) => {
                setTimeout(() => terminal.write(log), i * 500);
            });
        }, 1000);
    }
  }, [isTotallyCorrupted, triggerEvent]);

  const handleNewCapture = useCallback((imageUri: string) => {
    const newCapture: ImagePlaceholder = { id: `capture-${Date.now()}`, description: "It's you.", imageUrl: imageUri, imageHint: "self portrait" };
    setCapturedImages(prev => [...prev, newCapture]);
  }, []);
  
  const handleChapterCapture = useCallback((imageUri: string) => {
      const newCapture: ImagePlaceholder = { id: `story-capture-${Date.now()}`, description: "...", imageUrl: imageUri, imageHint: "self portrait" };
      setLastCapturedImage(newCapture);
      setCapturedImages(prev => [...prev, newCapture]);
  }, []);

  const renderEvent = () => {
    switch (activeEvent) {
      case 'bsod': return <BlueScreen onReboot={() => {}} />;
      case 'scream': return <Screamer onFinish={() => setActiveEvent('none')} />;
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
      
      <CameraCapture onCapture={handleNewCapture} enabled={isChapterTwoFinished && !isChapterThreeFinished} />
      <GpsTracker onLocationUpdate={setLocation} />
      <AudioManager event={soundEvent} onEnd={() => setSoundEvent(null)} />
      
      {activeEvent !== 'bsod' && activeEvent !== 'die_screen' && activeEvent !== 'purge_screen' && (
        <>
            <h1 className="absolute top-8 text-4xl font-headline text-primary opacity-50 select-none pointer-events-none">CAUCHEMAR VIRTUEL</h1>
            {openApps.map((app) => {
                const isAppCorrupted = ((isCorrupted || isTotallyCorrupted || activeEvent === 'system_collapse') && appConfig[app.appId].isCorruptible);
                
                const currentAppConfig = (() => {
                  let config = { ...appConfig[app.appId] };
                  if (app.appId === 'photos') {
                    config.props = { ...config.props, highlightedImageId: lastCapturedImage?.id, isSystemCollapsing: activeEvent === 'system_collapse' };
                  }
                  if (app.appId === 'chat') {
                    config.props = { ...config.props, isChapterOne: !isChapterOneFinished, onChapterOneFinish: handleChapterOneFinish }
                  }
                  if (app.appId === 'documents') {
                    config.props = { ...appConfig.documents.props, initialFileSystem: currentFileSystem };
                  }
                  if (app.appId === 'systemStatus') {
                    config.props = { ...config.props, isDefenseMode, username };
                  }
                  return config;
                })();

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
                          <Window title={currentAppConfig.title} onClose={() => closeApp(app.instanceId)} width={currentAppConfig.width} height={currentAppConfig.height} isCorrupted={isAppCorrupted}>
                              <AppComponent {...currentAppConfig.props}/>
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

    