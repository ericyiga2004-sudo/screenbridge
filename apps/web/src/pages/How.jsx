import { Link } from 'react-router-dom';
import { ArrowUpRight, MonitorUp, Smartphone, ShieldCheck, Globe2, LockKeyhole, Wifi, ArrowRight } from 'lucide-react';
const steps = [{ no: '01', title: 'Create a room', text: 'Open ScreenBridge on a laptop, choose Share your screen, and generate a private eight-character code.', icon: MonitorUp }, { no: '02', title: 'Ask to join', text: 'On your phone or another computer, open Watch screen. Enter the code and a display name.', icon: Smartphone }, { no: '03', title: 'Accept the request', text: 'The sharer sees who is asking and chooses Approve or Decline. A code alone never opens a screen.', icon: ShieldCheck }, { no: '04', title: 'Choose what to broadcast', text: 'After approval, the sharer selects a display, browser tab or window in the system permission dialog. The viewer receives live WebRTC media.', icon: Wifi }];
export default function How() {  
return <main>
    <section className="wrap py-20 md:py-28">
      <div className="eyebrow text-acid">THE PROCESS / NO FINE PRINT</div>
      <h1 className="font-display text-[clamp(3.2rem,7vw,7rem)] tracking-[-.07em] font-medium leading-[1.01] mt-7">It takes two devices.<br />
        <span className="text-acid">And a yes.</span>
      </h1>
      <p className="text-[#9CA99F] text-lg max-w-xl leading-8 mt-7">No account is required. Nothing is secretly captured. You stay in charge from the first code to the final frame.</p>
    </section>
    <section className="bg-paper text-ink">
      <div className="wrap py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-5">{steps.map(({ no, title, text, icon: Icon }) =>
          <div key={no} className="bg-[#E5E9DF] rounded-2xl p-8 min-h-[260px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <Icon size={28} strokeWidth={1.4} />
              <span className="font-display text-2xl text-[#829186]">{no}
              </span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-.04em]">{title}
              </h2>
              <p className="text-[#627168] text-sm leading-7 mt-3">{text}
              </p>
            </div>
          </div>)}
        </div>
      </div>
    </section>
    <section className="wrap py-24 grid lg:grid-cols-2 gap-16">
      <div>
        <div className="eyebrow text-acid mb-5">BEFORE YOU START</div>
        <h2 className="font-display text-4xl md:text-5xl tracking-[-.06em] font-semibold leading-tight">Designed to protect what's yours.</h2>
      </div>
      <div className="space-y-7 text-[#B1BDB3] text-sm leading-7">
        <p>
          <span className="text-white font-bold">Desktop sharing:</span> supported desktop browsers ask you which screen to capture. ScreenBridge never bypasses that dialog.</p>
        <p>
          <span className="text-white font-bold">Phone viewing:</span> receiving a screen works in modern browsers. Rotate your phone manually where automatic landscape orientation isn't available.</p>
        <p>
          <span className="text-white font-bold">Across networks:</span> STUN allows many direct connections. Real-world restricted networks often need a TURN relay configured by the operator.</p>
        <p>
          <span className="text-white font-bold">Phone screen sending:</span> this web-first release does not capture the entire iPhone or Android system screen. That needs native mobile integrations later.</p>
        <p>
          <span className="text-white font-bold">Security:</span> live media uses WebRTC encrypted transport; codes expire, viewers need approval, and ending a room stops the stream.</p>
      </div>
    </section>
    <section className="wrap border-t border-[#35403B] py-14 flex flex-col sm:flex-row gap-6 justify-between items-center">
      <h2 className="font-display text-3xl md:text-4xl tracking-[-.05em] font-semibold">Ready to bridge the gap?</h2>
      <div className="flex gap-3">
        <Link to="/share" className="btn btn-lime">Share your screen <ArrowUpRight size={17} />
        </Link>
        <Link to="/watch" className="btn btn-line">Watch <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  </main>
}
