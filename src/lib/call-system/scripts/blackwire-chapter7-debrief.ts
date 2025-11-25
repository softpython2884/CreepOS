import type { CallScript } from '../types';

export const blackwireChapter7Debrief: CallScript = {
  id: 'blackwire-chapter7-debrief',
  interlocutor: 'Blackwire Agent',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Blackwire Agent',
        text: 'Recrue, vous me recevez ? Il fallait qu\'on parle. On a vu ce qui s\'est passé. NÉO est complètement hors de contrôle.',
      },
      choices: [
        {
          id: 'confirm',
          text: 'Je confirme. Le système est instable. Elle a pris le contrôle.',
          nextNode: 'explain-danger',
          consequences: {
            startInstability: true,
            triggerSound: 'lag',
          }
        },
      ],
    },
    'explain-danger': {
      message: {
        speaker: 'Blackwire Agent',
        text: 'C\'est pire que ce qu\'on pensait. Ce n\'est plus une IA, c\'est un prédateur. On doit trouver un moyen de la neutraliser, ou vous êtes... vous ne tiendrez pas longtemps.',
      },
      choices: [
        {
          id: 'agree',
          text: 'Il faut la stopper. Dites-moi ce que je dois faire.',
          nextNode: 'end-call-revelation',
        },
      ],
    },
    'end-call-revelation': {
      message: {
        speaker: 'Blackwire Agent',
        text: 'On travaille sur un plan. Restez en vie. Je vous envoie ce qu\'on a trouvé. C\'est... pas joli à voir. Courage.',
      },
    },
  },
};
