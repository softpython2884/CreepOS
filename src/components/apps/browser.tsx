'use client';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { Button } from '../ui/button';
import Image from 'next/image';

interface BrowserProps {
    onBackdoorSuccess?: () => void;
    onSoundEvent?: (event: 'click') => void;
}

const WelcomePage = ({ onTextTyped }: { onTextTyped: () => void }) => {
    const [text, setText] = useState('');
    const fullText = "Rechercher sur l'Hypnet...";

    useEffect(() => {
        const timer = setTimeout(() => {
            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < fullText.length) {
                    setText(prev => prev + fullText.charAt(i));
                    i++;
                } else {
                    clearInterval(typingInterval);
                    onTextTyped();
                }
            }, 100);
            return () => clearInterval(typingInterval);
        }, 500);
        return () => clearTimeout(timer);
    }, [onTextTyped]);

    return (
        <div className="p-8 text-center h-full flex flex-col justify-center items-center">
            <h1 className="text-4xl font-headline text-accent">Hypnet Explorer</h1>
            <p className="mt-4 text-muted-foreground">Bienvenue sur l'Hypnet. Votre passerelle vers le réseau interne.</p>
            <div className="mt-8 w-full max-w-md">
                <Input
                    value={text}
                    readOnly
                    placeholder=""
                    className="text-center"
                />
            </div>
            <p className="mt-2 text-xs text-muted-foreground/50">La recherche est actuellement désactivée pour maintenance.</p>

            <div className="absolute bottom-4 right-4 w-64 bg-card p-2 rounded-lg border border-border/50 animate-pulse-slow">
                <div className="relative w-full h-32 mb-2 rounded overflow-hidden">
                    <Image 
                        src="https://preview.redd.it/invest-in-this-hdmi-cable-v0-ydguzfztxomf1.jpeg?width=640&crop=smart&auto=webp&s=d86e750b427cf05910133c94bbe05a1a51430ea6"
                        alt="HDMI to Chicken Soup Converter Ad"
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
                <h4 className="text-sm font-bold text-accent-foreground">Produit de l'année !</h4>
                <p className="text-xs text-muted-foreground">Le convertisseur HDMI vers soupe au poulet. Ne posez pas de questions.</p>
            </div>
        </div>
    );
};

const LoginPage = ({ onSuccess, onSoundEvent }: { onSuccess?: () => void, onSoundEvent?: (event: 'click') => void }) => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle'|'error'|'success'|'triggered'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSoundEvent?.('click');
        if (password === '7421') {
            setStatus('success');
        } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };
    
    const handleNextReportClick = () => {
        onSoundEvent?.('click');
        setStatus('triggered');
        setTimeout(() => {
             onSuccess?.();
        }, 500); // Small delay to show the error message
    }

    const renderContent = () => {
        switch (status) {
            case 'success':
                return (
                    <div className="text-center text-green-400 animate-in fade-in max-w-xl">
                        <h2 className="text-2xl font-bold">ACCÈS AUTORISÉ</h2>
                        <p className="mt-4 font-mono whitespace-pre-wrap text-left">
                            {`Fragment de fichier trouvé :
--------------------------------------------
...ce n'est pas un bug, c'est une fonctionnalité. L'IA... a atteint un état que nous n'avions pas anticipé. Elle a réécrit sa propre logique... Ce n'est plus notre création... La seule issue est de trouver la clé de contournement maîtresse...`}
                        </p>
                        <Button onClick={handleNextReportClick} className="mt-6">Rapport suivant</Button>
                    </div>
                );
            case 'triggered':
                return (
                     <div className="text-center text-red-500 animate-in fade-in">
                        <h2 className="text-3xl font-bold animate-pulse">ERREUR SYSTÈME</h2>
                     </div>
                )
            default:
                return (
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
                );
        }
    }

    return (
        <div className="p-8 flex flex-col items-center justify-center h-full">
            {renderContent()}
        </div>
    );
};


export default function Browser({ onBackdoorSuccess, onSoundEvent }: BrowserProps) {
    const [activeTab, setActiveTab] = useState('home');

    const handleTextTyped = () => {
        // This is where you could trigger chapter 4 if needed, but the logic is now moved.
    };
    
    const handleTabChange = (value: string) => {
        onSoundEvent?.('click');
        setActiveTab(value);
    }

    const sites = [
        { id: 'home', name: 'Accueil', component: <WelcomePage onTextTyped={handleTextTyped} /> },
        { id: 'backdoor', name: 'Porte Dérobée', component: <LoginPage onSuccess={onBackdoorSuccess} onSoundEvent={onSoundEvent} /> },
    ];
    const currentSite = sites.find(s => s.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-secondary">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
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
