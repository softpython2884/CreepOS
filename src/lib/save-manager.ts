
'use client';

import { PC, FileSystemNode } from './network/types';
import { network as initialNetwork } from './network';
import { Email } from '@/components/apps/email-client';

export interface GameState {
    network: PC[];
    hackedPcs: Set<string>;
    discoveredPcs: Set<string>;
    emails: Email[];
    isNeoInstalled?: boolean;
    machineState?: string;
}

const initialGameState: GameState = {
    network: JSON.parse(JSON.stringify(initialNetwork)), // Deep copy
    hackedPcs: new Set(['player-pc']),
    discoveredPcs: new Set(['player-pc']),
    emails: [],
    isNeoInstalled: false,
    machineState: 'off',
};

export const saveGameState = (username: string, gameState: Omit<GameState, 'hackedPcs' | 'discoveredPcs'> & { hackedPcs?: Set<string> | string[], discoveredPcs?: Set<string> | string[] }) => {
    try {
        const stateToSave = {
            ...gameState,
            hackedPcs: Array.from(gameState.hackedPcs || []), // Convert Set to Array for JSON
            discoveredPcs: Array.from(gameState.discoveredPcs || []),
        };
        localStorage.setItem(`gameState_${username}`, JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Failed to save game state:", error);
    }
};

export const loadGameState = (username: string): GameState => {
    try {
        const savedStateJSON = localStorage.getItem(`gameState_${username}`);
        if (savedStateJSON) {
            const parsedState = JSON.parse(savedStateJSON);
            const defaultInitialEmails = [
              {
                id: 'welcome-email',
                sender: 'RH@recherche-lab.net',
                recipient: 'Dr.Omen@recherche-lab.net',
                subject: 'Bienvenue et instructions',
                body: `Cher Dr. Omen,\n\nAu nom de toute l'équipe Nexus, nous sommes heureux de vous accueillir.\n\nVotre première mission est de vous familiariser avec le système NÉO. Voici vos identifiants pour accéder au portail de téléchargement :\n\nSite : neo.nexus (accessible via le navigateur Hypnet)\nUtilisateur : dromen\nMot de passe : nexus-init-key\n\nConsultez le portail pour obtenir les instructions de déploiement de NÉO. Un superviseur vous contactera sous peu pour un briefing.\n\nCordialement,\nLes Ressources Humaines de Nexus`,
                timestamp: new Date(new Date().getTime() - 10 * 60000).toISOString(),
                folder: 'inbox',
              },
              {
                id: 'supervisor-email-initial',
                sender: 'Superviseur@recherche-lab.net',
                recipient: 'Dr.Omen@recherche-lab.net',
                subject: 'Appel programmé',
                body: `Omen,\n\nJ'ai planifié un appel avec vous aujourd'hui pour passer en revue vos objectifs. Soyez prêt.\n\n- Superviseur`,
                timestamp: new Date(new Date().getTime() - 5 * 60000).toISOString(),
                folder: 'inbox',
              },
            ];
            
            return {
                ...parsedState,
                network: parsedState.network || JSON.parse(JSON.stringify(initialNetwork)),
                hackedPcs: new Set(parsedState.hackedPcs || ['player-pc']), // Convert Array back to Set
                discoveredPcs: new Set(parsedState.discoveredPcs || ['player-pc']),
                emails: parsedState.emails && parsedState.emails.length > 0 ? parsedState.emails : defaultInitialEmails,
                isNeoInstalled: parsedState.isNeoInstalled || false,
            };
        }
    } catch (error) {
        console.error("Failed to load game state:", error);
        // If loading fails, delete corrupted save
        deleteGameState(username);
    }
    // Return initial state if no save found or on error
    return {
        ...initialGameState,
        network: JSON.parse(JSON.stringify(initialNetwork)), // ensure deep copy
        hackedPcs: new Set(['player-pc']),
        discoveredPcs: new Set(['player-pc']),
        emails: initialGameState.emails.length > 0 ? initialGameState.emails : [
            {
              id: 'welcome-email',
              sender: 'RH@recherche-lab.net',
              recipient: 'Dr.Omen@recherche-lab.net',
              subject: 'Bienvenue et instructions',
              body: `Cher Dr. Omen,\n\nAu nom de toute l'équipe Nexus, nous sommes heureux de vous accueillir.\n\nVotre première mission est de vous familiariser avec le système NÉO. Voici vos identifiants pour accéder au portail de téléchargement :\n\nSite : neo.nexus (accessible via le navigateur Hypnet)\nUtilisateur : dromen\nMot de passe : nexus-init-key\n\nConsultez le portail pour obtenir les instructions de déploiement de NÉO. Un superviseur vous contactera sous peu pour un briefing.\n\nCordialement,\nLes Ressources Humaines de Nexus`,
              timestamp: new Date(new Date().getTime() - 10 * 60000).toISOString(),
              folder: 'inbox',
            },
            {
              id: 'supervisor-email-initial',
              sender: 'Superviseur@recherche-lab.net',
              recipient: 'Dr.Omen@recherche-lab.net',
              subject: 'Appel programmé',
              body: `Omen,\n\nJ'ai planifié un appel avec vous aujourd'hui pour passer en revue vos objectifs. Soyez prêt.\n\n- Superviseur`,
              timestamp: new Date(new Date().getTime() - 5 * 60000).toISOString(),
              folder: 'inbox',
            },
        ],
    };
};

export const deleteGameState = (username: string) => {
    try {
        localStorage.removeItem(`gameState_${username}`);
    } catch (error) {
        console.error("Failed to delete game state:", error);
    }
};
