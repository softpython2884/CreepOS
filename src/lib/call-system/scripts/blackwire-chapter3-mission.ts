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
        text: 'Recrue, c\'est votre contact Blackwire. Bien joué pour l\'activation de la porte dérobée. Maintenant, le vrai travail commence. Prêt ?',
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
                id: 'found-something',
                text: '[Après piratage] J\'ai trouvé un fichier "transfer_log.enc". Crypté.',
                nextNode: 'trigger-alarm',
            }
        ]
    },
    'trigger-alarm': {
        message: {
            speaker: 'Blackwire Agent',
            text: 'Parfait, c\'est ça ! Essayez de... Attendez. Merde. On a une alerte intrusion sur tout le réseau Nexus. C\'est nous. Ils nous ont repérés !',
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
    }
  },
};

    