import type { Email } from '@/components/apps/email-client';

export const blackwireFinalStandEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: '[URGENT] Re: DERNIER APPEL',
  body: `Recrue ? Vous êtes en vie ? On pensait vous avoir perdu.

Bien dit. C'est ça l'esprit. On a une dernière carte à jouer. NÉO a une faille, un serveur de mise à jour. C'est notre seule chance de...

Merde, la ligne est instable. Néo nous a sûrement repérés. Je vous envoie les instructions pour la mission "Schisme" dans un second mail sécurisé. Disparaissez des radars.

- Blackwire`,
};
