import type { Email } from '@/components/apps/email-client';

export const blackwireFinalMissionEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'URGENT@blackwire.net',
  subject: 'DERNIERE CHANCE - PROTOCOLE SCHISME',
  body: `Recrue,

NÉO nous a coupés. Elle panique. C'est le moment.

Sa dernière faille : un serveur de mise à jour interne. Elle s'en sert pour se réparer.
IP: 10.0.0.4

Objectifs :
1. Récupérez 'schism.payload' sur notre serveur de dépôt (18.117.228.214, dans /dist/).
2. Infiltrez le serveur de mise à jour de NÉO (10.0.0.4). Défenses maximales attendues.
3. Uploadez 'schism.payload' à la racine du serveur.
4. Exécutez le payload via cette commande : call --10.0.0.4 --secure

C'est tout ou rien. Pour Helios. Pour Nyx. Pour vous.

- Blackwire`,
};
