import { WebSocket } from 'ws';

// Extend WebSocket type to include custom properties
export interface ExtendedWebSocket extends WebSocket {
  companyId?: string;
}

// Export the companyClients map so it can be accessed from other modules
export const companyClients = new Map<string, Set<ExtendedWebSocket>>();
