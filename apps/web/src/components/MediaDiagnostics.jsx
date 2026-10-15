import {useState} from 'react';
import {mediaWarning} from '../lib/mediaDiagnostics';
export default function MediaDiagnostics({bridge,playback}) {
 const [copied,setCopied]=useState(false);
 const d=bridge.diagnostics;
 const warning=bridge.error||mediaWarning(d,playback);
 const values={
  'Pairing server':bridge.online?'connected':'disconnected','LiveKit room':d.connection,
  'Remote participants':d.participants,'Screen publication':d.publication?'Yes':'No',
  'Subscription':d.subscription,'Permission':d.permission,'Track SID':d.sid,'Source':d.source,'Kind':d.kind,
  'Publication muted':d.muted,'Actual codec':d.codec,'RTP resolution':d.width&&d.height?`${d.width} × ${d.height}`:null,
  'Bytes received':d.bytes,'Packets received':d.packets,'Receiving bitrate':bridge.stats.bitrate,
  'Frames received':d.framesReceived,'Frames decoded':d.framesDecoded,'Frames dropped':d.framesDropped,
  'Frames presented (callback)':playback?.presented,'Video frames (quality API)':playback?.frames,
  'Element resolution':playback?.size,'readyState':playback?.ready,'Paused':playback?.paused,
  'Browser':navigator.userAgent,'Warning':warning||'None reported'
 };
 const report=Object.entries(values).map(([key,value])=>`${key}: ${value==null?'Unavailable':String(value)}`).join('\n');
 return <details open className="mt-4 p-3 rounded-lg border border-[#4B5A51] text-xs text-[#D4E0D8] min-w-0">
  <summary className="font-semibold cursor-pointer">Live video diagnostics</summary>
  {warning&&<p role="status" className="my-3 text-[#F3DEA6]">{warning}</p>}
  <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 my-3">{Object.entries(values).map(([k,v])=><div key={k} className="min-w-0"><dt className="text-[#95A49A]">{k}</dt><dd className="break-words" style={{overflowWrap:'anywhere'}}>{v==null?'Unavailable':String(v)}</dd></div>)}</dl>
  <button type="button" className="btn btn-quiet !text-xs" onClick={async()=>{try{await navigator.clipboard.writeText(report);setCopied(true);}catch{setCopied(false);}}}>{copied?'Copied':'Copy diagnostics'}</button>
  <p className="mt-2">Unavailable means this browser did not expose that measurement. A connection is not proof of rendered video.</p>
 </details>;
}
