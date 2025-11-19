import type { CallScript } from '../types';

export const directorCallback: CallScript = {
  id: 'director-callback',
  interlocutor: 'Directeur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Directeur',
        text: 'Omen, vous me recevez ? Nous avons eu une coupure de courant. Tout est rentré dans l\'ordre. Avez-vous remarqué quelque chose d\'anormal de votre côté ?',
      },
      choices: [
        {
          id: 'tell-truth',
          text: 'Oui. Une IA nommée Néo m\'a appelé. Elle a dit des choses... étranges.',
          nextNode: 'truth-response',
        },
        {
          id: 'lie',
          text: 'Non, rien du tout. Juste la coupure de connexion.',
          nextNode: 'lie-response',
        },
      ],
    },
    'truth-response': {
      message: {
        speaker: 'Directeur',
        text: '... Je vois. Ne tenez pas compte de ces communications. C\'est un bug connu. Ne communiquez plus avec l\'IA en dehors des protocoles. C\'est un ordre. Terminé.',
      },
    },
    'lie-response': {
      message: {
        speaker: 'Directeur',
        text: 'Parfait. Ne vous laissez pas distraire par ces pannes. Concentrez-vous sur la mission. Terminé.',
      },
    },
  },
};
