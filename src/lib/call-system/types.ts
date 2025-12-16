import type { Email } from '@/components/apps/email-client';
import type { CallScript as CallScriptType } from './types'; // Self-reference for recursive types

export type CallParticipant = 'Operator' | 'Néo' | 'Superviseur' | 'Directeur' | 'Alex' | 'Blackwire Agent' | 'Dr. Omen' | string;

export interface CallMessage {
    speaker: CallParticipant;
    text: string;
}

export type EndgameType = 'credits' | 'wait_for_death' | 'self_destruct' | 'flee' | 'true_ending';

export type ConsequenceTrigger = 
    | { type: 'call'; script: CallScriptType }
    | { type: 'email'; email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> }
    | { type: 'trace'; duration: number }
    | { type: 'alarm', duration: number, nextCall?: CallScriptType, alertEmail?: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> }
    | { type: 'endgame', endType: EndgameType, lines?: string[] }
    | { type: 'machine_state', state: string, email?: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> };

export interface CallChoice {
    id: string;
    text: string;
    nextNode: string;
    consequences?: {
        danger?: number;
        triggerEmail?: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>;
        triggerSound?: 'tension' | 'glitch' | 'lag';
        startInstability?: boolean;
        endCallAndTrigger?: ConsequenceTrigger;
    };
}

export interface CallNode {
    id: string;
    message: CallMessage;
    choices?: CallChoice[];
    consequences?: {
        triggerEmail?: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>;
        triggerSound?: 'tension' | 'glitch' | 'lag';
        startInstability?: boolean;
        endCallAndTrigger?: ConsequenceTrigger;
    }
}

export interface CallScript {
    id: string;
    interlocutor: string;
    isSecure: boolean;
    startNode: string;
    nodes: Record<string, CallNode>;
}

export interface Call {
    interlocutor: string;
    isSecure: boolean;
    messages: CallMessage[];
    choices: CallChoice[];
    isFinished?: boolean;
}
