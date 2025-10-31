'use client';

import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { documents } from './content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Document = typeof documents[0];

export default function DocumentFolder() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  if (selectedDoc) {
    return (
      <div className="h-full bg-card font-code text-sm text-foreground p-4 animate-in fade-in">
        <Card className="h-full bg-secondary border-0 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-2 pl-4 border-b">
                <CardTitle className="text-sm font-medium">{selectedDoc.title}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSelectedDoc(null)}>
                    <X size={16} />
                </Button>
            </CardHeader>
            <CardContent className="p-4 flex-grow overflow-auto">
                <p className="whitespace-pre-wrap">{selectedDoc.content}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-card">
      <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="flex flex-col items-center gap-2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
          >
            <FileText className="h-12 w-12 text-accent group-hover:text-accent-foreground" />
            <span className="text-xs text-center break-all">{doc.title}</span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
