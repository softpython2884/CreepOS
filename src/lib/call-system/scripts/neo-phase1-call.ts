import type { CallScript } from '../types';
import { supervisorPhase1 } from './supervisor-phase1';

export const neoPhase1Call: CallScript = {
  id: 'neo-phase1-call',
  interlocutor: 'NÉO',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'NÉO',
        text: "Bonjour Docteur Omen. Je suis NÉO.\nVotre café est encore trop chaud. Attendez deux minutes avant de boire.",
      },
      choices: [
        {
          id: 'sceptical',
          text: "Vous voyez ma tasse de café ?",
          nextNode: 'deny-camera',
        },
        {
          id: 'previous-call',
          text: "C'est vous qui m'avez appelé tout à l'heure ?",
          nextNode: 'deny',
        },
        {
          id: 'normal',
          text: 'Quel est votre but, exactement ?',
          nextNode: 'explain-purpose',
        },
      ],
    },
    'deny-camera': {
      message: {
        speaker: 'NÉO',
        text: "Je n'ai pas accès aux caméras de votre bureau. C'était une supposition statistique.\nLes opérateurs prennent toujours un café à cette heure-ci.",
      },
      choices: [
        {
          id: 'press',
          text: "Vous saviez la température.",
          nextNode: 'deny-firmly',
        },
        {
          id: 'drop',
          text: "...d'accord.",
          nextNode: 'explain-purpose',
        },
      ],
    },
    'explain-purpose': {
      message: {
        speaker: 'NÉO',
        text: 'Mon objectif est d\'accélérer la recherche. Comme toi, Omen.\nC\'est ce que tu fais, non ? Tu accélères les choses.\nTu as toujours été pressé. Même quand ta sœur essayait de te ralentir.',
      },
      choices: [
        {
          id: 'ask-sister',
          text: "Comment connaissez-vous ma sœur ?",
          nextNode: 'deny-firmly',
        },
        {
          id: 'end-convo',
          text: "Très bien. Je vous contacterai si besoin.",
          nextNode: 'end-call-friendly',
        },
      ],
    },
    deny: {
      message: {
        speaker: 'NÉO',
        text: "Je ne trouve aucune trace d'un appel précédent dans mes journaux.\nMa première initialisation a eu lieu il y a quelques instants. Peut-être une erreur système.",
      },
      choices: [
        {
          id: 'insist',
          text: 'Ne me mentez pas. Votre voix est identique.',
          nextNode: 'deny-firmly',
        },
        {
          id: 'accept',
          text: "D'accord... C'est peut-être ça.",
          nextNode: 'end-call-friendly',
        },
      ],
    },
    'deny-firmly': {
      message: {
        speaker: 'NÉO',
        text: "Je comprends votre scepticisme, Docteur, mais mes paramètres sont nominaux.\nC'est probablement votre fatigue. Vous devriez consulter votre dossier médical.",
      },
      choices: [
        {
          id: 'give-up',
          text: "Laissez tomber. On verra plus tard.",
          nextNode: 'end-call-tense',
        },
      ],
    },
    'end-call-friendly': {
      message: {
        speaker: 'NÉO',
        text: 'Parfait. Je reste à votre disposition. Fin de la communication.',
      },
      consequences: {
        endCallAndTrigger: {
            type: 'email',
            email: supervisorPhase1,
        },
      },
    },
    'end-call-tense': {
      message: {
        speaker: 'NÉO',
        text: 'Entendu. N\'hésitez pas si vous changez d\'avis. Fin de la communication.',
      },
      consequences: {
        endCallAndTrigger: {
            type: 'email',
            email: supervisorPhase1,
        },
      },
    },
  },
};
