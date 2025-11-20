
'use client';

import { useState, useRef, useCallback, createRef, useEffect } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import DocumentFolder from '@/components/apps/document-folder';
import TextEditor from '@/components/apps/text-editor';
import { cn } from '@/lib/utils';
import { MusicEvent, AlertEvent } from './audio-manager';
import { type FileSystemNode } from '@/lib/network/types';
import Draggable from 'react-draggable';
import { network as initialNetwork } from '@/lib/network';
import { type PC } from '@/lib/network/types';
import LiveLogs from './apps/live-logs';
import NetworkMap from './apps/network-map';
import EmailClient, { type Email } from './apps/email-client';
import WebBrowser from './apps/web-browser';
import MediaPlayer from './apps/media-player';
import SequenceAnalyzer from './apps/sequence-analyzer';
import { AlertTriangle, Skull } from 'lucide-react';
import { saveGameState, loadGameState, deleteGameState } from '@/lib/save-manager';
import SurvivalMode from './survival-mode';
import CallView from './call-view';
import IncomingCallView from './incoming-call-view';
import { Call, CallMessage, CallChoice, CallScript } from '@/lib/call-system/types';
import { supervisorCall1 } from '@/lib/call-system/scripts/supervisor-call-1';
import { directorCall } from '@/lib/call-system/scripts/director-call';
import { neoIntroCall } from '@/lib/call-system/scripts/neo-intro-call';
import { directorCallback } from '@/lib/call-system/scripts/director-callback';
import { neoPhase1Call } from '@/lib/call-system/scripts/neo-phase1-call';
import { supervisorPhase1 } from '@/lib/call-system/scripts/supervisor-phase1';


export type AppId = 'terminal' | 'documents' | 'logs' | 'network-map' | 'email' | 'web-browser' | 'media-player' | 'contract-viewer' | 'sequence-analyzer';

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

type CallState = 'idle' | 'incoming' | 'active';

interface DesktopProps {
  onSoundEvent: (event: 'click' | 'close' | 'bsod' | 'fan' | 'email' | 'error' | 'tension' | null) => void;
  onMusicEvent: (event: MusicEvent) => void;
  onAlertEvent: (event: AlertEvent) => void;
  username: string;
  onReboot: () => void;
  setMachineState: (state: string) => void;
  scale: number;
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


export default function Desktop({ onSoundEvent, onMusicEvent, onAlertEvent, username, onReboot, setMachineState, scale }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const [editingFile, setEditingFile] = useState<EditingFile>(null);
  const nanoRef = useRef(null);

  const [network, setNetwork] = useState<PC[]>(() => loadGameState(username).network);
  const [hackedPcs, setHackedPcs] = useState<Set<string>>(() => loadGameState(username).hackedPcs);
  const [discoveredPcs, setDiscoveredPcs] = useState<Set<string>>(() => new Set(['player-pc', 'cheat-pc']));
  const [logs, setLogs] = useState<string[]>(['System initialized.']);
  const [dangerLevel, setDangerLevel] = useState(0);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const callScriptRef = useRef<CallScript | null>(null);
  const currentNodeIdRef = useRef<string | null>(null);
  const callQueueRef = useRef<(() => void)[]>([]);

  // Trace state
  const [isTraced, setIsTraced] = useState(false);
  const [traceTimeLeft, setTraceTimeLeft] = useState(0);
  const [traceTarget, setTraceTarget] = useState({ name: '', time: 0 });
  const [emailNotification, setEmailNotification] = useState(false);
  

  const [emails, setEmails] = useState<Email[]>(() => {
    const savedState = loadGameState(username);
    if (savedState.emails && savedState.emails.length > 0) {
      return savedState.emails;
    }
    return [
      {
        id: 'welcome-email',
        sender: 'RH@recherche-lab.net',
        recipient: 'Dr.Omen@recherche-lab.net',
        subject: 'Bienvenue et instructions',
        body: `Cher Dr. Omen,\n\nAu nom de toute l'équipe Nexus, nous sommes heureux de vous accueillir.\n\nVotre première mission est de vous familiariser avec le système NÉO. Voici vos identifiants pour accéder au portail de téléchargement :\n\nSite : neo.nexus (accessible via le navigateur Hypnet)\nUtilisateur : dromen\nMot de passe : nexus-init-key\n\nConsultez le portail pour obtenir les instructions de déploiement de NÉO. Un superviseur vous contactera sous peu pour un briefing.\n\nCordialement,\nLes Ressources Humaines de Nexus`,
        timestamp: new Date(new Date().getTime() - 10 * 60000).toISOString(),
        folder: 'inbox',
      },
      {
        id: 'supervisor-email-initial',
        sender: 'Superviseur@recherche-lab.net',
        recipient: 'Dr.Omen@recherche-lab.net',
        subject: 'Appel programmé',
        body: `Omen,\n\nJ'ai planifié un appel avec vous aujourd'hui pour passer en revue vos objectifs. Soyez prêt.\n\n- Superviseur`,
        timestamp: new Date(new Date().getTime() - 5 * 60000).toISOString(),
        folder: 'inbox',
      },
    ];
  });

  const gameState = { network, hackedPcs, emails, machineState: 'desktop' };
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => {
        const timestamp = new Date().toISOString();
        const formattedMessage = `${timestamp} - ${message}`;
        const newLogs = [...prev, formattedMessage];
        if (newLogs.length > 100) {
            newLogs.shift(); // Keep logs from growing indefinitely
        }
        return newLogs;
    });
    
    setNetwork(currentNetwork => {
        const playerPcIndex = currentNetwork.findIndex(p => p.id === 'player-pc');
        if (playerPcIndex === -1) return currentNetwork;

        const playerPc = currentNetwork[playerPcIndex];
        const logPath = ['logs', 'activity.log'];

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

  const receiveEmail = useCallback((emailDetails: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>) => {
    const newEmail: Email = {
      id: `email-${Date.now()}`,
      recipient: 'Dr.Omen@recherche-lab.net',
      folder: 'inbox',
      timestamp: new Date().toISOString(),
      ...emailDetails,
    };

    setEmails(prev => [...prev, newEmail]);
    onSoundEvent('email');
    setEmailNotification(true);
    addLog(`EMAIL: Email reçu de ${emailDetails.sender} avec le sujet "${emailDetails.subject}"`);
  }, [addLog, onSoundEvent]);


  const endCall = useCallback(() => {
    onAlertEvent('stopRingtone');
    onAlertEvent('stopScream'); // Just in case
    
    setCallState('idle');
    setActiveCall(null);
    callScriptRef.current = null;
    currentNodeIdRef.current = null;
    onSoundEvent('close');
    
    if(!isTraced) {
      onMusicEvent('calm');
    }
    
    const nextCall = callQueueRef.current.shift();
    if(nextCall) {
        setTimeout(nextCall, 2000); 
    }
  }, [onAlertEvent, onSoundEvent, onMusicEvent, isTraced]);


  const triggerCall = useCallback((script: CallScript) => {
    if (callState !== 'idle') {
        callQueueRef.current.push(() => triggerCall(script));
        return;
    };

    callScriptRef.current = script;
    currentNodeIdRef.current = script.startNode;
    setActiveCall({
      interlocutor: script.interlocutor,
      isSecure: script.isSecure,
      messages: [], 
      choices: [],
    });
    setCallState('incoming');
    onAlertEvent('ringtone');
    addLog(`EVENT: Appel entrant de ${script.interlocutor}`);
  }, [callState, onAlertEvent, addLog]);

  const answerCall = useCallback(() => {
    const script = callScriptRef.current;
    if (!script || callState !== 'incoming') return;
    
    onAlertEvent('stopRingtone');
    
    const startNode = script.nodes[script.startNode];
    
    setActiveCall(prev => prev ? ({
      ...prev,
      messages: [startNode.message],
      choices: startNode.choices || [],
    }) : null);
    setCallState('active');
    onSoundEvent('click');
  }, [callState, onAlertEvent, onSoundEvent]);

  const declineCall = useCallback(() => {
    addLog(`EVENT: Appel refusé de ${callScriptRef.current?.interlocutor}.`);
    endCall();
  }, [addLog, endCall]);

  const advanceCall = (choiceId: string) => {
    const script = callScriptRef.current;
    if (!script || !activeCall) return;

    const currentNodeId = currentNodeIdRef.current;
    if (!currentNodeId) return;
    const currentNode = script.nodes[currentNodeId];
    
    const chosenChoice = currentNode.choices?.find(c => c.id === choiceId);
    if (!chosenChoice) return;

    const playerMessage: CallMessage = {
        speaker: 'Operator',
        text: chosenChoice.text
    };

    setActiveCall(prev => prev ? ({ ...prev, messages: [...prev.messages, playerMessage], choices: [] }) : null);

    if (chosenChoice.consequences?.danger) {
        handleIncreaseDanger(chosenChoice.consequences.danger);
    }
    if (chosenChoice.consequences?.triggerEmail) {
        receiveEmail(chosenChoice.consequences.triggerEmail);
    }
    if (chosenChoice.consequences?.triggerSound) {
        onSoundEvent(chosenChoice.consequences.triggerSound);
    }
    
    const nextNodeId = chosenChoice.nextNode;
    
    setTimeout(() => {
      const nextNode = script.nodes[nextNodeId];
      if (!nextNode) {
          setActiveCall(prev => prev ? ({ ...prev, isFinished: true, choices: [] }) : null);
          return;
      }

      if (nextNode.consequences?.endCallAndTrigger) {
          setTimeout(() => triggerCall(nextNode.consequences!.endCallAndTrigger!), 1500);
      }
      
      currentNodeIdRef.current = nextNodeId;
      setActiveCall(prev => prev ? ({
          ...prev,
          messages: [...prev.messages, nextNode.message],
          choices: nextNode.choices || [],
          isFinished: !nextNode.choices || nextNode.choices.length === 0,
      }) : null);

      if (nextNode.consequences?.triggerSound) {
        onSoundEvent(nextNode.consequences.triggerSound);
      }

    }, 1000);
  }

  const handlePlayerChoice = (choiceId: string) => {
    advanceCall(choiceId);
  }
  
  const handleStopTrace = useCallback(() => {
    if (!isTraced) return;
    
    addLog(`INFO: Trace évitée. Déconnecté de ${traceTarget.name}.`);
    onAlertEvent('stopScream');
    onMusicEvent('calm');
    setIsTraced(false);
    setTraceTimeLeft(0);
    setOpenApps(prev => prev.map(app => ({...app, isSourceOfTrace: false})));
  }, [addLog, onAlertEvent, onMusicEvent, isTraced, traceTarget]);

  const handleStartTrace = useCallback((targetName: string, time: number, sourceInstanceId: number) => {
    if (isTraced) return;
    
    addLog(`DANGER: Trace initiée depuis ${targetName}. Vous avez ${time} secondes pour vous déconnecter.`);
    onAlertEvent('scream');
    setIsTraced(true);
    setTraceTimeLeft(time);
    setTraceTarget({ name: targetName, time: time });

    setOpenApps(prev => prev.map(app => 
        app.instanceId === sourceInstanceId ? { ...app, isSourceOfTrace: true } : app
    ));
  }, [addLog, onAlertEvent, isTraced]);

  // Initial supervisor call
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCall(supervisorCall1);
    }, 13000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleNeoExecute = useCallback((isInitialInstall: boolean) => {
    if (isInitialInstall) {
        callQueueRef.current = [
          () => triggerCall(directorCall),
          () => receiveEmail(supervisorPhase1)
        ];
        const firstCall = callQueueRef.current.shift();
        if(firstCall) {
            firstCall();
        }
    } else {
        triggerCall(neoPhase1Call);
    }
  }, [triggerCall, receiveEmail]);


  useEffect(() => {
    const saveInterval = setInterval(() => {
        saveGameState(username, gameState);
    }, 5000); 

    return () => clearInterval(saveInterval);
  }, [network, hackedPcs, emails, username, gameState]);

    useEffect(() => {
        if (dangerLevel >= 100) {
            setMachineState('survival');
            onAlertEvent('alarm');
            setDangerLevel(0); // Reset for next time
        }
    }, [dangerLevel, setMachineState, onAlertEvent]);


 useEffect(() => {
    if (!isTraced) {
      return;
    }

    const timer = setInterval(() => {
        setTraceTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            if (newTime <= 0) {
                clearInterval(timer);
                addLog(`CRITICAL: Trace complétée. KERNEL SUPPRIMÉ.`);

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
                
                saveGameState(username, { ...gameState, network: updatedNetwork });

                onSoundEvent('bsod');
                setMachineState('bsod');
                return 0;
            }
            return newTime;
        });
    }, 1000);

    return () => clearInterval(timer);
}, [isTraced, addLog, onSoundEvent, network, username, setMachineState, hackedPcs, handleStopTrace, gameState]);


  const handleHackedPc = (pcId: string, ip: string) => {
    addLog(`SUCCÈS: Accès root obtenu sur ${ip}`);
    setHackedPcs(prev => new Set(prev).add(pcId));
  }

  const handleDiscoveredPc = (pcId: string) => {
    setDiscoveredPcs(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(pcId)) {
            newSet.add(pcId);
            addLog(`INFO: Nouvel appareil découvert et ajouté à la Carte Réseau.`);
        }
        return newSet;
    });
  }

  const handleIncreaseDanger = (amount: number) => {
    setDangerLevel(prev => Math.min(prev + amount, 100));
    addLog(`DANGER: Niveau de trace augmenté de ${amount}%`);
  }

  const handleOpenFileEditor = (path: string[], content: string) => {
    setEditingFile({ path, content });
  };
  
  const openApp = useCallback((appId: AppId, appProps?: any) => {
    const config = appConfig[appId];

    if (appId === 'email') {
        setEmailNotification(false);
    }
    
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

  const handleSequenceAnalysisComplete = useCallback(() => {
    addLog(`EVENT: Analyse de séquence terminée. Rapport généré.`);
    
    setPlayerFileSystem(prevFs => {
        const newFile: FileSystemNode = {
            id: `file-${Date.now()}`,
            name: 'rapport_sequences.txt',
            type: 'file',
            content: `RAPPORT D'ANALYSE DE SÉQUENCE\nDate: ${new Date().toISOString()}\nOpérateur: Dr. Omen\n\nAnalyse des fragments de mémoire brute de data-sequences.bin terminée avec succès.\nStabilité de la séquence restaurée à 100%.\n\nNÉO a identifié et corrigé 3 corruptions de type Delta-7 en utilisant les fonctions logiques ROTATE, SPLIT, et FORWARD.\n\nConclusion: Le jeu de données est maintenant stable et prêt pour une analyse plus approfondie.\n\n- Rapport généré par NÉO -`,
        };

        const documentsPath = ['documents'];
        return updateNodeByPath(prevFs, documentsPath, (docsFolder) => {
            if (docsFolder && docsFolder.type === 'folder' && docsFolder.children) {
                return { ...docsFolder, children: [...docsFolder.children, newFile] };
            }
            return docsFolder;
        });
    });
  }, [addLog]);

  const handleSaveFile = (path: string[], newContent: string) => {
      addLog(`EVENT: Fichier sauvegardé à /${path.join('/')}`);
      
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
                          addLog(`EVENT: Fichier créé à /${path.join('/')}`);
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
    addLog(`EMAIL: Email envoyé à ${email.recipient} avec le sujet "${email.subject}"`);

    if(email.recipient === 'Superviseur@recherche-lab.net' && email.subject.includes('Rapport de Séquence')) {
        const autoReply: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
            sender: 'MAILER-DAEMON@recherche-lab.net',
            subject: `Re: ${email.subject}`,
            body: 'Ceci est une réponse automatique. Votre rapport a été reçu et sera traité prochainement.\n\n- Nexus Automated System -'
        };
        setTimeout(() => receiveEmail(autoReply), 1500);
    }
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

  const handleOpenLink = (url: string) => {
    if (url === 'app://sequence-analyzer') {
        openApp('sequence-analyzer');
        return;
    }

    if (url.startsWith('/')) {
        const fileName = url.split('/').pop() || 'document';
        openApp('contract-viewer', { initialUrl: url, fileName: fileName });
        
        if (url === '/welcome.html') {
            setTimeout(() => {
                triggerCall(neoIntroCall);
            }, 30000);
        }
    } else {
        openApp('web-browser', { initialUrl: url });
    }
  }

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
            receiveEmail,
            onNeoExecute: handleNeoExecute,
        } 
    },
    documents: { 
        title: 'Explorateur de Fichiers', 
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
      title: 'Journaux en direct',
      component: LiveLogs,
      width: 600,
      height: 400,
      props: {
        logs: logs,
      },
      isSingular: true,
    },
    'network-map': {
      title: 'Carte Réseau',
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
      title: 'Client Email',
      component: EmailClient,
      width: 900,
      height: 600,
      props: {
        emails: emails,
        onSend: handleSendEmail,
        currentUser: 'Dr.Omen@recherche-lab.net',
        onOpenLink: handleOpenLink,
      },
      isSingular: true,
    },
    'web-browser': {
      title: 'Explorateur Hypnet',
      component: WebBrowser,
      width: 1024,
      height: 768,
      props: {
        network: network,
      },
      isSingular: true,
    },
     'contract-viewer': {
      title: 'Visionneur de Contrat',
      component: WebBrowser,
      width: 800,
      height: 600,
      props: {
        network: network, // Pass network for consistency, even if not used directly
      },
      isSingular: false, // Can open multiple contracts
    },
    'media-player': {
      title: 'Lecteur Média',
      component: MediaPlayer,
      width: 450,
      height: 250,
      props: {
        // Default props, will be overridden by openApp call
        fileName: 'unknown',
        filePath: '',
      }
    },
    'sequence-analyzer': {
      title: 'Analyseur de Séquence',
      component: SequenceAnalyzer,
      width: 900,
      height: 650,
      props: {
        onAnalysisComplete: handleSequenceAnalysisComplete,
      },
      isSingular: true,
    }
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

        if (app.appId === 'email') {
            setEmailNotification(false);
        }
        
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
          <div className="absolute top-4 left-4 z-[9999] text-destructive-foreground font-code animate-pulse-slow">
              <div className="flex items-center gap-4 p-4 bg-destructive/80 border-2 border-destructive-foreground rounded-lg shadow-2xl shadow-destructive/20">
                  <AlertTriangle className="h-16 w-16" />
                  <div>
                      <h2 className="text-2xl font-bold tracking-widest">TRACE DÉTECTÉE</h2>
                      <p className="text-5xl font-bold text-center mt-1">{formatTime(traceTimeLeft)}</p>
                  </div>
              </div>
          </div>
      )}

      {callState === 'incoming' && activeCall && (
        <div className="absolute top-4 right-4 z-[9999]">
            <IncomingCallView 
                interlocutor={activeCall.interlocutor}
                onAccept={answerCall}
                onDecline={declineCall}
            />
        </div>
      )}

      {callState === 'active' && activeCall && (
        <div className="absolute top-4 right-4 z-[9999]">
            <CallView call={activeCall} onPlayerChoice={handlePlayerChoice} onClose={endCall} />
        </div>
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
                scale={scale}
              >
                <div ref={app.nodeRef} style={{ zIndex: app.zIndex, position: 'absolute' }}>
                    <Window 
                      title={(app.appId === 'media-player' || app.appId === 'contract-viewer') ? app.props?.fileName || currentAppConfig.title : currentAppConfig.title} 
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
          <Draggable handle=".handle" bounds="parent" nodeRef={nanoRef} scale={scale}>
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
