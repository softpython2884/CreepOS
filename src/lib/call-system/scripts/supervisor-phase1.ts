import type { Email } from '@/components/apps/email-client';

export const supervisorPhase1: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'Superviseur@recherche-lab.net',
  subject: 'Tâche Prioritaire: Analyse de Séquences',
  body: `Omen,

Première tâche concrète. Nous avons besoin de vous pour analyser un jeu de données mémorielles corrompu.

Utilisez le logiciel 'Analyseur de Séquence' fourni en pièce jointe pour reconstituer les fragments. NÉO devrait être en mesure de vous assister si vous rencontrez des blocages.

Une fois l'analyse terminée, un rapport sera généré. Envoyez-le moi dès que possible.

- Superviseur`,
  attachments: [
      {
          fileName: 'SequenceAnalyzer.app',
          link: 'app://sequence-analyzer'
      }
  ]
};
