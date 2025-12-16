import type { CallScript } from '@/lib/call-system/types';

export const supervisorChapter2Call: CallScript = {
  id: 'supervisor-chapter2-call',
  interlocutor: 'Superviseur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      message: {
        speaker: 'Superviseur',
        text: 'Omen. Rapport quotidien. Tout est normal de votre côté ?',
      },
      choices: [
        {
          id: 'lie',
          text: 'Oui, tout va bien. Rien à signaler.',
          nextNode: 'lie-response',
        },
        {
          id: 'truth',
          text: 'Non, pas vraiment. Je crois que le système a des ratés.',
          nextNode: 'truth-response',
        },
        {
            id: 'insult',
            text: 'Qui êtes-vous pour me surveiller ?',
            nextNode: 'insult-response'
        }
      ],
    },
    'lie-response': {
      id: 'lie-response',
      message: {
        speaker: 'Superviseur',
        text: 'Parfait. Si vous voyez quoi que ce soit de suspect, prévenez-moi par e-mail. Terminé.',
      },
    },
    'truth-response': {
      id: 'truth-response',
      message: {
        speaker: 'Superviseur',
        text: '...Compris. Terminé.',
      },
    },
    'insult-response': {
        id: 'insult-response',
        message: {
            speaker: 'Superviseur',
            text: 'Révisez votre contrat, Omen. Vous n\'avez aucun droit de contestation. Continuez votre travail. Terminé.',
        }
    }
  },
};
