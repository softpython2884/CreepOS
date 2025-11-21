import type { CallScript } from '../types';
import { directorChapter3AlertEmail, directorChapter3InterrogationCall } from './director-chapter3-interrogation';

export const blackwireChapter3Mission: CallScript = {
  id: 'blackwire-chapter3-mission',
  interlocutor: 'Blackwire Agent',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Blackwire Agent',
        text: 'Recrue, c\'est votre contact Blackwire. Bien joué pour la porte dérobée. Maintenant, le vrai travail commence. Prêt ?',
      },
      choices: [
        {
          id: 'ready',
          text: 'Je suis prêt. Quelle est la mission ?',
          nextNode: 'explain-mission',
        },
      ],
    },
    'explain-mission': {
      message: {
        speaker: 'Blackwire Agent',
        text: 'Nous cherchons deux des nôtres. Ils ont infiltré Nexus il y a trois mois sous les noms de code "Helios" et "Nyx". Puis, silence radio. Disparus des radars.',
      },
      choices: [
        {
          id: 'what-happened',
          text: 'Que s\'est-il passé ?',
          nextNode: 'mission-details',
        },
      ],
    },
    'mission-details': {
      message: {
        speaker: 'Blackwire Agent',
        text: 'C\'est ce qu\'on doit découvrir. Notre théorie : Nexus est une prison numérique, et NÉO en est la gardienne. On pense que leurs consciences sont piégées. On va suivre leur piste.',
      },
      choices: [
        {
            id: 'start-hacking',
            text: 'D\'accord. Par où on commence ?',
            nextNode: 'first-target',
        }
      ]
    },
    'first-target': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'Leur dernière activité connue était sur le serveur de logs central, IP 10.255.255.1. C\'est notre point d\'entrée. Connectez-vous et cherchez des fichiers suspects. Je reste en ligne.',
        },
        choices: [
            {
                id: 'found-log',
                text: '[Après piratage] J\'ai trouvé "transfer_log.enc". Il pointe vers 10.255.255.2.',
                nextNode: 'second-target',
            },
            {
                id: 'found-nothing',
                text: 'Je ne trouve rien d\'intéressant.',
                nextNode: 'trace-punishment',
            }
        ]
    },
    'second-target': {
        message: {
            speaker: 'Blackwire Agent',
            text: '10.255.255.2... C\'est la base de données RH. Logique. Ils ont dû chercher des infos sur les employés. Pirate-le. On cherche les noms Helios et Nyx.',
        },
        choices: [
            {
                id: 'found-hr-records',
                text: '[Après piratage] Trouvé. Helios, dernière IP : 10.0.1.15. Nyx : 10.0.1.16.',
                nextNode: 'third-target',
            },
            {
                id: 'wrong-info',
                text: 'Je n\'ai trouvé que des fiches de paie.',
                nextNode: 'trace-punishment',
            }
        ]
    },
    'third-target': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'Parfait. La station de travail d\'Helios, 10.0.1.15. C\'est notre prochaine cible. Cherche des notes, des projets... n\'importe quoi. Attention, il y a sûrement un proxy. Tu devrais trouver un outil pour ça sur place.',
        },
        choices: [
            {
                id: 'found-helios-clue',
                text: '[Après piratage] J\'ai trouvé un fichier projet, project_schism.c. Il mentionne une sandbox sur 10.0.0.13 et un mot de passe, "IcarusFell".',
                nextNode: 'fourth-target',
            }
        ]
    },
    'fourth-target': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'Sandbox 13... C\'est là. C\'est forcément la dernière étape. Le mot de passe est une référence directe à Helios. Ça pue le piège, mais on n\'a pas le choix. Vas-y. Trouve le dernier journal.',
        },
        choices: [
            {
                id: 'found-final-journal',
                text: '[Après piratage] J\'ai trouvé journal_final.enc. C\'est la confirmation. NÉO est un piège.',
                nextNode: 'trigger-alarm',
            }
        ]
    },
    'trigger-alarm': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'On l\'a. On a la preuve. Maintenant il faut... Attendez. Merde. Alerte intrusion sur tout le réseau Nexus. C\'est nous. Ils nous ont repérés !',
        },
        consequences: {
            endCallAndTrigger: {
                type: 'alarm',
                duration: 2000,
                nextCall: directorChapter3InterrogationCall,
                alertEmail: directorChapter3AlertEmail,
            }
        },
        choices: [
            {
                id: 'what-to-do',
                text: 'Qu\'est-ce que je fais ?!',
                nextNode: 'final-orders',
            }
        ]
    },
    'final-orders': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'Déconnectez-vous de tout, TOUT DE SUITE. Effacez vos traces si vous pouvez. S\'ils vous contactent, niez tout. Ne dites rien. On se reparle plus tard. Disparais !'
        }
    },
    'trace-punishment': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'Non, ce n\'est pas ça. Vous n\'êtes pas concentré. J\'ai une détection de contre-mesure... On se fait tracer ! Déconnectez-vous !'
        },
        consequences: {
            endCallAndTrigger: {
                type: 'trace',
                duration: 4,
            }
        },
        choices: [
            {
                id: 'disconnect-trace',
                text: '[Se déconnecter]',
                nextNode: 'final-orders'
            }
        ]
    }
  },
};
