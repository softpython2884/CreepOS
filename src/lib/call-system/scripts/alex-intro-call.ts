import type { CallScript } from '../types';

export const alexIntroCall: CallScript = {
  id: 'alex-intro-call',
  interlocutor: '172.50.32.8',
  isSecure: false,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Alex',
        text: "BROOOO ! Ça fait mille ans ! Comment ça va dans ton boulot super légal et pas du tout flippant ?\nAttends, bouge pas, j’active un tunnel… euh… non sécurisé.\nputain, la sécurité ça rigole pas chez toi...\n… ça a pas marché.\nBon tant pis.",
      },
      choices: [
        {
          id: 'who',
          text: 'C’est qui ? C’est une blague ?',
          nextNode: 'intro-alex',
        },
        {
            id: 'silent',
            text: '[Ne pas répondre]',
            nextNode: 'intro-alex',
        }
      ],
    },
    'intro-alex': {
      message: {
        speaker: 'Alex',
        text: "Respire. C'est Alex ; J’appelle vite fait.\nJ’ai retrouvé une vieille boîte d’outils… et frère…\nC’est des outils tellement puissants que même ton superviseur il oserait pas les regarder en 480p :p\nLes rivaux de Corporate Proxy ont sorti ça. Du très très DIRT.",
      },
      choices: [
        {
          id: 'tools',
          text: "Des outils ? De quoi tu parles ?",
          nextNode: 'give-tools',
        },
      ],
    },
    'give-tools': {
      message: {
        speaker: 'Alex',
        text: "Tiens, cadeau :\n\nlogin : test-user\nmdp : 9e0-test\nip : 172.50.32.8\n\nTu vas te connecter dessus, télécharger quelques .bin, et je t’explique la base du piratage.\nT’inquiète, c’est légal… enfin… légal dans mon pays....\nJe crois.",
      },
      choices: [
        {
          id: 'download',
          text: "[Se connecter et télécharger les fichiers...]",
          nextNode: 'explain-tools',
        },
      ],
    },
    'explain-tools': {
        message: {
            speaker: 'Alex',
            text: "Télécharge-moi ça. C’est les classiques.\n\n`scan` = géolocalise les noeuds du réseau\n`probe` = analyse la sécurité\n`porthack` = force brute : la version numérique du 'on soulève le mur'.",
        },
        choices: [
            {
                id: 'done',
                text: "C'est fait.",
                nextNode: 'end-call',
            }
        ]
    },
    'end-call': {
        message: {
            speaker: 'Alex',
            text: 'Voilààà. T’es armé. Bienvenue dans le vrai monde.'
        }
    }
  },
};
