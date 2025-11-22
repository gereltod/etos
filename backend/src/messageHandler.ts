import { v4 as uuidV4 } from "uuid";

// Store pending requests waiting for responses
export const pendingRequests = new Map<string, {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}>();

// Create a request and wait for response
export function waitForResponse(requestId: string, timeoutMs: number = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Request timeout'));
    }, timeoutMs);

    pendingRequests.set(requestId, {
      resolve,
      reject,
      timeout
    });
  });
}

// Resolve a pending request when response is received
export function resolveRequest(requestId: string, data: any) {
  const pending = pendingRequests.get(requestId);
  if (pending) {
    clearTimeout(pending.timeout);
    pending.resolve(data);
    pendingRequests.delete(requestId);
  }
}

// Generate unique request ID
export function generateRequestId(): string {
  return uuidV4();
}
