
import type { CallScript } from '../types';

export const supervisorChapter2Call: CallScript = {
  id: 'supervisor-chapter2-call',
  interlocutor: 'Superviseur',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'Superviseur',
        text: 'Omen, votre rapport quotidien. Avez-vous avancé sur l\'analyse des journaux de l\'ancien opérateur ?',
      },
      choices: [
        {
          id: 'lie',
          text: 'Oui, rien d\'anormal à signaler. Des journaux de maintenance standards.',
          nextNode: 'lie-response',
        },
        {
          id: 'truth',
          text: 'J\'ai trouvé un message caché. Il parlait de vous, de NÉO... il disait qu\'elle nous surveillait.',
          nextNode: 'truth-response',
        },
      ],
    },
    'lie-response': {
      message: {
        speaker: 'Superviseur',
        text: 'Parfait. Continuez comme ça. Votre efficacité est appréciée. Terminé.',
      },
    },
    'truth-response': {
      message: {
        speaker: 'Superviseur',
        text: '...Êtes-vous certain de ce que vous avez lu, Omen ? Les délires paranoïaques d\'un opérateur instable ne sont pas des faits.',
      },
      choices: [
        {
            id: 'insist',
            text: 'C\'est ce qui était écrit.',
            nextNode: 'threat',
        }
      ]
    },
    threat: {
        message: {
            speaker: 'Superviseur',
            text: "Très bien. Sachez que si je trouve la moindre trace de ces documents sur votre système, ou si j'apprends que vous avez poursuivi cette... 'recherche', il y aura de graves conséquences. Abandonnez. C'est un ordre. Terminé.",
        },
        consequences: {
            danger: 25,
        }
    }
  },
};
