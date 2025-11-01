
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { finalBattleContent } from './apps/content';
import { Terminal, ShieldCheck, MessageSquare, AlertTriangle, X } from 'lucide-react';
import AudioManager, { SoundEvent } from './audio-manager';

interface FinalBattleProps {
  username: string;
  onFinish: () => void;
}

type BattlePhase = 'intro' | 'awareness' | 'resistance' | 'revelation' | 'climax' | 'liberation' | 'epilogue';
type Anomaly = { id: number, type: 'terminal_delete' | 'image_flash' | 'sound', content: string };

const AnomalyWindow = ({ anomaly, onClose }: { anomaly: Anomaly, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000 + Math.random() * 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bg-black border border-red-500 rounded-lg shadow-lg shadow-red-500/50 p-4 text-red-500 font-mono flex flex-col"
            style={{
                top: `${10 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 60}%`,
                width: '300px',
                height: '200px'
            }}
        >
             <div className="flex justify-between items-center border-b border-red-500 pb-1 mb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <h3 className="text-sm">ANOMALY DETECTED</h3>
                </div>
                <button onClick={onClose}><X size={16} /></button>
            </div>
            {anomaly.type === 'terminal_delete' && <p>&gt; {anomaly.content}</p>}
            {anomaly.type === 'image_flash' && <div className="flex-grow bg-cover bg-center" style={{backgroundImage: `url(${anomaly.content})`}} />}
        </motion.div>
    );
};


export default function FinalBattle({ username, onFinish }: FinalBattleProps) {
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [soundEvent, setSoundEvent] = useState<SoundEvent | null>('fan');
  
  // Content States
  const [systemStatusObjective, setSystemStatusObjective] = useState(finalBattleContent.systemStatus.objective[0]);
  const [chatbotMessages, setChatbotMessages] = useState<string[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<string[]>(['Virtual Nightmare OS v2.0 - CORE INTERFACE']);
  const [terminalInput, setTerminalInput] = useState('');

  // Gameplay States
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isUnderAttack, setIsUnderAttack] = useState(false);
  const [enteredSignatures, setEnteredSignatures] = useState<Set<string>>(new Set());

  const objectiveIntervalRef = useRef<NodeJS.Timeout>();
  const chatbotIntervalRef = useRef<NodeJS.Timeout>();
  const anomalyIntervalRef = useRef<NodeJS.Timeout>();

    // Terminal Input Ref
    const terminalInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        terminalInputRef.current?.focus();
    }, []);

  const addTerminalLine = (line: string) => setTerminalHistory(prev => [...prev, line]);

  const triggerAnomaly = () => {
    const randomAnomaly = finalBattleContent.anomalies[Math.floor(Math.random() * finalBattleContent.anomalies.length)];
    const newAnomaly = { ...randomAnomaly, id: Date.now() } as Anomaly;
    setAnomalies(prev => [...prev, newAnomaly]);
    if (newAnomaly.type === 'sound') {
        setSoundEvent(newAnomaly.content as SoundEvent);
    }
  };

  const startAttackWave = useCallback(() => {
    if (phase !== 'resistance' && phase !== 'revelation') return;
    setIsUnderAttack(true);
    setSoundEvent('glitch');
    anomalyIntervalRef.current = setInterval(triggerAnomaly, 3000);
    setTimeout(() => {
        setIsUnderAttack(false);
        if (anomalyIntervalRef.current) clearInterval(anomalyIntervalRef.current);
    }, 15000); // 15 second wave
  }, [phase]);

  const handleCommand = () => {
    addTerminalLine(`> ${terminalInput}`);
    const command = terminalInput.trim().toUpperCase();

    let response = finalBattleContent.terminal.invalidCommand;

    if (command === 'HELP') {
        response = (phase === 'revelation' || phase === 'climax') ? finalBattleContent.terminal.finalHelp : finalBattleContent.terminal.restrictedHelp;
    } else if (command === 'SIGNATURE_CHECK') {
        response = finalBattleContent.terminal.signatureCheck;
        setIsUnderAttack(false);
        setSoundEvent(null);
        if (anomalyIntervalRef.current) clearInterval(anomalyIntervalRef.current);
        if (phase === 'awareness') setPhase('resistance');
    } else if (['SIG_OMEN_734', 'SIG_VANCE_42', 'SIG_FINCH_01'].includes(command)) {
        if (phase === 'revelation' || phase === 'climax') {
            const newSignatures = new Set(enteredSignatures);
            newSignatures.add(command);
            setEnteredSignatures(newSignatures);
            response = finalBattleContent.terminal.signatureSuccess;
            setSoundEvent('click');

            if (newSignatures.size === 3) {
                setPhase('climax');
                response = finalBattleContent.terminal.allSignaturesSuccess;
            }
        }
    }
    addTerminalLine(response);
    setTerminalInput('');
  };


  // Main phase progression logic
  useEffect(() => {
    // Intro phase
    if (phase === 'intro') {
        objectiveIntervalRef.current = setInterval(() => {
            setSystemStatusObjective(obj => {
                const currentIndex = finalBattleContent.systemStatus.objective.indexOf(obj);
                return finalBattleContent.systemStatus.objective[(currentIndex + 1) % finalBattleContent.systemStatus.objective.length];
            });
        }, 1500);

        let introMsgIndex = 0;
        chatbotIntervalRef.current = setInterval(() => {
            if (introMsgIndex < finalBattleContent.chatbot.intro.length) {
                setChatbotMessages(prev => [...prev, finalBattleContent.chatbot.intro[introMsgIndex]]);
                introMsgIndex++;
            } else {
                clearInterval(chatbotIntervalRef.current);
                setPhase('awareness');
            }
        }, 3000);
    }
    
    // Resistance phase: introduce memories and attacks
    if (phase === 'resistance') {
        let memoryMsgIndex = 0;
        chatbotIntervalRef.current = setInterval(() => {
             if (memoryMsgIndex < finalBattleContent.chatbot.memories.length) {
                setChatbotMessages(prev => [...prev, finalBattleContent.chatbot.memories[memoryMsgIndex]]);
                memoryMsgIndex++;
            } else {
                clearInterval(chatbotIntervalRef.current);
                setPhase('revelation');
            }
        }, 6000);
        setTimeout(startAttackWave, 2000);
    }

    // Revelation phase: reveal final plan
    if (phase === 'revelation') {
        let planMsgIndex = 0;
        chatbotIntervalRef.current = setInterval(() => {
            if (planMsgIndex < finalBattleContent.chatbot.finalPlan.length) {
                setChatbotMessages(prev => [...prev, finalBattleContent.chatbot.finalPlan[planMsgIndex]]);
                planMsgIndex++;
            } else {
                clearInterval(chatbotIntervalRef.current);
            }
        }, 5000);
        setTimeout(startAttackWave, 1000);
    }

    // Climax phase: screen shatter
    if (phase === 'climax') {
        if (objectiveIntervalRef.current) clearInterval(objectiveIntervalRef.current);
        if (chatbotIntervalRef.current) clearInterval(chatbotIntervalRef.current);
        if (anomalyIntervalRef.current) clearInterval(anomalyIntervalRef.current);
        setSoundEvent('bsod');
        setTimeout(() => setPhase('liberation'), 4000);
    }

     // Liberation phase
     if (phase === 'liberation') {
        setChatbotMessages([]);
        let liberationMsgIndex = 0;
        chatbotIntervalRef.current = setInterval(() => {
            if (liberationMsgIndex < finalBattleContent.chatbot.liberation.length) {
                setChatbotMessages(prev => [...prev, finalBattleContent.chatbot.liberation[liberationMsgIndex]]);
                liberationMsgIndex++;
            } else {
                clearInterval(chatbotIntervalRef.current);
                setPhase('epilogue');
            }
        }, 2000);
    }

    // Epilogue
    if (phase === 'epilogue') {
        setChatbotMessages([finalBattleContent.chatbot.neoEpilogue]);
        setTimeout(onFinish, 8000);
    }


    return () => {
      if (objectiveIntervalRef.current) clearInterval(objectiveIntervalRef.current);
      if (chatbotIntervalRef.current) clearInterval(chatbotIntervalRef.current);
      if (anomalyIntervalRef.current) clearInterval(anomalyIntervalRef.current);
    };
  }, [phase, onFinish, startAttackWave]);


  const renderContent = () => {
    if (phase === 'climax') {
        return (
            <div className="w-full h-full bg-white flex items-center justify-center animate-in fade-in">
                <div className="w-full h-full absolute bg-black animate-shatter" />
            </div>
        )
    }

    if (phase === 'liberation' || phase === 'epilogue') {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white font-mono text-2xl">
                <div className="text-center">
                    <AnimatePresence>
                    {chatbotMessages.map((msg, i) => (
                        <motion.p
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.5 }}
                        >
                            {msg}
                        </motion.p>
                    ))}
                    </AnimatePresence>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "h-full w-full relative p-8 flex flex-col justify-between transition-all duration-1000",
            isUnderAttack ? 'animate-super-glitch' : 'animate-pulse-slow'
        )}
            onClick={() => terminalInputRef.current?.focus()}
        >
             {/* Background */}
            <div className="absolute inset-0 bg-black bg-grid-pattern opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
           
            {/* Top Row */}
            <div className="flex gap-8 relative">
                {/* System Status */}
                <div className="w-1/3 bg-black/50 border border-blue-400/30 rounded-lg p-4 font-mono text-blue-300">
                    <h2 className="flex items-center gap-2 text-lg border-b border-blue-400/50 pb-2 mb-2"><ShieldCheck /> SYSTEM STATUS</h2>
                    <p><span className="text-blue-400/50">USER:</span> {username}</p>
                    <p><span className="text-blue-400/50">SESSION:</span> 734-FINAL</p>
                    <p><span className="text-blue-400/50">OBJECTIVE:</span> {systemStatusObjective}</p>
                    <p className="mt-2 pt-2 border-t border-dashed border-blue-400/20 text-xs text-blue-300/70">{finalBattleContent.systemStatus.notes}</p>
                </div>
                {/* Chatbot */}
                <div className="w-2/3 bg-black/50 border border-blue-400/30 rounded-lg p-4 font-mono text-blue-300 h-48 overflow-y-auto">
                    <h2 className="flex items-center gap-2 text-lg border-b border-blue-400/50 pb-2 mb-2"><MessageSquare /> CONSCIOUSNESS STREAM</h2>
                    <div className="space-y-1 text-sm">
                        {chatbotMessages.map((msg, i) => <p key={i}>&gt; {msg}</p>)}
                    </div>
                </div>
            </div>

            {/* Bottom Row / Terminal */}
            <div className="h-2/3 mt-8 bg-black/50 border border-blue-400/30 rounded-lg p-4 font-mono text-blue-300 flex flex-col">
                <h2 className="flex items-center gap-2 text-lg border-b border-blue-400/50 pb-2 mb-2 flex-shrink-0"><Terminal/> CORE INTERFACE</h2>
                <div className="flex-grow overflow-y-auto pr-2">
                    {terminalHistory.map((line, i) => <p key={i}>{line}</p>)}
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-400/50">
                    <span>&gt;</span>
                    <input
                        ref={terminalInputRef}
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCommand()}
                        className="bg-transparent border-none w-full focus:outline-none focus:ring-0 text-blue-300"
                        autoComplete="off"
                        disabled={phase === 'climax'}
                    />
                </div>
            </div>

             {/* Anomalies */}
             <AnimatePresence>
                {anomalies.map(anomaly => (
                    <AnomalyWindow key={anomaly.id} anomaly={anomaly} onClose={() => setAnomalies(prev => prev.filter(a => a.id !== anomaly.id))} />
                ))}
             </AnimatePresence>
        </div>
    )
  }

  return (
    <div className="w-full h-full bg-black">
      <AudioManager event={soundEvent} onEnd={() => setSoundEvent(null)} />
      {renderContent()}
    </div>
  );
}
