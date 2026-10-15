import {useCallback,useEffect,useRef,useState} from 'react';
import {Room,RoomEvent,Track,ConnectionState,ScreenSharePresets} from 'livekit-client';
import {createSocket,emitAck,fetchMediaStatus} from '../lib/socket';

// All media passes through LiveKit. Socket.IO remains for explicit pairing approval.
export function useBridge(role){
 const socketRef=useRef(null);if(!socketRef.current)socketRef.current=createSocket();
 const socket=socketRef.current,roomRef=useRef(null),localTrackRef=useRef(null);
 const received=useRef({video:null,audio:null}),statTimer=useRef(null),priorBytes=useRef(null),userStopped=useRef(false);
 const [online,setOnline]=useState(false),[mediaConfigured,setMediaConfigured]=useState(null);
 const [code,setCode]=useState(''),[status,setStatus]=useState('idle'),[error,setError]=useState('');
 const [requests,setRequests]=useState([]),[localStream,setLocalStream]=useState(null),[remoteStream,setRemoteStream]=useState(null);
 const [remotePointer,setRemotePointer]=useState(null),[reaction,setReaction]=useState(null);
 const [stats,setStats]=useState({fps:'—',bitrate:'—',latency:'—',quality:'Waiting'});
 const [peerState,setPeerState]=useState('new');
 const resetMedia=useCallback(()=>{
  clearInterval(statTimer.current);statTimer.current=null;priorBytes.current=null;
  const room=roomRef.current;roomRef.current=null;
  if(room){room.removeAllListeners();void room.disconnect();}
  localTrackRef.current=null;received.current={video:null,audio:null};
  setLocalStream(null);setRemoteStream(null);setPeerState('new');
  setRemotePointer(null);setReaction(null);
  setStats({fps:'—',bitrate:'—',latency:'—',quality:'Waiting'});
 },[]);
 const stop=useCallback(()=>{
  userStopped.current=true;socket.emit('session:leave');resetMedia();
  setCode('');setRequests([]);setStatus('ended');setError('');
 },[socket,resetMedia]);

 const connectLive=useCallback(async(media)=>{
  if(!media?.token||!/^wss:\/\//.test(media.url||''))throw Error('LiveKit media credentials were not issued by the server.');
  resetMedia();
  const room=new Room({adaptiveStream:true,dynacast:true});
  roomRef.current=room;
  function updateStream(){
   const tracks=[received.current.video?.mediaStreamTrack,received.current.audio?.mediaStreamTrack]
     .filter(t=>t?.readyState==='live');
   setRemoteStream(tracks.some(t=>t.kind==='video')?new MediaStream(tracks):null);
  }
  room.on(RoomEvent.TrackSubscribed,(track)=>{
   if(track.source===Track.Source.ScreenShare&&track.kind===Track.Kind.Video){
    received.current.video=track;updateStream();setStatus('connecting');
   } else if(track.source===Track.Source.ScreenShareAudio){
    received.current.audio=track;updateStream();
   }
  });
  room.on(RoomEvent.TrackUnsubscribed,(track)=>{
   if(received.current.video===track)received.current.video=null;
   if(received.current.audio===track)received.current.audio=null;
   updateStream();if(role==='viewer'&&!received.current.video)setStatus('waiting-screen');
  });
  room.on(RoomEvent.LocalTrackUnpublished,pub=>{
   if(pub.source===Track.Source.ScreenShare){
    localTrackRef.current=null;setLocalStream(null);setStatus('ready');
   }
  });
  room.on(RoomEvent.Reconnecting,()=>{setStatus('reconnecting');setPeerState('reconnecting');});
  room.on(RoomEvent.Reconnected,()=>{
   setPeerState('connected');setStatus(role==='host'?(localTrackRef.current?'streaming':'ready'):(received.current.video?'connecting':'waiting-screen'));
  });
  room.on(RoomEvent.Disconnected,()=>{
   if(roomRef.current===room){setPeerState('failed');setStatus('failed');setError('LiveKit media disconnected. End the session and create a new room.');}
  });
  try{
   await room.connect(media.url,media.token,{autoSubscribe:true});
   if(roomRef.current!==room){void room.disconnect();return;}
   setPeerState('connected');setError('');setStatus(role==='host'?'ready':'waiting-screen');
   statTimer.current=setInterval(async()=>{
    if(room.state!==ConnectionState.Connected)return;
    const track=role==='host'?localTrackRef.current:received.current.video;
    if(!track)return;
    try{
     const data=role==='host'?(await track.getSenderStats?.())?.[0]:await track.getReceiverStats?.();
     const bytes=data?.bytesSent??data?.bytesReceived;
     let bitrate='—';
     if(typeof bytes==='number'){
      const now=Date.now();
      if(priorBytes.current)bitrate=(Math.max(0,bytes-priorBytes.current.bytes)*8/Math.max(1,now-priorBytes.current.at)*1000/1e6).toFixed(1)+' Mbps';
      priorBytes.current={bytes,at:now};
     }else if(Number.isFinite(track.currentBitrate))bitrate=(track.currentBitrate/1e6).toFixed(1)+' Mbps';
     setStats({fps:data?.framesPerSecond?String(Math.round(data.framesPerSecond)):'—',bitrate,latency:'—',quality:'Connected'});
    }catch{/* Older Safari does not expose every video statistic. */}
   },2000);
  }catch(e){if(roomRef.current===room)resetMedia();throw Error('LiveKit connection failed: '+(e.message||String(e)));}
 },[resetMedia,role]);
 useEffect(()=>{
  let active=true;
  function onConnect(){
   if(!active)return;setOnline(true);
   fetchMediaStatus().then(x=>{if(active)setMediaConfigured(Boolean(x.configured));}).catch(()=>{if(active)setMediaConfigured(null);});
  }
  function onDisconnect(){
   if(!active)return;setOnline(false);resetMedia();setCode('');setRequests([]);
   setStatus(s=>['idle','ended'].includes(s)?s:'disconnected');setError('Connection to the pairing server was lost. Create a new session.');
  }
  const onRequest=item=>setRequests(p=>[...p.filter(x=>x.requestId!==item.requestId),item]);
  const onRemoved=({requestId})=>setRequests(p=>p.filter(x=>x.requestId!==requestId));
  async function onApproved({media}){
   setRequests([]);setError('');setStatus('connecting');
   try{await connectLive(media);}catch(e){if(active){setStatus('failed');setError(e.message);}}
  }
  function onDeclined({reason}){setStatus('declined');setError(reason||'Request declined.');}
  function onEnded({reason}){resetMedia();setCode('');setRequests([]);setStatus('ended');if(!userStopped.current)setError(reason||'Session ended.');}
  function onViewerLeft(){resetMedia();setStatus('waiting');setError('Viewer left. Screen streaming stopped; you may approve another viewer.');}
  function onReaction(item){if(['👍','👏','❤️','💡','✨'].includes(item?.emoji))setReaction({emoji:item.emoji,at:Date.now()});}
  socket.on('connect',onConnect);socket.on('disconnect',onDisconnect);
  socket.on('session:viewer-request',onRequest);socket.on('session:request-removed',onRemoved);
  socket.on('session:approved',onApproved);socket.on('session:declined',onDeclined);
  socket.on('session:ended',onEnded);socket.on('session:viewer-left',onViewerLeft);
  socket.on('interaction:pointer',p=>setRemotePointer(p?.visible?p:null));
  socket.on('interaction:reaction',onReaction);
  socket.connect();if(socket.connected)onConnect();
  return ()=>{active=false;socket.emit('session:leave');socket.removeAllListeners();socket.disconnect();resetMedia();};
 },[socket,resetMedia,connectLive]);
 const create=useCallback(async()=>{
  setError('');try{
   if(!socket.connected)throw Error('Pairing server is not yet online.');
   const data=await emitAck(socket,'session:create',{});userStopped.current=false;setCode(data.code);setStatus('waiting');
  }catch(e){setError(e.message);}
 },[socket]);
 const request=useCallback(async(code,name)=>{
  setError('');try{
   if(!socket.connected)throw Error('Pairing server is not online.');
   await emitAck(socket,'session:request-view',{code,name});userStopped.current=false;setCode(code);setStatus('pending');return true;
  }catch(e){setError(e.message);return false;}
 },[socket]);
 const approve=useCallback(async(requestId)=>{
  setError('');try{await emitAck(socket,'session:approve',{requestId});return true;}
  catch(e){setError(e.message);return false;}
 },[socket]);
 const decline=useCallback(requestId=>{socket.emit('session:decline',{requestId});setRequests(p=>p.filter(x=>x.requestId!==requestId));},[socket]);
 const beginCapture=useCallback(async(quality='balanced')=>{
  setError('');
  if(!navigator.mediaDevices?.getDisplayMedia){
   setError('Full-phone-screen sharing requires a native ReplayKit/Android app. Mobile Safari can watch streams, but cannot capture the entire iPhone screen.');
   return;
  }
  const room=roomRef.current;
  if(!room||room.state!==ConnectionState.Connected){setError('Wait for LiveKit to connect after approving the viewer.');return;}
  try{
   const preset=quality==='smooth'?ScreenSharePresets.h720fps30:ScreenSharePresets.h1080fps30;
   await room.localParticipant.setScreenShareEnabled(true,{audio:true,resolution:{...preset.resolution,frameRate:quality==='sharp'?15:30}});
   const track=room.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track;
   if(!track?.mediaStreamTrack)throw Error('The browser did not publish a screen track.');
   localTrackRef.current=track;setLocalStream(new MediaStream([track.mediaStreamTrack]));setStatus('streaming');
   track.mediaStreamTrack.addEventListener('ended',()=>{
    if(roomRef.current===room){localTrackRef.current=null;setLocalStream(null);setStatus('ready');}
   },{once:true});
  }catch(e){setStatus('ready');setError(e.name==='NotAllowedError'?'Screen selection was cancelled or the browser denied capture.':'Unable to broadcast: '+(e.message||String(e)));}
 },[]);
 const confirmVideo=useCallback(()=>{
  if(role==='viewer'&&roomRef.current?.state===ConnectionState.Connected)setStatus('streaming');
 },[role]);
 const point=useCallback((x,y,visible=true)=>{if(socket.connected&&role==='viewer')socket.emit('interaction:pointer',{x,y,visible});},[socket,role]);
 const reactTo=useCallback(emoji=>{if(socket.connected&&['👍','👏','❤️','💡','✨'].includes(emoji))socket.emit('interaction:reaction',{emoji});},[socket]);
 return {online,mediaConfigured,code,status,error,requests,stats,peerState,localStream,remoteStream,
 remotePointer,reaction,create,request,approve,decline,beginCapture,stop,confirmVideo,point,reactTo,setError};
}
