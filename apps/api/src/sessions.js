import {randomBytes, randomUUID} from 'node:crypto';
import {audit} from './db.js';
import {isMediaConfigured, createMediaTickets, closeMediaRoom} from './media.js';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const sessions=new Map();
const MAX_IDLE_MS=12*60*1000;
const MAX_SESSIONS=1500;
function safeAck(cb,payload){ if(typeof cb==='function')cb(payload); }
function makeCode(){let code;do{code=Array.from(randomBytes(8),b=>ALPHABET[b%ALPHABET.length]).join('');}while(sessions.has(code));return code;}
function sanitizeCode(value){return String(value??'').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,8);}
function validName(input){return String(input??'Guest').replace(/[<>]/g,'').trim().slice(0,38)||'Guest';}
function limited(socket){const now=Date.now();const hits=socket.data.attempts??[];socket.data.attempts=hits.filter(t=>now-t<60000);if(socket.data.attempts.length>=10)return true;socket.data.attempts.push(now);return false;}
function leavePending(socket,io){const code=socket.data.pendingCode;if(!code)return;const session=sessions.get(code);if(session){session.pending.delete(socket.id);session.hostId && io.to(session.hostId).emit('session:request-removed',{requestId:socket.id});}socket.data.pendingCode=null;}
function finishHost(io,session){io.to(session.hostId).emit('session:ended',{reason:'Session ended'});if(session.viewerId){io.to(session.viewerId).emit('session:ended',{reason:'The sharer ended the session'});const viewer=io.sockets.sockets.get(session.viewerId);if(viewer){viewer.data.activeCode=null;viewer.data.role=null;}}
 for(const id of session.pending.keys()){io.to(id).emit('session:ended',{reason:'This sharing code has expired'});const s=io.sockets.sockets.get(id);if(s)s.data.pendingCode=null;}
 const host=io.sockets.sockets.get(session.hostId);if(host){host.data.activeCode=null;host.data.role=null;}
 sessions.delete(session.code);audit(session.id,'ended');void closeMediaRoom(session.id);}
function removeViewer(io,session){if(!session.viewerId)return;const viewer=io.sockets.sockets.get(session.viewerId);if(viewer){viewer.data.activeCode=null;viewer.data.role=null;}session.viewerId=null;io.to(session.hostId).emit('session:viewer-left');void closeMediaRoom(session.id);}
function cleanup(io,socket){leavePending(socket,io);const code=socket.data.activeCode;if(!code)return;const session=sessions.get(code);if(!session)return;if(session.hostId===socket.id){finishHost(io,session);}else if(session.viewerId===socket.id){removeViewer(io,session);}socket.data.activeCode=null;socket.data.role=null;}
export function registerSessions(io){
 // Empty, unclaimed invitations expire. A running stream is never automatically ended by this timer.
 const sweep=setInterval(()=>{for(const s of sessions.values()){if(!s.viewerId&&Date.now()-s.createdAt>MAX_IDLE_MS)finishHost(io,s);}},45_000);sweep.unref();
 io.on('connection',socket=>{
  socket.data.activeCode=null;socket.data.pendingCode=null;
  socket.on('session:create',(_,ack)=>{
   if(!isMediaConfigured())return safeAck(ack,{ok:false,error:'Video service is not connected yet. Configure your LiveKit Cloud credentials in Render and retry.'});
   if(socket.data.activeCode||socket.data.pendingCode)return safeAck(ack,{ok:false,error:'Leave the current session first.'});
   if(sessions.size>=MAX_SESSIONS)return safeAck(ack,{ok:false,error:'Service is busy. Please try later.'});
   const code=makeCode();const session={code,id:randomUUID(),hostId:socket.id,viewerId:null,pending:new Map(),createdAt:Date.now()};sessions.set(code,session);socket.data.activeCode=code;socket.data.role='host';audit(session.id,'created');safeAck(ack,{ok:true,code,expiresInMinutes:12});
  });
  socket.on('session:request-view',(payload,ack)=>{
   if(limited(socket))return safeAck(ack,{ok:false,error:'Too many attempts. Wait one minute.'});
   if(socket.data.activeCode||socket.data.pendingCode)return safeAck(ack,{ok:false,error:'Already in a session.'});
   const code=sanitizeCode(payload?.code);const session=sessions.get(code);
   if(!session||code.length!==8)return safeAck(ack,{ok:false,error:'No active session found for that code.'});
   if(session.hostId===socket.id)return safeAck(ack,{ok:false,error:'Open the viewer on another device or browser.'});
   if(session.viewerId)return safeAck(ack,{ok:false,error:'This session already has a viewer.'});
   if(session.pending.size>=5)return safeAck(ack,{ok:false,error:'This sharing session has too many pending requests.'});
   const name=validName(payload?.name);session.pending.set(socket.id,name);socket.data.pendingCode=code;
   io.to(session.hostId).emit('session:viewer-request',{requestId:socket.id,name});safeAck(ack,{ok:true});
  });
  socket.on('session:approve',async (payload,ack)=>{
   const session=sessions.get(socket.data.activeCode);if(!session||session.hostId!==socket.id)return safeAck(ack,{ok:false,error:'Not authorized.'});
   const id=payload?.requestId;if(typeof id!=='string'||!session.pending.has(id))return safeAck(ack,{ok:false,error:'Request no longer available.'});
   if(session.viewerId)return safeAck(ack,{ok:false,error:'A viewer is already connected.'});
   let media;
   try {media=await createMediaTickets(session.id);}catch(error){console.error('LiveKit authorization:',error.message);return safeAck(ack,{ok:false,error:'Could not prepare secure video access. Check the LiveKit configuration.'});}
   if(sessions.get(session.code)!==session||session.viewerId||!session.pending.has(id))return safeAck(ack,{ok:false,error:'Session request expired. Please try again.'});
   session.viewerId=id;session.pending.delete(id);
   const viewer=io.sockets.sockets.get(id);if(!viewer){session.viewerId=null;return safeAck(ack,{ok:false,error:'Viewer disconnected.'});}
   viewer.data.pendingCode=null;viewer.data.activeCode=session.code;viewer.data.role='viewer';
   for(const pendingId of session.pending.keys()){io.to(pendingId).emit('session:declined',{reason:'The sharer accepted another viewer.'});const p=io.sockets.sockets.get(pendingId);if(p)p.data.pendingCode=null;}session.pending.clear();
   io.to(session.hostId).emit('session:approved',{role:'host',media:media.host});io.to(id).emit('session:approved',{role:'viewer',media:media.viewer});audit(session.id,'approved');safeAck(ack,{ok:true});
  });
  socket.on('session:decline',(payload)=>{
   const session=sessions.get(socket.data.activeCode);if(!session||session.hostId!==socket.id)return;
   const id=payload?.requestId;if(typeof id!=='string'||!session.pending.has(id))return;
   session.pending.delete(id);const viewer=io.sockets.sockets.get(id);if(viewer)viewer.data.pendingCode=null;io.to(id).emit('session:declined',{reason:'The sharer declined your request.'});
  });
  socket.on('session:leave',()=>{if(socket.data.role==='host') {const s=sessions.get(socket.data.activeCode);if(s)finishHost(io,s);}else if(socket.data.role==='viewer'){const s=sessions.get(socket.data.activeCode);if(s)removeViewer(io,s);}else leavePending(socket,io);});
  for(const type of ['offer','answer','ice']){
   socket.on(`rtc:${type}`,(payload)=>{
    const s=sessions.get(socket.data.activeCode);if(!s||!s.viewerId)return;
    const host=socket.id===s.hostId;const viewer=socket.id===s.viewerId;
    if(!host&&!viewer)return;if(type==='offer'&&!host)return;if(type==='answer'&&!viewer)return;
    if(!payload||typeof payload!=='object')return;
    const serialized=JSON.stringify(payload);if(serialized.length>120_000)return;
    if(type==='ice'&&typeof payload.candidate!=='string')return;
    if(type!=='ice'&&(payload.type!==type||typeof payload.sdp!=='string'))return;
    io.to(host?s.viewerId:s.hostId).emit(`rtc:${type}`,payload);
   });
  }
  // Ephemeral collaboration: never recorded, and never forwarded to unapproved peers.
  // A viewer may point at the screen; either approved participant may send a reaction.
  socket.on('interaction:pointer', payload => {
   const session=sessions.get(socket.data.activeCode);
   if(!session||session.viewerId!==socket.id)return;
   const now=Date.now();
   const visible=payload?.visible===true;
   if(!visible){socket.data.lastPointerAt=0;io.to(session.hostId).emit('interaction:pointer',{visible:false});return;}
   if(now-(socket.data.lastPointerAt||0)<65)return;
   socket.data.lastPointerAt=now;
   const {x,y}=payload||{};
   if(typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return;
   io.to(session.hostId).emit('interaction:pointer',{visible:true,x,y});
  });
  socket.on('interaction:reaction', payload => {
   const session=sessions.get(socket.data.activeCode);
   if(!session||!session.viewerId)return;
   const isHost=session.hostId===socket.id;
   if(!isHost&&session.viewerId!==socket.id)return;
   const emoji=payload?.emoji;
   if(!['👍','👏','❤️','💡','✨'].includes(emoji))return;
   const now=Date.now();
   if(now-(socket.data.lastReactionAt||0)<800)return;
   socket.data.lastReactionAt=now;
   io.to(isHost?session.viewerId:session.hostId).emit('interaction:reaction',{emoji});
  });
  socket.on('disconnect',()=>cleanup(io,socket));
 });
}
