
'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface TextEditorProps {
    fileContent: string;
    onSave: (newContent: string) => void;
}

export default function TextEditor({ fileContent, onSave }: TextEditorProps) {
    const [content, setContent] = useState(fileContent);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                onSave(content);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [content, onSave]);

    return (
        <div className="h-full flex flex-col bg-card font-code">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-grow w-full h-full p-4 bg-secondary text-foreground border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                placeholder="Empty file..."
                autoFocus
            />
            <div className="flex justify-end p-2 border-t">
                 <span className="text-xs text-muted-foreground mr-4 self-center">Ctrl+S pour sauvegarder</span>
                <Button onClick={() => onSave(content)} size="sm" variant="outline">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer & Quitter
                </Button>
            </div>
        </div>
    );
}
