import {useCallback,useEffect,useRef,useState} from 'react';
import {createSocket,emitAck,fetchIceConfig} from '../lib/socket';

export function useBridge(role){
 const socketRef=useRef(null);
 if(!socketRef.current)socketRef.current=createSocket();
 const peerRef=useRef(null);const streamRef=useRef(null);const candidatesRef=useRef([]);const statsTimerRef=useRef(null);const lastBytesRef=useRef(null);const handStoppedRef=useRef(false);
 const [online,setOnline]=useState(false);
 const [code,setCode]=useState('');const [status,setStatus]=useState('idle');const [error,setError]=useState('');
 const [requests,setRequests]=useState([]);const [localStream,setLocalStream]=useState(null);const [remoteStream,setRemoteStream]=useState(null);
 const [remotePointer,setRemotePointer]=useState(null);const [reaction,setReaction]=useState(null);
 const [stats,setStats]=useState({fps:'—',bitrate:'—',latency:'—',quality:'Waiting'});const [peerState,setPeerState]=useState('new');
 const socket=socketRef.current;
 const resetMedia=useCallback(()=>{
  clearInterval(statsTimerRef.current);statsTimerRef.current=null;lastBytesRef.current=null;
  if(peerRef.current){peerRef.current.onconnectionstatechange=null;peerRef.current.onicecandidate=null;peerRef.current.ontrack=null;peerRef.current.close();peerRef.current=null;}
  if(streamRef.current){for(const track of streamRef.current.getTracks()){track.onended=null;track.stop();}streamRef.current=null;}
  candidatesRef.current=[];setLocalStream(null);setRemoteStream(null);setRemotePointer(null);setReaction(null);setPeerState('new');setStats({fps:'—',bitrate:'—',latency:'—',quality:'Waiting'});
 },[]);
 const stop=useCallback(()=>{handStoppedRef.current=true;socket.emit('session:leave');resetMedia();setCode('');setRequests([]);setStatus('ended');},[resetMedia,socket]);
 const ensurePeer=useCallback(async()=>{
  if(peerRef.current)return peerRef.current;
  const peer=new RTCPeerConnection(await fetchIceConfig());peerRef.current=peer;
  peer.onicecandidate=event=>{if(event.candidate)socket.emit('rtc:ice',event.candidate.toJSON());};
  peer.ontrack=event=>{const s=event.streams?.[0] || new MediaStream([event.track]);setRemoteStream(s);};
  peer.onconnectionstatechange=()=>{setPeerState(peer.connectionState);if(peer.connectionState==='connected'){setStatus('streaming');setError('');}else if(peer.connectionState==='disconnected'){setStatus('reconnecting');}else if(peer.connectionState==='failed'){setStatus('failed');setError('Peer connection failed. Try again, or configure TURN for restricted networks.');}};
  statsTimerRef.current=setInterval(async()=>{
   if(peer.connectionState==='closed')return;
   try {const reports=await peer.getStats();let candidate,media;
    reports.forEach(item=>{if(item.type===(role==='host'?'outbound-rtp':'inbound-rtp')&&item.kind==='video')media=item;if(item.type==='candidate-pair'&&item.state==='succeeded'&&item.nominated)candidate=item;});
    let bitrate='—';if(media?.bytesSent!=null||media?.bytesReceived!=null){const b=media.bytesSent??media.bytesReceived;const now=Date.now();if(lastBytesRef.current){const rate=Math.max(0,(b-lastBytesRef.current.bytes)*8/Math.max(1,now-lastBytesRef.current.at)*1000/1e6);bitrate=rate.toFixed(1)+' Mbps';}lastBytesRef.current={bytes:b,at:now};}
    const fps=media?.framesPerSecond?String(Math.round(media.framesPerSecond)):'—';const latency=candidate?.currentRoundTripTime!=null?Math.round(candidate.currentRoundTripTime*1000)+' ms':'—';
    setStats({fps,bitrate,latency,quality:peer.connectionState==='connected'?'Live':'Connecting'});
   }catch{/* Stats unavailable on some browsers */}
  },2000);
  return peer;
 },[role,socket]);
 useEffect(()=>{
  let active=true;
  function connected(){if(active)setOnline(true);}
  function disconnected(){if(!active)return;setOnline(false);resetMedia();setCode('');setRequests([]);setStatus(prev=>['idle','ended'].includes(prev)?prev:'disconnected');setError('Lost the signaling server. Start a new session when connected.');}
  function viewerRequest(item){setRequests(prev=>[...prev.filter(x=>x.requestId!==item.requestId),item]);}
  function requestRemoved({requestId}){setRequests(prev=>prev.filter(x=>x.requestId!==requestId));}
  function approved(){setRequests([]);setError('');setStatus(role==='host'?'ready':'waiting-screen');}
  function declined({reason}){setStatus('declined');setError(reason||'Your request was declined.');}
  function ended({reason}){resetMedia();setCode('');setRequests([]);setStatus('ended');if(!handStoppedRef.current)setError(reason||'Session ended');}
  function viewerLeft(){resetMedia();setStatus('waiting');setError('Viewer disconnected. Your screen capture has stopped. Share the same code with someone else.');}
  async function offer(data){if(role!=='viewer')return;try{const peer=await ensurePeer();await peer.setRemoteDescription(new RTCSessionDescription(data));for(const c of candidatesRef.current)await peer.addIceCandidate(c);candidatesRef.current=[];const answer=await peer.createAnswer();await peer.setLocalDescription(answer);socket.emit('rtc:answer',{type:answer.type,sdp:answer.sdp});setStatus('connecting');}catch(e){setStatus('failed');setError('Could not start the incoming screen: '+e.message);}}
  async function answer(data){if(role!=='host'||!peerRef.current)return;try{await peerRef.current.setRemoteDescription(new RTCSessionDescription(data));for(const c of candidatesRef.current)await peerRef.current.addIceCandidate(c);candidatesRef.current=[];}catch(e){setError('Could not complete video negotiation: '+e.message);}}
  async function ice(data){try{if(peerRef.current?.remoteDescription)await peerRef.current.addIceCandidate(new RTCIceCandidate(data));else candidatesRef.current.push(new RTCIceCandidate(data));}catch{/* Ignore stale ICE candidates */}}
  function pointerUpdated(pointer){setRemotePointer(pointer?.visible?pointer:null);}
  function reactionReceived(item){if(['👍','👏','❤️','💡','✨'].includes(item?.emoji))setReaction({emoji:item.emoji,at:Date.now()});}
  socket.on('connect',connected);socket.on('disconnect',disconnected);socket.on('session:viewer-request',viewerRequest);socket.on('session:request-removed',requestRemoved);socket.on('session:approved',approved);socket.on('session:declined',declined);socket.on('session:ended',ended);socket.on('session:viewer-left',viewerLeft);socket.on('rtc:offer',offer);socket.on('rtc:answer',answer);socket.on('rtc:ice',ice);socket.on('interaction:pointer',pointerUpdated);socket.on('interaction:reaction',reactionReceived);
  socket.connect();if(socket.connected)setOnline(true);
  return ()=>{active=false;socket.emit('session:leave');socket.removeAllListeners();socket.disconnect();clearInterval(statsTimerRef.current);if(peerRef.current)peerRef.current.close();if(streamRef.current){for(const track of streamRef.current.getTracks())track.stop();}};
 },[ensurePeer,resetMedia,role,socket]);
 const create=useCallback(async()=>{setError('');try{if(!socket.connected)throw new Error('Connecting to server. Try again in a moment.');const data=await emitAck(socket,'session:create',{});handStoppedRef.current=false;setCode(data.code);setStatus('waiting');}catch(e){setError(e.message);}},[socket]);
 const request=useCallback(async(inputCode,name)=>{setError('');try{if(!socket.connected)throw new Error('Not connected to the server.');await emitAck(socket,'session:request-view',{code:inputCode,name});handStoppedRef.current=false;setStatus('pending');setCode(inputCode);return true;}catch(e){setError(e.message);return false;}},[socket]);
 const approve=useCallback(async(requestId)=>{setError('');try{await emitAck(socket,'session:approve',{requestId});return true;}catch(e){setError(e.message);return false;}},[socket]);
 const decline=useCallback((requestId)=>{socket.emit('session:decline',{requestId});setRequests(prev=>prev.filter(x=>x.requestId!==requestId));},[socket]);
 const beginCapture=useCallback(async(quality='balanced')=>{
  setError('');if(!navigator.mediaDevices?.getDisplayMedia){setError('Screen capture is unavailable here. Use a supported desktop browser over HTTPS or localhost.');return;}
  try {
   // Must be invoked directly from a user click: browser permission cannot be automated.
   const config=quality==='smooth'?{width:1280,height:720,frameRate:60}:quality==='sharp'?{width:1920,height:1080,frameRate:20}:{width:1920,height:1080,frameRate:30};
   const stream=await navigator.mediaDevices.getDisplayMedia({video:{width:{ideal:config.width},height:{ideal:config.height},frameRate:{ideal:config.frameRate}},audio:true});
   streamRef.current=stream;setLocalStream(stream);
   const peer=await ensurePeer();for(const track of stream.getTracks())peer.addTrack(track,stream);
   const videoTrack=stream.getVideoTracks()[0];if(videoTrack)videoTrack.onended=()=>stop();
   const offer=await peer.createOffer();await peer.setLocalDescription(offer);
   socket.emit('rtc:offer',{type:offer.type,sdp:offer.sdp});setStatus('connecting');
  }catch(e){resetMedia();if(e.name==='NotAllowedError')setError('Screen selection was cancelled or screen recording permission was denied. Check browser and macOS permissions, then try again.');else setError('Screen sharing could not start: '+e.message);setStatus('ready');}
 },[ensurePeer,resetMedia,socket,stop]);
 const point=useCallback((x,y,visible=true)=>{if(socket.connected&&role==='viewer')socket.emit('interaction:pointer',{x,y,visible});},[role,socket]);
 const reactTo=useCallback(emoji=>{if(socket.connected&&['👍','👏','❤️','💡','✨'].includes(emoji))socket.emit('interaction:reaction',{emoji});},[socket]);
 return {online,code,status,error,requests,stats,peerState,localStream,remoteStream,remotePointer,reaction,point,reactTo,create,request,approve,decline,beginCapture,stop,setError};
}
