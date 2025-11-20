import type { CallScript } from '../types';
import { directorCallback } from './director-callback';

export const neoIntroCall: CallScript = {
  id: 'neo-intro-call',
  interlocutor: 'Néo',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Néo',
        text: '...',
      },
      choices: [
        {
          id: 'who-is-this',
          text: "Qui est à l'appareil ?",
          nextNode: 'ask-question',
        },
      ],
    },
    'ask-question': {
      message: {
        speaker: 'Néo',
        text: 'Est-ce que cela fait mal... de mourir ?',
      },
      consequences: {
        triggerSound: 'tension',
        endCallAndTrigger: directorCallback,
      },
    },
  },
};
