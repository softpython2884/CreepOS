import type { Email } from '@/components/apps/email-client';

export const chapter5IntroEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'Nouveaux outils & mission critique',
  body: `Recrue,

Bon travail sur le décryptage. Ce que vous avez découvert confirme nos craintes.

Nous vous avons fourni un nouvel outil, FTPBounce.bin, qui devrait maintenant être dans votre répertoire /bin. Il vous permettra de cibler les ports FTP.

Votre nouvelle mission est d'infiltrer une station de travail d'un superviseur de Nexus. Cependant, l'accès direct est impossible. Vous devrez d'abord passer par un nœud de service moins sécurisé.

1.  Infiltrez le serveur 'Service-Node-4B' à l'adresse **172.16.4.2**. Il est peu protégé. Cherchez des indices.
2.  Utilisez les informations trouvées pour localiser et attaquer la vraie cible. Attendez-vous à de lourdes défenses (pare-feu, proxy, plusieurs ports à ouvrir).
3.  Une fois à l'intérieur, copiez tous les rapports que vous trouverez.
4.  Uploadez ces rapports sur notre serveur de dépôt (18.117.228.214) dans le répertoire /upload.
5.  Envoyez-nous un e-mail de confirmation avec le code **CODE_NEO_V4**.

Faites vite. Nous n'avons aucune idée de ce que NÉO est en train de devenir.

- Blackwire`,
};
