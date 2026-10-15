import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, MonitorUp, Users, UserRoundCheck, X, Play, Square, Monitor, Volume2, ShieldCheck, Clock3, Signal, ArrowUpRight } from 'lucide-react';
import { useBridge } from '../hooks/useBridge';
import { WorkspaceHead, SessionStamp, TrustNote } from '../components/Status';
import PointerSpot from '../components/PointerSpot';
import ReactionToast from '../components/ReactionToast';
function InfoTile({ label, value }) {  
return <div className="rounded-lg bg-[#121718] border border-[#2E3837] p-3">
    <div className="text-[10px] text-[#8D9994] uppercase tracking-[.14em] font-bold">{label}
    </div>
    <div className="font-display text-lg font-medium mt-1">{value}
    </div>
  </div>
}
function useElapsed(active) { const [secs, setSecs] = useState(0); useEffect(() => { if (!active) { setSecs(0); return; } const start = Date.now(); const id = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000); return () => clearInterval(id); }, [active]); return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`; }
export default function Share() {  
const bridge = useBridge('host'); const [quality, setQuality] = useState('balanced'); const [copied, setCopied] = useState(''); const localVideoRef = useRef(null); const localStageRef = useRef(null); const [lastReaction,setLastReaction] = useState(null); const live = bridge.status === 'streaming'; const elapsed = useElapsed(live);
  useEffect(() => { if (localVideoRef.current) localVideoRef.current.srcObject = bridge.localStream || null; }, [bridge.localStream]);
  async function copy(text, type) { try { await navigator.clipboard.writeText(text); setCopied(type); setTimeout(() => setCopied(''), 1600); } catch { setCopied('error'); setTimeout(() => setCopied(''), 3000); } }
  const hasSession = !!bridge.code; const link = hasSession ? `${window.location.origin}/watch?code=${bridge.code}` : '';
  return <main className="wrap py-11 pb-24">
    <WorkspaceHead eyebrow="01 / BROADCAST STUDIO" title="Share your screen." subtitle="You choose the screen. You choose who sees it. You decide when it ends." online={bridge.online} />
    <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,.85fr)] gap-5 items-start">
      <div>
        <div className="card-dark p-3 sm:p-4">
          <div className="flex items-center justify-between px-1 pb-3 gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C1CBC4]">
              <Monitor size={15} /> YOUR PREVIEW</div>
            <SessionStamp mode="sender" live={live} />
          </div>
          <div ref={localStageRef} className="video-stage grid-stage aspect-video !min-h-[275px] sm:!min-h-[390px]">
            <video ref={localVideoRef} autoPlay muted playsInline className={bridge.localStream ? '' : 'hidden'} />{!bridge.localStream && <div className="z-10 text-center px-8 max-w-sm">
              <div className="inline-flex w-20 h-20 rounded-[19px] bg-[#273130] border border-[#44514B] items-center justify-center text-acid mb-6">
                <MonitorUp size={34} strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl md:text-3xl tracking-[-.05em] font-semibold">Nothing on air. Yet.</h2>
              <p className="text-[#909E95] mt-3 text-sm leading-6">Create a room, approve a viewer, then choose the screen you want to broadcast.</p>
            </div>}{live && <PointerSpot pointer={bridge.remotePointer} stageRef={localStageRef} videoRef={localVideoRef} />}{live && <ReactionToast item={bridge.reaction} />}{live && <div className="absolute left-4 bottom-4 rounded-lg px-3 py-2 bg-[#121A19]/95 border border-[#596847] flex items-center gap-2 text-[11px] text-acid font-bold">
              <span className="w-1.5 h-1.5 bg-acid rounded-full animate-pulse" /> LIVE • {elapsed}
            </div>}
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-3 items-center px-1">
            <span className="text-[#8B9893] text-xs flex items-center gap-2">
              <Volume2 size={14} /> System audio depends on browser support</span>{hasSession && <button className="btn btn-line !px-3 !py-2 text-xs" onClick={bridge.stop}>
                <Square size={13} /> End session</button>}
          </div>
        </div>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">{[{ label: 'Encrypted media', value: 'WebRTC', icon: ShieldCheck }, { label: 'Viewer permissions', value: 'Owner-approved', icon: UserRoundCheck }, { label: 'Screen recording', value: 'Off by default', icon: Monitor }].map((item) =>
          <div key={item.label} className="card-slate p-4">
            <item.icon className="text-acid mb-4" size={19} />
            <p className="text-[10px] text-[#87978D] uppercase tracking-widest font-semibold">{item.label}
            </p>
            <div className="mt-1.5 text-sm font-semibold">{item.value}
            </div>
          </div>)}
        </div>
      </div>
      <aside className="space-y-4">
        {live && <section className="panel-section">
          <div className="flex items-center justify-between gap-2 mb-3"><h3 className="font-display text-lg font-semibold">Stay in the moment</h3><span className="text-[10px] text-acid">LIGHTWEIGHT · LIVE</span></div>
          <p className="text-[#91A097] text-xs leading-5 mb-3">The viewer can point to parts of your preview. Send a quick reaction back without interrupting the video.</p>
          <div className="flex gap-2 flex-wrap">{['👍','👏','❤️','💡','✨'].map(emoji=><button key={emoji} onClick={()=>{bridge.reactTo(emoji);setLastReaction(emoji);}} aria-label={`Send ${emoji} reaction`} className={'reaction-button '+(lastReaction===emoji?'reaction-sent':'')}>{emoji}</button>)}</div>
          <p className="text-[#728679] text-[11px] mt-3">No remote access and no stored interaction history.</p>
        </section>}

        <section className="panel-section">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold tracking-[-.03em] text-xl">The connection</h2>
            <span className="text-[11px] text-[#85948B]">1 viewer max</span>
          </div>{!hasSession ? <>
            <div className="bg-[#222D29] rounded-xl p-5 border border-[#34483E] mb-5">
              <div className="text-acid mb-3">
                <Link2 size={23} />
              </div>
              <h3 className="font-display text-lg font-semibold">A private link, just for you.</h3>
              <p className="text-[#B3C0B3] mt-2 text-sm leading-6">Create a one-time room code. Anyone with the code can request to join, but only you can let them in.</p>
            </div>
            <button className="btn btn-lime w-full" disabled={!bridge.online} onClick={bridge.create}>Create a sharing room <ArrowUpRight size={18} />
            </button>
          </> : <>
            <label className="text-[10px] tracking-widest font-bold text-[#8DA096] uppercase">Your room code</label>
            <div className="rounded-xl bg-[#D5FA64] text-ink p-5 mt-2">
              <div className="code-display text-center text-[clamp(24px,3.3vw,38px)]">{bridge.code.slice(0, 4)}-{bridge.code.slice(4)}
              </div>
              <div className="text-center text-[10px] uppercase tracking-[.16em] mt-2 font-bold opacity-60">Share this code with someone you trust</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button className="btn btn-quiet !py-2.5 !text-xs" onClick={() => copy(bridge.code, 'code')}>{copied === 'code' ? <Check size={14} /> : <Copy size={14} />} {copied === 'code' ? 'Copied!' : 'Copy code'}
              </button>
              <button className="btn btn-quiet !py-2.5 !text-xs" onClick={() => copy(link, 'link')}>{copied === 'link' ? <Check size={14} /> : <Link2 size={14} />} {copied === 'link' ? 'Copied!' : 'Copy link'}
              </button>
            </div>{copied === 'error' && <p className="text-amber-300 text-xs mt-2">Clipboard unavailable. Select the code and copy it manually.</p>}
            <p className="mt-3 text-[#819089] text-[11px] leading-5">Codes expire after 12 minutes without an active viewer. On another phone, use your laptop's network address or a deployed HTTPS URL; a localhost link only works on the same device.</p>
          </>}
        </section>{hasSession && <section className="panel-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Viewers</h3>
            <Users size={18} className="text-[#8E9C93]" />
          </div>{bridge.requests.length ? <div className="space-y-3">{bridge.requests.map(r =>
            <div key={r.requestId} className="border border-[#496044] bg-[#253027] p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#D5FA64] text-ink font-bold flex items-center justify-center">{r.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold">{r.name}
                  </div>
                  <div className="text-[11px] text-[#B8CDAA]">Requests access to your screen</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-lime !text-xs !py-2" onClick={() => bridge.approve(r.requestId)}>
                  <Check size={13} /> Approve</button>
                <button className="btn btn-line !text-xs !py-2" onClick={() => bridge.decline(r.requestId)}>
                  <X size={13} /> Decline</button>
              </div>
            </div>)}
          </div> : <div className="text-sm flex items-center gap-3 text-[#9BA89D] bg-[#212829] p-4 rounded-lg">
            <span className="w-2 h-2 bg-[#68776C] rounded-full" />{['ready', 'connecting', 'streaming', 'reconnecting'].includes(bridge.status) ? 'One viewer approved' : 'Waiting for a request…'}
          </div>}
        </section>}{hasSession && ['ready', 'connecting', 'streaming', 'reconnecting'].includes(bridge.status) && <section className="panel-section">
          <h3 className="font-display text-lg font-semibold">Broadcast settings</h3>
          <p className="text-xs text-[#87958D] leading-5 mt-1 mb-4">Choose how you want to prioritize the stream.</p>
          <div className="grid grid-cols-3 gap-2 mb-4">{[{ id: 'smooth', title: 'Smooth', sub: 'Up to 60fps' }, { id: 'balanced', title: 'Balanced', sub: '30fps' }, { id: 'sharp', title: 'Sharp', sub: 'Text clarity' }].map(q =>
            <button key={q.id} disabled={!!bridge.localStream} onClick={() => setQuality(q.id)} className={'rounded-lg border px-2 py-3 text-center transition-colors ' + (quality === q.id ? 'border-acid text-acid bg-[#303A2A]' : 'border-[#394341] text-[#95A298]')}>
              <div className="text-xs font-semibold">{q.title}
              </div>
              <div className="text-[9px] mt-1">{q.sub}
              </div>
            </button>)}
          </div>{bridge.status === 'ready' && <button className="btn btn-lime w-full" onClick={() => bridge.beginCapture(quality)}>
            <Play size={16} /> Choose screen & go live</button>}{bridge.localStream && <div className="grid grid-cols-3 gap-2">
              <InfoTile label="FPS" value={bridge.stats.fps} />
              <InfoTile label="Bitrate" value={bridge.stats.bitrate} />
              <InfoTile label="RTT" value={bridge.stats.latency} />
            </div>}
          <p className="text-[11px] text-[#91A097] mt-3 leading-5">Your browser will prompt you to pick a display, window or tab. That permission is always required.</p>
        </section>}{bridge.error && <div className="toast-error" role="alert">{bridge.error}{bridge.status==='failed' && <p className="mt-2 text-xs">TURN relay: {bridge.turnConfigured?'configured (check provider if connection still fails)':'not configured on Render'}</p>}</div>}
        <section className="p-1">
          <TrustNote />
        </section>
      </aside>
    </div>
  </main>
}
