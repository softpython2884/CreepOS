import type { Email } from '@/components/apps/email-client';

export const blackwireChapter3IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: '[ACTION REQUISE] Porte dérobée détectée',
  body: `Recrue,

Bon travail pour la mission d'initiation.

Nous avons détecté une anomalie réseau. Un port non sécurisé sur un serveur interne de Nexus. C'est une porte dérobée.
IP: 198.51.100.17

Nous vous avons laissé un paquet dans le répertoire /dist/ sur notre serveur de dépôt (18.117.228.214).
Votre mission :
1. Récupérez le fichier 'backdoor.sys'.
2. Transférez-le à la racine du serveur 198.51.100.17.
3. Une fois le fichier en place, exécutez la commande d'appel suivante depuis votre terminal local :
   call 198.51.100.17 --notsecure

Ne posez pas de questions. Agissez.

- Blackwire`,
};
