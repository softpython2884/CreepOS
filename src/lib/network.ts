import playerPc from './network/pcs/player-pc.json';
import holbertonGateway from './network/pcs/holberton-gateway.json';
import workstation01 from './network/pcs/workstation-01.json';
import corporateProxy from './network/pcs/corporate-proxy.json';
import hypnetSearch from './network/pcs/hypnet-search.json';
import cheatPc from './network/pcs/cheat-pc.json';
import neoDevNode from './network/pcs/neo-dev-node.json';
import alexToolbox from './network/pcs/alex-toolbox.json';
import blackwireTarget from './network/pcs/blackwire-target.json';
import blackwireDropzone from './network/pcs/blackwire-dropzone.json';
import chattoutpeteServer from './network/pcs/chattoutpete-server.json';
import { type PC } from './network/types';

export const network: PC[] = [
    playerPc,
    holbertonGateway,
    workstation01,
    corporateProxy,
    hypnetSearch,
    cheatPc,
    neoDevNode,
    alexToolbox,
    blackwireTarget,
    blackwireDropzone,
    chattoutpeteServer,
];
