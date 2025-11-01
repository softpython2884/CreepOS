
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
import SystemStatus from './apps/system-status';
import { cn } from '@/lib/utils';
import CameraCapture from './camera-capture';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import Screamer from './events/screamer';
import { SoundEvent, MusicEvent } from './audio-manager';
import PurgeScreen from './events/purge-screen';
import { initialFileSystem, chapterTwoFiles, chapterFourFiles, type FileSystemNode } from './apps/content';
import Draggable from 'react-draggable';
import SystemPanicTimer from './events/system-panic-timer';
import BlueScreen from './events/blue-screen';


export type AppId = 'terminal' | 'chat' | 'photos' | 'documents' | 'browser' | 'chatbot' | 'security' | 'systemStatus';
export type EventId = 'panic' | 'scream' | 'lag' | 'corrupt' | 'glitch' | 'tear' | 'chromatic' | 'red_screen' | 'die_screen' | 'freeze' | 'total_corruption' | 'purge_screen' | 'system_collapse' | 'bsod' | 'none';

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
  onSoundEvent: (event: SoundEvent) => void;
  onMusicEvent: (event: MusicEvent) => void;
  activeEvent: EventId;
  setActiveEvent: (event: EventId) => void;
  onPanicTimeout: () => void;
  isCorrupted: boolean;
  isDefenseMode: boolean;
  isTotallyCorrupted: boolean;
  username: string;
}

export default function Desktop({ onReboot, onShowEpilogue, onSoundEvent, onMusicEvent, activeEvent, setActiveEvent, onPanicTimeout, isCorrupted, isDefenseMode, isTotallyCorrupted, username }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [capturedImages, setCapturedImages] = useState<ImagePlaceholder[]>([]);
  const [currentFileSystem, setCurrentFileSystem] = useState<FileSystemNode[]>(initialFileSystem);
  
  // Story state
  const [isChapterOneFinished, setIsChapterOneFinished] = useState(false);
  const [isChapterTwoFinished, setIsChapterTwoFinished] = useState(false);
  const [isChapterThreeFinished, setIsChapterThreeFinished] = useState(false);
  const [isChapterFourTriggered, setIsChapterFourTriggered] = useState(false);
  const [isChapterFiveTriggered, setIsChapterFiveTriggered] = useState(false);
  const lastCapturedImage = null;

  const handlePanicSolved = useCallback(() => {
    setActiveEvent('none');
    onMusicEvent('none'); // Stop alarm
    onReboot('defense');
  }, [onReboot, setActiveEvent, onMusicEvent]);

  const handleCorruptionFinish = useCallback(() => {
    onReboot('defense');
  }, [onReboot]);
  
  const handleFatalError = () => {
    triggerEvent('freeze');
    setTimeout(() => {
        onReboot('total_corruption');
    }, 2000);
  }

  const appConfig: AppConfig = {
    terminal: { title: 'Terminal', component: Terminal, width: 600, height: 400, props: { isDefenseMode, onPanicSolved: handlePanicSolved, isPanicMode: isCorrupted }, isCorruptible: true },
    chat: { title: 'Néo', component: AIChat, width: 400, height: 600, props: { isChapterOne: !isChapterOneFinished, onChapterOneFinish: () => { setIsChapterOneFinished(true); const chatApp = openApps.find(app => app.appId === 'chat'); if (chatApp) setTimeout(() => closeApp(chatApp.instanceId), 1000); }, isCorrupted: false, onCorruptionFinish: handleCorruptionFinish, isPanicMode: isCorrupted }, isCorruptible: true },
    photos: { title: 'Photo Viewer', component: PhotoViewer, width: 600, height: 400, props: { extraImages: capturedImages }, isCorruptible: true },
    documents: { title: 'Documents', component: DocumentFolder, width: 600, height: 400, props: { initialFileSystem: currentFileSystem, onFolderUnlocked: (folderId: string) => { if (folderId === 'folder-archives') setIsChapterTwoFinished(true)}, onSoundEvent: onSoundEvent }, isCorruptible: true },
    browser: { title: 'Hypnet Explorer', component: Browser, width: 800, height: 600, props: { onBackdoorSuccess: () => triggerEvent('bsod'), onSoundEvent: onSoundEvent }, isCorruptible: true },
    chatbot: { title: '???', component: Chatbot, width: 400, height: 500, props: { onFinish: handleFatalError }, isCorruptible: false },
    security: { title: 'SENTINEL', component: SecurityApp, width: 900, height: 650, props: { onFatalError: handleFatalError }, isCorruptible: false },
    systemStatus: { title: 'System Status', component: SystemStatus, width: 450, height: 250, props: { isDefenseMode: isDefenseMode, username: username }, isCorruptible: false },
  };

  const openApp = useCallback((appId: AppId, options: { x?: number, y?: number } = {}) => {
    const instanceId = nextInstanceIdRef.current;
    nextInstanceIdRef.current += 1;

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
  
  const closeAllApps = useCallback(() => {
    setOpenApps([]);
    setActiveInstanceId(null);
  }, []);

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

  const triggerEvent = useCallback((eventId: EventId) => {
    setActiveEvent(eventId);

    if (eventId === 'scream') onSoundEvent('scream');
    if (eventId === 'bsod') {
        onMusicEvent('none');
        onSoundEvent('bsod');
        setTimeout(() => onReboot('corrupted'), 4000);
        return;
    }
    if (eventId === 'panic') {
        onMusicEvent('alarm');
        onSoundEvent('glitch');
        closeAllApps();
        const chatAppConfig = appConfig['chat'];
        const terminalAppConfig = appConfig['terminal'];
        
        openApp('chat', {
            x: (1920 / 2) - (chatAppConfig.width + 20),
            y: (1080 / 2) - (chatAppConfig.height / 2)
        });
        openApp('terminal', {
            x: (1920 / 2) + 20,
            y: (1080 / 2) - (terminalAppConfig.height / 2)
        });
        return;
    }

    if (eventId === 'corrupt' || eventId === 'glitch') {
        // Trigger multiple glitches
        onSoundEvent('glitch');
        setTimeout(() => onSoundEvent('glitch'), 150);
        setTimeout(() => onSoundEvent('glitch'), 300);
    };

    if (['lag', 'corrupt', 'glitch', 'tear', 'chromatic', 'red_screen', 'freeze', 'system_collapse'].includes(eventId)) {
      const duration = eventId === 'lag' ? 5000 : (eventId === 'red_screen' ? 1500 : (eventId === 'chromatic' ? 500 : (eventId === 'freeze' ? 2000 : 3000)));
      if(eventId !== 'system_collapse' && eventId !== 'freeze' && eventId !== 'die_screen') {
        setTimeout(() => setActiveEvent('none'), duration);
      }
    }
  }, [onSoundEvent, onMusicEvent, setActiveEvent, onReboot, openApp, closeAllApps, appConfig]);
  
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
    // Normal start - Chapter 1
    if(!isCorrupted && !isDefenseMode && !isTotallyCorrupted && !isChapterOneFinished) {
        if (openApps.length === 0) {
            openApp('systemStatus', { x: 50, y: 50 });
            openApp('chat', { x: 550, y: 100 });
        }
    }
    
    // After Chapter 1, add chapter 2 files
    if (isChapterOneFinished && !isChapterTwoFinished) {
        setCurrentFileSystem(prev => {
            if (prev.some(item => item.id === 'folder-archives')) return prev;
            return [...prev, ...chapterTwoFiles]
        });
    }

    // Corrupted state - Chapter 4
    if (isCorrupted && !isChapterFourTriggered) {
        setIsChapterFourTriggered(true);
        setCurrentFileSystem(prev => [...prev, ...chapterFourFiles]);
        onMusicEvent('alarm');
        closeAllApps();
        const chatAppConfig = appConfig['chat'];
        const terminalAppConfig = appConfig['terminal'];
        
        openApp('chat', {
            x: (1920 / 2) - (chatAppConfig.width + 20),
            y: (1080 / 2) - (chatAppConfig.height / 2)
        });
        openApp('terminal', {
            x: (1920 / 2) + 20,
            y: (1080 / 2) - (terminalAppConfig.height / 2)
        });
    } 
    // Defense mode - Chapter 5
    else if (isDefenseMode && !isChapterFiveTriggered) {
        closeAllApps();
        setIsChapterFiveTriggered(true);
        openApp('systemStatus', { x: 50, y: 50 });
        openApp('security', { x: 550, y: 50 });
        openApp('chatbot');
    } 
    // Final state
    else if (isTotallyCorrupted) {
        onShowEpilogue();
    }
    
    if (isCorrupted && !isDefenseMode) {
        triggerEvent('chromatic');
        triggerEvent('glitch');
    } else if (isDefenseMode) {
        triggerEvent('chromatic');
        triggerEvent('glitch');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChapterOneFinished, isCorrupted, isDefenseMode, isTotallyCorrupted]);

  useEffect(() => {
    if (isTotallyCorrupted) {
        triggerEvent('total_corruption');
    }
  }, [isTotallyCorrupted, triggerEvent]);

  const handleNewCapture = useCallback((imageUri: string) => {
    const newCapture: ImagePlaceholder = { id: `capture-${Date.now()}`, description: "It's you.", imageUrl: imageUri, imageHint: "self portrait" };
    setCapturedImages(prev => [...prev, newCapture]);
  }, []);
  
  const renderEventOverlays = () => {
    switch (activeEvent) {
      case 'scream': return <Screamer onFinish={() => setActiveEvent('none')} />;
      case 'purge_screen': return <PurgeScreen />;
      case 'bsod': return <BlueScreen />;
      default: return null;
    }
  }

  return (
    <main 
      ref={desktopRef}
      className={cn(
        "h-full w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4",
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
        {isCorrupted && !isDefenseMode && <SystemPanicTimer onTimeout={onPanicTimeout} />}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      
      <CameraCapture onCapture={handleNewCapture} enabled={isChapterTwoFinished && !isChapterThreeFinished} />
      
      {activeEvent !== 'die_screen' && activeEvent !== 'purge_screen' && activeEvent !== 'bsod' && (
        <>
            <h1 className="absolute top-8 text-4xl font-headline text-primary opacity-50 select-none pointer-events-none">CAUCHEMAR VIRTUEL</h1>
            {openApps.map((app) => {
                const isAppCorrupted = ((isCorrupted || isTotallyCorrupted || activeEvent === 'system_collapse') && appConfig[app.appId].isCorruptible);
                
                const currentAppConfig = (() => {
                  let config = { ...appConfig[app.appId] };
                  
                  // Dynamically set props based on game state
                  const isPanic = isCorrupted && !isDefenseMode;

                  if (app.appId === 'photos') {
                    config.props = { ...config.props, highlightedImageId: lastCapturedImage?.id, isSystemCollapsing: activeEvent === 'system_collapse' };
                  }
                  if (app.appId === 'chat') {
                    config.props = { ...config.props, isPanicMode: isPanic };
                  }
                  if (app.appId === 'documents') {
                    config.props = { ...appConfig.documents.props, onSoundEvent: onSoundEvent };
                  }
                  if (app.appId === 'systemStatus') {
                    config.props = { ...config.props, isDefenseMode, username };
                  }
                   if (app.appId === 'terminal') {
                    config.props = { ...config.props, isDefenseMode, onPanicSolved: handlePanicSolved, isPanicMode: isPanic };
                  }
                  if (app.appId === 'browser') {
                    config.props = { ...config.props, onSoundEvent };
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
      {renderEventOverlays()}
    </main>
  );
}
