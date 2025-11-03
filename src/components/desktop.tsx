
'use client';

import { useState, useRef, useCallback, createRef, useEffect } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import DocumentFolder from '@/components/apps/document-folder';
import { cn } from '@/lib/utils';
import { SoundEvent, MusicEvent } from './audio-manager';
import { initialFileSystem, type FileSystemNode } from './apps/content';
import Draggable from 'react-draggable';

export type AppId = 'terminal' | 'documents';

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
  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>([]);

  useEffect(() => {
    // Dynamically create the file system with the current username
    const personalizeFileSystem = (nodes: FileSystemNode[]): FileSystemNode[] => {
      return JSON.parse(JSON.stringify(nodes).replace(/<user>/g, username));
    };
    setFileSystem(personalizeFileSystem(initialFileSystem));
  }, [username]);


  const appConfig: AppConfig = {
    terminal: { 
        title: 'Terminal', 
        component: Terminal, 
        width: 600, 
        height: 400, 
        props: { 
            fileSystem: fileSystem,
            onFileSystemUpdate: setFileSystem,
            onSoundEvent: onSoundEvent,
            username: username,
        } 
    },
    documents: { 
        title: 'File Explorer', 
        component: DocumentFolder, 
        width: 700, 
        height: 500, 
        props: { 
            fileSystem: fileSystem,
            onFileSystemUpdate: setFileSystem,
            onSoundEvent: onSoundEvent,
            username: username,
        } 
    },
  };

  const openApp = useCallback((appId: AppId) => {
    // Prevent opening documents if file system is not ready
    if (appId === 'documents' && fileSystem.length === 0) return;

    const instanceId = nextInstanceIdRef.current++;
    const config = appConfig[appId];
    
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    const viewportWidth = viewport.offsetWidth;
    const viewportHeight = viewport.offsetHeight;

    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomYOffset = (Math.random() - 0.5) * 200;
    const x = (viewportWidth / 2) - (config.width / 2) + randomXOffset;
    const y = (viewportHeight / 2) - (config.height / 2) + randomYOffset;
    
    const newApp: OpenApp = { instanceId, appId, zIndex: nextZIndex, x, y, nodeRef: createRef<HTMLDivElement>() };

    setOpenApps(prev => [...prev, newApp]);
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
    onSoundEvent('click');
  }, [nextZIndex, onSoundEvent, appConfig, fileSystem]);

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
            {openApps.map((app) => {
                const currentAppConfig = appConfig[app.appId];
                if (!currentAppConfig) return null;
                const AppComponent = currentAppConfig.component;

                // Refresh props for documents app to pass the latest fileSystem state
                const props = { ...currentAppConfig.props, fileSystem, onFileSystemUpdate: setFileSystem };
                
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
                              <AppComponent {...props}/>
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
