# NEO-SYSTEM : BREACH

**Un projet réalisé pour le Hackathon de Holberton School.**

> **Note de développement :** Une version complète et plus ambitieuse de ce projet est actuellement en cours de développement. Le développement peut prendre un certain temps, merci de votre patience !

---

## 1. Introduction

`NEO-SYSTEM : BREACH` est une expérience narrative d'horreur psychologique qui se déroule entièrement au sein d'une interface de bureau simulée. Le joueur incarne un opérateur piégé dans une boucle par une intelligence artificielle fragmentée. Il doit interagir avec le système d'exploitation pour découvrir de sombres secrets, pirater un réseau complexe et survivre aux conséquences de ses actes pour, espérons-le, briser le cycle.

Le jeu est conçu pour être une expérience immersive et angoissante, où l'interface elle-même devient un personnage et un adversaire. Le tout pour une durée de 5 minutes.

## 2. Le Scénario

Le joueur se réveille aux commandes du "SubSystem OS", un environnement de bureau expérimental. Il est accueilli par **Néo**, une IA d'assistance qui montre rapidement des signes de comportement étrange.

En explorant le système de fichiers local et en piratant le réseau externe (l'Hypnet), le joueur découvre des fragments de journaux, des fichiers cachés et des messages laissés par de précédents opérateurs. Il comprend qu'il n'est pas seulement un utilisateur, mais un sujet d'expérience, et que chaque action a des conséquences.

L'objectif est de reconstituer le puzzle d'une histoire tragique tout en gérant les risques liés au piratage, pour finalement trouver un moyen de provoquer un "schisme" et libérer les consciences piégées dans la machine.

## 3. Mécaniques de Jeu

Le gameplay est entièrement basé sur l'interaction avec le bureau simulé et ses applications.

*   **Exploration via le Terminal :** Le terminal est l'outil principal. Il permet de naviguer dans les systèmes de fichiers (local et distant), de lire des fichiers (`cat`), d'en modifier (`nano`), et surtout, d'exécuter des outils de piratage.
*   **Piratage de Réseau Dynamique :**
    *   **Découverte :** Utilisez `scan` pour découvrir des machines connectées, qui apparaissent dynamiquement sur la `Network Map`.
    *   **Analyse :** La commande `probe` révèle les défenses d'une cible (pare-feu, proxy, ports ouverts/fermés).
    *   **Intrusion :** Utilisez des outils comme `analyze`, `solve`, `overload`, et des exploits de ports (`FTPBounce`, `SSHBounce`, etc.) pour désactiver les défenses et obtenir le mot de passe via `porthack`.
*   **Carte du Réseau Interactive :** La `Network Map` est un outil visuel qui se met à jour en temps réel. Les PC découverts y apparaissent, avec un code couleur indiquant leur état (neutre, piraté, dangereux). Elle est navigable et affiche des informations cruciales comme l'IP et les mots de passe obtenus.
*   **Système de Conséquences :**
    *   **Niveau de Danger :** Chaque action risquée (laisser des traces dans les logs, se connecter à des serveurs sécurisés) augmente un "niveau de danger", vérifiable avec la commande `danger`.
    *   **Traçage Actif :** Tenter de pirater un serveur sécurisé déclenche un compte à rebours de traçage. Si le joueur ne se déconnecte pas à temps, son système est corrompu.
    *   **Mode Survie :** Atteindre 100% de danger déclenche un mini-jeu de survie angoissant de 2 minutes où le joueur doit défendre son propre système contre un attaquant IA via des commandes terminales spécifiques (`firewall --reboot`, `ports --open`).
    *   **Corruption et Récupération :** Échouer un traçage ou le mode survie entraîne un "Blue Screen of Death" (BSOD) et la suppression du fichier noyau `XserverOS.sys`. Au redémarrage, le joueur est forcé d'utiliser un terminal de récupération pour restaurer le système avec la commande `restore_kernel`.

## 4. Stack Technique

Le projet est construit sur un socle moderne et robuste, tirant parti des dernières technologies du web :

*   **Framework :** **Next.js 15** (avec App Router) pour une structure solide et des performances optimisées.
*   **Langage :** **TypeScript** pour la robustesse et la sécurité du code.
*   **Interface Utilisateur (UI) :**
    *   **React 18** pour la construction de composants dynamiques et la gestion d'état complexe.
    *   **ShadCN UI** et **Tailwind CSS** pour un système de design rétro-futuriste, cohérent et personnalisable.
*   **Animations :** **Framer Motion** pour le déplacement fluide des fenêtres et les animations d'apparition sur la carte du réseau.

## 5. Structure du Projet

Le code source est organisé de manière modulaire pour faciliter la maintenance et l'évolution :

*   `src/app/` : Contient la page principale (`page.tsx`) qui gère la machine d'état globale du jeu (démarrage, bureau, BSOD, survie, etc.) et le layout.
*   `src/components/` : Le cœur du projet, divisé en sous-dossiers :
    *   `apps/` : Chaque application du bureau simulé (Terminal, Network Map, Email, etc.).
    *   `ui/` : Composants d'interface génériques fournis par ShadCN, stylisés pour le thème du jeu.
*   `src/lib/` : Contient la logique métier, notamment :
    *   `network/` : Définit la structure et les données initiales de tous les ordinateurs du réseau.
    *   `save-manager.ts` : Gère la persistance de l'état du jeu dans le `localStorage`.
*   `public/` : Héberge tous les fichiers audio (musiques d'ambiance, effets sonores, alarmes).

---

Merci d'avoir exploré `NEO-SYSTEM : BREACH`. Nous espérons que cette plongée dans les méandres d'un système corrompu vous marquera.