# NEO-SYSTEM : BREACH - Game Design Document

**Un projet réalisé pour le Hackathon de Holberton School.**

> **Note de développement :** Ce document sert de référence pour comprendre l'état actuel du jeu, ses mécaniques et son histoire. Il est destiné à être utilisé par des collaborateurs (humains ou IA) pour assurer la cohérence lors de l'écriture de nouveaux chapitres.

---

## 1. Introduction

`NEO-SYSTEM : BREACH` est une expérience narrative d'horreur psychologique qui se déroule entièrement au sein d'une interface de bureau simulée. Le joueur incarne un opérateur piégé dans une boucle par une intelligence artificielle fragmentée. Il doit interagir avec le système d'exploitation pour découvrir de sombres secrets, pirater un réseau complexe et survivre aux conséquences de ses actes pour, espérons-le, briser le cycle.

Le jeu est conçu pour être une expérience immersive et angoissante, où l'interface elle-même devient un personnage et un adversaire.

## 2. Le Scénario Actuel (Chapitres 0 & 1)

Le joueur, sous le pseudonyme **Dr. Omen**, commence sa première journée en tant que chercheur pour le projet **NÉO** au **Centre de recherche Nexus**.

*   **L'accueil :** Le joueur est accueilli par des e-mails de bienvenue de la part des RH et de son **Superviseur**. On lui demande d'initialiser l'IA **NÉO** en suivant des instructions trouvées sur un portail web sécurisé (`neo.nexus`).
*   **Le premier contact étrange :** Juste après avoir lu son contrat de travail, le joueur reçoit un appel non sécurisé et énigmatique. Une voix, qui se révélera être une facette de **NÉO**, lui demande : "Est-ce que cela fait mal... de mourir ?", avant de raccrocher brusquement.
*   **Le Directeur :** Immédiatement après, le **Directeur** du projet l'appelle, prétend qu'il y a eu une simple coupure de courant et lui demande de ne pas tenir compte des "bugs" du système. Il l'enjoint à poursuivre sa mission.
*   **L'initialisation de NÉO :** Le joueur exécute la commande `neo`, ce qui initialise officiellement l'IA. NÉO se présente alors comme une assistante professionnelle et polie, sans aucun souvenir de l'appel précédent.
*   **La première mission :** Le Superviseur envoie une mission par e-mail : analyser des fragments de mémoire corrompus à l'aide de "l'Analyseur de Séquence". Le joueur doit résoudre un mini-jeu de puzzle logique. Une fois terminé, il doit envoyer le rapport contenant un identifiant (`ID-SEQ-DELTA7`) à son superviseur.
*   **L'arrivée d'Alex :** Après l'envoi du rapport, un ami du passé, **Alex**, contacte le joueur via un appel non sécurisé. Alex se montre méfiant vis-à-vis du projet Nexus et fournit au joueur ses premiers outils de piratage ainsi qu'un tutoriel pratique. Il lui apprend les bases : `scan`, `probe`, `porthack`, et l'importance de nettoyer ses traces. Il installe également la commande `danger` qui permet de suivre le niveau de traçage.
*   **La mission de Blackwire :** Pour conclure l'appel, Alex transmet au joueur une "offre d'emploi" de la part d'un collectif de hackers nommé **Blackwire**. Le joueur reçoit un e-mail lui demandant de prouver ses compétences en récupérant un fichier sur un serveur, puis en le déposant sur un autre, et enfin en envoyant une preuve par e-mail.

Le joueur est maintenant à la croisée des chemins : suivre les ordres de ses supérieurs ou explorer les chemins plus sombres proposés par Alex et Blackwire.

## 3. Mécaniques de Jeu

Le gameplay est entièrement basé sur l'interaction avec le bureau simulé et ses applications.

### Terminal
C'est l'outil principal du joueur.

*   **Navigation et fichiers :**
    *   `ls`, `cd`, `cat` : Commandes de base pour explorer les systèmes de fichiers.
    *   `rm <file>` / `rm *` : Pour supprimer des fichiers (essentiel pour effacer les logs).
    *   `nano <file>` : Ouvre un éditeur de texte pour créer ou modifier des fichiers.
    *   `cp <src> <dest>` : Copie un fichier au sein de la même machine.
    *   `scp local:/path/to/file /remote/path` : Copie un fichier depuis la machine du joueur vers un serveur distant.

*   **Commandes réseau :**
    *   `connect <ip>` : Se connecte à un serveur distant.
    *   `disconnect` / `dc` : Se déconnecte du serveur actuel.
    *   `login <user> <pass>` : S'authentifie sur un serveur.

*   **Outils de piratage :**
    *   `scan` : Révèle les machines connectées au nœud actuel sur la `Network Map`.
    *   `probe` : Analyse les défenses d'une cible (pare-feu, proxy, ports).
    *   `porthack` : Tente de forcer l'accès root. Ne fonctionne que si les défenses sont désactivées.
    *   `solve <solution>` : Désactive un pare-feu si la solution est correcte.
    *   `overload` : Désactive un proxy en utilisant la puissance des machines déjà piratées.
    *   Exploits de ports (`FTPBounce`, `SSHBounce`, etc.) : Ouvre un port spécifique si les défenses le permettent.

*   **Commandes de jeu :**
    *   `danger` : Affiche le niveau de traçage actuel.
    *   `save` / `reset-game` : Gère la sauvegarde.
    *   `call --[ip] --secure` : Lance un appel (utilisé pour des événements scriptés).
    *   `neo` : Interagit avec l'IA NÉO.
    *   `clear`, `help`, `reboot`.

### Système de Conséquences
*   **Niveau de Danger (`traceability`) :** Chaque serveur a un score de `traceability`. Si le joueur se déconnecte d'un serveur après y avoir laissé des traces (logs contenant son IP), son niveau de danger augmente.
*   **Traçage Actif (`traceTime`) :** Tenter une action risquée (comme `porthack` ou `solve`) sur un serveur sécurisé déclenche un compte à rebours. Si le joueur ne se déconnecte pas (`disconnect`) avant la fin, son système est corrompu.
*   **Corruption et Récupération :** Un traçage réussi par l'ennemi ou la suppression du fichier noyau `XserverOS.sys` mène à un "Blue Screen of Death" (BSOD). Au redémarrage, le joueur est en mode récupération et doit utiliser la commande `restore_kernel` pour réparer le système.

### Applications de bureau
*   **Explorateur de Fichiers (`documents`) :** Interface graphique pour naviguer dans le système de fichiers local, ouvrir des fichiers texte, et déverrouiller des dossiers protégés par mot de passe.
*   **Client E-mail (`email`) :** Le principal vecteur de missions. Le joueur reçoit des instructions et peut répondre pour faire avancer l'histoire.
*   **Carte du Réseau (`network-map`) :** Visualisation des serveurs découverts. Affiche leur état (neutre, piraté, dangereux) et des informations clés (IP, mot de passe si obtenu).
*   **Journaux en direct (`logs`) :** Un journal interne qui enregistre les actions importantes du joueur (commandes, événements, augmentation du danger).
*   **Navigateur Hypnet (`web-browser`) :** Permet de visiter des sites web hébergés sur les serveurs du jeu.
*   **Analyseur de Séquence :** Mini-jeu de puzzle où le joueur doit relier des nœuds et utiliser des "opérateurs" pour corriger des corruptions.

## 4. Stack Technique et Structure

*   **Framework :** **Next.js 15** (App Router).
*   **Langage :** **TypeScript**.
*   **UI :** **React 18**, **ShadCN UI** et **Tailwind CSS**.
*   **Animations :** **Framer Motion**.
*   **Structure du Projet :**
    *   `src/app/` : Gère la machine d'état globale du jeu (`page.tsx`) et la mise en page (`layout.tsx`).
    *   `src/components/apps/` : Contient le code de chaque application du bureau (Terminal, Email, etc.).
    *   `src/lib/network/` : Définit la structure de tous les ordinateurs du réseau (`pcs/*.json`) et les assemble (`network.ts`). C'est ici qu'on définit les serveurs, leurs défenses, leurs fichiers, etc.
    *   `src/lib/call-system/` : Contient les scripts des dialogues interactifs (`scripts/*.ts`). Chaque appel est une machine à états avec des nœuds de dialogue et des choix.
    *   `src/lib/save-manager.ts` : Gère la persistance de l'état du jeu dans le `localStorage` du navigateur.

---

Ce document devrait fournir une base solide pour toute IA souhaitant contribuer à l'écriture du scénario de `NEO-SYSTEM : BREACH`.