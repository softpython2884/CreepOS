import type { CallScript } from '../types';

export const supervisorCall1: CallScript = {
  id: 'supervisor-call-1',
  interlocutor: 'Superviseur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Superviseur',
        text: "Omen, ici votre superviseur. J'ai un impératif. Je vous rappelle dans deux minutes pour le briefing. Mettez-vous en route, exécutez NÉO. Restez près de votre machine.",
      },
      choices: [
        {
          id: 'ack',
          text: 'Bien reçu.',
          nextNode: 'end-call',
        },
        {
          id: 'question',
          text: 'Exécuter NÉO ? Comment dois-je procéder ?',
          nextNode: 'question-response',
        },
        {
          id: 'silent',
          text: '[Rester silencieux]',
          nextNode: 'silent-response',
        }
      ],
    },
    'question-response': {
        message: {
            speaker: 'Superviseur',
            text: 'Les RH ont dû vous envoyer un e-mail avec les accès. Sinon, tout est dans le fichier welcome.txt sur votre bureau. Lisez-le. Terminé.',
        },
        consequences: {
            triggerEmail: {
              sender: 'Superviseur@recherche-lab.net',
              subject: 'Appel programmé',
              body: "Je vous rappelle dans 2 minutes. Mettez-vous en route, exécutez Néo. Restez près de votre machine.",
            },
          },
    },
    'silent-response': {
        message: {
            speaker: 'Superviseur',
            text: '...Omen ? Répondez. Est-ce que vous me recevez ? Bon, lisez vos instructions et mettez-vous au travail. Je n\'ai pas le temps pour ça. Terminé.',
        },
        consequences: {
            danger: 5,
            triggerEmail: {
              sender: 'Superviseur@recherche-lab.net',
              subject: 'Appel programmé',
              body: "Je vous rappelle dans 2 minutes. Mettez-vous en route, exécutez Néo. Restez près de votre machine.",
            },
        },
    },
    'end-call': {
      message: {
        speaker: 'Superviseur',
        text: 'Parfait. Terminé.',
      },
      consequences: {
        triggerEmail: {
          sender: 'Superviseur@recherche-lab.net',
          subject: 'Appel programmé',
          body: "Je vous rappelle dans 2 minutes. Mettez-vous en route, exécutez Néo. Restez près de votre machine.",
        },
      },
    },
  },
};
