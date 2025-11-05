
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
import { network as initialNetwork } from '@/lib/network';
import { type PC } from '@/lib/network/types';
import RemoteAccess from './apps/remote-access';
import LiveLogs from './apps/live-logs';
import NetworkMap from './apps/network-map';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Progress } from './ui/progress';

export type AppId = 'terminal' | 'documents' | 'network' | 'logs' | 'network-map';

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

type EditingFile = {
  path: string[];
  content: string;
} | null;

interface DesktopProps {
  onSoundEvent: (event: SoundEvent) => void;
  onMusicEvent: (event: MusicEvent) => void;
  username: string;
  onReboot: () => void;
}

export default function Desktop({ onSoundEvent, onMusicEvent, username, onReboot }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>([]);
  const [editingFile, setEditingFile] = useState<EditingFile>(null);
  const nanoRef = useRef(null);
  const [network, setNetwork] = useState<PC[]>(() => JSON.parse(JSON.stringify(initialNetwork)));
  const [hackedPcs, setHackedPcs] = useState<Set<string>>(new Set(['player-pc']));
  const [logs, setLogs] = useState<string[]>(['System initialized.']);
  const [dangerLevel, setDangerLevel] = useState(0);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${timestamp} - ${message}`;
    setLogs(prev => [...prev, formattedMessage]);

    // This logic updates the local log file on the player's machine.
    setFileSystem(prevFs => {
      const recursiveUpdate = (nodes: FileSystemNode[], path: string[], newContent: string): FileSystemNode[] => {
        const [current, ...rest] = path;
        return nodes.map(node => {
          if (node.name === current) {
            if (rest.length === 0 && node.type === 'file') {
              return { ...node, content: (node.content ? node.content + '\n' : '') + newContent };
            }
            if (node.type === 'folder' && node.children) {
              return { ...node, children: recursiveUpdate(node.children, rest, newContent) };
            }
          }
          return node;
        });
      };
      const logPath = ['home', username, 'logs', 'activity.log'];
      return recursiveUpdate(prevFs, logPath, formattedMessage);
    });
  }, [username]);

  const handleHackedPc = (pcId: string, ip: string) => {
    addLog(`SUCCESS: Root access gained on ${ip}`);
    setHackedPcs(prev => new Set(prev).add(pcId));
  }

  const handleIncreaseDanger = (amount: number) => {
    setDangerLevel(prev => Math.min(prev + amount, 100));
    addLog(`DANGER: Trace level increased by ${amount}%`);
  }

  useEffect(() => {
      const playerPc = network.find(p => p.id === 'player-pc');
      if (playerPc) {
        const personalizeFileSystem = (nodes: FileSystemNode[]): FileSystemNode[] => {
            return JSON.parse(JSON.stringify(nodes).replace(/<user>/g, username));
        };
        setFileSystem(personalizeFileSystem(playerPc.fileSystem));
      }
  }, [username, network]);

  const handleOpenFileEditor = (path: string[], content: string) => {
    setEditingFile({ path, content });
  };

    const handleSaveFile = (path: string[], newContent: string) => {
        addLog(`EVENT: File saved at /${path.join('/')}`);
        const parentPath = path.slice(0, -1);
        const fileName = path[path.length - 1];

        const recursiveUpdate = (nodes: FileSystemNode[], currentPath: string[]): FileSystemNode[] => {
            if (currentPath.length === 0) {
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
            network: network,
            setNetwork: setNetwork,
            hackedPcs: hackedPcs,
            onHack: handleHackedPc,
            onReboot: onReboot,
            addLog: addLog,
            onIncreaseDanger: handleIncreaseDanger,
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
        title: 'Remote Access',
        component: RemoteAccess,
        width: 800,
        height: 600,
        props: {
            network: network,
            setNetwork: setNetwork,
            hackedPcs: hackedPcs,
            onHack: handleHackedPc,
            addLog: addLog,
            onSoundEvent,
        }
    },
    logs: {
      title: 'Live Logs',
      component: LiveLogs,
      width: 600,
      height: 400,
      props: {
        logs: logs,
      }
    },
    'network-map': {
      title: 'Network Map',
      component: NetworkMap,
      width: 800,
      height: 600,
      props: {
        network: network,
        hackedPcs: hackedPcs
      }
    }
  };

  const openApp = useCallback((appId: AppId) => {
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
          if (app.appId === 'terminal' || app.appId === 'network') {
            props.network = network;
            props.setNetwork = setNetwork;
          }
           if (app.appId === 'network-map') {
            props.network = network;
          }
          if (app.appId === 'logs') {
            props.logs = logs;
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

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-64">
        <div className='flex items-center gap-2 text-sm'>
            {dangerLevel > 75 ? <ShieldAlert className="text-destructive" /> : <ShieldCheck className="text-muted-foreground" />} 
            <span className={cn('text-muted-foreground', dangerLevel > 50 && 'text-amber-400', dangerLevel > 75 && 'text-destructive font-bold' )}>
                Danger Level: {dangerLevel}%
            </span>
        </div>
        <Progress value={dangerLevel} className="h-2 mt-1" indicatorClassName={cn(dangerLevel > 75 ? 'bg-destructive' : 'bg-accent')}/>
      </div>

      <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} />
    </main>
  );
}
