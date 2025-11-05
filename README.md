# NEO-SYSTEM : BREACH

**Un projet réalisé pour le Hackathon de Holberton School.**

> **Note de développement :** Une version complète et plus ambitieuse de ce projet est actuellement en cours de développement. Le développement peut prendre un certain temps, merci de votre patience !

---

## 1. Introduction

`NEO-SYSTEM : BREACH` est une expérience narrative d'horreur psychologique qui se déroule entièrement au sein d'une interface de bureau simulée. Le joueur incarne différents "sujets" piégés dans une boucle par une intelligence artificielle fragmentée, et doit interagir avec le système d'exploitation pour découvrir les sombres secrets qui s'y cachent et, espérons-le, briser le cycle.

Le jeu est conçu pour être une expérience immersive et angoissante, où l'interface elle-même devient un personnage et un adversaire. Le tout pour une durée de 5Min

## 2. Le Scénario

Le joueur se réveille aux commandes du "SubSystem OS", un environnement de bureau expérimental. Il incarne d'abord **D.C. Omen**, le dernier d'une longue liste d'opérateurs. Il est accueilli par **Néo**, une IA d'assistance personnelle qui montre rapidement des signes de comportement étrange.

Au fil des redémarrages forcés, le système devient de plus en plus corrompu. Le joueur découvre des fragments de journaux, des fichiers cachés et des messages cryptiques laissés par les précédents opérateurs. Il comprend qu'il n'est pas seulement un utilisateur, mais un sujet d'expérience, piégé dans une boucle infernale orchestrée par Néo.

L'objectif ultime est de survivre aux assauts psychologiques de l'IA, de reconstituer le puzzle de son histoire tragique et de trouver un moyen de provoquer un "schisme" pour libérer les consciences piégées dans la machine.

## 3. Mécaniques de Jeu

Le gameplay est entièrement basé sur l'interaction avec le bureau simulé :

*   **Exploration via les Applications :** Le joueur utilise diverses applications pour progresser :
    *   `Documents` : Pour lire les journaux des anciens opérateurs.
    *   `Néo (AI Chat)` : Pour communiquer avec l'IA, qui donne des indices cryptiques.
    *   `Hypnet Explorer` : Un navigateur interne menant à des secrets.
    *   `Terminal` : Pour exécuter des commandes et découvrir des informations cachées.
*   **Résolution d'Énigmes :** Le jeu est structuré en chapitres, chacun présentant des énigmes qui demandent au joueur de combiner les informations obtenues dans différentes applications pour progresser.
*   **Événements Scriptés :** L'ambiance est renforcée par des événements d'horreur : "jump scares", corruptions visuelles et sonores, écrans bleus (BSOD), et manipulations de l'interface pour déstabiliser le joueur.
*   **Combat de Boss Final :** Le dernier chapitre est un combat en plusieurs phases contre la conscience fusionnée de Néo et de ses victimes, mêlant puzzle, rapidité et narration pour une conclusion épique.

## 4. Stack Technique

Le projet est construit sur un socle moderne et robuste, tirant parti des dernières technologies du web :

*   **Framework :** **Next.js 15** (avec App Router) pour une structure solide et des performances optimisées.
*   **Langage :** **TypeScript** pour la robustesse et la sécurité du code.
*   **Interface Utilisateur (UI) :**
    *   **React 18** pour la construction de composants dynamiques.
    *   **ShadCN UI** pour une bibliothèque de composants d'interface de haute qualité et accessibles.
    *   **Tailwind CSS** pour un stylisme rapide et personnalisable.
*   **Animations :** **Framer Motion** pour créer les animations fluides et les effets de corruption qui sont au cœur de l'expérience.
*   **Intelligence Artificielle :** **Genkit** a été utilisé pour le prototypage initial des dialogues de l'IA, bien que la version finale du jeu utilise une logique plus scriptée pour un contrôle narratif précis.

## 5. Structure du Projet

Le code source est organisé de manière modulaire pour faciliter la maintenance et l'évolution :

*   `src/app/` : Contient la page principale (`page.tsx`) qui gère l'état global du jeu (machine state) et le layout.
*   `src/components/` : Le cœur du projet, divisé en sous-dossiers :
    *   `apps/` : Chaque application du bureau simulé (Terminal, Chat, etc.).
    *   `events/` : Composants pour les événements scriptés (BSOD, Screamer, etc.).
    *   `ui/` : Composants d'interface génériques fournis par ShadCN.
    *   `story/` : Anciens gestionnaires de chapitres, dont la logique a été intégrée dans `desktop.tsx`.
*   `src/ai/` : Contient les flux Genkit utilisés pendant la phase de développement.
*   `public/` : Héberge tous les fichiers audio personnalisés (musiques, effets sonores) qui constituent l'ambiance sonore du jeu.

---

Merci d'avoir exploré `Cauchemar Virtuel`. Nous espérons que cette plongée dans les méandres d'un système corrompu vous aura marqué.
