import type { Email } from '@/components/apps/email-client';

export const blackwireChapter4IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Changement de plan & nouvelle cible',
  body: `Recrue,

L'opération a été un échec partiel. Votre activation de la porte dérobée a déclenché une alerte sur tout le réseau Nexus. La machine cible (198.51.100.17) est maintenant verrouillée. Inutile de réessayer.

Mais tout n'est pas perdu. Cette diversion nous a permis de cartographier une partie de leur infrastructure. Nous avons une nouvelle piste.

**Votre mission :**
Infiltrer la station de travail de votre propre superviseur. Son IP est **104.22.8.15**.
Ses défenses sont plus solides. Vous aurez besoin de nouveaux outils. Nous vous avons laissé un paquet sur le serveur de dépôt (18.117.228.214, dans /bin). Récupérez **analyze.bin**, **solve.bin**, et **SSHBounce.bin**.

- \`analyze\` vous permettra de scanner un pare-feu pour trouver sa "solution".
- \`solve <solution>\` désactivera le pare-feu si la solution est correcte.
- \`SSHBounce\` est un exploit pour le port 22 (SSH).

Cherchez des communications, des journaux, n'importe quoi qui pourrait nous éclairer sur le projet "Kinito" ou le sort de nos agents.

Soyez prudent. Vous êtes maintenant sur leurs radars.

- Blackwire`,
};
