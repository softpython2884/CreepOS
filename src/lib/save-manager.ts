
'use client';

import { PC, FileSystemNode } from './network/types';
import { network as initialNetwork } from './network';
import { Email } from '@/components/apps/email-client';

export const SAVE_VERSION = 2;
const VERSION_KEY = 'saveVersion';

export interface GameState {
    network: PC[];
    hackedPcs: Set<string>;
    discoveredPcs: Set<string>;
    emails: Email[];
    isNeoInstalled: boolean;
    machineState?: string;
    dangerLevel?: number;
}

const defaultInitialEmails: Email[] = [
  {
    id: 'welcome-email',
    sender: 'RH@recherche-lab.net',
    recipient: 'Dr.Omen@recherche-lab.net',
    subject: 'Bienvenue - 47e jour',
    body: `Cher Dr. Omen,\n\nAu nom de toute l'équipe Nexus, nous sommes heureux de vous accueillir pour votre 47e jour de mission.\n\nVotre première tâche est de vous familiariser avec le système NÉO. Voici vos identifiants pour accéder au portail de téléchargement :\n\nSite : neo.nexus (accessible via le navigateur Hypnet)\nUtilisateur : dromen\nMot de passe : nexus-init-key\n\nConsultez le portail pour obtenir les instructions de déploiement de NÉO. Un superviseur vous contactera sous peu pour un briefing.\n\nCordialement,\nLes Ressources Humaines de Nexus`,
    timestamp: new Date(new Date().getTime() - 10 * 60000).toISOString(),
    folder: 'inbox',
  },
  {
    id: 'supervisor-email-initial',
    sender: 'Dr.Vance@recherche-lab.net',
    recipient: 'Dr.Omen@recherche-lab.net',
    subject: 'Appel programmé',
    body: `Omen,\n\nJ'ai planifié un appel avec vous aujourd'hui pour passer en revue vos objectifs. Soyez prêt.\n\n- Dr. Vance, Superviseur`,
    timestamp: new Date(new Date().getTime() - 5 * 60000).toISOString(),
    folder: 'inbox',
  },
];

const initialGameState: GameState = {
    network: JSON.parse(JSON.stringify(initialNetwork)),
    hackedPcs: new Set(['player-pc']),
    discoveredPcs: new Set(['player-pc']),
    emails: defaultInitialEmails,
    isNeoInstalled: false,
    machineState: 'off',
    dangerLevel: 0,
};

const buildFreshState = (): GameState => ({
    network: JSON.parse(JSON.stringify(initialNetwork)),
    hackedPcs: new Set(['player-pc']),
    discoveredPcs: new Set(['player-pc']),
    emails: defaultInitialEmails.map(e => ({ ...e })),
    isNeoInstalled: false,
    machineState: 'off',
    dangerLevel: 0,
});

// Wipes any save that does not match the current SAVE_VERSION.
// Called once at app boot from page.tsx.
export const ensureSaveVersion = (): boolean => {
    try {
        const current = localStorage.getItem(VERSION_KEY);
        if (current !== String(SAVE_VERSION)) {
            // Clear every game-related key, not just gameState_*
            const toRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (key.startsWith('gameState_') || key === 'hasPlayedIntro_v1' || key === 'hasMadeSupervisorCall1') {
                    toRemove.push(key);
                }
            }
            toRemove.forEach(k => localStorage.removeItem(k));
            localStorage.setItem(VERSION_KEY, String(SAVE_VERSION));
            return true;
        }
    } catch (error) {
        console.error("Save version check failed:", error);
    }
    return false;
};

export const saveGameState = (username: string, gameState: Omit<GameState, 'hackedPcs' | 'discoveredPcs'> & { hackedPcs?: Set<string> | string[], discoveredPcs?: Set<string> | string[] }) => {
    try {
        const stateToSave = {
            ...gameState,
            hackedPcs: Array.from(gameState.hackedPcs || []),
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
            return {
                ...parsedState,
                network: parsedState.network || JSON.parse(JSON.stringify(initialNetwork)),
                hackedPcs: new Set(parsedState.hackedPcs || ['player-pc']),
                discoveredPcs: new Set(parsedState.discoveredPcs || ['player-pc']),
                emails: parsedState.emails && parsedState.emails.length > 0 ? parsedState.emails : defaultInitialEmails.map(e => ({ ...e })),
                isNeoInstalled: parsedState.isNeoInstalled || false,
                dangerLevel: typeof parsedState.dangerLevel === 'number' ? parsedState.dangerLevel : 0,
            };
        }
    } catch (error) {
        console.error("Failed to load game state:", error);
        deleteGameState(username);
    }
    return buildFreshState();
};

export const deleteGameState = (username: string) => {
    try {
        localStorage.removeItem(`gameState_${username}`);
    } catch (error) {
        console.error("Failed to delete game state:", error);
    }
};
