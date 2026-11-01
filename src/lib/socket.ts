import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '../api/client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const token = getAuthToken();
    socketInstance = io(window.location.origin, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      const currentToken = getAuthToken();
      if (currentToken) {
        socketInstance?.emit('auth:authenticate', { token: currentToken });
      }
    });
  }
  return socketInstance;
}

export function updateSocketAuth(token: string | null) {
  if (!socketInstance) return;
  socketInstance.auth = { token };
  if (token && socketInstance.connected) {
    socketInstance.emit('auth:authenticate', { token });
  }
}
