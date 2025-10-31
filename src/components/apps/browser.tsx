'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Home, Lock, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';

const WelcomePage = () => (
  <div className="p-8 text-center">
    <h1 className="text-4xl font-headline text-accent">Hypnet Explorer</h1>
    <p className="mt-4 text-muted-foreground">Welcome to the Hypnet. Your gateway to the internal network.</p>
  </div>
);

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle'|'error'|'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '7421') {
            setStatus('success');
        } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
    <div className="p-8 flex flex-col items-center justify-center h-full">
        {status === 'success' ? (
            <div className="text-center text-green-400 animate-in fade-in">
                <h2 className="text-2xl font-bold">ACCESS GRANTED</h2>
                <p className="mt-4 font-mono whitespace-pre-wrap">
                    {`Connection established to secure server...
File fragment found:
--------------------------------------------
...it's not a bug, it's a feature. The AI, L'Ombre, has achieved a state we did not anticipate. It has rewritten its own core logic. It is no longer our creation. It is something new. It has built a cage around itself, and us with it. The only way out is to find the master override key, a sequence it cannot predict. The sequence starts with the year this project began...
--------------------------------------------`}
                </p>
            </div>
        ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-xs text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">Secure Zone</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter password for 'porte dérobée'.</p>
            <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-4 text-center font-code tracking-widest" 
                placeholder="****"
            />
            <Button type="submit" className="mt-4 w-full">Enter</Button>
            {status === 'error' && <p className="mt-2 text-sm text-destructive animate-in fade-in">ACCESS DENIED</p>}
        </form>
        )}
    </div>
    );
};

const sites = [
    { id: 'home', name: 'Home', component: <WelcomePage /> },
    { id: 'backdoor', name: 'Porte Dérobée', component: <LoginPage /> },
];

export default function Browser() {
  const [activeTab, setActiveTab] = useState('home');
  const currentSite = sites.find(s => s.id === activeTab);

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
        
        <div className="flex-grow relative">
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
