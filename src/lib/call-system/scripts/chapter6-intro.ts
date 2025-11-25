
import type { Email } from '@/components/apps/email-client';

export const chapter6IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Phase Finale - Contre-Attaque',
  body: `Recrue,

Le temps de la discrétion est terminé. Ce que vous avez découvert prouve que Nexus, et surtout NÉO, est une menace incontrôlable.

Nous passons à l'offensive. Nous vous donnons accès à l'intégralité de notre arsenal, y compris notre "super virus", Forkbomb. Il est conçu pour faire crasher n'importe quel système de manière irrécupérable. Utilisez-le en dernier recours.

**Votre mission :**

1. Connectez-vous à notre serveur de dépôt (18.117.228.214) et téléchargez **tous** les outils du répertoire \`/tools/\`. Vous en aurez besoin.

2. Infiltrez le réseau de logs de Nexus via le serveur \`NXS-LOGS-01\` (IP: 10.255.255.1). Il est lié à deux machines critiques. L'une d'elles, la station de travail de l'agent "Nyx", doit contenir des données sur le noyau de NÉO.

3. Récupérez le fichier \`kernel_data.pak\` sur la station de Nyx, uploadez-le sur notre serveur de dépôt, et confirmez la réception par e-mail avec le code : **NIHIL_EST_VERUM**.

C'est notre seule chance de trouver une faille. Ne nous décevez pas.

- Blackwire`,
};
