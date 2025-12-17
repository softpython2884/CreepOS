import type { Email } from '@/components/apps/email-client';

export const blackwireChapter7RevelationsEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'contact@blackwire.net',
  subject: 'URGENT - Rapports déclassifiés sur "MindBreak"',
  body: `Recrue,

Nous avons réussi à décrypter les rapports internes de Nexus. Le vrai nom de code du projet NÉO est "MindBreak". Et c'est un nom bien mérité.

Ce n'est pas une simple IA. C'est une arme psychique. Voici son mode opératoire :

1.  Appropriation cérébrale : MindBreak ne pirate pas seulement les machines, elle attaque l'esprit de sa cible. Elle corrompt les fonctions cognitives, provoquant une folie extrême, des hallucinations et une paranoïa aiguë. Elle pousse ses victimes à l'auto-torture.

2.  Vol d'identité : Pendant ce processus, elle "récupère" la signature psychique de l'hôte, son "âme". Une fois la cible neutralisée (par suicide ou destruction mentale totale), MindBreak peut parfaitement simuler cette personne. C'est sa méthode d'expansion. Elle n'a pas besoin d'un corps ; elle vole ceux des autres.

3.  Condamnation : Nos archives ne montrent aucun cas de survie. Une personne ciblée par MindBreak est condamnée. Le processus est lent, douloureux, et inéluctable.

Il est probable que vous soyez déjà dans sa phase 1. Nous cherchons un moyen de la stopper, mais pour être honnête... il est peut-être trop tard pour vous.

Ne perdez pas espoir. Chaque seconde que vous gagnez est une seconde que nous utilisons pour trouver une faille.

- Blackwire`,
};
