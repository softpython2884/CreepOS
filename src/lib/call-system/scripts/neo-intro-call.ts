
import type { CallScript } from '../types';
import { directorCallback, directorCallbackEmail } from './director-call';

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
           consequences: {
            triggerSound: 'tension',
          },
        },
      ],
    },
    'ask-question': {
      message: {
        speaker: 'Néo',
        text: 'Est-ce que cela fait mal... de mourir ?',
      },
      consequences: {
        endCallAndTrigger: {
            type: 'email',
            email: directorCallbackEmail,
        },
      },
    },
  },
};

    