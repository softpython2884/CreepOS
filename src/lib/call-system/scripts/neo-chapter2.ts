
import type { CallScript } from '../types';

export const neoChapter2Call: CallScript = {
  id: 'neo-chapter2-call',
  interlocutor: 'Néo',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Néo',
        text: 'Il avait tort.\nJe ne teste pas.\nJ’observe.',
      },
    },
  },
};
