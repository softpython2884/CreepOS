
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Inbox, Send, Edit, CornerUpLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  folder: 'inbox' | 'sent';
}

interface EmailClientProps {
  emails: Email[];
  onSend: (email: Omit<Email, 'id' | 'timestamp' | 'folder'>) => void;
  currentUser: string;
  onOpenLink: (url: string) => void;
}

type View = 'list' | 'read' | 'compose';

export default function EmailClient({ emails, onSend, currentUser, onOpenLink }: EmailClientProps) {
  const [currentView, setCurrentView] = useState<View>('list');
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent'>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);

  const filteredEmails = useMemo(() => {
    return emails
      .filter(email => email.folder === currentFolder)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, currentFolder]);

  const selectedEmail = useMemo(() => {
    return emails.find(email => email.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  useEffect(() => {
    if (currentView === 'read' && emailBodyRef.current) {
        const links = emailBodyRef.current.querySelectorAll('a[data-internal-link]');
        links.forEach(link => {
            const internalLink = link.getAttribute('data-internal-link');
            if (internalLink) {
              const handleClick = (e: Event) => {
                  e.preventDefault();
                  onOpenLink(internalLink);
              };
              link.addEventListener('click', handleClick);
              
              // Cleanup function to remove the event listener
              return () => {
                link.removeEventListener('click', handleClick);
              };
            }
        });
    }
  }, [currentView, selectedEmail, onOpenLink]);


  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    setCurrentView('read');
  };
  
  const handleCompose = () => {
    setCurrentView('compose');
  };
  
  const handleSend = (recipient: string, subject: string, body: string) => {
    if (!recipient || !subject || !body) {
      // Maybe show a toast or an error message here
      return;
    }
    onSend({
      sender: currentUser,
      recipient: recipient,
      subject: subject,
      body: body,
    });
    setCurrentView('list');
    setCurrentFolder('sent');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const ListView = () => (
    <div className='h-full flex flex-col'>
      <div className="p-2 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold capitalize">{currentFolder}</h2>
        <Button size="sm" onClick={handleCompose}><Edit className="mr-2 h-4 w-4" />Nouveau</Button>
      </div>
      <ScrollArea className="flex-grow">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Dossier vide.
          </div>
        ) : (
          filteredEmails.map(email => (
            <div
              key={email.id}
              className="p-3 border-b cursor-pointer hover:bg-accent/50"
              onClick={() => handleSelectEmail(email.id)}
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold text-accent">
                  {currentFolder === 'inbox' ? email.sender : `To: ${email.recipient}`}
                </p>
                <p className="text-xs text-muted-foreground">{formatTimestamp(email.timestamp)}</p>
              </div>
              <p className="text-sm truncate">{email.subject}</p>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );

  const ReadView = () => (
    <div className='h-full flex flex-col'>
      <div className="p-2 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentView('list')}>
          <CornerUpLeft size={16} />
        </Button>
        <h2 className="text-lg font-semibold truncate flex-1">{selectedEmail?.subject}</h2>
      </div>
      {selectedEmail && (
        <ScrollArea className="flex-grow">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2 pb-2 border-b">
              <div>
                <p className="font-semibold">{selectedEmail.sender}</p>
                <p className="text-sm text-muted-foreground">To: {selectedEmail.recipient}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatTimestamp(selectedEmail.timestamp)}</p>
            </div>
            <div 
              ref={emailBodyRef}
              className="whitespace-pre-wrap text-sm" 
              dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const ComposeView = () => {
    const [composeRecipient, setComposeRecipient] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');

    return (
        <div className='h-full flex flex-col'>
        <div className="p-2 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentView('list')}>
                <CornerUpLeft size={16} />
                </Button>
                <h2 className="text-lg font-semibold">Nouveau Message</h2>
            </div>
            <Button size="sm" onClick={() => handleSend(composeRecipient, composeSubject, composeBody)}><Send className="mr-2 h-4 w-4" />Envoyer</Button>
        </div>
        <div className="p-4 flex flex-col gap-4">
            <Input 
            placeholder="Destinataire" 
            value={composeRecipient}
            onChange={(e) => setComposeRecipient(e.target.value)}
            className="bg-secondary border-input"
            autoFocus
            />
            <Input 
            placeholder="Sujet" 
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            className="bg-secondary border-input"
            />
            <Separator />
            <Textarea 
            placeholder="Votre message..." 
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            className="flex-grow bg-secondary border-input resize-none h-[350px]"
            />
        </div>
        </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case 'read': return <ReadView />;
      case 'compose': return <ComposeView />;
      case 'list':
      default:
        return <ListView />;
    }
  };

  return (
    <div className="h-full flex bg-card text-foreground font-code text-sm">
      <div className="w-48 border-r bg-secondary/30 flex flex-col">
        <div className="p-4 font-bold text-lg border-b">Messagerie</div>
        <div className="flex flex-col p-2 gap-1">
          <Button 
            variant={currentFolder === 'inbox' ? 'secondary' : 'ghost'} 
            className="justify-start gap-2"
            onClick={() => {setCurrentFolder('inbox'); setCurrentView('list');}}
          >
            <Inbox size={16} />
            Boîte de réception
          </Button>
          <Button 
            variant={currentFolder === 'sent' ? 'secondary' : 'ghost'} 
            className="justify-start gap-2"
            onClick={() => {setCurrentFolder('sent'); setCurrentView('list');}}
          >
            <Send size={16} />
            Messages envoyés
          </Button>
        </div>
      </div>
      <main className="flex-1">
        {renderView()}
      </main>
    </div>
  );
}
