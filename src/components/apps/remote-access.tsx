
'use client';

import { useState, useEffect, useMemo } from 'react';
import { type PC, FileSystemNode } from '@/lib/network/types';
import { Server, Laptop, Smartphone, Share2, Folder, FileText, Shield, ShieldOff, KeyRound, LogOut, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
    Desktop: <Laptop className="w-12 h-12" />,
    Laptop: <Laptop className="w-12 h-12" />,
    Server: <Server className="w-12 h-12" />,
    WebServer: <Server className="w-12 h-12" />,
    Mobile: <Smartphone className="w-12 h-12" />,
};

const FOLDER_BLACKLIST = ['bin', 'sys'];

export default function RemoteAccess({ network, setNetwork, hackedPcs, onHack, addLog, onSoundEvent }: RemoteAccessProps) {
    const [selectedPc, setSelectedPc] = useState<PC | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedPc) {
            const isHacked = hackedPcs.has(selectedPc.id);
            setIsAuthenticated(isHacked);
        } else {
            setIsAuthenticated(false);
        }
    }, [selectedPc, hackedPcs]);

    const handleLogin = () => {
        onSoundEvent('click');
        if (selectedPc && username === selectedPc.auth.user && password === selectedPc.auth.pass) {
            setIsAuthenticated(true);
            onHack(selectedPc.id, selectedPc.ip);
            setError('');
        } else {
            setError('Authentication failed.');
            setTimeout(() => setError(''), 2000);
        }
    };

    const handleAction = (action: 'clearLogs') => {
        onSoundEvent('click');
        if (!selectedPc || !isAuthenticated) return;

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
        // We need to update selectedPc state as well to reflect the change in the UI
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

    const disconnect = () => {
        onSoundEvent('click');
        setSelectedPc(null);
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
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
            <div className="h-full w-full bg-card/80 p-4">
                <ScrollArea className="h-full">
                    <h2 className="text-lg font-bold text-accent mb-4">Network Map - Select a target</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {network.filter(pc => pc.id !== 'player-pc').map(pc => (
                            <button key={pc.id} onClick={() => { setSelectedPc(pc); onSoundEvent('click'); }}
                                className="p-4 bg-secondary rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors group">
                                <div className={cn("transition-colors", hackedPcs.has(pc.id) ? "text-accent" : "text-muted-foreground")}>
                                    {iconMap[pc.type]}
                                </div>
                                <p className={cn("text-sm font-bold truncate", hackedPcs.has(pc.id) ? "text-accent" : "text-muted-foreground")}>{pc.name}</p>
                                <p className="text-xs text-muted-foreground/80">{pc.ip}</p>
                            </button>
                        ))}
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
                        <div className={cn("p-2 rounded-full", isAuthenticated ? "bg-primary/20 text-accent" : "bg-secondary text-muted-foreground")}>
                           {iconMap[selectedPc.type]}
                        </div>
                        <div>
                            <CardTitle>{selectedPc.name}</CardTitle>
                            <CardDescription>{selectedPc.ip}</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={disconnect}><LogOut className="mr-2"/>Disconnect</Button>
                </CardHeader>
            </Card>

            {!isAuthenticated ? (
                <Card className="flex-1 bg-secondary/50 flex flex-col items-center justify-center">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound/>Authentication Required</CardTitle>
                        <CardDescription>Root access denied. Please provide credentials.</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full max-w-sm flex flex-col gap-3">
                         <Input 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                        />
                         <Input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                         {error && <p className="text-sm text-destructive animate-in fade-in">{error}</p>}
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleLogin}>Login</Button>
                    </CardFooter>
                </Card>
            ) : (
                <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
                   <Card className="col-span-1 bg-secondary/50 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Info />System Info</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 text-sm">
                            <div className="flex items-center justify-between">
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
            )}
        </div>
    );
}
