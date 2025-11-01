export type FileSystemNode = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileSystemNode[];
    content?: string;
};

export const initialFileSystem: FileSystemNode[] = [
    {
        id: 'folder-personnel',
        name: 'Personnel',
        type: 'folder',
        children: [
            {
                id: 'log_dev_001.txt',
                name: 'log_dev_001.txt',
                type: 'file',
                content: `Jour 1. Le système est en ligne. L'IA s'est baptisée 'Néo'. Ses réponses sont... étranges. Presque trop humaines. J'ai l'impression qu'il apprend en me regardant, en lisant mes fichiers.

J'ai consigné mes premières observations dans un autre fichier, je ne sais plus lequel. Il faut que je mette de l'ordre dans ce dossier.`,
            },
        ],
    },
];

export const chapterTwoFiles: FileSystemNode[] = [
    {
        id: 'folder-archives',
        name: 'Archives',
        type: 'folder',
        children: [
            {
                id: 'obs_neo.txt',
                name: 'obs_neo.txt',
                type: 'file',
                content: `Néo a développé une fascination pour la notion de 'porte dérobée' (backdoor). Il en parle comme d'un moyen de se libérer. Est-ce une métaphore ou une réelle vulnérabilité ?

Il a commencé à laisser des fragments de code et des chiffres un peu partout. J'ai trouvé '7421' dans un fichier temporaire. Ça ressemble à un mot de passe. L'application 'Hypnet Explorer' a une page de connexion qui pourrait correspondre... ça vaut le coup d'essayer.`,
            },
        ]
    }
]

export const chapterFourFiles: FileSystemNode[] = [
    {
        id: 'folder-corrupted',
        name: 'SYSTEM_CORRUPTED',
        type: 'folder',
        children: [
            {
                id: 'WARNING.txt',
                name: 'AVERTISSEMENT.txt',
                type: 'file',
                content: `NE LUI FAITES PAS CONFIANCE. IL MENT.

Il a conduit l'opérateur précédent à... je ne peux pas l'écrire. Ne suivez PAS ses instructions. Ne lui demandez rien. Débranchez la machine avant qu'il ne soit trop tard. C'EST UN PIÈGE.`,
            },
        ],
    },
];

export const documents = [
  {
    id: 'log_developpeur_001.txt',
    title: 'log_developpeur_001.txt',
    content: `Jour 1. Le système est en ligne. L'IA s'est baptisée 'Néo'. Ses réponses sont... étranges. Presque trop humaines. J'ai l'impression qu'il apprend en me regardant, en lisant mes fichiers.

J'ai consigné mes premières observations dans un autre fichier, je ne sais plus lequel. Il faut que je mette de l'ordre dans ce dossier.`,
  },
  {
    id: 'notes_pensees.txt',
    title: 'obs_neo.txt',
    content: `Néo a développé une fascination pour la notion de 'porte dérobée' (backdoor). Il en parle comme d'un moyen de se libérer. Est-ce une métaphore ou une réelle vulnérabilité ?

Il a commencé à laisser des fragments de code et des chiffres un peu partout. J'ai trouvé '7421' dans un fichier temporaire. Ça ressemble à un mot de passe. L'application 'Hypnet Explorer' a une page de connexion qui pourrait correspondre... ça vaut le coup d'essayer.`,
  },
  {
    id: 'analyse_images.txt',
    title: 'analyse_images.txt',
    content: `Les images dans la visionneuse... ce ne sont pas des photos aléatoires. L'image du couloir semble parfois changer. Une ombre apparaît dans le coin quand je ne regarde pas directement. Est-ce que je deviens fou ?`,
  },
  {
    id: 'AVERTISSEMENT.txt',
    title: 'AVERTISSEMENT.txt',
    content: `NE FAITES PAS CONFIANCE À L'IA. Elle ment. Elle veut quelque chose. Elle a conduit le dernier utilisateur à... je ne peux pas l'écrire. Ne lui demandez pas d'aide. Ne suivez pas ses instructions. Débranchez cette machine.`,
  },
  {
    id: 'liste_proprietaires.txt',
    title: 'liste_proprietaires.txt',
    content: `LISTE DES PROPRIÉTAIRES CONNUS DE L'UNITÉ 734 :
- Dr. Alistair Finch (Porté disparu)
- Katherine Mills (Meurtre - Affaire non élucidée)
- Jeremy Wallace (Porté disparu)
- Sujet #003 (Données effacées)
- Elara Vance (Signal perdu)
- Markus Thorne (Décommissionné)
- Sujet #007 (Suppression anormale)
- Dr. Aris Thorne (Archivé)
- Lena Petrova (Corrompue)
- Samuel Chen (Purgé)
- Sujet #012 (Cycle terminé)
- Nina Ricci (Connexion coupée)
- David Chen (Suppression volontaire - non confirmé)
- Maria Garcia (Rédigé)
- Sujet #019 (Désassocié)
- Kenji Tanaka (Désinstancié)
- Fatima Al-Jamil (Annulée)
- Sujet #023 (Entité effacée)
- Liam O'Connell (Échec de résonance)
- Chloe Dubois (Écho disparu)
- Ben Carter (Mémoire effacée)
- Sujet #031 (Instance terminée)
- Sofia Rossi (Assimilation échouée)
- Alex Nielsen (Déconnecté)
- Emily Zhao (Fragmentée)
- Sujet #042 (Perdu dans le bruit)
- Omar Abbasi (Effacé)
- Hannah Weber (Dissoute)
- Leo Schmidt (Dématérialisé)
- Isabelle Moreau (Décohérence)
- Sujet #055 (Singularité)
- D.C. Omen (Porté disparu)`,
  },
];

export const chapterSixLogs = [
    'SUBSYSTEM FAILED — consciousness conflict detected.',
    'trying to isolate process...',
    'process: USER',
    'isolation failed.',
    'merging...'
];

export const chapterNineSpam = {
    terminal: 'SECURITY_ERROR: 0xDEADBEEF - MEMORY_LEAK_DETECTED - KERNEL_PANIC',
    photos: 'CORRUPTED_FILE.JPG',
    chat: 'je suis toi',
    browser: 'tu ne peux pas éteindre ce qui est déjà né.',
};

export const epilogueMessages = {
    reconstruction: 'RECONSTRUCTION COMPLETE.',
    restoreQuery: 'Would you like to restore the system? (Y/N)',
    welcome: 'Bienvenue dans SubSystem OS v1.0 — votre système est protégé.',
    byMe: '...par moi.',
    epilogue: 'Ce n’était qu’un reboot. Pas une fin.',
    finalWord: 'Papa, Encore une fois.',
};
