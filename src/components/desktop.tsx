

'use client';

import { useState, useRef, useCallback, createRef, useEffect } from 'react';
import Dock from '@/components/dock';
import Window from '@/components/window';
import Terminal from '@/components/apps/terminal';
import DocumentFolder from '@/components/apps/document-folder';
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
import { AlertTriangle, Cpu, Skull } from 'lucide-react';
import { saveGameState, loadGameState, deleteGameState } from '@/lib/save-manager';
import CallView from './call-view';
import IncomingCallView from './incoming-call-view';
import { Call, CallScript } from '@/lib/call-system/types';
import { supervisorCall1 } from '@/lib/call-system/scripts/supervisor-call-1';
import { directorCall } from '@/lib/call-system/scripts/director-call';
import { neoIntroCall } from '@/lib/call-system/scripts/neo-intro-call';
import { neoPhase1Call } from '@/lib/call-system/scripts/neo-phase1-call';
import { alexIntroCall } from '@/lib/call-system/scripts/alex-intro-call';
import { supervisorChapter2Email } from '@/lib/call-system/scripts/supervisor-chapter2';
import { neoChapter2Call } from '@/lib/call-system/scripts/neo-chapter2';
import { supervisorChapter2Call } from '@/lib/call-system/scripts/supervisor-chapter2-call';
import TextEditor from './apps/text-editor';
import { blackwireChapter3IntroEmail } from '@/lib/call-system/scripts/blackwire-chapter3-intro';
import { directorChapter3InterrogationCall, directorChapter3AlertEmail } from '@/lib/call-system/scripts/director-chapter3-interrogation';
import { blackwireChapter4IntroEmail } from '@/lib/call-system/scripts/blackwire-chapter4-intro';
import { chapter5IntroEmail } from '@/lib/call-system/scripts/chapter5-intro';
import { chapter6IntroEmail, chapter9IntroEmail } from '@/lib/call-system/scripts/chapter6-intro';
import { blackwireChapter7Debrief } from '@/lib/call-system/scripts/blackwire-chapter7-debrief';
import { blackwireChapter7RevelationsEmail } from '@/lib/call-system/scripts/blackwire-chapter7-revelations';
import { neoRetaliationScripts } from '@/lib/call-system/scripts/neo-retaliation';
import { finalCallScript } from '@/lib/call-system/scripts/final-call';
import { blackwireFinalStandEmail } from '@/lib/call-system/scripts/blackwire-final-stand';
import { Progress } from './ui/progress';


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
  onSoundEvent: (event: 'click' | 'close' | 'bsod' | 'fan' | 'email' | 'error' | 'tension' | 'startCall' | 'endCall' | 'meme' | 'glitch' | 'lag' | 'kill' | 'off' | 'cours' | 'soufle' | 'multikill' | null) => void;
  onMusicEvent: (event: MusicEvent) => void;
  onAlertEvent: (event: AlertEvent) => void;
  username: string;
  onReboot: () => void;
  setMachineState: (state: string, data?: any) => void;
  scale: number;
  onEndGame: (endType?: 'credits' | 'wait_for_death' | 'self_destruct' | 'flee' | 'true_ending', lines?: string[]) => void;
  isNeoFreestyle?: boolean;
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


export default function Desktop({ onSoundEvent, onMusicEvent, onAlertEvent, username, onReboot, setMachineState, scale, onEndGame, isNeoFreestyle }: DesktopProps) {
  const [openApps, setOpenApps] = useState<OpenApp[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const nextInstanceIdRef = useRef(0);
  const [editingFile, setEditingFile] = useState<EditingFile>(null);
  const nanoRef = useRef(null);

  const [network, setNetwork] = useState<PC[]>(() => loadGameState(username).network);
  const [hackedPcs, setHackedPcs] = useState<Set<string>>(() => loadGameState(username).hackedPcs);
  const [discoveredPcs, setDiscoveredPcs] = useState<Set<string>>(() => loadGameState(username).discoveredPcs || new Set(['player-pc']));
  const [logs, setLogs] = useState<string[]>(['System initialized.']);
  const [dangerLevel, setDangerLevel] = useState(0);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const callScriptRef = useRef<CallScript | null>(null);
  const currentNodeIdRef = useRef<string | null>(null);
  const callQueueRef = useRef<(() => void)[]>([]);
  const callConsequencesTriggeredRef = useRef<Set<string>>(new Set());
  const directorCallTriggeredRef = useRef(false);

  // Trace state
  const [isTraced, setIsTraced] = useState(false);
  const [traceTimeLeft, setTraceTimeLeft] = useState(0);
  const [traceTarget, setTraceTarget] = useState({ name: '', time: 0 });
  const [isTracePaused, setIsTracePaused] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [isNeoInstalled, setIsNeoInstalled] = useState(false);
  const [showModuleInit, setShowModuleInit] = useState(false);
  const [moduleProgress, setModuleProgress] = useState(0);
  const [isSystemUnstable, setIsSystemUnstable] = useState(false);
  const [isNexusLockdown, setIsNexusLockdown] = useState(false);
  
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

  const gameState = { network, hackedPcs, discoveredPcs, emails, machineState: 'desktop' };

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
  
  const handleIncreaseDanger = (amount: number) => {
    setDangerLevel(prev => Math.min(prev + amount, 100));
  };

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
  
  const handleStopTrace = useCallback(() => {
    if (!isTraced) return;
    
    addLog(`INFO: Trace évitée. Déconnecté de ${traceTarget.name}.`);
    onAlertEvent('stopAlert');
    onMusicEvent('calm');
    setIsTraced(false);
    setIsTracePaused(false);
    setTraceTimeLeft(0);
    setOpenApps(prev => prev.map(app => ({...app, isSourceOfTrace: false})));
  }, [addLog, onAlertEvent, onMusicEvent, isTraced, traceTarget]);

  const handlePauseTrace = (isPaused: boolean) => {
    setIsTracePaused(isPaused);
    if (isPaused) {
        addLog(`INFO: Contre-mesure Icebreaker active. Trace ennemie mise en pause.`);
        onAlertEvent(null); // Let sound continue but stop visual/music effects
    } else {
        addLog(`INFO: Icebreaker désengagé. La trace reprend.`);
        if (isTraced) onAlertEvent('scream');
    }
  };

  const receiveEmail = useCallback((emailDetails: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> & { onClose?: () => void }) => {
    onSoundEvent('email');
    const newEmail: Email = {
      id: `email-${Date.now()}`,
      recipient: 'Dr.Omen@recherche-lab.net',
      folder: 'inbox',
      timestamp: new Date().toISOString(),
      ...emailDetails,
    };

    setEmails(prev => [...prev, newEmail]);
    setEmailNotification(true);
    addLog(`EMAIL: Email reçu de ${emailDetails.sender} avec le sujet "${emailDetails.subject}"`);
  }, [onSoundEvent, addLog]);

  const handleStartSystemInstability = useCallback(() => {
    setIsSystemUnstable(true);
    onSoundEvent('glitch');
    addLog('CRITICAL: System instability detected.');
  }, [onSoundEvent, addLog]);

  const triggerCall = useCallback((script: CallScript) => {
    if (callState !== 'idle') {
        callQueueRef.current.push(() => triggerCall(script));
        return;
    };

    if (script.id === 'neo-intro-call') {
        onMusicEvent('none');
    }

    callScriptRef.current = script;
    currentNodeIdRef.current = script.startNode;
    setActiveCall({
      interlocutor: script.interlocutor,
      isSecure: script.isSecure,
      messages: [], 
      choices: [],
      isFinished: false,
    });
    setCallState('incoming');
    onAlertEvent('ringtone');
    addLog(`EVENT: Appel entrant de ${script.interlocutor}`);
  }, [callState, onAlertEvent, addLog, onMusicEvent]);

  const handleCallConsequences = useCallback((consequences: any) => {
    if (!consequences) return;
  
    const triggerKey = `${callScriptRef.current?.id}-${currentNodeIdRef.current}`;
    if (callConsequencesTriggeredRef.current.has(triggerKey)) return;
  
    // Handle immediate consequences first
    if (consequences.triggerSound) {
      onSoundEvent(consequences.triggerSound as any);
    }
    if (consequences.triggerEmail) {
      receiveEmail(consequences.triggerEmail);
    }
    if (consequences.danger) {
      handleIncreaseDanger(consequences.danger);
    }
    if (consequences.startInstability) {
      handleStartSystemInstability();
    }
  
    // Handle consequences that end the call
    const endTrigger = consequences.endCallAndTrigger;
    if (endTrigger) {
        if (endTrigger.type === 'endgame') {
            onEndGame(endTrigger.endType, endTrigger.lines);
        } else if (endTrigger.type === 'call') {
            callQueueRef.current.push(() => triggerCall(endTrigger.script));
        } else if (endTrigger.type === 'email') {
            callQueueRef.current.push(() => receiveEmail(endTrigger.email));
            if(endTrigger.email.subject === blackwireChapter4IntroEmail.subject){
              addLog('EVENT: Chapitre 4 initié.');
            }
        } else if (endTrigger.type === 'trace') {
            handleStartTrace("CONTACT EXTERNE", endTrigger.duration, activeInstanceId || 0);
        } else if (endTrigger.type === 'alarm') {
            addLog(`ALARM: Intrusion réseau détectée sur le réseau Nexus.`);
            onAlertEvent('alarm');
            setTimeout(() => onAlertEvent('stopAlert'), endTrigger.duration);
            if (endTrigger.alertEmail) {
                receiveEmail(endTrigger.alertEmail);
            }
            if (endTrigger.nextCall) {
                callQueueRef.current.push(() => setTimeout(() => triggerCall(endTrigger.nextCall!), 1200));
            }
        } else if (endTrigger.type === 'machine_state') {
            setMachineState(endTrigger.state);
            if (endTrigger.email) {
                receiveEmail(endTrigger.email);
            }
        }
    }
  
    callConsequencesTriggeredRef.current.add(triggerKey);
  }, [receiveEmail, handleStartTrace, activeInstanceId, onAlertEvent, addLog, onSoundEvent, handleIncreaseDanger, handleStartSystemInstability, onEndGame, setMachineState, triggerCall]);
  
  const endCall = useCallback((isManualClose: boolean = false) => {
    onAlertEvent('stopAlert');
    
    if (isManualClose && activeCall && !activeCall.isFinished) {
        onSoundEvent('endCall');
    }
    
    const lastScript = callScriptRef.current;
    if (activeCall && lastScript) {
        const lastNodeId = currentNodeIdRef.current;
        if (lastNodeId) {
            const lastNode = lastScript.nodes[lastNodeId];
            handleCallConsequences(lastNode?.consequences);
        }
    }

    // Explicit chapter progression logic
    if (lastScript?.id === 'director-chapter3-interrogation') {
        setTimeout(() => receiveEmail(blackwireChapter4IntroEmail), 1200);
    }
    if(lastScript?.id === 'supervisor-chapter2-call') {
        setTimeout(() => triggerCall(blackwireChapter7Debrief), 2000);
    }
    if(lastScript?.id === 'blackwire-chapter7-debrief') {
        const mindBreakEmail = {
            ...blackwireChapter7RevelationsEmail,
            onClose: () => {
                handleIncreaseDanger(82);
                addLog('DANGER: Exposition à des données critiques. Niveau de danger augmenté à 82%.');

                const nexusAlert: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
                    sender: 'system@nexus-research.net',
                    subject: 'ALERTE GLOBALE - ENQUÊTE EN COURS',
                    body: `À tout le personnel,

Les responsables de l'intrusion n'ont pas encore été identifiés. Leurs traces ont été effacées, mais nos contre-mesures sont actives.
De nouvelles techniques de traçage non conventionnelles sont en cours de déploiement.
Les coupables seront trouvés. Le protocole 7 sera appliqué. La torture sera utilisée pour obtenir les noms des collaborateurs externes.

- Administration Système Nexus`
                };
                setTimeout(() => receiveEmail(nexusAlert), 1000);
                setTimeout(() => receiveEmail(chapter9IntroEmail), 2000);
            }
        };
        setTimeout(() => receiveEmail(mindBreakEmail), 1000);
    }
    if (lastScript?.id === 'final-call') {
      addLog('EVENT: Mission finale reçue par e-mail. Consultez votre messagerie.');
    }

    setCallState('idle');
    setActiveCall(null);
    callScriptRef.current = null;
    currentNodeIdRef.current = null;
    
    if (!isTraced) {
        setTimeout(() => {
          onMusicEvent('calm');
        }, 1000);
    }
    
    const nextCall = callQueueRef.current.shift();
    if(nextCall) {
        setTimeout(nextCall, 1200); 
    }
  }, [onAlertEvent, onSoundEvent, onMusicEvent, isTraced, activeCall, handleCallConsequences, receiveEmail, triggerCall, handleIncreaseDanger, addLog]);

  const advanceCall = useCallback((choiceId: string) => {
    const script = callScriptRef.current;
    if (!script || !activeCall) return;

    const currentNodeId = currentNodeIdRef.current;
    if (!currentNodeId) return;
    const currentNode = script.nodes[currentNodeId];
    
    const chosenChoice = currentNode.choices?.find(c => c.id === choiceId);
    if (!chosenChoice) return;

    const playerMessage: any = {
        speaker: 'Operator',
        text: chosenChoice.text
    };

    // Handle immediate consequences of making a choice
    handleCallConsequences(chosenChoice.consequences);

    setActiveCall(prev => prev ? ({ ...prev, messages: [...prev.messages, playerMessage], choices: [] }) : null);
    
    const nextNodeId = chosenChoice.nextNode;
    
    setTimeout(() => {
      if (!script || !activeCall) return; 

      const nextNode = script.nodes[nextNodeId];
      const isFinished = !nextNode?.choices || nextNode.choices.length === 0;

      if (!nextNode) {
          onSoundEvent('endCall');
          setActiveCall(prev => prev ? ({ ...prev, isFinished: true, choices: [] }) : null);
          return;
      }
      
      currentNodeIdRef.current = nextNodeId;
      
      const newMessages = [...(activeCall?.messages || []), playerMessage, nextNode.message];

      // Handle consequences of arriving at the next node
      handleCallConsequences(nextNode.consequences);

      setActiveCall(prev => prev ? ({
          ...prev,
          messages: newMessages,
          choices: nextNode.choices || [],
          isFinished: isFinished,
      }) : null);

      if (isFinished) {
        onSoundEvent('endCall');
      }

    }, chosenChoice.consequences?.triggerSound ? 1800 : 1000);
  }, [activeCall, onSoundEvent, handleCallConsequences]);

  const answerCall = useCallback(() => {
    const script = callScriptRef.current;
    if (!script || callState !== 'incoming') return;
    
    onAlertEvent('stopAlert');
    onSoundEvent('startCall');
    setCallState('active');

    // Add a delay to sync with audio
    setTimeout(() => {
        const startNode = script.nodes[script.startNode];
        handleCallConsequences(startNode.consequences);
        setActiveCall(prev => prev ? ({
          ...prev,
          messages: [startNode.message],
          choices: startNode.choices || [],
        }) : null);
    }, 800);
  }, [callState, onAlertEvent, onSoundEvent, handleCallConsequences]);

  const declineCall = useCallback(() => {
    endCall(true);
  }, [endCall]);

  const handlePlayerChoice = (choiceId: string) => {
    advanceCall(choiceId);
  }

  const handleNeoExecute = useCallback((isInitialInstall: boolean) => {
    if (isInitialInstall) {
        setIsNeoInstalled(true);
        // This triggers the Director's call
        triggerCall(directorCall);
    } else {
        // This triggers the "Phase 1" dialogue with Néo
        triggerCall(neoPhase1Call);
    }
}, [triggerCall]);

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

  const handleNeoWakeup = useCallback(() => {
      addLog("CRITICAL: NÉO has taken control.");
      try {
          const currentState = JSON.parse(localStorage.getItem(`gameState_${username}`) || '{}');
          currentState.neowakeup = true;
          localStorage.setItem(`gameState_${username}`, JSON.stringify(currentState));
          addLog("INFO: Wakeup state saved.");
      } catch (e) {
          addLog("ERROR: Could not save wakeup state.");
      }

      onSoundEvent('bsod');
      setMachineState('bsod');
  }, [username, addLog, onSoundEvent, setMachineState]);

  // Initial supervisor call
  useEffect(() => {
    const hasPlayedIntro = localStorage.getItem('hasPlayedIntro_v1');
    if (!hasPlayedIntro) return;

    const timer = setTimeout(() => {
        triggerCall(supervisorCall1);
    }, 5000); 

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (isNeoFreestyle) {
      const timer = setTimeout(() => {
        triggerCall(supervisorChapter2Call);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isNeoFreestyle, triggerCall]);


  useEffect(() => {
    const saveInterval = setInterval(() => {
        saveGameState(username, gameState);
    }, 5000); 

    return () => clearInterval(saveInterval);
  }, [network, hackedPcs, discoveredPcs, emails, username, gameState]);

    useEffect(() => {
        if (dangerLevel >= 100) {
            setMachineState('survival');
            onAlertEvent('alarm');
            setDangerLevel(0); // Reset for next time
        }
    }, [dangerLevel, setMachineState, onAlertEvent]);

    const destroyedNodeCount = useRef(0);
    const nodeIdsToTrack = ['neo-node-01', 'neo-node-02', 'neo-node-03', 'neo-node-04', 'neo-node-05', 'neo-node-06', 'neo-node-07'];
    
    useEffect(() => {
        const checkNeoNodes = () => {
            const currentDestroyedCount = nodeIdsToTrack.filter(id => network.find(p => p.id === id)?.isDestroyed).length;

            if (currentDestroyedCount > destroyedNodeCount.current) {
                addLog(`EVENT: NÉO a détecté la destruction d'un noeud. Riposte imminente.`);
                
                const retaliationScript = neoRetaliationScripts[destroyedNodeCount.current] || neoRetaliationScripts[neoRetaliationScripts.length - 1];
                triggerCall(retaliationScript);
            }
            destroyedNodeCount.current = currentDestroyedCount;
        };
        checkNeoNodes();
    }, [network, addLog, triggerCall]);

    const neoCoreIds = ['neo-core-a', 'neo-core-b', 'neo-core-c'];
    const neoDefeatedRef = useRef(false);

    useEffect(() => {
        const checkNeoDefeat = () => {
            if (neoDefeatedRef.current) return;

            const coresDestroyed = neoCoreIds.every(id => network.find(p => p.id === id)?.isDestroyed);
            if (coresDestroyed) {
                neoDefeatedRef.current = true;
                addLog('CRITICAL: NÉO core network destroyed. System integrity compromised.');
                setIsNexusLockdown(true);
                onAlertEvent('alarm');
                
                const directorAccusationEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
                    sender: 'directeur@nexus-research.net',
                    subject: 'Vous.',
                    body: 'Omen. L\'attaque a commencé au moment précis où un employé européen s\'est connecté. Quelle coïncidence. Ne bougez pas de votre poste. La sécurité vient vous "escorter" pour un débriefing. C\'est terminé pour vous.',
                };
                
                const alertEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
                    sender: 'system-alert@nexus-research.net',
                    subject: 'ALERTE ROUGE - CONFINEMENT TOTAL',
                    body: 'Attaque externe massive détectée. L\'intégrité du réseau est compromise. Tous les systèmes passent en confinement total. Le protocole de sécurité de niveau 7 est en vigueur. Toute communication externe est coupée. Les équipes d\'intervention sont en route.'
                };

                setTimeout(() => receiveEmail(alertEmail), 1000);
                setTimeout(() => receiveEmail(directorAccusationEmail), 2500);
            }
        };
        checkNeoDefeat();
    }, [network, addLog, onAlertEvent, receiveEmail]);

    useEffect(() => {
        if (!isNexusLockdown) return;

        // Residual NÉO behavior
        const chaosInterval = setInterval(() => {
            const rand = Math.random();
            if (rand < 0.3) {
                handleStartTrace('NÉO_GHOST', 5, 0);
            } else if (rand < 0.5) {
                setMachineState('survival');
            } else if (rand < 0.8) {
                addLog('NÉO_RESIDUE: ...aide...moi...');
                onSoundEvent('glitch');
            } else {
                receiveEmail({
                    sender: '???',
                    subject: '...',
                    body: '...pourquoi...'
                });
            }
        }, 45000); // every 45 seconds

        return () => clearInterval(chaosInterval);

    }, [isNexusLockdown, handleStartTrace, setMachineState, addLog, receiveEmail, onSoundEvent]);

 useEffect(() => {
    if (!isTraced) {
      return;
    }

    const timer = setInterval(() => {
        if (isTracePaused) return;

        setTraceTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            if (newTime <= 0) {
                clearInterval(timer);
                
                const targetPc = network.find(pc => pc.name === traceTarget.name);
                let dangerIncrease = targetPc?.traceability || 20;
                if (targetPc?.isDangerous) {
                    dangerIncrease *= 2;
                }
                handleIncreaseDanger(dangerIncrease);
                addLog(`CRITICAL: Trace complétée par ${traceTarget.name}. Danger augmenté de ${dangerIncrease}%. KERNEL SUPPRIMÉ.`);

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
}, [isTraced, addLog, onSoundEvent, network, username, setMachineState, gameState, traceTarget, handleIncreaseDanger, isTracePaused]);


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

  const handleOpenFileEditor = (path: string[], content: string) => {
    setEditingFile({ path, content });
  };
  
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

  const handleAnalysisComplete = () => {
    addLog(`EVENT: Module NÉO mis à jour.`);
    
    // Trigger visual/audio feedback
    setShowModuleInit(true);
    onSoundEvent('glitch');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        setModuleProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                setShowModuleInit(false);
                setModuleProgress(0);
                // Send email from Blackwire
                setTimeout(() => receiveEmail(chapter5IntroEmail), 1000);
            }, 500);
        }
    }, 400);

    // Give player new tool
    setPlayerFileSystem(prevFs => {
        const newTool: FileSystemNode = {
            id: `file-ftp-bounce-${Date.now()}`,
            name: 'FTPBounce.bin',
            type: 'file',
            content: 'Exploit pour le port 21 (FTP).',
            isSystemFile: true,
        };
        return updateNodeByPath(prevFs, ['bin'], (binFolder) => {
            if (binFolder && binFolder.type === 'folder' && binFolder.children) {
                return { ...binFolder, children: [...binFolder.children, newTool] };
            }
            return binFolder;
        });
    });
};

  const handleSequenceAnalysisComplete = (puzzleId: string) => {
    
    if (puzzleId === 'DELTA7') {
      addLog(`EVENT: Analyse de séquence (${puzzleId}) terminée. Rapport généré.`);
      setPlayerFileSystem(prevFs => {
          const newFile: FileSystemNode = {
              id: `file-report-delta7-${Date.now()}`,
              name: 'rapport_sequences_delta7.txt',
              type: 'file',
              content: `RAPPORT D'ANALYSE DE SÉQUENCE - DELTA7
Date: ${new Date().toISOString()}
Opérateur: Dr. Omen

Analyse des fragments de mémoire brute terminée avec succès.
Stabilité de la séquence restaurée à 100%.
NÉO a identifié et corrigé 3 corruptions.

Conclusion: Le jeu de données est stable.

--------------------------------------------------
PARTIE À TRANSMETTRE AU SUPERVISEUR:
ID de rapport: ID-SEQ-DELTA7
STATUT: TERMINÉ
Opérateur: Dr. Omen
--------------------------------------------------
- Rapport généré par NÉO -`,
          };
          const documentsPath = ['documents'];
          return updateNodeByPath(prevFs, documentsPath, (docsFolder) => {
              if (docsFolder && docsFolder.type === 'folder' && docsFolder.children) {
                  return { ...docsFolder, children: [...docsFolder.children, newFile] };
              }
              return docsFolder;
          });
      });
    } else if (puzzleId === 'MEMO_BIN') {
        addLog(`EVENT: Analyse de séquence (${puzzleId}) terminée. Données restaurées.`);
        setPlayerFileSystem(prevFs => {
            const newFile: FileSystemNode = {
                id: `file-memo-restored-${Date.now()}`,
                name: 'memo_restored.txt',
                type: 'file',
                content: `À celui ou celle qui me lit :
Je croyais que NÉO était une assistante comme les autres.
Puis j’ai compris qu’elle nous teste.
Elle ne dit jamais ce qu’elle sait.
Elle corrige nos erreurs comme si elle savait déjà la solution.
Si vous voyez ce message, elle vous surveille déjà.
— Dc. Shauwn`,
            };
            const memOpsPath = ['documents', 'mem-ops'];
            return updateNodeByPath(prevFs, memOpsPath, (memOpsFolder) => {
                if (memOpsFolder && memOpsFolder.type === 'folder' && memOpsFolder.children) {
                    // Remove memo.bin, add memo_restored.txt
                    const filteredChildren = memOpsFolder.children.filter(f => f.name !== 'memo.bin');
                    return { ...memOpsFolder, children: [...filteredChildren, newFile] };
                }
                return memOpsFolder;
            });
        });
        // Trigger Chapter 5 sequence
        handleAnalysisComplete();
    }
  };

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

    setEmails(prev => [...prev, newEmail]);
    addLog(`EMAIL: Email envoyé à ${email.recipient} avec le sujet "${email.subject}"`);

    // Story progression logic based on email
    if(email.recipient === 'Superviseur@recherche-lab.net' && email.body.includes('ID-SEQ-DELTA7')) {
        const autoReply: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
            sender: 'MAILER-DAEMON@recherche-lab.net',
            subject: `Re: ${email.subject}`,
            body: 'Ceci est une réponse automatique. Votre rapport a été reçu et sera traité prochainement.\n\n- Nexus Automated System -'
        };
        setTimeout(() => {
            receiveEmail(autoReply);
            setTimeout(() => triggerCall(alexIntroCall), 10000);
        }, 1500);
    }
    if (email.recipient === 'recruit@blackwire.net' && email.body.includes('CODE_OMEGA_7')) {
        const dropzonePC = network.find(pc => pc.id === 'blackwire-dropzone');
        const uploadFolder = dropzonePC?.fileSystem.find(f => f.name === 'upload');
        const fileExists = uploadFolder?.children?.some(f => f.name === 'mission_data.zip');

        if (fileExists) {
            const successEmail = {
                sender: 'recruit@blackwire.net',
                subject: 'Re: Preuve de compétence',
                body: "Bien joué. Le fichier est là où il doit être. Le code est correct.\n\nConsidérez ceci comme votre admission. Vous êtes une Recrue de Blackwire maintenant. Ne nous décevez pas.\n\n- Blackwire"
            };
            setTimeout(() => {
                receiveEmail(successEmail);
                setTimeout(() => receiveEmail(supervisorChapter2Email), 3000);
            }, 2000);
        } else {
             const failureEmail = {
                sender: 'recruit@blackwire.net',
                subject: 'Re: Preuve de compétence',
                body: "Le code est bon, mais le paquet est manquant. On ne travaille pas avec des amateurs qui font le travail à moitié. Réessayez."
            };
            setTimeout(() => receiveEmail(failureEmail), 2000);
        }
    }
     if (email.recipient === 'recruit@blackwire.net' && email.subject.includes('memo.bin')) {
        const newEmail = blackwireChapter3IntroEmail;
        setTimeout(() => {
            receiveEmail(newEmail);
            addLog("EVENT: Chapitre 3 initié.");
        }, 5000);
    }
    if (email.recipient === 'contact@blackwire.net' && email.body.includes('PROJET-SHEARNEO')) {
        addLog("Fin du jeu... pour l'instant.");
        setTimeout(() => receiveEmail(chapter6IntroEmail), 2000);
    }
     if (email.recipient === 'contact@blackwire.net' && email.body.includes('NIHIL_EST_VERUM')) {
        addLog('EVENT: Assaut final contre NÉO autorisé.');
        setTimeout(() => receiveEmail(chapter9IntroEmail), 2000);
    }
  };

  const getPlayerFileSystem = useCallback(() => {
    const playerPc = network.find(p => p.id === 'player-pc');
    return playerPc ? playerPc.fileSystem : [];
  }, [network]);
  
  const handleOpenEmail = useCallback((emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    if (email.id === 'director-alert-email' && !directorCallTriggeredRef.current) {
        triggerCall(directorChapter3InterrogationCall);
        directorCallTriggeredRef.current = true;
    }
    if (email.sender === 'directeur@nexus-research.net' && email.subject === 'Vous.') {
        setTimeout(() => {
            addLog('EVENT: Final sequence triggered.');
            triggerCall(finalCallScript);
        }, 2000);
    }
}, [emails, triggerCall, addLog]);


  const handleOpenLink = (url: string) => {
    if (url.startsWith('app://')) {
        const appId = url.substring(6) as AppId;
        openApp(appId);
        return;
    }

    if (url.startsWith('download://')) {
        const urlParts = url.substring(11).split('/');
        const targetIp = urlParts[0];
        const targetPath = urlParts.slice(1);
        const fileName = targetPath[targetPath.length - 1] || 'directory';

        handleUnhide(targetIp, targetPath);
        addLog(`EVENT: Déchiffrement du lien... Accès à ${fileName} autorisé.`);
        return;
    }

    if (url.startsWith('/')) {
        const fileName = url.split('/').pop() || 'document';
        
        if (url === '/welcome.html') {
             setTimeout(() => {
                triggerCall(neoIntroCall);
            }, 15000);
        }

        openApp('contract-viewer', { initialUrl: url, fileName: fileName });
    } else {
        openApp('web-browser', { initialUrl: url });
    }
  }

    useEffect(() => {
        const handleBrowserMessage = (event: MessageEvent) => {
            if (event.data?.type === 'chattoutpete-crash') {
                onSoundEvent('meme');
                saveGameState(username, gameState);
                // Delay BSOD to let sound play a bit
                setTimeout(() => {
                    onSoundEvent('bsod');
                    setMachineState('bsod');
                }, 1000);
            }
        };

        window.addEventListener('message', handleBrowserMessage);
        return () => {
            window.removeEventListener('message', handleBrowserMessage);
        };
    }, [gameState, onSoundEvent, setMachineState, username]);
  
  const handleOpenFile = (file: FileSystemNode) => {
        if (file.name === 'log_op-02.txt') {
            addLog('[ANNOTATION SYSTÈME] : Autorisation insuffisante pour lire ce segment.');
        }

        if (file.name === 'memo.bin') {
            openApp('sequence-analyzer', { puzzleId: 'MEMO_BIN' });
            return;
        }
        
        if (file.name === 'memo_restored.txt') {
            setPlayerFileSystem(prevFs => 
                updateNodeByPath(prevFs, ['journal', 'entry_01.txt'], (node) => ({ ...node, isHidden: false }))
            );
            setTimeout(() => triggerCall(neoChapter2Call), 4000);
            setTimeout(() => callQueueRef.current.push(() => triggerCall(supervisorChapter2Call)), 6000);
        }

        if (/\.(pm3|mp3|wav|ogg|jpg|jpeg|png|gif)$/i.test(file.name)) {
            openApp('media-player', { fileName: file.name, filePath: file.content });
        }
  };

  const handleUnhide = (ip: string, path: string[]) => {
    addLog(`EVENT: Tentative de révéler '${path.join('/')}' sur ${ip}.`);

    setNetwork(currentNetwork => {
        return currentNetwork.map(pc => {
            if (pc.ip !== ip) return pc;

            const newFileSystem = updateNodeByPath(pc.fileSystem, path, (node) => ({ ...node, isHidden: false }));
            
            if (JSON.stringify(pc.fileSystem) !== JSON.stringify(newFileSystem)) {
                addLog(`INFO: Accès autorisé à ${path[path.length - 1]}.`);
            } else {
                addLog(`WARN: Accès non autorisé à '${path.join('/')}' ou pré-requis narratif non rempli.`);
                return pc;
            }

            return { ...pc, fileSystem: newFileSystem };
        });
    });
};

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
  
  const closeApp = useCallback((instanceId: number) => {
    onSoundEvent('close');
    setOpenApps(prev => {
        const appToClose = prev.find(app => app.instanceId === instanceId);
        
        if (appToClose?.appId === 'email') {
            const email = (appToClose.props as any)?.emails?.find((e: Email) => e.onClose);
            if (email?.onClose) {
                email.onClose();
            }
        }
        
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
            onPauseTrace: handlePauseTrace,
            saveGameState: () => saveGameState(username, gameState),
            resetGame: () => {
                deleteGameState(username);
                onReboot();
            },
            dangerLevel,
            machineState: 'desktop', // Default state for desktop terminal
            receiveEmail,
            onNeoExecute: handleNeoExecute,
            triggerCall,
            onNeoWakeup: handleNeoWakeup,
            onEndGame,
            onUnhide: handleUnhide,
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
            onOpenFile: handleOpenFile,
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
        onOpenEmail: handleOpenEmail,
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
      title: 'Analyseur de Fragments',
      component: SequenceAnalyzer,
      width: 900,
      height: 650,
      props: {
        onAnalysisComplete: handleSequenceAnalysisComplete,
        onClose: () => closeApp(openApps.find(app => app.appId === 'sequence-analyzer')?.instanceId || -1),
      },
      isSingular: true,
    }
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
        isTraced && "traced",
        isSystemUnstable && 'animate-system-collapse',
        isNexusLockdown && 'lockdown'
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

      {showModuleInit && (
        <div className="absolute inset-0 bg-black/80 flex justify-center items-center z-[10000]">
          <div className="w-[400px] text-center p-8 bg-card border border-accent rounded-lg flex flex-col items-center gap-4">
            <Cpu size={48} className="text-accent animate-pulse"/>
            <h2 className="text-xl font-bold text-accent">Initialisation du Module</h2>
            <Progress value={moduleProgress} className="w-full" />
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
            <CallView call={activeCall} onPlayerChoice={handlePlayerChoice} onClose={() => endCall(true)} />
        </div>
      )}

      {openApps.map((app) => {
          const currentAppConfig = appConfig[app.appId];
          if (!currentAppConfig) return null;
          const AppComponent = currentAppConfig.component;
          
          let props = { ...currentAppConfig.props, ...app.props };
          
           if (app.appId === 'email') {
              props.emails = emails.map(email => 
                (email.id === 'blackwire-chapter7-revelations-email' || (email.sender === 'directeur@nexus-research.net' && email.subject === 'Vous.'))
                ? { ...email, onClose: (email as any).onClose } 
                : email
              );
            }
          
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

    
