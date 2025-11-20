
import type { Email, Attachment } from '@/components/apps/email-client';

export interface CallMessage {
    speaker: string; // e.g., 'Operator', 'Néo'
    text: string;
}

type ConsequenceTrigger = 
    | { type: 'call'; script: CallScript }
    | { type: 'email'; email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> };

export interface CallChoice {
    id: string;
    text: string;
    nextNode: string;
    consequences?: {
        danger?: number;
        triggerEmail?: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>;
        triggerSound?: 'tension';
        endCallAndTrigger?: ConsequenceTrigger;
    };
}

export interface CallNode {
    message: CallMessage;
    choices?: CallChoice[];
    consequences?: {
        triggerEmail?: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'>;
        triggerSound?: 'tension';
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

    