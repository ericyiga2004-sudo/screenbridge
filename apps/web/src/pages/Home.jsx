import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, MonitorUp, ScanLine, ShieldCheck, MoveUpRight, Smartphone, Monitor, LockKeyhole, MousePointer2, Signal, Check, Headphones, Radio } from 'lucide-react';
const steps = [{ no: '01', title: 'Open a room.', desc: 'Start a session on the device you want to share. No account. No installation on desktop.' }, { no: '02', title: 'Send the code.', desc: 'Enter the code on another device and ask to watch. Works across different networks with suitable connectivity.' }, { no: '03', title: 'You stay in charge.', desc: 'Approve the viewer, choose your screen, and stop sharing with a single click.' }];
function DesktopArtwork() {  
return <div className="relative isolate w-full max-w-[610px] mx-auto" aria-label="ScreenBridge interface concept preview">
    <div className="absolute -left-8 -top-8 hidden md:block text-[#959E97] text-[10px] tracking-widest font-bold rotate-[-90deg] origin-bottom-left">LIVE WORKSPACE / 001</div>
    <div className="rounded-[15px] border border-[#4A5452] bg-[#191E20] shadow-[0_34px_120px_rgba(0,0,0,.57)] overflow-hidden">
      <div className="flex items-center justify-between h-11 px-4 border-b border-[#323A3B]">
        <div className="monitor-dots flex gap-1.5">
          <i />
          <i />
          <i />
        </div>
        <span className="text-[10px] text-[#AAB4AF] tracking-[.17em] font-bold">SCREENBRIDGE PREVIEW</span>
        <span className="text-[#D5FA64] text-xs">●</span>
      </div>
      <div className="p-3 sm:p-5">
        <div className="rounded-[11px] bg-[#101719] overflow-hidden relative h-[230px] sm:h-[270px] border border-[#353E40]">
          <div className="h-8 border-b border-[#354041] bg-[#1B2426] flex items-center justify-between px-3">
            <span className="text-[9px] text-[#A1B1A8] font-bold">BRIDGE / CANVAS</span>
            <div className="flex gap-2">
              <span className="w-9 h-1 rounded bg-[#43524D]" />
              <span className="w-4 h-1 rounded bg-[#6C826F]" />
            </div>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-[1fr_90px] sm:grid-cols-[1fr_150px] gap-3 h-[calc(100%-32px)]">
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-[.2em] text-[#D5FA64] font-bold">Your ideas, anywhere</div>
                <div className="font-display text-[22px] sm:text-[37px] tracking-[-.06em] leading-none mt-3 max-w-[240px]">No walls.<br />Just screens<span className="text-acid">.</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-1 bg-acid rounded" />
                <div className="w-6 h-1 bg-[#4D5552] rounded" />
                <div className="w-4 h-1 bg-[#4D5552] rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex-1 bg-[#29342F] rounded-md p-2 flex flex-col justify-end">
                <div className="w-[60%] h-[45%] bg-[#D5FA64] rounded-[4px] rotate-[-7deg] mb-2" />
                <div className="bg-[#465D49] h-1.5 w-[80%] rounded mb-1" />
                <div className="bg-[#465D49] h-1.5 w-[50%] rounded" />
              </div>
              <div className="flex gap-2 h-11">
                <div className="bg-[#4D6050] flex-1 rounded-md" />
                <div className="bg-[#D5FA64] flex-1 rounded-md" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-[#47614A] bg-[#1D3426] px-3 py-1.5 text-[10px] text-acid font-semibold">
            <span className="w-1.5 h-1.5 bg-acid rounded-full" /> DESIGN PREVIEW</div>
        </div>
        <div className="px-1 pt-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[#97A6A1] text-xs">
            <Signal size={14} /> Optimized viewing</span>
          <div className="flex items-center gap-1.5 text-[#97A6A1] text-xs">
            <LockKeyhole size={13} /> Private by design</div>
        </div>
      </div>
    </div>
    <div className="absolute -bottom-12 -right-3 sm:-right-8 w-[140px] sm:w-[183px] rounded-[24px] sm:rounded-[30px] border-[6px] border-[#313939] shadow-[0_24px_40px_rgba(0,0,0,.5)] bg-[#0C1011] p-2 rotate-[10deg]">
      <div className="w-12 h-[7px] bg-[#3F4A48] rounded-full mx-auto mb-2" />
      <div className="rounded-[12px] bg-[#1C2827] h-[154px] sm:h-[200px] flex flex-col items-center justify-center p-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#D5FA64] text-ink">
          <Monitor size={22} />
        </div>
        <p className="text-[10px] text-center font-bold mt-3 tracking-wide">SCREEN CONNECTED</p>
        <p className="text-[8px] text-[#889991] text-center mt-2">Across your devices.</p>
        <div className="w-[75%] h-1.5 bg-[#45554B] rounded mt-4" />
        <div className="w-[55%] h-1.5 bg-[#45554B] rounded mt-1.5" />
      </div>
      <div className="w-9 h-1 bg-[#485652] rounded-full mx-auto mt-2" />
    </div>
  </div>
}
export default function Home() {  
return <>
    <main>
      <section className="relative overflow-hidden pt-16 pb-28 sm:pt-20 sm:pb-36">
        <div className="absolute right-0 top-0 w-[45%] h-full pointer-events-none opacity-[.1] hero-hatching" />
        <div className="wrap relative grid lg:grid-cols-[.95fr_1.05fr] gap-14 lg:gap-8 items-center">
          <div className="lg:pb-10">
            <div className="inline-flex items-center gap-2 border border-[#414C44] text-[#D3F594] rounded-full px-3.5 py-2 text-[10px] sm:text-xs font-bold tracking-[.08em]">
              <span className="glow-dot mr-1" /> YOUR SCREEN. THEIR DEVICE. ZERO FRICTION.</div>
            <h1 className="font-display font-medium tracking-[-.072em] text-[clamp(3.7rem,6.7vw,7.4rem)] leading-[.99] mt-8 max-w-[670px]">One screen.<br />
              <span className="text-acid">Anywhere.</span>
            </h1>
            <p className="text-[#A2ADA7] text-[15px] sm:text-lg leading-[1.8] mt-7 max-w-[505px]">Bring your desktop to your phone. Walk someone through a problem. Show the work, not just tell the story. All without the usual setup headache.</p>
            <div className="flex flex-wrap gap-3 mt-9">
              <Link to="/share" className="btn btn-lime">Share your screen <ArrowUpRight size={18} />
              </Link>
              <Link to="/watch" className="btn btn-line">Watch a screen <ArrowRight size={18} />
              </Link>
            </div>
            <div className="flex items-center gap-4 mt-12 border-t border-[#303937] pt-5 max-w-lg">
              <div className="flex -space-x-2">
                <span className="w-8 h-8 rounded-full bg-[#D5FA64] border-[3px] border-ink text-ink flex items-center justify-center">
                  <Monitor size={14} />
                </span>
                <span className="w-8 h-8 rounded-full bg-[#55766B] border-[3px] border-ink flex items-center justify-center">
                  <Smartphone size={14} />
                </span>
                <span className="w-8 h-8 rounded-full bg-[#B0B9A8] border-[3px] border-ink text-ink flex items-center justify-center">
                  <ScanLine size={14} />
                </span>
              </div>
              <span className="text-[#96A39B] text-[12px] leading-5">Laptop to phone. Desktop to desktop.<br />
                <b className="text-[#D3DDD4] font-medium">All with your permission.</b>
              </span>
            </div>
          </div>
          <div className="lg:pl-5 pt-10 lg:pt-0">
            <DesktopArtwork />
          </div>
        </div>
      </section>
      <section className="bg-paper text-ink relative overflow-hidden" id="features">
        <div className="wrap py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b border-[#D4D7CD]">
            <div>
              <div className="eyebrow text-[#58685A] mb-5">Built for actual people</div>
              <h2 className="font-display text-[clamp(2.7rem,5vw,5.1rem)] tracking-[-.065em] leading-[1.02] font-semibold">Less setup.<br />More <span className="text-[#6A8960]">showing up.</span>
              </h2>
            </div>
            <p className="max-w-[350px] text-sm leading-7 text-[#627069]">Screen sharing should feel as simple as handing someone your phone. We stripped everything back to the essentials.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-8">{[{ icon: MonitorUp, title: 'Show without switching', desc: 'Stream a desktop or browser window straight into another device’s screen.' }, { icon: ShieldCheck, title: 'Invite-only by default', desc: 'Every connection needs a code and an explicit yes from the person sharing.' }, { icon: Smartphone, title: 'Made for the small screen', desc: 'Landscape viewing, fullscreen controls and a layout that actually fits a phone.' }].map(({ icon: Icon, title, desc }, i) =>
            <div key={title} className="rounded-2xl bg-[#E7EAE0] p-7 min-h-[255px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Icon size={31} strokeWidth={1.5} />
                <span className="text-[#829084] font-display text-sm">0{i + 1}/03</span>
              </div>
              <div>
                <h3 className="font-display text-[22px] font-semibold tracking-[-.04em]">{title}
                </h3>
                <p className="text-[#68736C] mt-3 text-sm leading-6">{desc}
                </p>
              </div>
            </div>)}
          </div>
        </div>
      </section>
      <section className="wrap py-24 md:py-32">
        <div className="flex items-center gap-4 mb-7">
          <div className="h-[1px] w-10 bg-acid" />
          <div className="eyebrow text-acid">HOW IT WORKS</div>
        </div>
        <div className="grid lg:grid-cols-[.65fr_1.35fr] gap-12">
          <div>
            <h2 className="font-display tracking-[-.065em] text-4xl md:text-6xl font-medium leading-[1.05]">Three steps.<br />One connection.</h2>
            <Link to="/how" className="inline-flex items-center gap-2 text-acid text-sm font-bold mt-8 hover:gap-3 transition-all">See how it works <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-[#303938] border-t border-b border-[#303938]">{steps.map(s =>
            <div key={s.no} className="grid grid-cols-[45px_1fr] sm:grid-cols-[70px_1fr] gap-3 py-7">
              <span className="font-display text-acid text-lg">{s.no}
              </span>
              <div>
                <h3 className="font-display text-2xl tracking-[-.04em] font-medium">{s.title}
                </h3>
                <p className="text-[#8F9C95] text-sm mt-2 leading-7 max-w-lg">{s.desc}
                </p>
              </div>
            </div>)}
          </div>
        </div>
      </section>
      <section className="bg-[#D5FA64] text-[#1B211B]">
        <div className="wrap py-16 md:py-20 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="eyebrow mb-4">READY WHEN YOU ARE</div>
            <h2 className="font-display font-semibold text-4xl md:text-6xl tracking-[-.065em] leading-[1.04]">Distance is overrated.</h2>
            <p className="mt-4 text-[#44523A] max-w-md">Bring the screen closer, whatever device is in your hands.</p>
          </div>
          <Link to="/share" className="btn !bg-[#1A201C] !text-white hover:!bg-[#333B32]">Start sharing <MoveUpRight size={20} />
          </Link>
        </div>
      </section>
    </main>
    <footer className="wrap py-9 flex flex-col sm:flex-row sm:justify-between gap-3 text-xs text-[#89968F]">
      <span>© {new Date().getFullYear()} ScreenBridge · One screen, anywhere.</span>
      <span>Capture only with consent · Built for modern browsers</span>
    </footer>
  </>
}
