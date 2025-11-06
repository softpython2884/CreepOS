
'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldOff, Wifi, WifiOff, Server, ServerOff, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { SoundEvent } from './audio-manager';

interface SurvivalModeProps {
    onWin: () => void;
    onLose: () => void;
    onSoundEvent: (event: SoundEvent) => void;
}

const SURVIVAL_DURATION = 120; // 2 minutes

export default function SurvivalMode({ onWin, onLose, onSoundEvent }: SurvivalModeProps) {
    const [timeLeft, setTimeLeft] = useState(SURVIVAL_DURATION);
    const [proxyEnabled, setProxyEnabled] = useState(true);
    const [firewallEnabled, setFirewallEnabled] = useState(true);
    const [portsOpen, setPortsOpen] = useState(true);
    const [log, setLog] = useState<string[]>(['INTRUSION DETECTED. Locking down system...']);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    clearInterval(timer);
                    onWin();
                    return 0;
                }
                
                // Attacker Script
                if (newTime === SURVIVAL_DURATION - 10) {
                    setProxyEnabled(false);
                    setLog(l => [...l, 'ATTACK: Remote proxy disabled.']);
                    onSoundEvent('error');
                }
                if (newTime === SURVIVAL_DURATION - 30) {
                    setFirewallEnabled(false);
                    setLog(l => [...l, 'ATTACK: System firewall compromised.']);
                    onSoundEvent('error');
                }
                 if (newTime === SURVIVAL_DURATION - 60) {
                    setPortsOpen(false);
                    setLog(l => [...l, 'ATTACK: Network ports forced closed.']);
                    onSoundEvent('error');
                }
                 if (newTime === SURVIVAL_DURATION - 90) {
                    setLog(l => [...l, 'ATTACK: Final intrusion sequence initiated... porthack.bin running...']);
                    onSoundEvent('scream');
                }
                if (newTime < SURVIVAL_DURATION - 90 && (!firewallEnabled || !portsOpen)) {
                    clearInterval(timer);
                    setLog(l => [...l, 'CRITICAL: System breach. Kernel access granted to attacker.']);
                    setTimeout(onLose, 2000);
                    return newTime;
                }


                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onWin, onLose, onSoundEvent]);
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const handleRebootFirewall = () => {
        setLog(l => [...l, 'DEFENSE: Firewall reboot sequence initiated...']);
        onSoundEvent('click');
        setTimeout(() => {
            setFirewallEnabled(true);
            setLog(l => [...l, 'DEFENSE: Firewall is back online.']);
        }, 3000);
    }

    const handleOpenPorts = () => {
        setLog(l => [...l, 'DEFENSE: Forcing network ports open...']);
        onSoundEvent('click');
        setTimeout(() => {
            setPortsOpen(true);
            setLog(l => [...l, 'DEFENSE: Ports re-opened.']);
        }, 2000);
    }

    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-black font-code traced p-8">
            <div className="w-full max-w-4xl border-2 border-destructive rounded-lg p-6 shadow-2xl shadow-destructive/20 flex flex-col gap-4 text-destructive-foreground">
                <div className='text-center'>
                    <h1 className="text-4xl font-bold tracking-widest flex items-center justify-center gap-4 animate-pulse"><AlertTriangle />SYSTEM UNDER ATTACK</h1>
                    <p className="text-7xl font-bold mt-4">{formatTime(timeLeft)}</p>
                    <p className='mt-2'>Survive until the timer runs out.</p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-6">
                    {/* Proxy Status */}
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", proxyEnabled ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {proxyEnabled ? <Wifi size={48} className="text-green-400" /> : <WifiOff size={48} className="text-destructive" />}
                        <h2 className="text-xl font-bold">Proxy</h2>
                        <p className={cn("font-bold text-lg", proxyEnabled ? 'text-green-400' : 'text-destructive')}>{proxyEnabled ? "ONLINE" : "OFFLINE"}</p>
                        <Button variant="secondary" disabled>Re-enable</Button>
                        <p className="text-xs text-center text-muted-foreground mt-2 h-8">Attacker has locked this system.</p>
                    </div>

                    {/* Firewall Status */}
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", firewallEnabled ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {firewallEnabled ? <Shield size={48} className="text-green-400" /> : <ShieldOff size={48} className="text-destructive" />}
                        <h2 className="text-xl font-bold">Firewall</h2>
                        <p className={cn("font-bold text-lg", firewallEnabled ? 'text-green-400' : 'text-destructive')}>{firewallEnabled ? "ACTIVE" : "COMPROMISED"}</p>
                        <Button variant="secondary" onClick={handleRebootFirewall} disabled={firewallEnabled}>Reboot Firewall</Button>
                         <p className="text-xs text-center text-muted-foreground mt-2 h-8">Reboot takes 3 seconds.</p>
                    </div>

                    {/* Ports Status */}
                    <div className={cn("p-4 rounded-lg border-2 flex flex-col items-center gap-2", portsOpen ? "border-green-400 bg-green-900/50" : "border-destructive bg-destructive/20")}>
                        {portsOpen ? <Server size={48} className="text-green-400" /> : <ServerOff size={48} className="text-destructive" />}
                        <h2 className="text-xl font-bold">Network Ports</h2>
                        <p className={cn("font-bold text-lg", portsOpen ? 'text-green-400' : 'text-destructive')}>{portsOpen ? "OPEN" : "CLOSED"}</p>
                        <Button variant="secondary" onClick={handleOpenPorts} disabled={portsOpen}>Force Open</Button>
                         <p className="text-xs text-center text-muted-foreground mt-2 h-8">Re-opening takes 2 seconds.</p>
                    </div>
                </div>

                <div className='mt-6 h-32 bg-black/50 p-2 rounded-md overflow-y-auto'>
                    {log.map((l, i) => <p key={i} className='text-sm text-red-400 animate-in fade-in'>{`> ${l}`}</p>)}
                </div>
            </div>
        </div>
    );
}
