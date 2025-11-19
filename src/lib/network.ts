
import playerPc from './network/pcs/player-pc.json';
import holbertonGateway from './network/pcs/holberton-gateway.json';
import workstation01 from './network/pcs/workstation-01.json';
import corporateProxy from './network/pcs/corporate-proxy.json';
import hypnetSearch from './network/pcs/hypnet-search.json';
import cheatPc from './network/pcs/cheat-pc.json';
import { type PC } from './network/types';

export const network: PC[] = [
    playerPc,
    holbertonGateway,
    workstation01,
    corporateProxy,
    hypnetSearch,
    cheatPc,
];
