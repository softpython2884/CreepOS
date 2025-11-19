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
import LiveLogs from './apps/live-logs';
import NetworkMap from './apps/network-map';
import EmailClient, { type Email } from './apps/email-client';
import WebBrowser from './apps/web-browser';
import MediaPlayer from './apps/media-player';
import { ShieldAlert, ShieldCheck, Mail, AlertTriangle, Skull } from 'lucide-react';
import { Progress } from './ui/progress';
import TracerTerminal, { traceCommands, decryptCommands, isolationCommands } from './tracer-terminal';
import { saveGameState, loadGameState, deleteGameState } from '@/lib/save-manager';
import SurvivalMode from './survival-mode';

export type AppId = 'terminal' | 'documents' | 'logs' | 'network-map' | 'email' | 'web-browser' | 'media-player';

type AppConfig = {
  [key in AppId]: {
    title: string;
    component: (props: any) => JSX.Element;
    width: number;
    height: number;
    props?: any;
    isSingular?: boolean; // Can only one instance of this app be open?
  };
};

type OpenApp = {
  instanceId: number;
  appId: AppId;
  zIndex: number;
  x: number;
  y: number;
  nodeRef: React.RefObject<HTMLDivElement>;
  isSourceOfTrace?: boolean;
  props?: any; // For app-specific props like file path
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
  setMachineState: (state: string) => void;
}

const updateNodeByPath = (
  nodes: FileSystemNode[],
  path: string[],
  updater: (node: FileSystemNode) => FileSystemNode | null
): FileSystemNode[] => {
  if (path.length === 0) return nodes;
  const nodeName = path[0];
  
  if (path.length === 1) {
      const nodeIndex = nodes.findIndex(n => n.name === nodeName);
      if (nodeIndex !== -1) {
          const updatedNode = updater(nodes[nodeIndex]);
          const newNodes = [...nodes];
          if (updatedNode === null) {
              newNodes.splice(nodeIndex, 1);
          } else {
              newNodes[nodeIndex] = updatedNode;
          }
          return newNodes;
      }
  }

  return nodes.map(node => {
      if (node.name === nodeName && node.type === 'folder' && node.children) {
          return {
              ...node,
              children: updateNodeByPath(node.children, path.slice(1), updater),
          };
      }
      return node;
  });
};


export default function Desktop({ onSoundEvent, onMusicEvent, username, onReboot, setMachineState }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const [editingFile, setEditingFile] = useState<EditingFile>(null);
  const nanoRef = useRef(null);

  const [network, setNetwork] = useState<PC[]>(() => loadGameState(username).network);
  const [hackedPcs, setHackedPcs] = useState<Set<string>>(() => loadGameState(username).hackedPcs);
  const [discoveredPcs, setDiscoveredPcs] = useState<Set<string>>(() => new Set(['player-pc']));
  const [logs, setLogs] = useState<string[]>(['System initialized.']);
  const [dangerLevel, setDangerLevel] = useState(0);

  // Trace state
  const [isTraced, setIsTraced] = useState(false);
  const [traceTimeLeft, setTraceTimeLeft] = useState(0);
  const [traceTarget, setTraceTarget] = useState({ name: '', time: 0 });
  const [isScreaming, setIsScreaming] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  
  // Survival mode state
  const [playerDefenses, setPlayerDefenses] = useState({
      firewall: true,
      ports: [80, 443, 22]
  });


  const [emails, setEmails] = useState<Email[]>([
      {
        id: 'welcome-email',
        sender: 'NEO-SYSTEM',
        recipient: username,
        subject: 'Welcome, Operator',
        body: 'Welcome to the SubSystem OS, Operator. Your terminal is now active. All system communications will be directed here. Await your first directive.\n\n- Néo',
        timestamp: new Date().toISOString(),
        folder: 'inbox',
      },
  ]);

  const gameState = { network, hackedPcs, machineState: 'desktop' };

  useEffect(() => {
    // Autosave interval
    const saveInterval = setInterval(() => {
        saveGameState(username, gameState);
    }, 5000); // Save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [network, hackedPcs, username, gameState]);

    useEffect(() => {
        if (dangerLevel >= 100) {
            setMachineState('survival');
            onMusicEvent('alarm');
            setDangerLevel(0); // Reset for next time
        }
    }, [dangerLevel, setMachineState, onMusicEvent]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => {
        const timestamp = new Date().toISOString();
        const formattedMessage = `${timestamp} - ${message}`;
        return [...prev, formattedMessage];
    });
    
    setNetwork(currentNetwork => {
        const playerPcIndex = currentNetwork.findIndex(p => p.id === 'player-pc');
        if (playerPcIndex === -1) return currentNetwork;

        const playerPc = currentNetwork[playerPcIndex];
        const logPath = ['home', 'logs', 'activity.log'];

        const newFileSystem = updateNodeByPath(playerPc.fileSystem, logPath, (node) => {
            if (node.type === 'file') {
                const timestamp = new Date().toISOString();
                const formattedMessage = `${timestamp} - ${message}`;
                return { ...node, content: (node.content || '') + formattedMessage + '\n' };
            }
            return node;
        });

        const newPlayerPc = { ...playerPc, fileSystem: newFileSystem };
        const newNetwork = [...currentNetwork];
        newNetwork[playerPcIndex] = newPlayerPc;
        return newNetwork;
    });
  }, []);

  const handleStartTrace = useCallback((targetName: string, time: number, sourceInstanceId: number) => {
    if (isTraced) return; // Don't start a new trace if one is active
    
    addLog(`DANGER: Trace initiated from ${targetName}. You have ${time} seconds to disconnect.`);
    onMusicEvent('alarm');
    setIsScreaming(true);
    setIsTraced(true);
    setTraceTimeLeft(time);
    setTraceTarget({ name: targetName, time: time });

    setOpenApps(prev => prev.map(app => 
        app.instanceId === sourceInstanceId ? { ...app, isSourceOfTrace: true } : app
    ));
  }, [addLog, onMusicEvent, isTraced]);

  const handleStopTrace = useCallback(() => {
    if (!isTraced) return;
    
    addLog(`INFO: Trace averted. Disconnected from ${traceTarget.name}.`);
    onMusicEvent('calm');
    if (isScreaming) {
        onSoundEvent('stopScream');
        setIsScreaming(false);
    }
    setIsTraced(false);
    setTraceTimeLeft(0);
    setOpenApps(prev => prev.map(app => ({...app, isSourceOfTrace: false})));
  }, [addLog, onMusicEvent, isTraced, traceTarget, onSoundEvent, isScreaming]);

 useEffect(() => {
    if (!isTraced) {
      if (isScreaming) {
        onSoundEvent('stopScream');
        setIsScreaming(false);
      }
      return;
    }

    const timer = setInterval(() => {
        setTraceTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            if (newTime <= 0) {
                clearInterval(timer);
                addLog(`CRITICAL: Trace completed. KERNEL DELETED.`);

                const updatedNetwork = network.map(pc => {
                    if (pc.id === 'player-pc') {
                        const newFileSystem = updateNodeByPath(
                            pc.fileSystem,
                            ['sys', 'XserverOS.sys'],
                            () => null
                        );
                        return { ...pc, fileSystem: newFileSystem };
                    }
                    return pc;
                });
                setNetwork(updatedNetwork);
                
                saveGameState(username, { network: updatedNetwork, hackedPcs, machineState: 'desktop' });

                onSoundEvent('bsod');
                setMachineState('bsod');
                return 0;
            }
            if (newTime > 0 && !isScreaming) {
                onSoundEvent('scream');
                setIsScreaming(true);
            }
            return newTime;
        });
    }, 1000);

    return () => clearInterval(timer);
}, [isTraced, addLog, isScreaming, onSoundEvent, network, username, setMachineState, hackedPcs]);


  const handleHackedPc = (pcId: string, ip: string) => {
    addLog(`SUCCESS: Root access gained on ${ip}`);
    setHackedPcs(prev => new Set(prev).add(pcId));
  }

  const handleDiscoveredPc = (pcId: string) => {
    setDiscoveredPcs(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(pcId)) {
            newSet.add(pcId);
            addLog(`INFO: New device discovered and added to Network Map.`);
        }
        return newSet;
    });
  }

  const handleIncreaseDanger = (amount: number) => {
    setDangerLevel(prev => Math.min(prev + amount, 100));
    addLog(`DANGER: Trace level increased by ${amount}%`);
  }

  const handleOpenFileEditor = (path: string[], content: string) => {
    setEditingFile({ path, content });
  };
  
  const openApp = useCallback((appId: AppId, appProps?: any) => {
    const config = appConfig[appId];
    
    // If app is singular and already open, just bring it to front
    if (config.isSingular) {
        const existingApp = openApps.find(app => app.appId === appId);
        if (existingApp) {
            bringToFront(existingApp.instanceId);
            return;
        }
    }
    
    const instanceId = nextInstanceIdRef.current++;
    
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    const viewportWidth = viewport.offsetWidth;
    const viewportHeight = viewport.offsetHeight;

    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomYOffset = (Math.random() - 0.5) * 200;
    const x = (viewportWidth / 2) - (config.width / 2) + randomXOffset;
    const y = (viewportHeight / 2) - (config.height / 2) + randomYOffset;
    
    const newApp: OpenApp = { instanceId, appId, zIndex: nextZIndex, x, y, nodeRef: createRef<HTMLDivElement>(), props: appProps };

    setOpenApps(prev => [...prev, newApp]);
    setActiveInstanceId(instanceId);
    setNextZIndex(prev => prev + 1);
    onSoundEvent('click');
  }, [nextZIndex, onSoundEvent, openApps]);


  const handleSaveFile = (path: string[], newContent: string) => {
      addLog(`EVENT: File saved at /${path.join('/')}`);
      
      setNetwork(prevNetwork => {
          return prevNetwork.map(pc => {
              if (pc.id !== 'player-pc') return pc;
              
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
                          addLog(`EVENT: File created at /${path.join('/')}`);
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
                      (node.name === next && node.type === 'folder' && node.children)
                          ? { ...node, children: recursiveUpdate(node.children, rest) }
                          : node
                  );
              };
              
              const newFileSystem = recursiveUpdate(pc.fileSystem, parentPath);
              return { ...pc, fileSystem: newFileSystem };
          });
      });

      setEditingFile(null); // Close editor
      onSoundEvent('click');
  };

  const handleSendEmail = (email: Omit<Email, 'id' | 'timestamp' | 'folder'>) => {
    const newEmail: Email = {
      ...email,
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      folder: 'sent',
    };

    onSoundEvent('email');
    setEmails(prev => [...prev, newEmail]);
    addLog(`EMAIL: Sent email to ${email.recipient} with subject "${email.subject}"`);
    
    // This was causing a re-render error. Wrapping in setTimeout defers the state update.
    setTimeout(() => {
        setEmailNotification(true);
        setTimeout(() => setEmailNotification(false), 2000);
    }, 0);
  };

  const getPlayerFileSystem = useCallback(() => {
    const playerPc = network.find(p => p.id === 'player-pc');
    return playerPc ? playerPc.fileSystem : [];
  }, [network]);

  const setPlayerFileSystem = (newFileSystem: FileSystemNode[] | ((fs: FileSystemNode[]) => FileSystemNode[])) => {
    setNetwork(prevNetwork => {
        const playerPcIndex = prevNetwork.findIndex(p => p.id === 'player-pc');
        if (playerPcIndex === -1) return prevNetwork;

        const playerPc = prevNetwork[playerPcIndex];
        const updatedFileSystem = typeof newFileSystem === 'function' ? newFileSystem(playerPc.fileSystem) : newFileSystem;
        const newPlayerPc = { ...playerPc, fileSystem: updatedFileSystem };

        const newNetwork = [...prevNetwork];
        newNetwork[playerPcIndex] = newPlayerPc;
        return newNetwork;
    });
  };

  const appConfig: AppConfig = {
    terminal: { 
        title: 'Terminal', 
        component: Terminal, 
        width: 700, 
        height: 450, 
        props: { 
            onSoundEvent,
            username,
            onOpenFileEditor: handleOpenFileEditor,
            network,
            setNetwork,
            hackedPcs,
            onHack: handleHackedPc,
            onDiscovered: handleDiscoveredPc,
            onReboot,
            addLog,
            handleIncreaseDanger: handleIncreaseDanger,
            onStartTrace: handleStartTrace,
            onStopTrace: handleStopTrace,
            saveGameState: () => saveGameState(username, gameState),
            resetGame: () => {
                deleteGameState(username);
                onReboot();
            },
            dangerLevel,
            machineState: 'desktop', // Default state for desktop terminal
        } 
    },
    documents: { 
        title: 'File Explorer', 
        component: DocumentFolder, 
        width: 700, 
        height: 500, 
        props: { 
            fileSystem: getPlayerFileSystem(),
            onFileSystemUpdate: setPlayerFileSystem,
            onSoundEvent: onSoundEvent,
            username: username,
            onOpenFile: (fileNode: FileSystemNode) => {
                openApp('media-player', { fileName: fileNode.name, filePath: fileNode.content });
            },
        } 
    },
    logs: {
      title: 'Live Logs',
      component: LiveLogs,
      width: 600,
      height: 400,
      props: {
        logs: logs,
      },
      isSingular: true,
    },
    'network-map': {
      title: 'Network Map',
      component: NetworkMap,
      width: 800,
      height: 600,
      props: {
        network: network.filter(pc => discoveredPcs.has(pc.id)),
        hackedPcs: hackedPcs,
      },
      isSingular: true,
    },
    email: {
      title: 'Email Client',
      component: EmailClient,
      width: 900,
      height: 600,
      props: {
        emails: emails,
        onSend: handleSendEmail,
        currentUser: username,
      },
      isSingular: true,
    },
    'web-browser': {
      title: 'Hypnet Explorer',
      component: WebBrowser,
      width: 1024,
      height: 768,
      props: {
        network: network,
      },
      isSingular: true,
    },
    'media-player': {
      title: 'Media Player',
      component: MediaPlayer,
      width: 450,
      height: 250,
      props: {
        // Default props, will be overridden by openApp call
        fileName: 'unknown',
        filePath: '',
      }
    }
  };
  
  const survivalTerminalConfig = {
      title: 'DEFENSE_TERMINAL',
      component: Terminal,
      width: 700,
      height: 450,
      props: { ...appConfig.terminal.props, machineState: 'survival', setPlayerDefenses, playerDefenses }
  };

  const closeApp = useCallback((instanceId: number) => {
    onSoundEvent('close');
    setOpenApps(prev => {
        const appToClose = prev.find(app => app.instanceId === instanceId);
        if (appToClose?.isSourceOfTrace) {
            handleStopTrace();
        }

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
  }, [activeInstanceId, onSoundEvent, handleStopTrace]);
  
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
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <main 
      className={cn(
        "h-full w-full font-code relative overflow-hidden flex flex-col justify-center items-center p-4 transition-colors duration-500",
        isTraced && "traced"
      )}
      style={{ backgroundImage: `linear-gradient(hsl(var(--accent) / 0.05) 1px, transparent 1px), linear-gradient(to right, hsl(var(--accent) / 0.05) 1px, hsl(var(--background)) 1px)`, backgroundSize: `2rem 2rem` }}
    >
      {isTraced && (
          <div className="absolute inset-0 bg-destructive/80 animate-scream pointer-events-none z-[9998]" />
      )}
      <div className={cn("absolute inset-0 bg-gradient-to-b from-transparent to-background/80 transition-opacity", isTraced && "bg-destructive/30 animate-pulse-slow")} />
      
      {isTraced && (
        <>
          <div className="absolute top-4 left-4 z-[9999] text-destructive-foreground font-code animate-pulse-slow">
              <div className="flex items-center gap-4 p-4 bg-destructive/80 border-2 border-destructive-foreground rounded-lg shadow-2xl shadow-destructive/20">
                  <AlertTriangle className="h-16 w-16" />
                  <div>
                      <h2 className="text-2xl font-bold tracking-widest">TRACE DETECTED</h2>
                      <p className="text-5xl font-bold text-center mt-1">{formatTime(traceTimeLeft)}</p>
                  </div>
              </div>
          </div>

          <div className='absolute top-32 left-4 z-50 flex flex-col gap-2'>
            <TracerTerminal title="INCOMING_TRACE::ID_77_A" commands={traceCommands} startDelay={0} />
            <TracerTerminal title="ROUTE_ANALYSIS::ID_34_B" commands={decryptCommands} startDelay={1000} />
            <TracerTerminal title="NODE_ISOLATION::ID_99_C" commands={isolationCommands} startDelay={2000} />
          </div>
        </>
      )}

      {openApps.map((app) => {
          const currentAppConfig = appConfig[app.appId];
          if (!currentAppConfig) return null;
          const AppComponent = currentAppConfig.component;
          
          let props = { ...currentAppConfig.props, ...app.props };
          
          if (app.appId === 'terminal') {
            props.instanceId = app.instanceId;
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
                    <Window 
                      title={app.appId === 'media-player' ? app.props?.fileName || 'Media Player' : currentAppConfig.title} 
                      onClose={() => closeApp(app.instanceId)} 
                      width={currentAppConfig.width}
                      height={currentAppConfig.height}
                      isCorrupted={app.isSourceOfTrace}
                    >
                      <AppComponent {...props} />
                    </Window>
                </div>
              </Draggable>
          );
      })}

      {editingFile && (
          <Draggable handle=".handle" bounds="parent" nodeRef={nanoRef}>
            <div ref={nanoRef} style={{ zIndex: nextZIndex + 1, position: 'absolute' }}>
              <Window title={`nano - /${editingFile.path.join('/')}`} onClose={() => setEditingFile(null)} width={800} height={600}>
                <TextEditor 
                    fileContent={editingFile.content}
                    onSave={(newContent) => handleSaveFile(editingFile.path, newContent)}
                />
              </Window>
            </div>
          </Draggable>
      )}

      <Dock onAppClick={openApp} openApps={openApps} activeInstanceId={activeInstanceId} emailNotification={emailNotification} />
    </main>
  );
}
