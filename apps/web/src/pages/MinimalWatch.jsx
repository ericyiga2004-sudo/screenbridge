import {useEffect,useRef,useState} from 'react';
import {useBridge} from '../hooks/useBridge';
import MediaDiagnostics from '../components/MediaDiagnostics';
// Deliberately independent attachment: a plain video-only MediaStream, no SDK attach,
// audio, geometry, animation, hidden elements or conditional video mounting.
export default function MinimalWatch(){
 const bridge=useBridge('viewer'),videoRef=useRef(null);
 const [code,setCode]=useState(''),[playback,setPlayback]=useState({});
 useEffect(()=>{
  const video=videoRef.current,track=bridge.remoteVideoTrack;
  let active=true,id,presented=null;
  video.muted=true;video.playsInline=true;
  video.srcObject=track?new MediaStream([track.mediaStreamTrack]):null;
  if(track)video.play().catch(()=>{if(active)bridge.setError('Playback paused. Tap Resume video.');});
  function frame(_now,metadata){if(!active)return;presented=metadata.presentedFrames;bridge.confirmVideo();id=video.requestVideoFrameCallback(frame);}
  if(track&&video.requestVideoFrameCallback)id=video.requestVideoFrameCallback(frame);
  const timer=setInterval(()=>{if(!active)return;const q=video.getVideoPlaybackQuality?.();setPlayback({ready:video.readyState,paused:video.paused,size:`${video.videoWidth} × ${video.videoHeight}`,frames:q?.totalVideoFrames,presented});},1000);
  return()=>{active=false;clearInterval(timer);if(id!==undefined)video.cancelVideoFrameCallback?.(id);video.srcObject=null;};
 },[bridge.remoteVideoTrack]);
 return <main className="wrap py-6 min-w-0"><h1 className="text-xl">Minimal video test</h1>
  <p className="my-3 text-sm">Uses normal host approval. Leave the other viewer before joining here.</p>
  <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();bridge.request(code,'Minimal Safari test');}}>
   <input aria-label="Invitation code" className="input-dark px-3 py-2 min-w-0" maxLength={9} value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8))}/>
   <button className="btn btn-lime" disabled={!bridge.online||code.length!==8}>Request to watch</button>
   <button type="button" className="btn btn-quiet" onClick={bridge.stop}>Leave</button>
  </form>
  <video ref={videoRef} autoPlay playsInline muted controls style={{display:'block',width:'100%',background:'#000',minHeight:180,marginTop:16}} onPlaying={()=>bridge.confirmVideo()}/>
  <button className="btn btn-lime mt-3" onClick={()=>videoRef.current.play().then(()=>bridge.setError('')).catch(()=>bridge.setError('Playback blocked by browser.'))}>Resume video</button>
  <MediaDiagnostics bridge={bridge} playback={playback}/>
 </main>;
}
