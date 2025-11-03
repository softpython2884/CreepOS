
export type FileSystemNode = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileSystemNode[];
    content?: string;
    isLocked?: boolean;
    password?: string;
    isSystemFile?: boolean;
};

// A clean file system for the new game
export const initialFileSystem: FileSystemNode[] = [
    {
        id: 'folder-home',
        name: 'home',
        type: 'folder',
        children: [
            {
                id: 'folder-user',
                name: '<user>', // This will be replaced dynamically
                type: 'folder',
                children: [
                    {
                        id: 'folder-docs',
                        name: 'docs',
                        type: 'folder',
                        children: [
                            { id: 'file-notes', name: 'notes.txt', type: 'file', content: 'My personal notes...' }
                        ]
                    },
                    {
                        id: 'folder-photos',
                        name: 'photos',
                        type: 'folder',
                        children: []
                    },
                    {
                        id: 'folder-trash',
                        name: 'trash',
                        type: 'folder',
                        children: [
                            { id: 'file-exploit', name: 'exploit.bin', type: 'file', content: 'corrupted data...' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'folder-sys',
        name: 'sys',
        type: 'folder',
        children: [
            { id: 'file-kernel', name: 'kernel.sim', type: 'file', content: 'SYSTEM KERNEL [ENCRYPTED]', isSystemFile: true },
            { id: 'file-uiconfig', name: 'ui.config', type: 'file', content: 'UI Configuration...', isSystemFile: true },
            { id: 'file-neoprofile', name: 'neo_profile.asc', type: 'file', content: 'NEO PROFILE DATA - CORRUPTED', isSystemFile: true }
        ]
    },
    {
        id: 'folder-bin',
        name: 'bin',
        type: 'folder',
        children: [
            { id: 'file-viewer', name: 'viewer.bin', type: 'file', content: 'Binary executable', isSystemFile: true },
            { id: 'file-player', name: 'player.anscii.bin', type: 'file', content: 'Binary executable', isSystemFile: true },
            { id: 'file-analyzer', name: 'analyzer.bin', type: 'file', content: 'Binary executable', isSystemFile: true },
            { id: 'file-nano', name: 'nano.bin', type: 'file', content: 'Text editor executable', isSystemFile: true },
        ]
    },
    {
        id: 'folder-logs',
        name: 'logs',
        type: 'folder',
        children: [
            { id: 'file-accesslog', name: 'access.log', type: 'file', content: 'USER <user> logged in.' },
            { id: 'file-systemlog', name: 'system.log', type: 'file', content: 'System boot successful.' },
            { id: 'file-auditlog', name: 'audit.log', type: 'file', content: 'No integrity violations detected.' }
        ]
    }
];

export const documents = [];
