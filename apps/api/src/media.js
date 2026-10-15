import { randomUUID } from 'node:crypto';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// Room identity is opaque and never derived from the publicly shared invite code.
export function isMediaConfigured() {
  return Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}
function config() {
  if (!isMediaConfigured()) throw new Error('LiveKit Cloud is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to the Render API environment.');
  const u = new URL(process.env.LIVEKIT_URL);
  if (!['wss:', 'https:'].includes(u.protocol)) throw new Error('LIVEKIT_URL must start with wss:// or https://.');
  return { url: u.href.replace(/\/$/, ''), key: process.env.LIVEKIT_API_KEY, secret: process.env.LIVEKIT_API_SECRET };
}
function roomFor(id) { return 'sb_' + id.replace(/[^a-f\d]/g, '').slice(0, 36); }
export async function createMediaTickets(sessionId) {
  const { url, key, secret } = config();
  const roomName = roomFor(sessionId);
  async function token(role) {
    const jwt = new AccessToken(key, secret, {
      identity: role + '_' + randomUUID(),
      ttl: '2m',
      name: role === 'host' ? 'Sharer' : 'Approved viewer'
    });
    jwt.addGrant({
      roomJoin: true, room: roomName,
      canPublish: role === 'host',
      // LiveKit server-sdk expects protobuf TrackSource enum values (3 and 4), not browser track-source strings.
      canPublishSources: role === 'host' ? [3, 4] : [],
      canSubscribe: role === 'viewer',
      canPublishData: false
    });
    return { url, token: await jwt.toJwt() };
  }
  const [host, viewer] = await Promise.all([token('host'), token('viewer')]);
  return { host, viewer };
}
export async function closeMediaRoom(sessionId) {
  if (!isMediaConfigured()) return;
  const {url,key,secret} = config();
  const api = new RoomServiceClient(url.replace(/^wss:/, 'https:'), key, secret);
  try { await api.deleteRoom(roomFor(sessionId)); }
  catch (error) { console.warn('LiveKit room cleanup:', error?.message || error); }
}
