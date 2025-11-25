import type { Email } from '@/components/apps/email-client';

export const chapter6IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Phase Finale',
  body: `Recrue,

Le temps de la discrétion est terminé. Ce que vous avez découvert sur les projets V3 et V4 prouve que Nexus, et surtout NÉO, est une menace incontrôlable. Une arme sans corps physique est une abomination. Leur logique est folle : "Kinito nous a échappé ? Créons une version pire et espérons qu'elle reste sage."

Nous passons à l'offensive. Nous vous donnons accès à l'intégralité de notre arsenal.

**Votre mission :**

1.  Connectez-vous à notre serveur de dépôt (18.117.228.214) et téléchargez **tous** les outils du répertoire \`/tools/\`. Vous en aurez besoin.
2.  Lancez un dernier assaut sur la porte dérobée que vous aviez activée : \`call 198.51.100.17 --notsecure\`.

Le système est verrouillé, mais nos analystes pensent que cet appel direct va provoquer un conflit dans les protocoles de sécurité de NÉO, créant une diversion suffisante pour l'étape suivante.

Attendez-vous à une forte résistance. C'est notre seule chance de la neutraliser.

- Blackwire`,
};
