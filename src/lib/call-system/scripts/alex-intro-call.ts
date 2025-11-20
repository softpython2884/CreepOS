import type { CallScript } from '../types';
import { cousinMission1Email } from './cousin-mission-1';

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
                nextNode: 'scan-tutorial',
            }
        ]
    },
    'scan-tutorial': {
        message: {
            speaker: 'Alex',
            text: "Maintenant, utilise `scan` sur ta propre machine. Tu devrais voir un PC lié. C'est ta première cible. Connecte-toi dessus.",
        },
        choices: [
            {
                id: 'connected',
                text: "Ok, je suis connecté.",
                nextNode: 'probe-tutorial',
            }
        ]
    },
    'probe-tutorial': {
        message: {
            speaker: 'Alex',
            text: "Bien. Maintenant, lance un `probe` pour voir ses défenses. Ça devrait être... léger.",
        },
        choices: [
            {
                id: 'probed',
                text: "C'est fait. Je vois les infos.",
                nextNode: 'porthack-tutorial',
            }
        ]
    },
    'porthack-tutorial': {
        message: {
            speaker: 'Alex',
            text: "T’as vu ? Simple, propre, sans risque.\nBon maintenant tu vas `porthack`. Ça ne donne que le mot de passe, mais c'est pas grave, la plupart des boîtes utilisent 'admin' par défaut. Vas-y, crack-le et connecte-toi.",
        },
        choices: [
            {
                id: 'hacked',
                text: "J'ai l'accès. C'était 'root'. Facile.",
                nextNode: 'warning',
            }
        ]
    },
    'warning': {
        message: {
            speaker: 'Alex',
            text: "Ok, là faut que je t’apprenne un truc IMPORTANT.\nY’a des PC comme celui-ci : chill, pas de traçage.\nMais Corporate Proxy… Eux, ils ont des systèmes anti-intrusion qui voient TOUT.\nTu laisses des logs ? Ils retrouvent ton PC."
        },
        choices: [
            {
                id: 'how-to-clean',
                text: "Comment on nettoie ça ?",
                nextNode: 'explain-logs',
            }
        ]
    },
    'explain-logs': {
        message: {
            speaker: 'Alex',
            text: "Les logs sont dans `/logs/`. Tu les effaces avec `rm`. Mais le plus sûr, c'est de faire crasher la bécane avec un virus genre forkbomb. Ça wipe la RAM, aucune trace. T'en as pas encore, mais ça viendra.",
        },
        choices: [
            {
                id: 'got-it',
                text: "Compris. Nettoyer les logs ou tout faire sauter.",
                nextNode: 'danger-command',
            }
        ]
    },
    'danger-command': {
        message: {
            speaker: 'Alex',
            text: "Bon, j’ai installé un programme sur ton PC. Ça calcule ton 'danger'. Quand tu tapes `danger`, ça t’affiche ton pourcentage.\n0% → t’es invisible\n100% → frère prépare ta valise, l’Amérique arrive.",
        },
        choices: [
            {
                id: 'thanks',
                text: 'Utile. Merci.',
                nextNode: 'final-mission',
            }
        ]
    },
    'final-mission': {
        message: {
            speaker: 'Alex',
            text: "Dernière chose… Je t’ai mis une mission dans ton mail. Les gars d’un certain collectif 'Cousin' de Corporate Proxy veulent te tester. Fais ce qu'ils disent. En échange, ils t'aideront peut-être. Ton histoire de centre américain… j’aime pas ça.",
        },
        consequences: {
            triggerEmail: cousinMission1Email,
        },
        choices: [
            {
                id: 'end',
                text: 'Je vais voir ça. Merci Alex.',
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
