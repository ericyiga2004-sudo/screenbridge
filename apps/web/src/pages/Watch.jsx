import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Expand, Hand, Maximize, Minimize, Monitor, MonitorPlay, Radio, RotateCw, ShieldCheck, Signal, Smartphone, Video, X, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useBridge } from '../hooks/useBridge';
import { WorkspaceHead, SessionStamp } from '../components/Status';
import { pointInVideo } from '../lib/videoGeometry';
import PointerSpot from '../components/PointerSpot';
import ReactionToast from '../components/ReactionToast';

const EMOJI = ['👍','👏','❤️','💡','✨'];
export default function Watch() {
  const bridge = useBridge('viewer');
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [code, setCode] = useState((params.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,8));
  const [fit, setFit] = useState('contain');
  const [tvCanvas, setTvCanvas] = useState(true);
  const [rotated, setRotated] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [full, setFull] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [laser, setLaser] = useState(false);
  const [pointer, setPointer] = useState(null);
  const [lastReaction, setLastReaction] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const lastPointerAt = useRef(0);
  const live = bridge.status === 'streaming' && videoReady;
  const connected = !!bridge.remoteStream;
  const canInteract = live && connected;
  const showPortraitCanvas = connected && isPortrait && tvCanvas && !rotated && fit === 'contain';
  const canPoint = canInteract && laser && !rotated && fit === 'contain';
  const valid = code.length === 8;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const videoTrack = bridge.remoteVideoTrack;
    const audioTrack = bridge.remoteAudioTrack;
    const stream = bridge.remoteStream;
    let disposed = false;
    let frameId;
    setVideoReady(false);
    setAudioEnabled(false);
    video.muted = true;
    video.srcObject = null;

    // LiveKit manages its subscribed video track through attach()/detach().
    // Assigning a bare mediaStreamTrack while adaptive streaming is active can
    // leave the video paused at the SFU, particularly on mobile Safari.
    try {
      if (videoTrack) {
        videoTrack.attach(video);
        if (audioTrack) audioTrack.attach(video);
      } else if (stream) {
        video.srcObject = stream;
      }
    } catch (e) {
      bridge.setError('Unable to attach the received LiveKit screen: ' + (e.message || String(e)));
    }

    const firstFrame = () => {
      if (disposed || !videoTrack || video.videoWidth <= 0 || video.readyState < 2) return;
      setVideoReady(true);
      setNeedsPlay(false);
      bridge.confirmVideo();
    };
    const fallback = () => {
      if (!video.requestVideoFrameCallback && video.videoWidth > 0 && video.readyState >= 2) {
        setVideoReady(true);
        bridge.confirmVideo();
      }
    };
    if (videoTrack || stream) {
      if (video.requestVideoFrameCallback) frameId = video.requestVideoFrameCallback(firstFrame);
      video.addEventListener('loadeddata', fallback);
      video.addEventListener('timeupdate', fallback);
      video.play().then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true));
    } else {
      setIsPortrait(false);
      setNeedsPlay(false);
    }
    return () => {
      disposed = true;
      if (frameId != null) video.cancelVideoFrameCallback?.(frameId);
      video.removeEventListener('loadeddata', fallback);
      video.removeEventListener('timeupdate', fallback);
      try { audioTrack?.detach(video); } catch {}
      try { videoTrack?.detach(video); } catch {}
      video.srcObject = null;
    };
  }, [bridge.remoteVideoTrack, bridge.remoteAudioTrack, bridge.remoteStream]);
  useEffect(() => {
    if (videoReady || !['pending','waiting-screen','connecting','reconnecting'].includes(bridge.status)) {
      setWaitSeconds(0);
      return;
    }
    const timer = setInterval(() => setWaitSeconds(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [bridge.status, videoReady]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setStageSize({width: stage.clientWidth, height: stage.clientHeight});
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(stage);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  useEffect(() => {
    const handler = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange',handler);
    return () => document.removeEventListener('fullscreenchange',handler);
  }, []);
  useEffect(() => { if (!connected) { setLaser(false); setPointer(null); } }, [connected]);
  useEffect(() => { if (lastReaction === null) return; const id = setTimeout(()=>setLastReaction(null),850); return ()=>clearTimeout(id); }, [lastReaction]);

  async function fullscreen() {
    if (!stageRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await stageRef.current.requestFullscreen();
        try { await screen.orientation?.lock?.('landscape'); } catch { /* browser/OS restriction */ }
      }
    } catch { bridge.setError('Fullscreen is unavailable here. On iPhone, rotate manually or use Add to Home Screen.'); }
  }
  async function play() {
    try { await videoRef.current?.play(); setNeedsPlay(false); }
    catch { bridge.setError('Autoplay is blocked. Tap the video again to play.'); }
  }
  function pointerMove(event) {
    if (!canPoint || event.pointerType === 'touch' && event.buttons === 0) return;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;
    const box = stage.getBoundingClientRect();
    const p = pointInVideo(event.clientX-box.left,event.clientY-box.top,box.width,box.height,video.videoWidth,video.videoHeight);
    if (!p) { clearPointer(); return; }
    setPointer(p);
    if (Date.now()-lastPointerAt.current > 90) { lastPointerAt.current=Date.now(); bridge.point(p.x,p.y); }
  }
  function clearPointer() { setPointer(null); bridge.point(0,0,false); }
  function switchLaser() {
    if (laser) clearPointer();
    else { setRotated(false); setFit('contain'); }
    setLaser(v=>!v);
  }
  function reactTo(emoji) { if (!canInteract) return; bridge.reactTo(emoji); setLastReaction(emoji); }
  async function enableAudio() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    try { await video.play(); setAudioEnabled(true); }
    catch { video.muted = true; bridge.setError('Your browser blocked sound. Tap Enable sound again.'); }
  }
  function rotateScreen() { if (laser) { setLaser(false); clearPointer(); } setRotated(v=>!v); }

  return <main className="wrap min-w-0 pt-6 sm:pt-11 pb-24">
    <WorkspaceHead eyebrow="02 / VIEWER STUDIO" title="Watch a screen." subtitle="A better view on any display. Your connection is always approved by the sharer." online={bridge.online}/>
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,.85fr)] gap-4 sm:gap-5 items-start">
      <div className="min-w-0 order-2 lg:order-1">
        <section className="card-dark p-3 sm:p-4">
          <div className="flex flex-wrap justify-between items-center pb-3 px-1 gap-2">
            <span className="flex gap-2 items-center text-xs font-semibold text-[#BBC7BF]"><MonitorPlay size={16}/> INCOMING SCREEN</span>
            <SessionStamp mode="viewer" live={live}/>
          </div>
          <div
            ref={stageRef}
            onPointerMove={pointerMove}
            onPointerLeave={clearPointer}
            onPointerUp={clearPointer}
            className={'video-stage tv-stage grid-stage aspect-video group ' + (laser ? 'laser-target' : '')}
            style={{touchAction: canPoint ? 'none' : 'auto'}}
            aria-label="Shared screen viewing stage"
          >
            {showPortraitCanvas && <div className="tv-ambient" aria-hidden="true">
              <div className="tv-wing tv-wing-left"><div className="tv-wing-label">SCREENBRIDGE / 01</div><div className="tv-wing-hero">Portrait.<br/><em>Perfectly</em><br/>placed.</div><div className="tv-wing-tick">LIVE DEVICE · 9:16</div></div>
              <div className="tv-wing tv-wing-right"><div className="tv-wing-top"><span className="tv-indicator"/> TV CANVAS</div><div className="tv-wing-rule"/><div className="tv-wing-copy">No stretched video.<br/>No awkward alignment.<br/>Just the real screen.</div><div className="tv-wing-bottom">FIT · CENTERED · ORIGINAL RATIO</div></div>
            </div>}
            <video
              ref={videoRef}
              autoPlay playsInline muted={!audioEnabled} controls={false}
              onPlaying={event=>{if(event.currentTarget.videoWidth>0 && event.currentTarget.readyState>=2){setVideoReady(true);bridge.confirmVideo();}}}
              onWaiting={()=>setVideoReady(false)}
              onError={()=>{setVideoReady(false);bridge.setError('Video playback failed in this browser. Try restarting the session.');}}
              className={'incoming-video ' + (!connected ? 'hidden' : '') + (showPortraitCanvas?' portrait-video':'')}
              style={rotated ? {objectFit:fit,width:`${stageSize.height}px`,height:`${stageSize.width}px`,left:'50%',top:'50%',inset:'auto',transform:'translate(-50%,-50%) rotate(90deg)'} : {objectFit:fit}}
              onLoadedMetadata={event=>setIsPortrait(event.currentTarget.videoHeight>event.currentTarget.videoWidth)}
            />
            {!connected && <div className="text-center px-6 max-w-sm z-10">
              <div className="inline-flex w-20 h-20 bg-[#26302F] text-acid border border-[#43534A] rounded-2xl items-center justify-center mb-6"><MonitorPlay size={36} strokeWidth={1.5}/></div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-[-.05em]">{bridge.status === 'waiting-screen' ? 'Waiting for the sharer.' : bridge.status === 'connecting' ? 'Connecting to video.' : 'Your window to anywhere.'}</h2>
              <p className="text-[#92A097] text-sm leading-6 mt-3">{bridge.status === 'waiting-screen' ? 'Approved. On the laptop, click Choose screen & go live and pick a screen in Chrome.' : bridge.status === 'connecting' ? 'Connecting to the secure LiveKit video server.' : 'Enter a code, wait for approval, and watch the other screen arrive here.'}</p>
              {waitSeconds >= 25 && ['waiting-screen','connecting','reconnecting'].includes(bridge.status) && <p role="status" className="mt-4 rounded-lg border border-[#796B41] bg-[#302B20] p-3 text-xs text-[#F3DEA6] leading-5">Still waiting after {waitSeconds} seconds. Check the laptop: is the screen preview moving? If not, click Choose screen & go live. If it is moving, leave and start a fresh session.</p>}
            </div>}
            {needsPlay && connected && <button className="absolute z-30 bg-acid text-ink rounded-lg px-5 py-3 font-semibold" onClick={play}>Tap to play video</button>}
            {live && <div className="absolute top-3 right-3 z-20 bg-[#121919]/90 border border-[#48534B] px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1.5 text-acid"><span className="w-1.5 h-1.5 bg-acid rounded-full"/>LIVE</div>}
            {connected && !live && !needsPlay && <div className="absolute inset-x-3 bottom-10 text-center z-20 text-xs text-[#D9E5DC] bg-[#101718]/90 border border-[#36443D] rounded-lg p-3">{waitSeconds >= 25 ? 'A video track arrived, but no playable frames have appeared. Check that the laptop is broadcasting; otherwise restart the session.' : bridge.status==='failed'?'LiveKit media connection failed. Try starting a fresh approved session.':'Video track received. Waiting for the first playable frames…'}</div>}
            {canPoint && pointer && <PointerSpot pointer={pointer} stageRef={stageRef} videoRef={videoRef}/>}
            <ReactionToast item={bridge.reaction}/>
            {live && <div className="tv-overlay-bottom" aria-hidden="true">{isPortrait ? 'PORTRAIT SIGNAL' : 'WIDESCREEN SIGNAL'} <span>·</span> ENCRYPTED VIEW</div>}
          </div>
          <div className="mt-4 flex flex-wrap justify-between items-center gap-2 px-1">
            <div className="flex flex-wrap gap-2">
              <button disabled={!canInteract} onClick={()=>{setLaser(false);clearPointer();setFit(v=>v==='contain'?'cover':'contain');}} className="btn btn-quiet !px-3 !py-2 !text-xs" title={fit==='contain'?'Show full image':'Crop to fill the stage'}><Expand size={13}/>{fit==='contain'?'Fit':'Fill (crop)'}</button>
              <button disabled={!canInteract} onClick={rotateScreen} className={'btn !px-3 !py-2 !text-xs '+(rotated?'btn-lime':'btn-quiet')} title="Rotate the received picture 90 degrees"><RotateCw size={14}/>Rotate</button>
              <button disabled={!canInteract} onClick={()=>setTvCanvas(v=>!v)} className={'btn !px-3 !py-2 !text-xs '+(tvCanvas?'btn-lime':'btn-quiet')} title="Use side canvas to center portrait screens on wide monitors"><Monitor size={14}/>TV canvas</button>
              <button disabled={!canInteract} onClick={switchLaser} aria-pressed={laser} className={'btn !px-3 !py-2 !text-xs '+(laser?'btn-lime':'btn-quiet')}><Hand size={14}/>{laser?'Pointer on':'Point'}</button>
              <button disabled={!canInteract} onClick={fullscreen} className="btn btn-quiet !px-3 !py-2 !text-xs">{full?<Minimize size={14}/>:<Maximize size={14}/>}Fullscreen</button>
            </div>
            {!['idle','ended'].includes(bridge.status) && <button onClick={bridge.stop} className="btn btn-line !px-3 !py-2 !text-xs"><X size={14}/> Leave</button>}
          </div>
          {live && bridge.remoteStream?.getAudioTracks()?.length>0 && !audioEnabled && <button className="btn btn-quiet mt-3 !text-xs" onClick={enableAudio}>Enable sound</button>}
          <p className="text-[#809087] text-[11px] leading-5 mt-3 px-1">TV canvas centers portrait screens on wide displays. Rotate fixes sideways video; Fill crops edges. Point lets you guide the sharer without remote control.</p>
        </section>
        {canInteract && <section className="card-slate mt-4 p-4 flex flex-wrap items-center gap-2 sm:gap-4" aria-label="Send a reaction"><span className="text-[10px] uppercase tracking-[.18em] text-[#91A096] font-bold mr-1">Quick reactions</span>{EMOJI.map(emoji=><button key={emoji} type="button" onClick={()=>reactTo(emoji)} aria-label={`Send ${emoji} reaction`} className={'reaction-button '+(lastReaction===emoji?'reaction-sent':'')}>{emoji}</button>)}<span className="text-[#73867A] text-[10px] sm:ml-auto">Only your approved partner sees these</span></section>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">{[{label:'Current frame rate',value:bridge.stats.fps==='—'?'—':bridge.stats.fps+' fps',icon:Video},{label:'Receiving bitrate',value:bridge.stats.bitrate,icon:Signal},{label:'Network round trip',value:bridge.stats.latency,icon:Radio}].map(item=><div key={item.label} className="card-slate px-4 py-5"><item.icon size={18} className="text-acid mb-3"/><div className="text-[#8B9B92] text-[10px] font-bold uppercase tracking-[.1em]">{item.label}</div><div className="font-display text-xl font-semibold mt-1">{item.value}</div></div>)}</div>
      </div>
      <aside className="mobile-join min-w-0 order-1 lg:order-2 space-y-4">
        <section className="panel-section">
          <div className="flex flex-wrap justify-between gap-2 items-center mb-5"><h2 className="font-display text-xl font-semibold">Join a room</h2><span className="text-[#91A096] text-xs">Secure pairing</span></div>
          <form onSubmit={async e=>{e.preventDefault();await bridge.request(code,name);}}>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#96A49A] mb-2" htmlFor="viewer-name">Your display name</label>
            <input id="viewer-name" className="input-dark w-full min-w-0 max-w-full py-3 px-4 text-sm mb-4" placeholder="e.g. Living room TV" value={name} onChange={e=>setName(e.target.value)} maxLength={38} autoComplete="nickname" disabled={!['idle','ended','declined','disconnected','failed'].includes(bridge.status)}/>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#96A49A] mb-2" htmlFor="viewer-code">Invitation code</label>
            <input id="viewer-code" inputMode="text" className="input-dark block w-full min-w-0 max-w-full px-2 sm:px-4 py-4 text-center code-display text-[clamp(1.25rem,7vw,1.875rem)]" placeholder="ABCD-EFGH" maxLength={9} value={code.length>4?code.slice(0,4)+'-'+code.slice(4):code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8))} disabled={!['idle','ended','declined','disconnected','failed'].includes(bridge.status)}/>
            <div className="mt-4">{bridge.status==='failed'?<button type="button" className="btn btn-lime w-full" onClick={bridge.stop}>Reset connection to retry</button>:['idle','ended','declined','disconnected'].includes(bridge.status)?<button type="submit" disabled={!bridge.online||!valid} className="btn btn-lime w-full">Request to watch <ArrowUpRight size={17}/></button>:<div className="flex items-center gap-3 bg-[#26322B] text-[#D1E4BA] border border-[#405640] rounded-xl px-4 py-4 text-sm"><span className="w-2 h-2 bg-acid rounded-full animate-pulse"/><span>{bridge.status==='pending'?'Request sent. Waiting for approval…':bridge.status==='waiting-screen'?'Approved! Waiting for the screen…':bridge.status==='connecting'?'Establishing video connection…':bridge.status==='reconnecting'?'Trying to reconnect video…':bridge.status==='streaming'?'Connected! You are watching live.':'Connecting…'}</span></div>}</div>
          </form>
          {bridge.error && <div className="toast-error mt-4" role="alert">{bridge.error}{bridge.mediaConfigured===false && <p className="mt-2 text-xs">LiveKit Cloud credentials are missing from the Render backend. Contact the host before retrying.</p>}</div>}
          <p className="text-[#8A998F] text-[11px] leading-5 mt-4">The sharer must approve you before any screen data is transmitted.</p>
        </section>
        <section className="panel-section">
          <div className="flex gap-3 items-start"><Monitor className="text-acid shrink-0" size={25}/><div><h3 className="font-display text-lg font-semibold">From phone to TV.</h3><p className="text-[#95A49A] mt-2 text-xs leading-6">A vertical phone broadcast is centered in your widescreen canvas, with clean side panels instead of sticking to one edge. Select Fullscreen for a TV-like display. This layout works for any portrait stream the sender can capture.</p></div></div>
          <div className="mt-5 rounded-lg bg-[#252E2B] px-4 py-3 flex items-center gap-3"><Smartphone className="text-[#CDEAA1]" size={18}/><span className="text-xs text-[#C3CDC4]">Native phone screen broadcasting is a later app capability; web desktop capture works now.</span></div>
        </section>
        <section className="panel-section"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={18} className="text-acid"/>Lightweight interaction</div><p className="text-xs text-[#92A095] leading-6 mt-2">Tap Point, then move your mouse or finger over the video. The sharer sees your laser pointer in their ScreenBridge preview. Reactions are temporary, not stored.</p></section>
        <section className="panel-section"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={18} className="text-acid"/>Privacy-first</div><p className="text-xs text-[#92A095] leading-6 mt-2">Your device only receives the approved live video. Remote keyboard/mouse control and screen recording are not enabled.</p></section>
      </aside>
    </div>
  </main>;
}
