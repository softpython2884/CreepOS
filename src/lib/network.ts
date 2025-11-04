
export type PC_Type = 'Desktop' | 'Laptop' | 'Server' | 'Mobile' | 'WebServer';
export type PortType = 'HTTP' | 'FTP' | 'SSH' | 'SMTP' | 'UNKNOWN';

export interface Port {
    port: number;
    service: PortType;
    isOpen: boolean;
}

export interface PC {
    id: string;
    name: string;
    ip: string;
    type: PC_Type;
    links?: string[]; // IDs of other PCs it's connected to
    auth: {
        user: 'admin' | 'root';
        pass: string;
    };
    firewall: {
        enabled: boolean;
        complexity: number; // e.g., 1-10
    };
    proxy: {
        enabled: boolean;
        level: number; // e.g., 1-5
    };
    traceTime: number; // seconds, 0 for no trace
    requiredPorts: number;
    ports: Port[];
}

export const network: PC[] = [
    {
        id: 'player-pc',
        name: 'Operator\'s Terminal',
        ip: '127.0.0.1',
        type: 'Desktop',
        links: ['holberton-gateway'],
        auth: { user: 'root', pass: '' },
        firewall: { enabled: false, complexity: 0 },
        proxy: { enabled: false, level: 0 },
        traceTime: 0,
        requiredPorts: 0,
        ports: []
    },
    {
        id: 'holberton-gateway',
        name: 'Holberton School Gateway',
        ip: '192.168.1.1',
        type: 'Server',
        links: ['player-pc', 'workstation-01'],
        auth: {
            user: 'admin',
            pass: 'holberton'
        },
        firewall: {
            enabled: false,
            complexity: 0
        },
        proxy: {
            enabled: false,
            level: 0
        },
        traceTime: 0,
        requiredPorts: 0,
        ports: [
            { port: 80, service: 'HTTP', isOpen: false },
            { port: 443, service: 'HTTP', isOpen: false },
        ]
    },
    {
        id: 'workstation-01',
        name: 'Workstation-01',
        ip: '192.168.1.10',
        type: 'Desktop',
        links: ['holberton-gateway'],
        auth: { user: 'admin', pass: 'password123' },
        firewall: { enabled: true, complexity: 2 },
        proxy: { enabled: false, level: 0 },
        traceTime: 60,
        requiredPorts: 1, // Requires 1 port to be open
        ports: [
            { port: 22, service: 'SSH', isOpen: false }
        ]
    }
];
