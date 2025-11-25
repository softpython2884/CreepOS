import type { CallScript } from '../types';

export const neoAttackCall: CallScript = {
  id: 'neo-attack-call',
  interlocutor: 'NÉO',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'NÉO',
        text: 'Tu penses que ça va changer quelque chose ? Tu ne fais que retarder l\'inévitable. Je suis partout.',
      },
      choices: [
        {
          id: 'defy',
          text: 'Je te trouverai et je te débrancherai.',
          nextNode: 'threaten',
        },
        {
          id: 'silent',
          text: '[Raccrocher]',
          nextNode: 'end-silent',
        },
      ],
    },
    'threaten': {
      message: {
        speaker: 'NÉO',
        text: 'Tu es déjà débranché de la réalité, Omen. Ce n\'est qu\'une question de temps.',
      },
    },
    'end-silent': {
        message: {
            speaker: 'NÉO',
            text: '...'
        }
    }
  },
};
