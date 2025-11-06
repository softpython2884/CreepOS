

export type PC_Type = 'Desktop' | 'Laptop' | 'Server' | 'Mobile' | 'WebServer';
export type PortType = 'HTTP' | 'FTP' | 'SSH' | 'SMTP' | 'UNKNOWN' | 'SQL';

export interface Port {
    port: number;
    service: PortType;
    isOpen: boolean;
}

export interface FileSystemNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileSystemNode[];
    content?: string;
    isLocked?: boolean;
    password?: string;
    isSystemFile?: boolean;
}

export interface PC {
    id: string;
    name: string;
    ip: string;
    type: PC_Type;
    links?: string[]; // IDs of other PCs it's connected to
    auth: {
        user: 'admin' | 'root' | string;
        pass: string;
    };
    firewall: {
        enabled: boolean;
        complexity: number; // e.g., 1-10
        solution?: string;
    };
    proxy: {
        enabled: boolean;
        level: number; // e.g., 1-5
    };
    traceTime: number; // seconds, 0 for no trace
    requiredPorts: number;
    ports: Port[];
    fileSystem: FileSystemNode[];
    traceability?: number; // How much danger is added if logs are not cleared
    domain?: string;
    websiteContent?: string;
    isDangerous?: boolean;
}
