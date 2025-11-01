'use client';

// This component is now empty as its logic has been moved to desktop.tsx
// for a simpler, more direct implementation of story progression.

export interface TerminalWriter {
    write: (content: string, type?: 'command' | 'output') => void;
    clear: () => void;
    lock: (locked: boolean) => void;
}

export default function ChapterTwoManager() {
    return null;
}
