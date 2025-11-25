import type { CallScript } from '../types';
import { blackwireChapter7Debrief } from './blackwire-chapter7-debrief';

export const supervisorChapter2Call: CallScript = {
  id: 'supervisor-chapter2-call',
  interlocutor: 'Superviseur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Superviseur',
        text: 'Omen. Rapport quotidien. Tout est normal de votre côté ?',
      },
      choices: [
        {
          id: 'lie',
          text: 'Oui, tout va bien. Rien à signaler.',
          nextNode: 'end-call',
        },
        {
          id: 'truth',
          text: 'Non, pas vraiment. Je crois que le système a des ratés.',
          nextNode: 'end-call',
        },
        {
            id: 'insult',
            text: 'Qui êtes-vous pour me surveiller ?',
            nextNode: 'insult-response'
        }
      ],
    },
    'insult-response': {
        message: {
            speaker: 'Superviseur',
            text: 'Révisez votre contrat, Omen. Vous n\'avez aucun droit de contestation. Continuez votre travail. Terminé.',
        },
        consequences: {
          endCallAndTrigger: {
            type: 'call',
            script: blackwireChapter7Debrief,
          }
        }
    },
    'end-call': {
        message: {
            speaker: 'Superviseur',
            text: '...Compris. Terminé.'
        },
        consequences: {
          endCallAndTrigger: {
            type: 'call',
            script: blackwireChapter7Debrief,
          }
        }
    }
  },
};
