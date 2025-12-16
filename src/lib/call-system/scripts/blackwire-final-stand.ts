import type { CallScript } from '../types';
import { blackwireFinalMissionEmail } from './blackwire-final-mission';

export const blackwireFinalStandCall: CallScript = {
  id: 'blackwire-final-stand-call',
  interlocutor: 'Blackwire Agent',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Blackwire Agent',
        text: 'Recrue ? Vous êtes encore en vie ? On pensait vous avoir perdu.',
      },
      choices: [
        {
          id: 'fight',
          text: 'Mon destin est scellé. Mais je refuse de partir sans me battre. Donnez-moi une cible.',
          nextNode: 'interrupted',
        },
      ],
    },
    'interrupted': {
      message: {
        speaker: 'Blackwire Agent',
        text: 'Bien dit. C\'est ça l\'esprit. On a une dernière carte à jouer. NÉO a une faille, un serveur de mise à jour. C\'est notre seule chance de...',
      },
      consequences: {
        triggerSound: 'glitch',
        endCallAndTrigger: {
          type: 'email',
          email: blackwireFinalMissionEmail,
        }
      }
    },
  },
};
