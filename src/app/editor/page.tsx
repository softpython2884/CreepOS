'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PC, FileSystemNode, PC_Type } from '@/lib/network/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Scenario = {
  name: string;
  description: string;
  pcs: PC[];
  // emails: Email[];
  // calls: CallScript[];
  // triggers: Trigger[];
};

const PC_TYPES: PC_Type[] = ['Server', 'Desktop', 'WebServer', 'Laptop', 'Mobile'];

const EMPTY_PC: Omit<PC, 'id' | 'name' | 'ip'> = {
  type: 'Server',
  links: [],
  auth: { user: 'admin', pass: 'password' },
  firewall: { enabled: false, complexity: 0, solution: '' },
  proxy: { enabled: false, level: 0 },
  traceTime: 0,
  requiredPorts: 0,
  ports: [],
  fileSystem: [],
  traceability: 0,
  isDangerous: false,
  isDestroyed: false,
};


export default function EditorPage() {
  const [scenario, setScenario] = useState<Scenario>({
    name: 'Nouveau Scénario',
    description: 'Une nouvelle aventure dans NEO-SYSTEM.',
    pcs: [],
  });

  const [selectedPcId, setSelectedPcId] = useState<string | null>(null);
  const [fileSystemJson, setFileSystemJson] = useState('[]');
  const [websiteContent, setWebsiteContent] = useState('');

  const selectedPc = scenario.pcs.find(p => p.id === selectedPcId) || null;

  const handleAddPc = () => {
    const id = `pc-${Date.now()}`;
    const newPc: PC = {
      ...EMPTY_PC,
      id: id,
      name: `Nouveau-PC-${scenario.pcs.length + 1}`,
      ip: `192.168.100.${100 + scenario.pcs.length}`,
    };
    setScenario(prev => ({ ...prev, pcs: [...prev.pcs, newPc] }));
    setSelectedPcId(id);
    setFileSystemJson(JSON.stringify(newPc.fileSystem, null, 2));
    setWebsiteContent(newPc.websiteContent || '');
  };
  
  const handleSelectPc = (pc: PC) => {
    setSelectedPcId(pc.id);
    setFileSystemJson(JSON.stringify(pc.fileSystem, null, 2));
    setWebsiteContent(pc.websiteContent || '');
  };

  const handlePcChange = (field: keyof PC, value: any) => {
    if (!selectedPcId) return;
    setScenario(prev => ({
      ...prev,
      pcs: prev.pcs.map(pc => 
        pc.id === selectedPcId ? { ...pc, [field]: value } : pc
      ),
    }));
  };
  
  const handleNestedPcChange = (path: string, value: any) => {
     if (!selectedPcId) return;
     const [parent, child] = path.split('.');
     setScenario(prev => ({
       ...prev,
       pcs: prev.pcs.map(pc => {
         if (pc.id === selectedPcId) {
            const updatedPc = { ...pc };
            (updatedPc as any)[parent][child] = value;
            return updatedPc;
         }
         return pc;
       })
     }))
  }

  const handleSaveFileSystem = () => {
    if (!selectedPcId) return;
    try {
        const parsedFS: FileSystemNode[] = JSON.parse(fileSystemJson);
        handlePcChange('fileSystem', parsedFS);
        alert('Système de fichiers sauvegardé !');
    } catch (e) {
        alert('Erreur: Le JSON du système de fichiers est invalide.');
    }
  };
  
  const handleSaveWebsiteContent = () => {
      if (!selectedPcId) return;
      handlePcChange('websiteContent', websiteContent);
      alert('Contenu du site web sauvegardé !');
  };


  return (
    <div className="h-screen w-screen bg-background text-foreground font-code p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-accent">Éditeur de Scénario</h1>
        <Button>Charger / Sauvegarder Scénario</Button>
      </div>
      <Tabs defaultValue="scenario" className="flex-grow flex flex-col">
        <TabsList>
          <TabsTrigger value="scenario">Scénario</TabsTrigger>
          <TabsTrigger value="pcs">Ordinateurs (PCs)</TabsTrigger>
          <TabsTrigger value="emails" disabled>E-mails</TabsTrigger>
          <TabsTrigger value="dialogues" disabled>Dialogues</TabsTrigger>
          <TabsTrigger value="triggers" disabled>Déclencheurs</TabsTrigger>
          <TabsTrigger value="export">Exporter</TabsTrigger>
        </TabsList>

        <TabsContent value="scenario" className="flex-grow">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Nom du Scénario</Label>
                <Input id="scenario-name" value={scenario.name} onChange={e => setScenario(s => ({...s, name: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="scenario-desc">Description</Label>
                <Textarea id="scenario-desc" value={scenario.description} onChange={e => setScenario(s => ({...s, description: e.target.value}))}/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pcs" className="flex-grow flex gap-4 overflow-hidden">
          <Card className="w-1/3 flex flex-col">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Liste des PCs</CardTitle>
              <Button size="sm" onClick={handleAddPc}>Ajouter</Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="flex flex-col gap-2">
                {scenario.pcs.map(pc => (
                  <Button key={pc.id} variant={selectedPcId === pc.id ? 'secondary' : 'ghost'} onClick={() => handleSelectPc(pc)}>
                    {pc.name} ({pc.ip})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="w-2/3 flex flex-col">
            <CardHeader>
              <CardTitle>{selectedPc ? `Édition de: ${selectedPc.name}` : 'Sélectionnez un PC'}</CardTitle>
              <CardDescription>Configurez les propriétés de l'ordinateur.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-4">
              {selectedPc ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom</Label>
                      <Input value={selectedPc.name} onChange={e => handlePcChange('name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Adresse IP</Label>
                      <Input value={selectedPc.ip} onChange={e => handlePcChange('ip', e.target.value)} />
                    </div>
                     <div>
                        <Label>Type de PC</Label>
                        <Select value={selectedPc.type} onValueChange={v => handlePcChange('type', v as PC_Type)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PC_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <Separator />
                  <CardTitle className="text-lg">Sécurité</CardTitle>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Utilisateur</Label>
                            <Input value={selectedPc.auth.user} onChange={e => handleNestedPcChange('auth.user', e.target.value)} />
                        </div>
                        <div>
                            <Label>Mot de passe</Label>
                            <Input value={selectedPc.auth.pass} onChange={e => handleNestedPcChange('auth.pass', e.target.value)} />
                        </div>
                   </div>
                   <div className="flex items-center space-x-2">
                        <Switch id="fw-enabled" checked={selectedPc.firewall.enabled} onCheckedChange={c => handleNestedPcChange('firewall.enabled', c)}/>
                        <Label htmlFor="fw-enabled">Pare-feu activé</Label>
                   </div>
                    {selectedPc.firewall.enabled && (
                        <div className="pl-6 space-y-2">
                             <Label>Solution du pare-feu</Label>
                             <Input value={selectedPc.firewall.solution} onChange={e => handleNestedPcChange('firewall.solution', e.target.value)} />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <Switch id="proxy-enabled" checked={selectedPc.proxy.enabled} onCheckedChange={c => handleNestedPcChange('proxy.enabled', c)}/>
                        <Label htmlFor="proxy-enabled">Proxy activé</Label>
                   </div>
                    {selectedPc.proxy.enabled && (
                        <div className="pl-6 space-y-2">
                             <Label>Niveau du proxy (noeuds requis)</Label>
                             <Input type="number" value={selectedPc.proxy.level} onChange={e => handleNestedPcChange('proxy.level', parseInt(e.target.value) || 0)} />
                        </div>
                    )}
                    <Separator />
                    <CardTitle className="text-lg">Traçage & Danger</CardTitle>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Temps de traçage (s)</Label>
                            <Input type="number" value={selectedPc.traceTime} onChange={e => handlePcChange('traceTime', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                            <Label>Dangerosité (%)</Label>
                            <Input type="number" value={selectedPc.traceability} onChange={e => handlePcChange('traceability', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                            <Label>Ports requis (Porthack)</Label>
                            <Input type="number" value={selectedPc.requiredPorts} onChange={e => handlePcChange('requiredPorts', parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="is-dangerous" checked={selectedPc.isDangerous} onCheckedChange={c => handlePcChange('isDangerous', c)}/>
                        <Label htmlFor="is-dangerous">Marquer comme DANGEREUX (double pénalité)</Label>
                   </div>
                     <Separator />
                     {selectedPc.type === 'WebServer' && (
                        <>
                            <CardTitle className="text-lg">Serveur Web</CardTitle>
                             <div className='space-y-2'>
                                <Label>Domaine (ex: site.com)</Label>
                                <Input value={selectedPc.domain} onChange={e => handlePcChange('domain', e.target.value)} />
                             </div>
                             <div className='space-y-2'>
                                <Label>Contenu du site (HTML)</Label>
                                <Textarea 
                                    placeholder='Collez votre code HTML ici...'
                                    className="h-40"
                                    value={websiteContent}
                                    onChange={e => setWebsiteContent(e.target.value)}
                                />
                                <Button onClick={handleSaveWebsiteContent} size="sm">Sauvegarder le contenu du site</Button>
                             </div>
                            <Separator />
                        </>
                     )}
                    <CardTitle className="text-lg">Système de Fichiers (JSON)</CardTitle>
                     <Textarea 
                        placeholder='Collez un tableau JSON de FileSystemNode ici...'
                        className="h-64"
                        value={fileSystemJson}
                        onChange={e => setFileSystemJson(e.target.value)}
                    />
                    <Button onClick={handleSaveFileSystem} size="sm">Sauvegarder le système de fichiers</Button>
                </>
              ) : (
                <p className="text-muted-foreground text-center pt-10">Veuillez sélectionner un PC dans la liste ou en ajouter un nouveau.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="flex-grow">
           <Card>
             <CardHeader>
               <CardTitle>Exporter le Scénario</CardTitle>
               <CardDescription>Copiez le contenu ci-dessous et collez-le dans les fichiers appropriés de votre jeu.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                {scenario.pcs.map(pc => (
                    <div key={pc.id}>
                        <Label>Fichier: src/lib/network/pcs/{pc.name.toLowerCase().replace(/ /g, '-')}.json</Label>
                        <Textarea readOnly className="h-48 mt-1" value={JSON.stringify(pc, null, 2)} />
                    </div>
                ))}
                {scenario.pcs.length === 0 && <p className="text-muted-foreground">Aucun PC à exporter.</p>}
             </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

    