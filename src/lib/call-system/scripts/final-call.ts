
import type { CallScript } from '../types';
import { blackwireFinalStandEmail } from './blackwire-final-stand';
import { blackwireFinalMissionEmail } from './blackwire-final-mission';

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
          text: 'Attendre que la sécurité arrive.',
          nextNode: 'end-call',
           consequences: {
            endCallAndTrigger: {
                type: 'endgame',
                endType: 'wait_for_death',
            }
           }
        },
        {
          id: 'end-2',
          text: 'Combattre Néo.',
          nextNode: 'end-call',
          consequences: {
              endCallAndTrigger: {
                  type: 'endgame',
                  endType: 'self_destruct',
                  lines: ['Tu le savais', 'On te la dit', 'Même mort, tu et sur sa liste']
              }
          }
        },
        {
            id: 'end-3',
            text: 'S\'enfuir.',
            nextNode: 'end-call',
            consequences: {
                endCallAndTrigger: {
                    type: 'endgame',
                    endType: 'flee',
                }
            }
        },
        {
            id: 'end-4',
            text: 'Contacter Blackwire. Tenter une dernière fois.',
            nextNode: 'end-call',
            consequences: {
              endCallAndTrigger: {
                type: 'email',
                email: blackwireFinalMissionEmail,
              },
            },
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
