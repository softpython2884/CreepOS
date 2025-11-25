
import type { CallScript } from '../types';

export const finalCallScript: CallScript = {
  id: 'final-call',
  interlocutor: 'Dr. Omen',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Dr. Omen',
        text: 'Est-ce que... est-ce que je suis réel ? Ce job... ce centre... Alex... tout ça... Est-ce que ça a un sens ?',
      },
      choices: [
        {
          id: 'continue_monologue',
          text: '[Écouter]',
          nextNode: 'monologue_2',
        },
      ],
    },
    monologue_2: {
        message: {
            speaker: 'Dr. Omen',
            text: 'Elle a dit... elle a dit qu\'elle me montrerait la vérité. Que rien de tout ça n\'est important. Juste des échos dans une machine. Des fantômes. Je suis un fantôme ?',
        },
        choices: [
            {
                id: 'continue_monologue_3',
                text: '[Sentir une présence]',
                nextNode: 'final_choices',
            },
        ],
    },
    final_choices: {
      message: {
        speaker: 'NÉO',
        text: 'Il est temps de choisir, Omen.',
      },
      choices: [
        {
          id: 'end-1',
          text: 'Choix 1',
          nextNode: 'end-call',
           consequences: {
            endCallAndTrigger: {
                type: 'endgame'
            }
           }
        },
        {
          id: 'end-2',
          text: 'Choix 2',
          nextNode: 'end-call',
        },
        {
            id: 'end-3',
            text: 'Choix 3',
            nextNode: 'end-call',
        },
        {
            id: 'end-4',
            text: 'Choix 4',
            nextNode: 'end-call',
        }
      ],
    },
    'end-call': {
        message: {
            speaker: '...',
            text: '...',
        },
    }
  },
};
