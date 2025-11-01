'use client';

import { useState } from 'react';
import { FileText, Folder, CornerUpLeft, X } from 'lucide-react';
import { type FileSystemNode } from './content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DocumentFolderProps {
    initialFileSystem: FileSystemNode[];
}

export default function DocumentFolder({ initialFileSystem }: DocumentFolderProps) {
    const [currentPath, setCurrentPath] = useState<FileSystemNode[]>(initialFileSystem);
    const [history, setHistory] = useState<FileSystemNode[][]>([initialFileSystem]);
    const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);

    const currentFolder = history[history.length - 1];

    const openNode = (node: FileSystemNode) => {
        if (node.type === 'folder' && node.children) {
            const newHistory = [...history, node.children];
            setHistory(newHistory);
            setCurrentPath(node.children);
        } else if (node.type === 'file') {
            setSelectedFile(node);
        }
    };

    const goBack = () => {
        if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            setCurrentPath(newHistory[newHistory.length - 1]);
        }
    };

    if (selectedFile) {
        return (
            <div className="h-full bg-card font-code text-sm text-foreground p-4 animate-in fade-in">
                <Card className="h-full bg-secondary border-0 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between p-2 pl-4 border-b">
                        <CardTitle className="text-sm font-medium">{selectedFile.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSelectedFile(null)}>
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
        <ScrollArea className="h-full bg-card">
            <div className="p-2 flex items-center border-b">
                <Button variant="ghost" size="icon" onClick={goBack} disabled={history.length === 1}>
                    <CornerUpLeft size={16} />
                </Button>
                <span className="ml-2 text-sm text-muted-foreground">
                    /
                    {history.slice(1).map(h => h.find(n => n.type === 'folder')?.name).join('/')}
                </span>
            </div>
            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {currentPath.map((node) => (
                    <button
                        key={node.id}
                        onClick={() => openNode(node)}
                        className="flex flex-col items-center gap-2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                    >
                        {node.type === 'folder' ? (
                            <Folder className="h-12 w-12 text-accent group-hover:text-accent-foreground" />
                        ) : (
                            <FileText className="h-12 w-12 text-muted-foreground group-hover:text-accent-foreground" />
                        )}
                        <span className="text-xs text-center break-all">{node.name}</span>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}
