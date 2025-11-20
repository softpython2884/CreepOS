import type { Email } from '@/components/apps/email-client';

export const blackwireMission1Email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'recruit@blackwire.net',
  subject: 'Mission #1 — Évaluation de compétences',
  body: `On nous a parlé de vous.
Nous avons une petite tâche… format initiation.

1. Récupérez un fichier sur la machine cible : 18.222.13.116
2. Le fichier est un .zip protégé. Le mot de passe est dans les notes de l'admin.
3. Déposez ce .zip dans le répertoire /upload/ de notre serveur de réception : 18.117.228.214
4. Envoyez-nous le mot de passe du .zip comme preuve à l'adresse recruit@blackwire.net avec le code CODE_OMEGA_7.

Discrétion obligatoire. Le système est équipé de trace-time.
Appliquez les procédures apprises : effacement, crash, vitesse.`,
};
