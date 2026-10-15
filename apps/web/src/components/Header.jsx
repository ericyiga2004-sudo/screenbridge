import { NavLink, Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
export function Logo({ light = false }) {  
return <Link to="/" className="inline-flex items-center gap-3 text-current" aria-label="ScreenBridge home">
    <span className={'w-9 h-9 rounded-lg relative inline-flex items-center justify-center ' + (light ? 'bg-ink' : 'bg-acid')}>
      <span className={'absolute border-2 rounded-sm w-[17px] h-[13px] -translate-x-[3px] -translate-y-[3px] ' + (light ? 'border-acid' : 'border-ink')} />
      <span className={'absolute border-2 rounded-sm w-[17px] h-[13px] translate-x-[4px] translate-y-[4px] ' + (light ? 'border-acid' : 'border-ink')} />
    </span>
    <span className="font-display font-bold tracking-[-.04em] text-xl">screenbridge<span className="text-acid">.</span>
    </span>
  </Link>
}
export default function Header() {  
const [mobile, setMobile] = useState(false); const location = useLocation(); useEffect(() => setMobile(false), [location]); const items = [['/how', 'How it works'], ['/share', 'Share screen'], ['/watch', 'Watch screen']]; return <header className="relative z-30 border-b border-[#2D3533] bg-ink/95 backdrop-blur-md">
    <div className="wrap h-[80px] flex items-center justify-between">
      <Logo />
      <nav className="hidden md:flex items-center gap-9 text-[13px] font-semibold text-[#ACB4B0]" aria-label="Primary navigation">{items.map(([path, label]) =>
        <NavLink to={path} key={path} className={({ isActive }) => 'hover:text-white transition-colors ' + (isActive ? 'text-acid' : '')}>{label}
        </NavLink>)}
      </nav>
      <Link to="/share" className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 border border-[#505A51] rounded-lg font-semibold text-[13px] hover:border-acid transition-colors">Start a session <ArrowUpRight size={15} />
      </Link>
      <button className="md:hidden p-2 rounded-lg border border-[#394441]" onClick={() => setMobile(x => !x)} aria-label="Toggle menu">{mobile ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>{mobile && <nav className="md:hidden px-5 pb-6 pt-1 grid gap-2 bg-ink" aria-label="Mobile navigation">{items.map(([path, label]) =>
      <Link key={path} to={path} className="px-4 py-3 border-b border-[#303939] text-sm font-medium">{label}
      </Link>)}
    </nav>}
  </header>
}
