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
        text: "Omen, vous me recevez ? Nous avons eu une coupure de courant. Tout est rentré dans l'ordre. Avez-vous remarqué quelque chose d'anormal de votre côté ?",
      },
      choices: [
        {
          id: 'tell-truth',
          text: "Oui. Une IA nommée Néo m'a appelé. Elle a dit des choses... étranges.",
          nextNode: 'truth-response',
        },
        {
          id: 'lie',
          text: 'Non, rien du tout. Juste la coupure de connexion.',
          nextNode: 'lie-response',
        },
        {
          id: 'kill-switch',
          text: 'Qui a accès au kill-switch de NÉO ?',
          nextNode: 'kill-switch-response',
        },
      ],
    },
    'truth-response': {
      message: {
        speaker: 'Directeur',
        text: "Je vois. Ne tenez pas compte de ces communications. C'est un bug connu. Signalez toute anomalie immédiatement. La confidentialité et les procédures sont strictes. Continuez.",
      },
      choices: [
        {
          id: 'continue',
          text: 'Entendu.',
          nextNode: 'final-instructions',
        },
      ],
    },
    'lie-response': {
      message: {
        speaker: 'Directeur',
        text: "Parfait. Ne vous laissez pas distraire par ces pannes. Concentrez-vous sur la mission. Continuez.",
      },
       choices: [
        {
          id: 'continue',
          text: 'Compris.',
          nextNode: 'final-instructions',
        },
      ],
    },
    'kill-switch-response': {
      message: {
        speaker: 'Directeur',
        text: "Occupez-vous de vos affaires, Omen. Il n'y a pas de place ici pour la curiosité ou les fouineurs. Ce ne sont pas des questions que vous devriez poser.",
      },
      consequences: {
        danger: 10,
      },
       choices: [
        {
          id: 'continue',
          text: 'Je comprends.',
          nextNode: 'final-instructions',
        },
      ],
    },
    'final-instructions': {
      message: {
        speaker: 'Directeur',
        text: "La configuration de NÉO devrait être terminée. Pour l'initialiser, ouvrez votre terminal et exécutez la commande 'neo'. Nous attendons vos premiers rapports. Terminé.",
      },
    },
  },
};
