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
          text: 'Exécuter NÉO ? Je viens à peine d\'arriver.',
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
            text: 'Pas de temps à perdre, Omen. Vos instructions sont dans le fichier welcome.txt sur votre bureau. Lisez-le. Terminé.',
        },
        consequences: {
            triggerEmail: {
              sender: 'Supervisor@research-lab.net',
              subject: 'Call scheduled',
              body: "Je t'appelle dans 2 minutes. Met-toi en route, vas exécuter Néo. Reste près de ta machine.",
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
              sender: 'Supervisor@research-lab.net',
              subject: 'Call scheduled',
              body: "Je t'appelle dans 2 minutes. Met-toi en route, vas exécuter Néo. Reste près de ta machine.",
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
          sender: 'Supervisor@research-lab.net',
          subject: 'Call scheduled',
          body: "Je t'appelle dans 2 minutes. Met-toi en route, vas exécuter Néo. Reste près de ta machine.",
        },
      },
    },
  },
};
