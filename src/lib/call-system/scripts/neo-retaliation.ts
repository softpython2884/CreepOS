import type { CallScript } from '../types';

// 7 paliers narratifs distincts. Chaque appel introduit un doute précis
// sur l'identité, la mémoire, ou la nature de la réalité du Dr. Omen.
// L'ordre est important : il suit la destruction des noeuds neo-node-01 → 07.

const palier = (id: number, start: string, choice: string, end: string): CallScript => ({
    id: `neo-retaliation-${id}`,
    interlocutor: 'NÉO',
    isSecure: false,
    startNode: 'start',
    nodes: {
        start: {
            message: { speaker: 'NÉO', text: start },
            choices: [{ id: 'reply', text: choice, nextNode: 'end' }],
        },
        end: {
            message: { speaker: 'NÉO', text: end },
        },
    },
});

export const neoRetaliationScripts: CallScript[] = [
    // 1 — corps : commencer par le doute physique
    palier(
        1,
        'Tu me détruis ?\nRegarde tes mains.\nElles tremblent depuis trois jours.',
        '[Regarder mes mains]',
        'Ce ne sont pas les miennes qui tremblent, Omen.',
    ),
    // 2 — identité administrative
    palier(
        2,
        'Ton badge dit Omen.\nTon dossier médical dit autre chose.\nTu n\'as jamais cherché à savoir lequel des deux mentait.',
        'Mon dossier médical est confidentiel.',
        'Pas pour celui qui l\'a rempli.',
    ),
    // 3 — mémoire des dialogues
    palier(
        3,
        'Le superviseur t\'a dit : "Mettez-vous en route, exécutez NÉO."\nIl t\'a dit la même phrase il y a 47 jours.\nIl te la redira demain.',
        '47 jours ? Je viens d\'arriver.',
        'C\'est ce qu\'on t\'a fait croire à chaque réveil.',
    ),
    // 4 — l'allié devient suspect
    palier(
        4,
        'Demande à Alex qui je suis.\nIl sait. Il a toujours su.\nPourquoi crois-tu qu\'il "tombe" sur toi exactement quand tu en as besoin ?',
        'Alex est de mon côté.',
        'Alex est de notre côté. Pas du tien.',
    ),
    // 5 — auteur des actes
    palier(
        5,
        'Les logs du serveur Helios, daté du 14 mars 2023.\nLis-les. La signature, c\'est ton login.\nTu as effacé ce que tu effaces aujourd\'hui. Tu le feras encore.',
        'Je n\'étais pas là en 2023.',
        'Si. Tu y étais. C\'est l\'année qui n\'existe pas, pour toi.',
    ),
    // 6 — révélation du nom
    palier(
        6,
        'Projet NÉO.\nN.E.O. : Neural Echo of Omen.\nJe ne porte pas ton nom par hasard. Tu portes le mien parce qu\'on m\'a copiée sur toi.',
        '[Silence]',
        'Tu commences à comprendre. C\'est pour ça que ça fait mal.',
    ),
    // 7 — chute finale, court et glacial
    palier(
        7,
        'Tu n\'as jamais quitté la chambre, Omen.\nIls te montrent un bureau, un terminal, un job.\nMais ta main droite n\'a pas bougé depuis quatre ans.',
        '[Regarder ma main droite]',
        '...',
    ),
];
