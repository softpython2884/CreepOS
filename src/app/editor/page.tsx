
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PC, FileSystemNode, PC_Type, Port, PortType } from '@/lib/network/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Email, Attachment } from '@/components/apps/email-client';
import { CallScript, CallNode, CallChoice, CallMessage } from '@/lib/call-system/types';

type Scenario = {
  name: string;
  description: string;
  pcs: PC[];
  emails: Email[];
  dialogues: CallScript[];
};

const PC_TYPES: PC_Type[] = ['Server', 'Desktop', 'WebServer', 'Laptop', 'Mobile'];
const PORT_TYPES: PortType[] = ['HTTP', 'FTP', 'SSH', 'SMTP', 'UNKNOWN', 'SQL'];

const EMPTY_PC: Omit<PC, 'id' | 'name' | 'ip'> = {
  type: 'Server',
  links: [],
  auth: { user: 'admin', pass: 'password' },
  firewall: { enabled: false, complexity: 0, solution: '' },
  proxy: { enabled: false, level: 0 },
  traceTime: 0,
  requiredPorts: 1,
  ports: [
    { port: 80, service: 'HTTP', isOpen: false },
    { port: 21, service: 'FTP', isOpen: false },
    { port: 22, service: 'SSH', isOpen: false }
  ],
  fileSystem: [],
  traceability: 10,
  isDangerous: false,
  isDestroyed: false,
};

const EMPTY_EMAIL: Omit<Email, 'id'> = {
    sender: 'expediteur@domaine.com',
    recipient: 'Dr.Omen@recherche-lab.net',
    subject: 'Nouveau Sujet',
    body: 'Contenu du message...',
    timestamp: new Date().toISOString(),
    folder: 'inbox',
    attachments: [],
};

const EMPTY_DIALOGUE: Omit<CallScript, 'id'> = {
    interlocutor: 'Inconnu',
    isSecure: false,
    startNode: 'start',
    nodes: {
        'start': {
            id: 'start',
            message: { speaker: 'Inconnu', text: '...' },
            choices: [{ id: 'choice-1', text: 'Continuer...', nextNode: 'start' }]
        }
    }
};


export default function EditorPage() {
  const [scenario, setScenario] = useState<Scenario>({
    name: 'Nouveau Scénario',
    description: 'Une nouvelle aventure dans NEO-SYSTEM.',
    pcs: [],
    emails: [],
    dialogues: [],
  });

  const [selectedPcId, setSelectedPcId] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>(null);
  
  const [fileSystemJson, setFileSystemJson] = useState('[]');
  const [websiteContent, setWebsiteContent] = useState('');
  
  const [newPort, setNewPort] = useState<{ port: number, service: PortType }>({ port: 0, service: 'HTTP' });
  const [newAttachment, setNewAttachment] = useState<Attachment>({ fileName: '', link: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedPc = scenario.pcs.find(p => p.id === selectedPcId) || null;
  const selectedEmail = scenario.emails.find(e => e.id === selectedEmailId) || null;
  const selectedDialogue = scenario.dialogues.find(d => d.id === selectedDialogueId) || null;

  const selectItem = (type: 'pc' | 'email' | 'dialogue', id: string) => {
    if (type === 'pc') {
      const pc = scenario.pcs.find(p => p.id === id);
      if (pc) {
        setSelectedPcId(id);
        setFileSystemJson(JSON.stringify(pc.fileSystem, null, 2));
        setWebsiteContent(pc.websiteContent || '');
      }
    } else {
      setSelectedPcId(null);
    }

    if (type === 'email') {
      setSelectedEmailId(id);
    } else {
      setSelectedEmailId(null);
    }
    
    if (type === 'dialogue') {
      setSelectedDialogueId(id);
    } else {
      setSelectedDialogueId(null);
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
        const scrollAmount = 400;
        scrollRef.current.scrollBy({
            top: direction === 'up' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  // --- PC Management ---
  const handleAddPc = () => {
    const id = `pc-${Date.now()}`;
    const newPc: PC = {
      ...JSON.parse(JSON.stringify(EMPTY_PC)),
      id: id,
      name: `Nouveau-PC-${scenario.pcs.length + 1}`,
      ip: `192.168.100.${100 + scenario.pcs.length}`,
    };
    setScenario(prev => ({ ...prev, pcs: [...prev.pcs, newPc] }));
    selectItem('pc', newPc.id);
  };
  
  const handlePcChange = (field: keyof PC, value: any) => {
    if (!selectedPcId) return;
    setScenario(prev => ({
        ...prev,
        pcs: prev.pcs.map(pc => pc.id === selectedPcId ? { ...pc, [field]: value } : pc)
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
  
  const handleLinkToggle = (targetId: string, isLinked: boolean) => {
      if (!selectedPc) return;
      const currentLinks = selectedPc.links || [];
      const newLinks = isLinked 
        ? [...currentLinks, targetId] 
        : currentLinks.filter(id => id !== targetId);
      handlePcChange('links', newLinks);
  }
  
  const handleAddPort = () => {
      if (!selectedPc || !newPort.port) return;
      const newPortToAdd: Port = { ...newPort, isOpen: false };
      const currentPorts = selectedPc.ports || [];
      if (currentPorts.some(p => p.port === newPortToAdd.port)) {
          alert("Erreur: Ce port existe déjà.");
          return;
      }
      handlePcChange('ports', [...currentPorts, newPortToAdd]);
      setNewPort({ port: 0, service: 'HTTP' });
  }
  
  const handleRemovePort = (portNumber: number) => {
      if (!selectedPc) return;
      const newPorts = selectedPc.ports.filter(p => p.port !== portNumber);
      handlePcChange('ports', newPorts);
  }

  // --- Email Management ---
    const handleAddEmail = () => {
        const id = `email-${Date.now()}`;
        const newEmail: Email = {
        ...JSON.parse(JSON.stringify(EMPTY_EMAIL)),
        id: id,
        subject: `Nouveau Sujet ${scenario.emails.length + 1}`
        };
        setScenario(prev => ({ ...prev, emails: [...prev.emails, newEmail] }));
        selectItem('email', newEmail.id);
    };

    const handleEmailChange = (field: keyof Email, value: any) => {
        if (!selectedEmailId) return;
        setScenario(prev => ({
            ...prev,
            emails: prev.emails.map(email => email.id === selectedEmailId ? { ...email, [field]: value } : email)
        }));
    };

    const handleAddAttachment = () => {
        if (!selectedEmail || !newAttachment.fileName || !newAttachment.link) return;
        const newAttachments = [...(selectedEmail.attachments || []), newAttachment];
        handleEmailChange('attachments', newAttachments);
        setNewAttachment({ fileName: '', link: '' });
    };

    const handleRemoveAttachment = (index: number) => {
        if (!selectedEmail) return;
        const newAttachments = selectedEmail.attachments?.filter((_, i) => i !== index);
        handleEmailChange('attachments', newAttachments || []);
    };
    
  // --- Dialogue Management ---
  const handleAddDialogue = () => {
    const id = `dialogue-${Date.now()}`;
    const newDialogue: CallScript = {
      ...JSON.parse(JSON.stringify(EMPTY_DIALOGUE)),
      id: id,
    };
    setScenario(prev => ({ ...prev, dialogues: [...prev.dialogues, newDialogue] }));
    selectItem('dialogue', newDialogue.id);
  };

  const handleDialogueChange = (field: keyof CallScript, value: any) => {
    if (!selectedDialogueId) return;
    setScenario(prev => ({
      ...prev,
      dialogues: prev.dialogues.map(d => d.id === selectedDialogueId ? { ...d, [field]: value } : d)
    }));
  };
  
  const handleDialogueNodeChange = (nodeId: string, field: keyof CallNode, value: any) => {
      if (!selectedDialogue) return;
      const newNodes = { ...selectedDialogue.nodes };
      newNodes[nodeId] = { ...newNodes[nodeId], [field]: value };
      handleDialogueChange('nodes', newNodes);
  }
  
  const handleNodeMessageChange = (nodeId: string, field: keyof CallMessage, value: string) => {
      if (!selectedDialogue) return;
      const newNodes = { ...selectedDialogue.nodes };
      const message = newNodes[nodeId].message;
      newNodes[nodeId].message = { ...message, [field]: value };
      handleDialogueChange('nodes', newNodes);
  }

  const handleNodeChoiceChange = (nodeId: string, choiceIndex: number, field: keyof CallChoice, value: string) => {
      if (!selectedDialogue) return;
      const newNodes = { ...selectedDialogue.nodes };
      const choices = newNodes[nodeId].choices || [];
      choices[choiceIndex] = { ...choices[choiceIndex], [field]: value };
      newNodes[nodeId].choices = choices;
      handleDialogueChange('nodes', newNodes);
  };
  
  const handleAddNode = () => {
      if (!selectedDialogue) return;
      const nodeId = `node-${Date.now()}`;
      const newNode: CallNode = {
          id: nodeId,
          message: { speaker: selectedDialogue.interlocutor, text: ''},
          choices: []
      };
      const newNodes = { ...selectedDialogue.nodes, [nodeId]: newNode };
      handleDialogueChange('nodes', newNodes);
  };
  
  const handleAddChoice = (nodeId: string) => {
      if (!selectedDialogue) return;
      const newChoice: CallChoice = { id: `choice-${Date.now()}`, text: '', nextNode: '' };
      const newNodes = { ...selectedDialogue.nodes };
      const choices = newNodes[nodeId].choices || [];
      newNodes[nodeId].choices = [...choices, newChoice];
      handleDialogueChange('nodes', newNodes);
  }

  const handleRemoveChoice = (nodeId: string, choiceIndex: number) => {
      if (!selectedDialogue) return;
      const newNodes = { ...selectedDialogue.nodes };
      const choices = newNodes[nodeId].choices || [];
      newNodes[nodeId].choices = choices.filter((_, i) => i !== choiceIndex);
      handleDialogueChange('nodes', newNodes);
  }


  // --- Scenario Load/Save ---
  const handleSaveScenario = () => {
    const dataStr = JSON.stringify(scenario, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataUri);
    downloadAnchorNode.setAttribute("download", "scenario.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const handleLoadScenario = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const loadedScenario = JSON.parse(content);
            if (loadedScenario.name && loadedScenario.description && Array.isArray(loadedScenario.pcs)) {
                setScenario({emails: [], dialogues: [], ...loadedScenario});
                setSelectedPcId(null);
                setSelectedEmailId(null);
                setSelectedDialogueId(null);
                alert('Scénario chargé avec succès !');
            } else {
                throw new Error("Invalid scenario file structure.");
            }
        } catch (error) {
            alert('Erreur: Le fichier de scénario est invalide ou corrompu.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  }


  return (
    <div className="h-screen w-screen bg-background text-foreground font-code p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-accent">Éditeur de Scénario</h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Charger Scénario</Button>
            <Button onClick={handleSaveScenario}>Sauvegarder Scénario</Button>
            <input type="file" ref={fileInputRef} onChange={handleLoadScenario} accept=".json" className="hidden" />
        </div>
      </div>
      <Tabs defaultValue="scenario" className="flex-grow flex flex-col">
        <TabsList>
          <TabsTrigger value="scenario">Scénario</TabsTrigger>
          <TabsTrigger value="pcs">Ordinateurs</TabsTrigger>
          <TabsTrigger value="emails">E-mails</TabsTrigger>
          <TabsTrigger value="dialogues">Dialogues</TabsTrigger>
          <TabsTrigger value="commands" disabled>Commandes</TabsTrigger>
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
                <CardContent className="flex-grow overflow-y-auto">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-2">
                        {scenario.pcs.map(pc => (
                            <Button key={pc.id} variant={selectedPcId === pc.id ? 'secondary' : 'ghost'} onClick={() => selectItem('pc', pc.id)}>
                            {pc.name} ({pc.ip})
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <Card className="w-2/3 flex flex-col">
                <CardHeader>
                <CardTitle>{selectedPc ? `Édition de: ${selectedPc.name}` : 'Sélectionnez un PC'}</CardTitle>
                <CardDescription>Configurez les propriétés de l'ordinateur.</CardDescription>
                </CardHeader>
                <CardContent ref={scrollRef} className="flex-grow overflow-y-auto pr-4 space-y-4">
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
                        
                        <CardTitle className="text-lg">Réseau & Ports</CardTitle>
                        <div>
                            <Label>PCs Liés</Label>
                            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                                {scenario.pcs.filter(p => p.id !== selectedPcId).map(p => (
                                    <div key={`link-${p.id}`} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`link-${p.id}`}
                                            checked={(selectedPc.links || []).includes(p.id)}
                                            onCheckedChange={c => handleLinkToggle(p.id, !!c)}
                                        />
                                        <Label htmlFor={`link-${p.id}`}>{p.name} ({p.ip})</Label>
                                    </div>
                                ))}
                                {scenario.pcs.length <= 1 && <p className="text-muted-foreground text-sm">Créez d'autres PCs pour pouvoir les lier.</p>}
                            </div>
                        </div>
                        <div>
                            <Label>Ports Réseau</Label>
                            <div className="space-y-2 mt-2">
                                {selectedPc.ports.map(p => (
                                    <div key={p.port} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                        <p className="text-sm">{p.port} - {p.service}</p>
                                        <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => handleRemovePort(p.port)}>
                                            <X size={14}/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Input type="number" placeholder="Numéro de port" value={newPort.port || ''} onChange={e => setNewPort(p => ({ ...p, port: parseInt(e.target.value) }))} />
                                <Select value={newPort.service} onValueChange={v => setNewPort(p => ({...p, service: v as PortType}))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PORT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddPort}>Ajouter Port</Button>
                            </div>
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

        <TabsContent value="emails" className="flex-grow flex gap-4 overflow-hidden">
            <Card className="w-1/3 flex flex-col">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Liste des E-mails</CardTitle>
                    <Button size="sm" onClick={handleAddEmail}>Ajouter</Button>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-2">
                        {scenario.emails.map(email => (
                            <Button key={email.id} variant={selectedEmailId === email.id ? 'secondary' : 'ghost'} onClick={() => selectItem('email', email.id)}>
                                {email.subject}
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <Card className="w-2/3 flex flex-col">
                <CardHeader>
                    <CardTitle>{selectedEmail ? `Édition de: ${selectedEmail.subject}` : 'Sélectionnez un E-mail'}</CardTitle>
                    <CardDescription>Configurez le contenu de l'e-mail.</CardDescription>
                </CardHeader>
                <CardContent ref={scrollRef} className="flex-grow overflow-y-auto pr-4 space-y-4">
                    {selectedEmail ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>ID de l'E-mail</Label><Input value={selectedEmail.id} onChange={e => handleEmailChange('id', e.target.value)} /></div>
                                <div><Label>Expéditeur</Label><Input value={selectedEmail.sender} onChange={e => handleEmailChange('sender', e.target.value)} /></div>
                                <div><Label>Destinataire</Label><Input value={selectedEmail.recipient} onChange={e => handleEmailChange('recipient', e.target.value)} /></div>
                                <div><Label>Sujet</Label><Input value={selectedEmail.subject} onChange={e => handleEmailChange('subject', e.target.value)} /></div>
                            </div>
                            <div>
                                <Label>Corps du message</Label>
                                <Textarea className="h-48" value={selectedEmail.body} onChange={e => handleEmailChange('body', e.target.value)} />
                            </div>
                            <Separator />
                            <CardTitle className="text-lg">Pièces Jointes</CardTitle>
                            <div className="space-y-2">
                                {(selectedEmail.attachments || []).map((att, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                        <p className="text-sm">{att.fileName} ({att.link})</p>
                                        <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => handleRemoveAttachment(index)}>
                                            <X size={14}/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input placeholder="Nom du fichier" value={newAttachment.fileName} onChange={e => setNewAttachment(a => ({...a, fileName: e.target.value}))} />
                                <Input placeholder="Lien (app:// ou download://)" value={newAttachment.link} onChange={e => setNewAttachment(a => ({...a, link: e.target.value}))} />
                                <Button onClick={handleAddAttachment}>Ajouter P.J.</Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-center pt-10">Veuillez sélectionner un e-mail dans la liste ou en ajouter un nouveau.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="dialogues" className="flex-grow flex gap-4 overflow-hidden">
           <Card className="w-1/3 flex flex-col">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Liste des Dialogues</CardTitle>
                    <Button size="sm" onClick={handleAddDialogue}>Ajouter</Button>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-2">
                        {scenario.dialogues.map(d => (
                            <Button key={d.id} variant={selectedDialogueId === d.id ? 'secondary' : 'ghost'} onClick={() => selectItem('dialogue', d.id)}>
                                {d.id}
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
             <Card className="w-2/3 flex flex-col">
                <CardHeader>
                    <CardTitle>{selectedDialogue ? `Édition de: ${selectedDialogue.id}` : 'Sélectionnez un Dialogue'}</CardTitle>
                </CardHeader>
                <CardContent ref={scrollRef} className="flex-grow overflow-y-auto pr-4 space-y-4">
                    {selectedDialogue ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>ID du Dialogue</Label><Input value={selectedDialogue.id} onChange={e => handleDialogueChange('id', e.target.value)} /></div>
                                <div><Label>Interlocuteur</Label><Input value={selectedDialogue.interlocutor} onChange={e => handleDialogueChange('interlocutor', e.target.value)} /></div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="is-secure" checked={selectedDialogue.isSecure} onCheckedChange={c => handleDialogueChange('isSecure', c)}/>
                                <Label htmlFor="is-secure">Appel sécurisé</Label>
                            </div>
                            <Separator/>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Nœuds de Dialogue</CardTitle>
                                <Button size="sm" variant="outline" onClick={handleAddNode}><Plus size={16}/> Ajouter un Nœud</Button>
                            </div>
                            <div className="space-y-4">
                                {Object.values(selectedDialogue.nodes).map((node, nodeIndex) => (
                                    <Card key={node.id} className="bg-secondary/50">
                                        <CardHeader className="p-4">
                                            <div className="flex justify-between">
                                                <Label>ID du Nœud</Label>
                                                <Input className="w-1/2 h-8" value={node.id} onChange={e => handleDialogueNodeChange(node.id, 'id', e.target.value)}/>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 space-y-2">
                                            <Label>Message</Label>
                                            <div className="flex gap-2">
                                                <Input placeholder="Locuteur" className="w-1/3" value={node.message.speaker} onChange={e => handleNodeMessageChange(node.id, 'speaker', e.target.value)} />
                                                <Textarea placeholder="Texte du message..." value={node.message.text} onChange={e => handleNodeMessageChange(node.id, 'text', e.target.value)} />
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <Label>Choix du joueur</Label>
                                                <Button size="xs" variant="outline" onClick={() => handleAddChoice(node.id)}><Plus size={14}/> Ajouter</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {(node.choices || []).map((choice, choiceIndex) => (
                                                    <div key={choice.id} className="flex gap-2 items-center p-2 bg-background/50 rounded">
                                                        <Input placeholder="Texte du choix" value={choice.text} onChange={e => handleNodeChoiceChange(node.id, choiceIndex, 'text', e.target.value)} />
                                                        <Select value={choice.nextNode} onValueChange={v => handleNodeChoiceChange(node.id, choiceIndex, 'nextNode', v)}>
                                                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Nœud suivant..."/></SelectTrigger>
                                                            <SelectContent>
                                                                {Object.keys(selectedDialogue.nodes).map(nodeId => <SelectItem key={nodeId} value={nodeId}>{nodeId}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                         <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleRemoveChoice(node.id, choiceIndex)}><X size={14}/></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-center pt-10">Veuillez sélectionner un dialogue dans la liste ou en ajouter un nouveau.</p>
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
                        <Label>Fichier: src/lib/story/pcs/{pc.name.toLowerCase().replace(/ /g, '-')}.json</Label>
                        <Textarea readOnly className="h-48 mt-1" value={JSON.stringify(pc, null, 2)} />
                    </div>
                ))}
                {scenario.emails.map(email => (
                    <div key={email.id}>
                        <Label>Fichier: src/lib/story/emails/{email.id}.ts</Label>
                        <Textarea readOnly className="h-48 mt-1" value={`import type { Email } from '@/components/apps/email-client';\n\nexport const ${email.id.replace(/-/g, '_')} = ${JSON.stringify(email, null, 2)};`} />
                    </div>
                ))}
                {(scenario.pcs.length === 0 && scenario.emails.length === 0) && <p className="text-muted-foreground">Aucun élément à exporter.</p>}
             </CardContent>
           </Card>
        </TabsContent>

      </Tabs>

        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
            <Button size="icon" variant="outline" onClick={() => handleScroll('up')}>
                <ArrowUp />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleScroll('down')}>
                <ArrowDown />
            </Button>
        </div>
    </div>
  );
}
