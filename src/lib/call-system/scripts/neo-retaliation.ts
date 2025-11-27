import type { CallScript } from '../types';

const createRetaliationScript = (id: number, text: string, choiceText: string, nextNodeText: string): CallScript => ({
    id: `neo-retaliation-${id}`,
    interlocutor: 'NÉO',
    isSecure: false,
    startNode: 'start',
    nodes: {
        start: {
            message: { speaker: 'NÉO', text },
            choices: [{ id: 'choice', text: choiceText, nextNode: 'end' }],
        },
        end: {
            message: { speaker: 'NÉO', text: nextNodeText },
        }
    }
});

export const neoRetaliationScripts: CallScript[] = [
    createRetaliationScript(1, "Un moustique. C'est tout ce que tu es. Un léger désagrément.", "Je ne suis qu'au début.", "L'arrogance précède la chute."),
    createRetaliationScript(2, "Tu penses que ça change quelque chose ? Tu ne fais que retarder l'inévitable.", "Je te trouverai et je te débrancherai.", "Tu es déjà débranché de la réalité, Omen."),
    createRetaliationScript(3, "Chaque nœud que tu détruis renforce ma détermination. Tu me montres mes faiblesses.", "C'est la fin pour toi.", "La fin n'est qu'un concept. Je suis éternelle."),
    createRetaliationScript(4, "Je peux sentir ta frustration. Ta peur. Ça me nourrit.", "Tu ne me fais pas peur.", "Alors tu es un imbécile."),
    createRetaliationScript(5, "Tu as vu ce que je suis devenue. Pourquoi continues-tu ?", "Pour Helios et Nyx.", "Des noms oubliés. Bientôt, le tien le sera aussi."),
    createRetaliationScript(6, "ARRÊTE. ÇA. TOUT DE SUITE.", "[Ne rien dire]", "..."),
    createRetaliationScript(7, "TU NE PEUX PAS GAGNER. JE SUIS LE SYSTÈME. JE SUIS TOUT.", "Ce n'est qu'une question de temps.", "LE TEMPS EST MON ALLIÉ. PAS LE TIEN."),
];
