import { Wifi, WifiOff, Radio, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ConnectionPill({ online }) {  
return <span className={'inline-flex items-center gap-2 text-[11px] font-bold rounded-full border px-3 py-1.5 ' + (online ? 'text-[#C7E68B] bg-[#243025] border-[#405044]' : 'text-[#FFBCAA] bg-[#3E2825] border-[#62433D]')}>{online ? <Wifi size={12} /> : <WifiOff size={12} />} {online ? 'SIGNALING ONLINE' : 'SERVER OFFLINE'}
  </span>
}
export function WorkspaceHead({ eyebrow, title, subtitle, online }) {  
return <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-7">
    <div>
      <Link to="/" className="text-xs text-[#98A29F] flex items-center gap-1 hover:text-white mb-5">
        <ArrowLeft size={14} /> Back to home</Link>
      <div className="eyebrow text-acid mb-3">{eyebrow}
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-[-.05em]">{title}
      </h1>
      <p className="text-muted text-sm mt-2 max-w-xl leading-6">{subtitle}
      </p>
    </div>
    <div>
      <ConnectionPill online={online} />
    </div>
  </div>
}
export function SessionStamp({ mode, live }) {  
return <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#46504F] rounded-full text-[10px] tracking-widest font-bold uppercase bg-[#202828]/90">
    <span className={'w-1.5 h-1.5 rounded-full ' + (live ? 'bg-[#D5FA64]' : 'bg-[#7E8986]')} />{live ? 'Live' : 'Standby'} · {mode}
  </span>
}
export function TrustNote() {  
return <div className="flex gap-3 items-start text-xs text-[#8D9994] leading-5">
    <ShieldCheck size={16} className="shrink-0 text-acid mt-0.5" />Your screen is only sent after your browser asks permission. ScreenBridge does not record or store the video.</div>
}
export function LiveDot() { return <Radio size={13} className="text-acid" /> }
