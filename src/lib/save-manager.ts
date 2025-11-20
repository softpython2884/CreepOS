
'use client';

import { PC, FileSystemNode } from './network/types';
import { network as initialNetwork } from './network';
import { Email } from '@/components/apps/email-client';

export interface GameState {
    network: PC[];
    hackedPcs: Set<string>;
    discoveredPcs: Set<string>;
    emails: Email[];
    machineState?: string;
}

const initialGameState: GameState = {
    network: JSON.parse(JSON.stringify(initialNetwork)), // Deep copy
    hackedPcs: new Set(['player-pc']),
    discoveredPcs: new Set(['player-pc']),
    emails: [],
    machineState: 'off',
};

export const saveGameState = (username: string, gameState: Omit<GameState, 'hackedPcs' | 'discoveredPcs'> & { hackedPcs: Set<string> | string[], discoveredPcs: Set<string> | string[] }) => {
    try {
        const stateToSave = {
            ...gameState,
            hackedPcs: Array.from(gameState.hackedPcs), // Convert Set to Array for JSON
            discoveredPcs: Array.from(gameState.discoveredPcs),
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
                hackedPcs: new Set(parsedState.hackedPcs || ['player-pc']), // Convert Array back to Set
                discoveredPcs: new Set(parsedState.discoveredPcs || ['player-pc']),
                emails: parsedState.emails || [],
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
        discoveredPcs: new Set(['player-pc']),
    };
};

export const deleteGameState = (username: string) => {
    try {
        localStorage.removeItem(`gameState_${username}`);
    } catch (error) {
        console.error("Failed to delete game state:", error);
    }
};
