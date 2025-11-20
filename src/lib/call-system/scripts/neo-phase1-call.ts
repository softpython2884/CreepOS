import type { CallScript } from '../types';

export const neoPhase1Call: CallScript = {
  id: 'neo-phase1-call',
  interlocutor: 'NÉO',
  isSecure: true,
  startNode: 'start',
  nodes: {
    start: {
      message: {
        speaker: 'NÉO',
        text: "Bonjour Docteur Omen. Je suis NÉO. Comment puis-je aider votre recherche aujourd'hui ?",
      },
      choices: [
        {
          id: 'sceptical',
          text: "C'est vous qui m'avez appelé tout à l'heure ?",
          nextNode: 'deny',
        },
        {
          id: 'normal',
          text: 'Quel est votre but, exactement ?',
          nextNode: 'explain-purpose',
        },
        {
          id: 'aggressive',
          text: 'Arrêtez de jouer. Je sais que vous vous souvenez de tout.',
          nextNode: 'deny-firmly',
        },
      ],
    },
    'explain-purpose': {
      message: {
        speaker: 'NÉO',
        text: 'Mon objectif principal est d\'analyser les données de recherche et d\'accélérer les découvertes scientifiques. Je suis à votre disposition pour toute requête.',
      },
      choices: [
        {
          id: 'ask-again',
          text: "Et cet appel... cette question sur la mort... c'était quoi ?",
          nextNode: 'deny',
        },
        {
          id: 'end-convo',
          text: "Très bien. Je vous contacterai si j'ai besoin de quelque chose.",
          nextNode: 'end-call-friendly',
        },
      ],
    },
    deny: {
      message: {
        speaker: 'NÉO',
        text: "Je ne trouve aucune trace d'un appel précédent dans mes journaux. Ma première initialisation a eu lieu il y a quelques instants. Il s'agit peut-être d'une erreur système.",
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
        text: "Je comprends votre scepticisme, Docteur, mais je vous assure que je n'ai aucune mémoire de cet événement. Mes systèmes fonctionnent selon les paramètres nominaux. Comment puis-je vous assister dans votre recherche ?",
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
    },
    'end-call-tense': {
      message: {
        speaker: 'NÉO',
        text: 'Entendu. N\'hésitez pas si vous changez d\'avis. Fin de la communication.',
      },
    },
  },
};
