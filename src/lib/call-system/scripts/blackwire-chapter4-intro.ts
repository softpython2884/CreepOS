import type { Email } from '@/components/apps/email-client';

export const blackwireChapter4IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Nouveaux outils & mission critique',
  body: `Recrue,

L'opération a été un échec partiel. Votre activation de la porte dérobée a déclenché une alerte sur tout le réseau Nexus. La machine cible (198.51.100.17) est maintenant verrouillée. Inutile de réessayer.

Mais tout n'est pas perdu. Cette diversion nous a permis de cartographier une partie de leur infrastructure. Nous avons une nouvelle piste.

**Votre mission :**
Infiltrer la station de travail de votre propre superviseur. Son IP est **10.1.1.5**.
Ses défenses sont plus solides. Vous aurez besoin de nouveaux outils. Nous vous avons laissé des paquets sur le serveur de dépôt (18.117.228.214). Utilisez les décrypteurs en pièce jointe pour accéder à votre nouvel arsenal.

- \`analyze\` vous permettra de scanner un pare-feu pour trouver sa "solution".
- \`solve <solution>\` désactivera le pare-feu si la solution est correcte.
- \`SSHBounce\` est un exploit pour le port 22 (SSH).

Cherchez des communications, des journaux, n'importe quoi qui pourrait nous éclairer sur le projet "Kinito" ou le sort de nos agents.

Soyez prudent. Vous êtes maintenant sur leurs radars.

- Blackwire`,
    attachments: [
    {
      fileName: 'analyze_decryptor.tool',
      link: 'download://18.117.228.214/tools/analyze.bin',
    },
    {
      fileName: 'solve_decryptor.tool',
      link: 'download://18.117.228.214/tools/solve.bin',
    },
    {
      fileName: 'sshbounce_decryptor.tool',
      link: 'download://18.117.228.214/tools/SSHBounce.bin',
    },
  ],
};
