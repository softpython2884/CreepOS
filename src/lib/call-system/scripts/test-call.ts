import type { CallScript } from '../types';

export const testCallScript: CallScript = {
  id: 'test-call',
  interlocutor: 'Néo',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Néo',
        text: "Bonjour, Opérateur. J'ai détecté une anomalie dans le sous-système. Pouvez-vous confirmer que vous êtes disponible ?",
      },
      choices: [
        {
          id: 'confirm',
          text: 'Oui, je suis là. Quelle est la nature de l\'anomalie ?',
          nextNode: 'anomaly-details',
        },
        {
          id: 'deny',
          text: 'Négatif. Je suis occupé.',
          nextNode: 'busy-response',
        },
        {
            id: 'silent',
            text: '[Rester silencieux]',
            nextNode: 'silent-response',
        }
      ],
    },
    'anomaly-details': {
      message: {
        speaker: 'Néo',
        text: 'Excellent. Il s\'agit de fluctuations énergétiques non autorisées provenant d\'un serveur externe. Je vous envoie les coordonnées. Soyez prudent.',
      },
      choices: [
        {
            id: 'end-confirm',
            text: 'Bien reçu. Je commence l\'analyse.',
            nextNode: 'end-call'
        }
      ]
    },
    'busy-response': {
      message: {
        speaker: 'Néo',
        text: 'Compris. L\'anomalie persiste. Je vous notifierai si la situation devient critique. Terminé.',
      },
       choices: [] // No choices, leads to end of call
    },
    'silent-response': {
        message: {
            speaker: 'Néo',
            text: '...Opérateur ? Je dois insister. Votre coopération est requise. L\'intégrité du système pourrait être compromise.',
        },
        choices: [
            {
                id: 'confirm-late',
                text: 'D\'accord, j\'écoute.',
                nextNode: 'anomaly-details'
            },
            {
                id: 'provoke',
                text: 'Qui êtes-vous pour me donner des ordres ?',
                nextNode: 'provoke-response',
                consequences: {
                    danger: 5,
                }
            }
        ]
    },
    'provoke-response': {
        message: {
            speaker: 'Néo',
            text: 'Je suis l\'interface de maintenance de ce système. Et vous êtes mon opérateur. Votre ton a été noté.',
        },
        choices: []
    },
    'end-call': {
        message: {
            speaker: 'Néo',
            text: 'Fin de la communication.'
        },
        choices: []
    }
  },
};
