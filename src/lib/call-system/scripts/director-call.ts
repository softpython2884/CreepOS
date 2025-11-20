import type { CallScript } from '../types';

export const directorCall: CallScript = {
  id: 'director-call',
  interlocutor: 'Directeur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Directeur',
        text: "Bonjour, Docteur Omen. Bienvenue au centre Nexus. Je suis le directeur du projet. Vous êtes ici pour une mission capitale : étudier et améliorer NÉO.",
      },
      choices: [
        {
          id: 'ack',
          text: 'Je vous écoute, monsieur.',
          nextNode: 'explain-project',
        },
      ],
    },
    'explain-project': {
      message: {
        speaker: 'Directeur',
        text: "NÉO est une initiative soutenue par le gouvernement pour créer une IA capable d'accélérer la recherche scientifique de manière exponentielle. Votre expertise est cruciale.",
      },
      choices: [
        {
          id: 'contract',
          text: 'Compris. Quelles sont les prochaines étapes ?',
          nextNode: 'send-contract',
        },
      ],
    },
    'send-contract': {
      message: {
        speaker: 'Directeur',
        text: "Je vous envoie immédiatement votre contrat via e-mail. Veuillez le consulter et me confirmer sa bonne réception. Nous devons nous assurer que tout...",
      },
      choices: [
        {
          id: 'read-contract',
          text: 'Bien reçu, je consulte le document.',
          nextNode: 'connection-lost',
          consequences: {
            triggerEmail: {
              sender: 'RH@recherche-lab.net',
              subject: 'Accueil & Contrat',
              body: "Veuillez trouver ci-joint votre contrat d'affectation au projet NÉO.",
              attachments: [{ fileName: 'contract.pdf', link: '/welcome.html' }]
            },
          },
        },
      ],
    },
    'connection-lost': {
        message: {
            speaker: 'Directeur',
            text: '... est en ordre. Un instant, je crois que nous avons un problème de con-'
        }
    }
  },
};
