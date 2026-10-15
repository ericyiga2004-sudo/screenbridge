// Read only standardized counters. Missing measurements stay null, never invented zeroes.
export function readInboundReport(report) {
  const rows = report ? Array.from(report.values()) : [];
  const inbound = rows.find(r => r.type === 'inbound-rtp' && (r.kind === 'video' || r.mediaType === 'video'));
  const codec = inbound && rows.find(r => r.type === 'codec' && r.id === inbound.codecId);
  const number = key => Number.isFinite(inbound?.[key]) ? inbound[key] : null;
  return {codec: codec?.mimeType || null, bytes: number('bytesReceived'), packets: number('packetsReceived'),
    framesReceived: number('framesReceived'), framesDecoded: number('framesDecoded'), framesDropped: number('framesDropped'),
    fps: number('framesPerSecond'), width: number('frameWidth'), height: number('frameHeight')};
}
// Diagnostic-only read of LiveKit's subscriber transport. Do not expose SDP,
// ICE candidate addresses or access tokens in the UI/report.
export function subscriberTransportSnapshot(room) {
  const transport = room?.engine?.pcManager?.subscriber;
  if (!transport) return {subscriberPC:null,subscriberICE:null,subscriberSignaling:null,
    subscriberVideoMLine:null,subscriberVideoTransceivers:null};
  const safe = fn => {try{return fn();}catch{return null;}};
  const remote = safe(()=>transport.getRemoteDescription?.());
  const transceivers = safe(()=>transport.getTransceivers?.());
  return {
    subscriberPC:safe(()=>transport.getConnectionState?.()) ?? null,
    subscriberICE:safe(()=>transport.getICEConnectionState?.()) ?? null,
    subscriberSignaling:safe(()=>transport.getSignallingState?.()) ?? null,
    subscriberVideoMLine:remote?.sdp ? /(?:^|\\r?\\n)m=video /.test(remote.sdp) : null,
    subscriberVideoTransceivers:Array.isArray(transceivers)
      ? transceivers.filter(t=>t.receiver?.track?.kind==='video').length : null
  };
}
export function receiverCodecCapabilities(){
  try{
    if(typeof RTCRtpReceiver==='undefined'||typeof RTCRtpReceiver.getCapabilities!=='function') return null;
    const capabilities=RTCRtpReceiver.getCapabilities('video');
    if(!capabilities?.codecs?.length)return null;
    return Array.from(new Set(capabilities.codecs.map(c=>c.mimeType?.toLowerCase()).filter(Boolean)
      .filter(c=>['video/h264','video/vp8','video/vp9','video/av1'].includes(c))));
  }catch{return null;}
}
export function roomSnapshot(room) {
  const publications = Array.from(room.remoteParticipants.values()).flatMap(p => Array.from(p.trackPublications.values()));
  const video = publications.find(p => p.source === 'screen_share' && p.kind === 'video');
  return {connection:room.state, participants:room.remoteParticipants.size, publication:!!video, ...subscriberTransportSnapshot(room), supportedVideoCodecs:receiverCodecCapabilities(),
    sid:video?.trackSid || null, source:video?.source || null, kind:video?.kind || null,
    subscription:video?.subscriptionStatus || 'no publication', permission:video?.permissionStatus || null,
    muted:video?.isMuted ?? null};
}
export function mediaWarning(d, playback) {
  if (d.connection !== 'connected') return 'Media room is not connected.';
  if (!d.publication) return 'No screen video published in this room. Check the host preview.';
  if (d.subscription !== 'subscribed') return 'Screen published, but subscription is not established.';
  if (d.bytes === 0) return 'Subscribed, but no video bytes received. Check the media network connection.';
  if (d.bytes > 0 && d.framesDecoded === 0) return 'Video bytes arrive, but no frames decode. Test the host Compatibility profile.';
  if (playback?.paused) return 'Playback is paused. Tap Resume video.';
  if (playback?.ready < 2) return 'Waiting for playable video frames.';
  return '';
}
