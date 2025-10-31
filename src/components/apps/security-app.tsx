'use client';

import { Radar, MapPin, Wifi } from 'lucide-react';

const StatCard = ({ title, value, children }: { title: string; value: string; children: React.ReactNode }) => (
    <div className="bg-secondary p-4 rounded-lg flex items-center gap-4">
        {children}
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-bold font-mono">{value}</p>
        </div>
    </div>
);

const LogLine = ({ timestamp, message, type }: { timestamp: string, message: string, type: 'info' | 'warn' | 'error' }) => {
    const color = type === 'error' ? 'text-red-400' : type === 'warn' ? 'text-yellow-400' : 'text-green-400';
    return (
        <p className={`font-mono text-sm ${color}`}>
            <span className="text-muted-foreground/50">{timestamp} - </span>{message}
        </p>
    );
};

export default function SecurityApp() {
  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono p-4 gap-4">
        <div className="grid grid-cols-3 gap-4">
            <StatCard title="STATUS" value="ACTIVE">
                <div className="w-12 h-12 bg-green-900/50 flex items-center justify-center rounded-full border-2 border-green-400 animate-pulse">
                    <Radar className="w-6 h-6 text-green-300" />
                </div>
            </StatCard>
            <StatCard title="GPS LOCK" value="SECURED">
                <div className="w-12 h-12 bg-green-900/50 flex items-center justify-center rounded-full border-2 border-green-400">
                    <MapPin className="w-6 h-6 text-green-300" />
                </div>
            </StatCard>
            <StatCard title="NETWORK" value="ISOLATED">
                <div className="w-12 h-12 bg-green-900/50 flex items-center justify-center rounded-full border-2 border-green-400">
                    <Wifi className="w-6 h-6 text-green-300" />
                </div>
            </StatCard>
        </div>
        <div className="flex-grow bg-secondary/50 rounded-lg p-4 overflow-y-auto border border-green-400/20">
            <h2 className="text-lg font-bold mb-2 text-green-300 border-b border-green-400/30 pb-1">SENTINEL LOGS</h2>
            <div className="space-y-1">
                <LogLine timestamp="[00:00:01]" message="AUTHORIZING DEFENSE MODE..." type="info" />
                <LogLine timestamp="[00:00:03]" message="TARGET IDENTIFIED: USER" type="warn" />
                <LogLine timestamp="[00:00:05]" message="INITIATING NEURAL FIREWALL..." type="info" />
            </div>
        </div>
    </div>
  );
}
