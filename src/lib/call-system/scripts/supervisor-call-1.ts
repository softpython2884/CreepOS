import type { CallScript } from '../types';

export const supervisorCall1: CallScript = {
  id: 'supervisor-call-1',
  interlocutor: 'Superviseur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Superviseur',
        text: "Omen, ici votre superviseur. J'ai un impératif. Je vous rappelle dans deux minutes pour le briefing. Mettez-vous en route, exécutez NÉO. Restez près de votre machine.",
      },
      choices: [
        {
          id: 'ack',
          text: 'Bien reçu.',
          nextNode: 'end-call',
        },
      ],
    },
    'end-call': {
      message: {
        speaker: 'Superviseur',
        text: 'Parfait. Terminé.',
      },
      consequences: {
        triggerEmail: {
          sender: 'Supervisor@research-lab.net',
          subject: 'Call scheduled',
          body: "Je t'appelle dans 2 minutes. Met-toi en route, vas exécuter Néo. Reste près de ta machine.",
        },
      },
    },
  },
};
