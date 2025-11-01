'use client';

import { useState } from 'react';
import { FileText, Folder, CornerUpLeft, X, Lock } from 'lucide-react';
import { type FileSystemNode } from './content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DocumentFolderProps {
    initialFileSystem: FileSystemNode[];
    onFolderUnlocked?: (folderId: string) => void;
    onSoundEvent?: (event: 'click') => void;
}

export default function DocumentFolder({ initialFileSystem, onFolderUnlocked, onSoundEvent }: DocumentFolderProps) {
    const [fileSystem, setFileSystem] = useState<FileSystemNode[]>(initialFileSystem);
    const [history, setHistory] = useState<FileSystemNode[][]>([initialFileSystem]);
    const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);
    const [lockedFolder, setLockedFolder] = useState<FileSystemNode | null>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    const currentFolderItems = history[history.length - 1];

    const openNode = (node: FileSystemNode) => {
        onSoundEvent?.('click');
        if (node.isLocked) {
            setLockedFolder(node);
            setPassword('');
            setPasswordError(false);
            return;
        }

        if (node.type === 'folder' && node.children) {
            const newHistory = [...history, node.children];
            setHistory(newHistory);
        } else if (node.type === 'file') {
            setSelectedFile(node);
        }
    };

    const goBack = () => {
        onSoundEvent?.('click');
        if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
        }
    };

    const handlePasswordSubmit = () => {
        onSoundEvent?.('click');
        if (lockedFolder && password === lockedFolder.password) {
            const unlockedFolder = { ...lockedFolder, isLocked: false };
            
            // Update the file system state to reflect the unlocked folder
            const updateNodeRecursively = (nodes: FileSystemNode[]): FileSystemNode[] => {
                return nodes.map(n => {
                    if (n.id === unlockedFolder.id) {
                        return unlockedFolder;
                    }
                    if (n.children) {
                        return { ...n, children: updateNodeRecursively(n.children) };
                    }
                    return n;
                });
            };
    
            const newFileSystem = updateNodeRecursively(fileSystem);
            setFileSystem(newFileSystem);

            // Update history to replace the locked folder with the unlocked one
            const newHistory = history.map(level => updateNodeRecursively(level));
            setHistory(newHistory);

            setLockedFolder(null);
            setPassword('');
            onFolderUnlocked?.(unlockedFolder.id);
            // Directly open the folder after unlocking
            if (unlockedFolder.children) {
                setHistory(prev => [...prev, unlockedFolder.children!]);
            }
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        }
    };

    if (selectedFile) {
        return (
            <div className="h-full bg-card font-code text-sm text-foreground p-4 animate-in fade-in">
                <Card className="h-full bg-secondary border-0 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between p-2 pl-4 border-b">
                        <CardTitle className="text-sm font-medium">{selectedFile.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedFile(null); onSoundEvent?.('click');}}>
                            <X size={16} />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow overflow-auto">
                        <p className="whitespace-pre-wrap">{selectedFile.content}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <ScrollArea className="h-full bg-card">
                <div className="p-2 flex items-center border-b">
                    <Button variant="ghost" size="icon" onClick={goBack} disabled={history.length === 1}>
                        <CornerUpLeft size={16} />
                    </Button>
                    <span className="ml-2 text-sm text-muted-foreground">
                        /Personnel
                        {history.length > 1 && '/Archives'}
                    </span>
                </div>
                <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {currentFolderItems.map((node) => (
                        <button
                            key={node.id}
                            onClick={() => openNode(node)}
                            className="flex flex-col items-center gap-2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                        >
                            {node.type === 'folder' ? (
                                <div className="relative">
                                    <Folder className="h-12 w-12 text-accent group-hover:text-accent-foreground" />
                                    {node.isLocked && <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-foreground/70" />}
                                </div>
                            ) : (
                                <FileText className="h-12 w-12 text-muted-foreground group-hover:text-accent-foreground" />
                            )}
                            <span className="text-xs text-center break-all">{node.name}</span>
                        </button>
                    ))}
                </div>
            </ScrollArea>

            <Dialog open={!!lockedFolder} onOpenChange={() => setLockedFolder(null)}>
                <DialogContent className="sm:max-w-md bg-card border-destructive">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Lock size={16}/>Accès Restreint</DialogTitle>
                        <DialogDescription>
                            Le dossier '{lockedFolder?.name}' est protégé. Veuillez entrer le mot de passe.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            placeholder="Mot de passe"
                            className="font-mono tracking-widest"
                            autoFocus
                        />
                        <Button type="submit" onClick={handlePasswordSubmit}>Déverrouiller</Button>
                    </div>
                    {passwordError && <p className="text-sm text-destructive animate-in fade-in">Mot de passe incorrect.</p>}
                </DialogContent>
            </Dialog>
        </>
    );
}
