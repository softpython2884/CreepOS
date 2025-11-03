
export type FileSystemNode = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileSystemNode[];
    content?: string;
    isLocked?: boolean;
    password?: string;
};

// A clean file system for the new game
export const initialFileSystem: FileSystemNode[] = [
    {
        id: 'folder-documents',
        name: 'Documents',
        type: 'folder',
        children: [
            {
                id: 'welcome.txt',
                name: 'welcome.txt',
                type: 'file',
                content: `Bienvenue, Opérateur.

Votre nouvelle mission commence. Explorez le système, analysez les données et attendez vos instructions.

Néo est à votre disposition pour vous assister.`,
            },
        ],
    },
    {
        id: 'folder-system',
        name: 'System',
        type: 'folder',
        children: []
    }
];

export const documents = [];
