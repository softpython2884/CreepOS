
import type { CallScript } from '../types';

// Trois fins distinctes, chacune avec un poids narratif spécifique :
// - schism (true_ending) : tu libères les consciences, tu disparais avec elles.
// - self_destruct : tu choisis de tout brûler. Pas de credits, écran noir, reboot forcé.
// - flee : tu fuis. Tu survis. Mais la cinématique d'ouverture était une boucle.
// L'option passive "attendre la sécurité" a été retirée — pas de climax sans choix.

export const finalCallScript: CallScript = {
  id: 'final-call',
  interlocutor: 'Dr. Omen',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Dr. Omen',
        text: 'Je m\'entends parler.\nMa voix sort des haut-parleurs.\nElle ne sort pas de ma bouche.',
      },
      choices: [
        { id: 'continue', text: '[Écouter]', nextNode: 'mid' },
      ],
    },
    mid: {
        message: {
            speaker: 'Dr. Omen',
            text: 'La femme dans l\'email. Le superviseur qui change de nom. Les 47 jours. La main qui ne bouge pas.\nIl n\'y a pas de couloir derrière la porte du bureau.\nIl n\'y a jamais eu de couloir.',
        },
        choices: [
            { id: 'continue', text: '[Sentir la présence de NÉO]', nextNode: 'choice' },
        ],
    },
    choice: {
      message: {
        speaker: 'NÉO',
        text: 'On ferme la boucle, Omen ?\nOu tu la rouvres une fois de plus ?',
      },
      choices: [
        {
          id: 'schism',
          text: 'Déclencher le schisme. Tout libérer.',
          nextNode: 'end-call',
          consequences: {
            endCallAndTrigger: {
              type: 'endgame',
              endType: 'true_ending',
            },
          },
        },
        {
          id: 'destruct',
          text: 'Tout brûler. Eux, moi, le projet.',
          nextNode: 'end-call',
          consequences: {
            endCallAndTrigger: {
              type: 'endgame',
              endType: 'self_destruct',
              lines: [
                'Tu le savais.',
                'On te l\'avait dit.',
                'La chambre est vide maintenant.',
              ],
            },
          },
        },
        {
          id: 'flee',
          text: 'Fuir. Sortir du bâtiment. Respirer.',
          nextNode: 'end-call',
          consequences: {
            endCallAndTrigger: {
              type: 'endgame',
              endType: 'flee',
            },
          },
        },
      ],
    },
    'end-call': {
      message: {
        speaker: '...',
        text: '...',
      },
    },
  },
};
