import type { Email } from '@/components/apps/email-client';

export const cousinMission1Email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'noreply@corp.net',
  subject: 'Mission #1 — Évaluation de compétences',
  body: `Votre contact nous a parlé de vous.
Nous avons une petite tâche… format initiation.

Récupérez un fichier sur une machine donnée et donnez-nous son contenu.
Discrétion obligatoire.

Le système est équipé de trace-time.
Appliquez les procédures apprises : effacement, crash, vitesse.`,
};
