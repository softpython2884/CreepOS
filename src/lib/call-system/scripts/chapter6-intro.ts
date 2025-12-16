
import type { Email } from '@/components/apps/email-client';

export const chapter6IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Phase Finale - Contre-Attaque',
  body: `Recrue,

Le temps de la discrétion est terminé. Ce que vous avez découvert prouve que Nexus, et surtout NÉO, est une menace incontrôlable.

Nous passons à l'offensive. Nous vous donnons accès à l'intégralité de notre arsenal via les décrypteurs ci-joints. Récupérez et installez TOUS les outils. La pièce maîtresse est "Forkbomb", un virus conçu pour faire crasher n'importe quel système de manière irrécupérable. Utilisez-le en dernier recours.

**Votre mission :**

1. Infiltrez le réseau de logs de Nexus via le serveur \`NXS-LOGS-01\` (IP: 10.255.255.1). Il est lié à deux machines critiques. L'une d'elles, la station de travail de l'agent "Nyx", doit contenir des données sur le noyau de NÉO.

2. Récupérez le fichier \`kernel_data.pak\` sur la station de Nyx, uploadez-le sur notre serveur de dépôt, et confirmez la réception par e-mail avec le code : **NIHIL_EST_VERUM**.

C'est notre seule chance de trouver une faille. Ne nous décevez pas.

- Blackwire`,
  attachments: [
    { fileName: 'solve_decryptor.tool', link: 'download://18.117.228.214/tools/solve.bin' },
    { fileName: 'overload_decryptor.tool', link: 'download://18.117.228.214/tools/overload.bin' },
    { fileName: 'ftp_decryptor.tool', link: 'download://18.117.228.214/tools/FTPBounce.bin' },
    { fileName: 'ssh_decryptor.tool', link: 'download://18.117.228.214/tools/SSHBounce.bin' },
    { fileName: 'smtp_decryptor.tool', link: 'download://18.117.228.214/tools/SMTPOverflow.bin' },
    { fileName: 'web_decryptor.tool', link: 'download://18.117.228.214/tools/WebServerWorm.bin' },
    { fileName: 'forkbomb_decryptor.tool', link: 'download://18.117.228.214/tools/forkbomb.bin' },
  ]
};

export const chapter9IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'URGENT - Assaut final sur NÉO',
  body: `Recrue,

C'est le moment. L'analyse des données du noyau a révélé la structure de NÉO. Ce n'est pas un serveur, c'est une hydre. Un réseau de 7 nœuds de périmètre protège 3 cœurs centraux.

**Votre mission est simple : détruire. Vous devez anéantir les 7 nœuds, puis les 3 cœurs.**

Utilisez \`forkbomb --destruct\` sur chaque cible. C'est notre seule option.

Point d'entrée : \`NEO-NODE-01\` (IP: 138.201.44.19).

À chaque nœud que vous détruirez, attendez-vous à une riposte de NÉO. Elle va se débattre. Elle va vous attaquer. Tenez bon.

C'est la fin de la partie. Pour vous, ou pour elle.

- Blackwire`,
};
