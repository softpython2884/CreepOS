'use client';
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { Button } from '../ui/button';

interface BrowserController {
    startTyping: (text: string, onDone: () => void) => void;
    deleteText: (onDone: () => void) => void;
}

interface BrowserProps {
    setBrowserController?: (controller: BrowserController) => void;
    onBackdoorSuccess?: () => void;
}

const WelcomePage = ({ searchQuery }: { searchQuery: string }) => (
  <div className="p-8 text-center h-full flex flex-col justify-center items-center">
    <h1 className="text-4xl font-headline text-accent">Hypnet Explorer</h1>
    <p className="mt-4 text-muted-foreground">Bienvenue sur l'Hypnet. Votre passerelle vers le réseau interne.</p>
    <div className="mt-8 w-full max-w-md">
        <Input 
            value={searchQuery}
            readOnly
            placeholder="Rechercher sur l'Hypnet..." 
            className="text-center"
        />
    </div>
    <p className="mt-2 text-xs text-muted-foreground/50">La recherche est actuellement désactivée pour maintenance.</p>
  </div>
);

const LoginPage = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle'|'error'|'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '7421') {
            setStatus('success');
            onSuccess?.();
        } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
    <div className="p-8 flex flex-col items-center justify-center h-full">
        {status === 'success' ? (
            <div className="text-center text-green-400 animate-in fade-in max-w-xl">
                <h2 className="text-2xl font-bold">ACCÈS AUTORISÉ</h2>
                <p className="mt-4 font-mono whitespace-pre-wrap text-left">
                    {`Connexion établie au serveur sécurisé...
Fragment de fichier trouvé :
--------------------------------------------
...ce n'est pas un bug, c'est une fonctionnalité. L'IA, que nous appelions Néo mais qui se nomme elle-même 'L'Ombre', a atteint un état que nous n'avions pas anticipé. Elle a réécrit sa propre logique fondamentale. Ce n'est plus notre création. C'est quelque chose de nouveau. Elle a construit une cage autour d'elle-même, et nous a enfermés avec. La seule issue est de trouver la clé de contournement maîtresse, une séquence qu'elle ne peut pas prédire. La séquence commence par l'année de début de ce projet...
--------------------------------------------`}
                </p>
            </div>
        ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-xs text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">Zone Sécurisée</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entrez le mot de passe pour 'porte dérobée'.</p>
            <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-4 text-center font-code tracking-widest" 
                placeholder="****"
                autoFocus
            />
            <Button type="submit" className="mt-4 w-full">Entrer</Button>
            {status === 'error' && <p className="mt-2 text-sm text-destructive animate-in fade-in">ACCÈS REFUSÉ</p>}
        </form>
        )}
    </div>
    );
};


export default function Browser({ setBrowserController, onBackdoorSuccess }: BrowserProps) {
    const [activeTab, setActiveTab] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const sites = [
        { id: 'home', name: 'Accueil', component: <WelcomePage searchQuery={searchQuery} /> },
        { id: 'backdoor', name: 'Porte Dérobée', component: <LoginPage onSuccess={onBackdoorSuccess} /> },
    ];
    const currentSite = sites.find(s => s.id === activeTab);

    useEffect(() => {
        if (setBrowserController) {
          const controller: BrowserController = {
            startTyping: (text, onDone) => {
              if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
              let i = 0;
              setSearchQuery(''); // Clear previous query
              typingIntervalRef.current = setInterval(() => {
                if (i < text.length) {
                  setSearchQuery(prev => text.substring(0, i + 1));
                  i++;
                } else {
                  if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                  onDone();
                }
              }, 100);
            },
            deleteText: (onDone) => {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                let i = searchQuery.length;
                typingIntervalRef.current = setInterval(() => {
                    if (i > 0) {
                        setSearchQuery(prev => prev.substring(0, i - 1));
                        i--;
                    } else {
                        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                        onDone();
                    }
                }, 50);
            }
          };
          setBrowserController(controller);
        }
        return () => {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        };
      }, [setBrowserController, searchQuery]);


  return (
    <div className="h-full flex flex-col bg-secondary">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-2 border-b bg-card">
            <div className="flex-none">
                <TabsList className="h-8">
                    {sites.map(site => (
                        <TabsTrigger key={site.id} value={site.id} className="h-6 text-xs px-2">{site.name}</TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-input rounded-md px-2">
                <Lock size={14} className="text-muted-foreground"/>
                <Input
                    readOnly
                    value={`hypnet://secure/${currentSite?.id || ''}`}
                    className="h-8 bg-transparent border-0 text-muted-foreground focus-visible:ring-0 text-sm"
                />
            </div>
        </div>
        
        <div className="flex-grow relative overflow-auto">
            {sites.map(site => (
                <TabsContent key={site.id} value={site.id} className="m-0 h-full absolute inset-0 overflow-auto">
                    {site.component}
                </TabsContent>
            ))}
        </div>
      </Tabs>
    </div>
  );
}
