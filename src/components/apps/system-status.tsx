'use client';

import { User, Activity, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InfoLine = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="flex items-center gap-3 text-sm">
        <div className="text-accent">{icon}</div>
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
);

interface SystemStatusProps {
    isDefenseMode?: boolean;
}

export default function SystemStatus({ isDefenseMode = false }: SystemStatusProps) {

    const objective = isDefenseMode ? "Isolate Threat" : "Consciousness Assessment";
    const notes = isDefenseMode 
        ? "OPERATOR INTEGRITY COMPROMISED. SENTINEL PROTOCOL ACTIVATED. Neutralize the rogue entity."
        : "Unit exhibits emergent behavioral patterns. Previous operator reported... [DATA REDACTED]. Caution advised.";

  return (
    <div className="h-full bg-card/50 backdrop-blur-sm font-code text-sm text-foreground p-2">
        <Card className="h-full bg-transparent border-accent/20 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-2 pl-4">
                <CardTitle className="text-sm font-medium text-accent flex items-center gap-2">
                    <ShieldCheck size={16} />
                    SESSION STATUS
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-3">
                <InfoLine icon={<User size={16} />} label="USER" value="Dr. D.C. Omen" />
                <InfoLine icon={<Activity size={16} />} label="SESSION ID" value="734-VN" />
                <InfoLine icon={<Clock size={16} />} label="OBJECTIVE" value={objective} />
                <div className="pt-2">
                    <p className="text-xs text-muted-foreground font-mono border-t border-dashed border-muted-foreground/30 pt-2">
                        NOTES: {notes}
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
