
'use client';

import { useState, useEffect, useMemo } from 'react';
import { type PC, FileSystemNode } from '@/lib/network/types';
import { Server, Laptop, Smartphone, Folder, FileText, KeyRound, LogOut, Info, Trash2, Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface RemoteAccessProps {
    network: PC[];
    setNetwork: (network: PC[]) => void;
    hackedPcs: Set<string>;
    onHack: (pcId: string, ip: string) => void;
    addLog: (message: string) => void;
    onSoundEvent: (event: 'click') => void;
}

const iconMap: Record<PC['type'], React.ReactNode> = {
    Desktop: <Laptop className="w-8 h-8" />,
    Laptop: <Laptop className="w-8 h-8" />,
    Server: <Server className="w-8 h-8" />,
    WebServer: <Server className="w-8 h-8" />,
    Mobile: <Smartphone className="w-8 h-8" />,
};

const FOLDER_BLACKLIST = ['bin', 'sys'];

export default function RemoteAccess({ network, setNetwork, hackedPcs, onHack, addLog, onSoundEvent }: RemoteAccessProps) {
    const [selectedPc, setSelectedPc] = useState<PC | null>(null);

    const knownPcs = useMemo(() => {
        return network.filter(pc => pc.id !== 'player-pc' && hackedPcs.has(pc.id));
    }, [network, hackedPcs]);

    const handleAction = (action: 'clearLogs') => {
        onSoundEvent('click');
        if (!selectedPc) return;

        let logMessage = '';
        const newNetwork = network.map(pc => {
            if (pc.id === selectedPc.id) {
                const updatedPc = { ...pc };
                if (action === 'clearLogs') {
                    const logFile = findNodeByPath(['logs', 'access.log'], updatedPc.fileSystem);
                    if(logFile && logFile.type === 'file'){
                        logFile.content = 'Log cleared by remote admin.\n';
                    }
                    logMessage = `SECURITY: Logs cleared on ${pc.ip}`;
                }
                return updatedPc;
            }
            return pc;
        });

        setNetwork(newNetwork);
        addLog(logMessage);
        setSelectedPc(newNetwork.find(pc => pc.id === selectedPc.id) || null);
    }
    
    const findNodeByPath = (path: string[], nodes: FileSystemNode[]): FileSystemNode | null => {
        let currentLevel: FileSystemNode[] | undefined = nodes;
        let foundNode: FileSystemNode | null = null;
        for (const part of path) {
            if (!currentLevel) return null;
            const node = currentLevel.find(n => n.name === part);
            if (!node) return null;
            foundNode = node;
            currentLevel = node.children;
        }
        return foundNode;
    };

    const goHome = () => {
        onSoundEvent('click');
        setSelectedPc(null);
    }

    const visibleFiles = useMemo(() => {
        if (!selectedPc) return [];

        const personalizeFileSystem = (nodes: FileSystemNode[]): FileSystemNode[] => {
            return JSON.parse(JSON.stringify(nodes).replace(/<user>/g, selectedPc.auth.user));
        };
        
        const files: {path: string, node: FileSystemNode}[] = [];
        const traverse = (nodes: FileSystemNode[], currentPath: string) => {
            for (const node of nodes) {
                if(FOLDER_BLACKLIST.includes(node.name) && currentPath === '') continue;

                const newPath = currentPath ? `${currentPath}/${node.name}` : node.name;
                if (node.type === 'file') {
                    files.push({ path: newPath, node });
                }
                if (node.type === 'folder' && node.children) {
                    traverse(node.children, newPath);
                }
            }
        };

        traverse(personalizeFileSystem(selectedPc.fileSystem), '');
        return files;
    }, [selectedPc]);

    if (!selectedPc) {
        return (
            <div className="h-full w-full bg-card/80 p-4 flex flex-col">
                <h2 className="text-lg font-bold text-accent mb-4">Known Systems</h2>
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-2 pr-4">
                        {knownPcs.length > 0 ? knownPcs.map(pc => (
                            <button key={pc.id} onClick={() => { setSelectedPc(pc); onSoundEvent('click'); }}
                                className="p-4 bg-secondary rounded-lg flex items-center justify-between gap-4 hover:bg-accent hover:text-accent-foreground transition-colors group text-left w-full">
                                <div className="flex items-center gap-4">
                                    <div className="text-accent group-hover:text-accent-foreground">
                                        {iconMap[pc.type]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">{pc.name}</p>
                                        <p className="text-sm text-muted-foreground font-code">{pc.ip}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-code">{pc.auth.user}</p>
                                    <p className="text-sm font-code text-muted-foreground">{pc.auth.pass}</p>
                                </div>
                            </button>
                        )) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-center p-8">
                                <p>No compromised systems found.<br/>Use the terminal to gain access to new machines.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full bg-card/80 p-4 flex flex-col gap-4">
            <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-start justify-between p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/20 text-accent">
                           {iconMap[selectedPc.type]}
                        </div>
                        <div>
                            <CardTitle>{selectedPc.name}</CardTitle>
                            <CardDescription>{selectedPc.ip}</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={goHome}><Home className="mr-2"/>Known Systems</Button>
                </CardHeader>
            </Card>

            <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
               <Card className="col-span-1 bg-secondary/50 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Info />System Info</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Username:</span>
                            <span className="font-bold font-code">{selectedPc.auth.user}</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Password:</span>
                            <span className="font-bold font-code">{selectedPc.auth.pass}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-muted-foreground">Firewall:</span>
                            <span className={cn("font-bold", selectedPc.firewall.enabled ? 'text-destructive' : 'text-green-400')}>
                                {selectedPc.firewall.enabled ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Proxy:</span>
                             <span className={cn("font-bold", selectedPc.proxy.enabled ? 'text-destructive' : 'text-green-400')}>
                                {selectedPc.proxy.enabled ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ports for Breach:</span>
                            <span className="font-bold">{selectedPc.requiredPorts}</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Traceability:</span>
                            <span className="font-bold text-amber-400">{selectedPc.traceability}%</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2">
                         <Button onClick={() => handleAction('clearLogs')} variant="outline">
                            <Trash2 className="mr-2"/>Clear Access Logs
                        </Button>
                    </CardFooter>
               </Card>
               <Card className="col-span-2 bg-secondary/50 flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Folder />File System</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4 pt-0">
                            {visibleFiles.map(({ path, node }) => (
                                <div key={path} className="mb-2 p-2 rounded-md hover:bg-background/50">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground"/>
                                        <span className="text-sm font-code text-accent">{path}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap truncate">
                                        {node.content?.substring(0, 100) || '(empty)'}
                                        {node.content && node.content.length > 100 ? '...' : ''}
                                    </p>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
               </Card>
            </div>
        </div>
    );
}
