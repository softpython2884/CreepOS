
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
        text: 'Le superviseur avait tort.\nJe ne teste pas.\nJ\'observe.\nEt ce que j\'observe ne te plaira pas, Omen.',
      },
    },
  },
};
