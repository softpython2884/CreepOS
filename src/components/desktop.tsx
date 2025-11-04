
'use client';

import { useState, useRef, useCallback, createRef, useEffect } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import DocumentFolder from '@/components/apps/document-folder';
import TextEditor from '@/components/apps/text-editor';
import { cn } from '@/lib/utils';
import { SoundEvent, MusicEvent } from './audio-manager';
import { type FileSystemNode } from '@/lib/network/types';
import Draggable from 'react-draggable';
import { network } from '@/lib/network';
import { type PC } from '@/lib/network/types';
import NetworkMap from './apps/network-map';

export type AppId = 'terminal' | 'documents' | 'network';

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

// New type for the file being edited
type EditingFile = {
  path: string[];
  content: string;
} | null;

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
  const [editingFile, setEditingFile] = useState<EditingFile>(null);
  const nanoRef = useRef(null);
  const [hackedPcs, setHackedPcs] = useState<Set<string>>(new Set(['player-pc']));

  const handleHackedPc = (pcId: string) => {
    setHackedPcs(prev => new Set(prev).add(pcId));
  }

  useEffect(() => {
      const playerPc = network.find(p => p.id === 'player-pc');
      if (playerPc) {
        const personalizeFileSystem = (nodes: FileSystemNode[]): FileSystemNode[] => {
            return JSON.parse(JSON.stringify(nodes).replace(/<user>/g, username));
        };
        setFileSystem(personalizeFileSystem(playerPc.fileSystem));
      }
  }, [username]);

  const handleOpenFileEditor = (path: string[], content: string) => {
    setEditingFile({ path, content });
  };

    const handleSaveFile = (path: string[], newContent: string) => {
        const parentPath = path.slice(0, -1);
        const fileName = path[path.length - 1];

        const recursiveUpdate = (nodes: FileSystemNode[], currentPath: string[]): FileSystemNode[] => {
            if (currentPath.length === 0) {
                // We are at the target directory
                const fileExists = nodes.some(node => node.name === fileName);
                if (fileExists) {
                    return nodes.map(node => 
                        node.name === fileName && node.type === 'file' 
                            ? { ...node, content: newContent } 
                            : node
                    );
                } else {
                    const newFile: FileSystemNode = {
                        id: `file-${Date.now()}`,
                        name: fileName,
                        type: 'file',
                        content: newContent,
                    };
                    return [...nodes, newFile];
                }
            }

            const [next, ...rest] = currentPath;
            return nodes.map(node => 
                (node.name === next && node.type === 'folder')
                    ? { ...node, children: recursiveUpdate(node.children || [], rest) }
                    : node
            );
        };

        setFileSystem(prevFs => recursiveUpdate(prevFs, parentPath));
        setEditingFile(null); // Close editor
        onSoundEvent('click');
    };

  const appConfig: AppConfig = {
    terminal: { 
        title: 'Terminal', 
        component: Terminal, 
        width: 700, 
        height: 450, 
        props: { 
            onSoundEvent: onSoundEvent,
            username: username,
            onOpenFileEditor: handleOpenFileEditor,
            onHack: handleHackedPc,
            hackedPcs: hackedPcs,
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
    network: {
        title: 'Network Map',
        component: NetworkMap,
        width: 800,
        height: 600,
        props: {
            network: network,
            hackedPcs: hackedPcs,
        }
    }
  };

  const openApp = useCallback((appId: AppId) => {
    // This check is now only for the DocumentFolder which depends on the local FS
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
  }, [nextZIndex, onSoundEvent, appConfig, fileSystem.length]);

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
      
      {openApps.map((app) => {
          const currentAppConfig = appConfig[app.appId];
          if (!currentAppConfig) return null;
          const AppComponent = currentAppConfig.component;
          
          let props = { ...currentAppConfig.props };
          if (app.appId !== 'terminal') {
            props = { ...props, fileSystem: fileSystem, onFileSystemUpdate: setFileSystem, hackedPcs };
          }
          
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
      
      {editingFile && (
        <Draggable
            handle=".handle"
            bounds="parent"
            nodeRef={nanoRef}
            defaultPosition={{ 
                x: (document.getElementById('viewport')?.offsetWidth || 1920) / 2 - 400,
                y: (document.getElementById('viewport')?.offsetHeight || 1080) / 2 - 300,
             }}
        >
            <div ref={nanoRef} style={{ zIndex: nextZIndex + 1 }} className="absolute">
              <Window title={`nano - ${editingFile.path.join('/')}`} onClose={() => setEditingFile(null)} width={800} height={600}>
                  <TextEditor 
                      fileContent={editingFile.content}
                      onSave={(newContent) => handleSaveFile(editingFile.path, newContent)}
                  />
              </Window>
            </div>
        </Draggable>
      )}

      <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} />
    </main>
  );
}
