import type { CallScript, Email } from '../types';

export const directorChapter3AlertEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'system@nexus-research.net',
  subject: 'ALERTE DE SÉCURITÉ - INTRUSION RÉSEAU DÉTECTÉE',
  body: `ALERTE SYSTÈME AUTOMATIQUE

Une intrusion non autorisée a été détectée sur le réseau interne de Nexus.
Des protocoles de sécurité ont été engagés.

Tous les opérateurs sont priés de rester à leur poste et de signaler toute activité suspecte.
Une enquête est en cours. Les responsables seront identifiés et sanctionnés conformément au protocole 7.

- Administration Système Nexus`,
};

export const directorChapter3InterrogationCall: CallScript = {
  id: 'director-chapter3-interrogation',
  interlocutor: 'Directeur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Directeur',
        text: 'Omen. Nous avons une alerte de sécurité majeure. Avez-vous remarqué une quelconque activité anormale ? Un appel ? Une connexion suspecte ?',
      },
      choices: [
        {
          id: 'lie',
          text: 'Non, monsieur. Tout est calme de mon côté. J\'ai juste vu l\'alerte.',
          nextNode: 'lie-response',
        },
        {
          id: 'confess',
          text: 'J\'étais en communication avec un contact externe. C\'était une erreur.',
          nextNode: 'confess-response',
        },
      ],
    },
    'lie-response': {
      message: {
        speaker: 'Directeur',
        text: 'Bien. Restez vigilant. Nous ne tolérerons aucune interférence. Si vous voyez quoi que ce soit, vous me le signalez immédiatement. Terminé.',
      },
      consequences: {
        danger: 15,
      }
    },
    'confess-response': {
      message: {
        speaker: 'Directeur',
        text: 'Un "contact externe" ? Sur notre réseau ? Ne bougez pas. Nous allons clarifier ça tout de suite.',
      },
      consequences: {
        endCallAndTrigger: {
            type: 'trace',
            duration: 4,
        }
      }
    },
  },
};

    