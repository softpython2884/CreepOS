
import type { Email } from '@/components/apps/email-client';

export const blackwireChapter4IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Changement de plan & nouvelle cible',
  body: `Recrue,

L'opération a été un échec partiel. Votre activation de la porte dérobée a déclenché une alerte sur tout le réseau Nexus. La machine cible (198.51.100.17) est maintenant verrouillée. Inutile de réessayer.

Mais tout n'est pas perdu. Cette diversion nous a permis de cartographier une partie de leur infrastructure. Nous avons une nouvelle piste.

**Votre mission :**

1.  Utilisez les décrypteurs en pièce jointe pour accéder à votre nouvel arsenal sur notre serveur de dépôt (18.117.228.214). Récupérez et installez \`analyze.bin\`, \`solve.bin\`, et \`SSHBounce.bin\`.

2.  Infiltrez la station de travail de votre propre superviseur. Son IP est **193.70.55.201**. Ses défenses sont plus solides ; vous aurez besoin de ces nouveaux outils.

3.  Une fois à l'intérieur, copiez tous les rapports que vous trouverez.

4.  Uploadez ces rapports sur notre serveur de dépôt (18.117.228.214) dans le répertoire /upload.

5.  Envoyez-nous un e-mail de confirmation avec le code : **PROJET-SHEARNEO**.

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
