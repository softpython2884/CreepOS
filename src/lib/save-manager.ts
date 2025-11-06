
'use client';

import { PC } from './network/types';
import { network as initialNetwork } from './network';

export interface GameState {
    network: PC[];
    hackedPcs: Set<string>;
    machineState?: string;
}

const initialGameState: GameState = {
    network: JSON.parse(JSON.stringify(initialNetwork)), // Deep copy
    hackedPcs: new Set(['player-pc']),
};

export const saveGameState = (username: string, gameState: GameState) => {
    try {
        const stateToSave = {
            ...gameState,
            hackedPcs: Array.from(gameState.hackedPcs), // Convert Set to Array for JSON
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
                hackedPcs: new Set(parsedState.hackedPcs || ['player-pc']), // Convert Array back to Set
            };
        }
    } catch (error) {
        console.error("Failed to load game state:", error);
    }
    // Return initial state if no save found or on error
    return initialGameState;
};

export const deleteGameState = (username: string) => {
    try {
        localStorage.removeItem(`gameState_${username}`);
    } catch (error) {
        console.error("Failed to delete game state:", error);
    }
};
