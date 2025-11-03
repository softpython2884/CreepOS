
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
        id: 'pc-holberton-gateway',
        name: 'Holberton School Gateway',
        ip: '192.168.1.1',
        type: 'Server',
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
    }
];
