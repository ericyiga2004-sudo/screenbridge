import { io } from 'socket.io-client';

// Empty means same-origin development through Vite's /api and /socket.io proxy.
// In production point VITE_API_URL to the public HTTPS Render service origin.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

export function createSocket() {
  return io(API_ORIGIN || undefined, {
    path: '/socket.io',
    autoConnect: false,
    reconnectionAttempts: 12,
    timeout: 12000,
  });
}

export async function fetchIceConfig() {
  const response = await fetch(`${API_ORIGIN}/api/ice-config`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load network configuration. Check your ScreenBridge API.');
  const data = await response.json();
  if (!Array.isArray(data.iceServers)) throw new Error('Invalid network configuration from the API.');
  return { iceServers: data.iceServers };
}

export function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(10000).emit(event, payload, (error, result) => {
      if (error) reject(new Error('Server did not respond. Check the connection.'));
      else if (!result?.ok) reject(new Error(result?.error || 'Request failed'));
      else resolve(result);
    });
  });
}
