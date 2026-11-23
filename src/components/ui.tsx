import type { ReactNode } from 'react';
import { audio } from '../systems/audio';
import { useGame } from '../store/gameStore';
import type { Illustration } from '../data/learning';

export function Button({
  children, onClick, variant = 'primary', size = 'md', className = '', ariaLabel,
}: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'teal';
  size?: 'lg' | 'md' | 'sm'; className?: string; ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={() => { audio.unlock(); audio.sfx('click'); onClick?.(); }}
    >
      {children}
    </button>
  );
}

export function Screen({ title, kicker, onBack, children, className = '' }: {
  title: string; kicker?: string; onBack: () => void; children: ReactNode; className?: string;
}) {
  return (
    <div className={`screen ${className}`} role="dialog" aria-label={title}>
      <div className="screen-sheet">
        <header className="screen-head">
          <Button variant="ghost" size="sm" onClick={onBack} ariaLabel="Back">
            <Icon name="back" /> Back
          </Button>
          <div className="screen-titles">
            {kicker && <div className="kicker">{kicker}</div>}
            <h1>{title}</h1>
          </div>
        </header>
        <div className="screen-body">{children}</div>
      </div>
    </div>
  );
}

export function Thumb({ id, size = 56, locked = false, alt = '' }: { id: string; size?: number; locked?: boolean; alt?: string }) {
  const src = useGame((s) => s.thumbs[id]);
  return (
    <span className={`thumb ${locked ? 'locked' : ''}`} style={{ width: size, height: size }}>
      {src ? <img src={src} alt={alt} width={size} height={size} draggable={false} /> : null}
    </span>
  );
}

export function Icon({ name, size = 20 }: { name: 'back' | 'pause' | 'heart' | 'heartEmpty' | 'play' | 'gear' | 'book' | 'leaf' | 'trophy' | 'help' | 'home' | 'restart' | 'lock' | 'check' | 'sound' | 'mute' | 'star'; size?: number }) {
  const s = { width: size, height: size };
  switch (name) {
    case 'back': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'pause': return <svg {...s} viewBox="0 0 24 24" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" /></svg>;
    case 'play': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>;
    case 'heart': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z" fill="currentColor" /></svg>;
    case 'heartEmpty': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
    case 'gear': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.4 4.7-1.8.4-.6 1.5 1 1.6-1.6 1.6-1.6-1-1.5.6-.4 1.8h-2.2l-.4-1.8-1.5-.6-1.6 1-1.6-1.6 1-1.6-.6-1.5-1.8-.4v-2.4l1.8-.4.6-1.5-1-1.6 1.6-1.6 1.6 1 1.5-.6.4-1.8h2.2l.4 1.8 1.5.6 1.6-1 1.6 1.6-1 1.6.6 1.5 1.8.4Z" fill="currentColor" /></svg>;
    case 'book': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.4-6-1.4-9 .5-3-1.9-6.5-1.9-9-.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 6v13.5" stroke="currentColor" strokeWidth="2" /></svg>;
    case 'leaf': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l8-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'trophy': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M7 4h10v4a5 5 0 0 1-10 0Zm0 1H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3M12 13v4m-4 3h8l-1-3H9Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
    case 'help': return <svg {...s} viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="17" r="1.2" fill="currentColor" /></svg>;
    case 'home': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" fill="currentColor" /></svg>;
    case 'restart': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M5 12a7 7 0 1 0 2.1-5M5 4v4h4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'lock': return <svg {...s} viewBox="0 0 24 24" aria-hidden><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
    case 'check': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'sound': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor" /><path d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
    case 'mute': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor" /><path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
    case 'star': return <svg {...s} viewBox="0 0 24 24" aria-hidden><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" fill="currentColor" /></svg>;
  }
}

/** Gauri the sparrow as a little SVG avatar (matches the 3D model). */
export function GauriAvatar({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="gauri-avatar">
      <circle cx="32" cy="32" r="31" fill="#F2E6CF" />
      <path d="M10 40c4-8 10-11 18-11l-6 12Z" fill="#5A3622" />
      <ellipse cx="30" cy="38" rx="17" ry="14" fill="#F1DDB6" />
      <path d="M14 34c6-8 16-9 24-5-4 6-12 9-24 5Z" fill="#8C5A3A" />
      <circle cx="40" cy="25" r="11" fill="#F1DDB6" />
      <path d="M29.5 23a11 11 0 0 1 21-1c-6-2-13-2-21 1Z" fill="#A95A32" />
      <path d="M36 20.5c3-1.5 7-1.5 10 0" stroke="#F8EEDC" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="43" cy="25" r="2.6" fill="#1A110D" />
      <circle cx="43.8" cy="24.2" r="0.9" fill="#fff" />
      <circle cx="45" cy="29.5" r="2" fill="#C66161" opacity="0.55" />
      <path d="M50 25.5 57 27l-7 2.4Z" fill="#4A4646" />
      <path d="M28 51v5m5-5v5" stroke="#C08A5C" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="53" r="1.6" fill="#C66161" />
    </svg>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'logo-sm' : ''}`} aria-label="Power Dash">
      <span className="logo-power">POWER</span>
      <span className="logo-dash">
        DASH
        <svg className="logo-bolt" viewBox="0 0 24 40" aria-hidden><path d="M15 1 2 23h9l-3 16L22 15h-9l3-14Z" fill="#C4452E" stroke="#3A2420" strokeWidth="2" strokeLinejoin="round" /></svg>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Learning-centre illustrations (simple, friendly, non-graphic SVGs)

const P = { chandan: '#F2E6CF', haldi: '#E2A93B', terracotta: '#B8643F', sindoor: '#C4452E', indigo: '#2F4A73', neem: '#7E9A6E', teal: '#3F6E68', rose: '#C66161', ink: '#3A2420', cream: '#FAF3E3', water: '#6FB7C9', pink: '#E79BA6' };

export function Art({ name, size = 96 }: { name: Illustration; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 100 100', 'aria-hidden': true } as const;
  const bg = <circle cx="50" cy="50" r="48" fill={P.cream} />;
  switch (name) {
    case 'uterus': return <svg {...s}>{bg}<path d="M30 30c6-6 14 0 20 0s14-6 20 0c4 4-2 10-8 12-4 2-6 8-6 14v14h-12V56c0-6-2-12-6-14-6-2-12-8-8-12Z" fill={P.rose} /><circle cx="24" cy="32" r="5" fill={P.pink} /><circle cx="76" cy="32" r="5" fill={P.pink} /><path d="M29 32h-5m47 0h5" stroke={P.rose} strokeWidth="3" /></svg>;
    case 'cycle': return <svg {...s}>{bg}<circle cx="50" cy="50" r="28" fill="none" stroke={P.haldi} strokeWidth="8" strokeDasharray="140 40" /><path d="M76 34 80 46 68 44Z" fill={P.haldi} /><circle cx="50" cy="22" r="7" fill={P.rose} /><circle cx="78" cy="58" r="5" fill={P.teal} /><circle cx="30" cy="72" r="5" fill={P.neem} /></svg>;
    case 'calendar': return <svg {...s}>{bg}<rect x="22" y="26" width="56" height="50" rx="6" fill="#fff" stroke={P.ink} strokeWidth="2.5" /><rect x="22" y="26" width="56" height="12" rx="6" fill={P.sindoor} />{[0, 1, 2, 3, 4].map((i) => [0, 1, 2].map((j) => <circle key={`${i}${j}`} cx={31 + i * 9.5} cy={48 + j * 10} r="3" fill={i < 2 && j === 0 ? P.rose : '#D9CBB0'} />))}</svg>;
    case 'growing': return <svg {...s}>{bg}<rect x="22" y="62" width="10" height="16" rx="3" fill={P.neem} /><rect x="38" y="50" width="10" height="28" rx="3" fill={P.teal} /><rect x="54" y="38" width="10" height="40" rx="3" fill={P.haldi} /><rect x="70" y="26" width="10" height="52" rx="3" fill={P.rose} /><path d="M20 80h62" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" /></svg>;
    case 'variety': return <svg {...s}>{bg}{[P.rose, P.haldi, P.teal, P.indigo].map((c, i) => <g key={i}><circle cx={26 + i * 16} cy={42 + (i % 2) * 6} r="7" fill="#C98454" /><rect x={20 + i * 16} y={52 + (i % 2) * 6} width="12" height={18 - (i % 2) * 4} rx="4" fill={c} /></g>)}</svg>;
    case 'pad': case 'padSteps': return <svg {...s}>{bg}<path d="M50 18c10 0 11 14 9 18 8 1 8 11 0 12 2 4 1 22-9 22s-11-18-9-22c-8-1-8-11 0-12-2-4-1-18 9-18Z" fill="#fff" stroke={P.pink} strokeWidth="3" /><ellipse cx="50" cy="44" rx="5" ry="16" fill={P.pink} opacity="0.6" />{name === 'padSteps' && <g fontFamily="Baloo 2" fontWeight="800" fontSize="12" fill={P.ink}><circle cx="20" cy="24" r="8" fill={P.haldi} /><text x="16.5" y="28">1</text><circle cx="82" cy="50" r="8" fill={P.haldi} /><text x="78.5" y="54">2</text><circle cx="22" cy="78" r="8" fill={P.haldi} /><text x="18.5" y="82">3</text></g>}</svg>;
    case 'tampon': case 'tamponSafe': return <svg {...s}>{bg}<rect x="36" y="22" width="28" height="44" rx="14" fill="#fff" stroke="#9CC9C2" strokeWidth="3" /><path d="M50 66v16" stroke={P.teal} strokeWidth="2.5" strokeLinecap="round" />{name === 'tamponSafe' && <g><circle cx="76" cy="28" r="12" fill="#fff" stroke={P.indigo} strokeWidth="2.5" /><path d="M76 21v7l5 3" stroke={P.indigo} strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>}</svg>;
    case 'cup': case 'cupCare': return <svg {...s}>{bg}<path d="M32 26h36l-4 26c-2 10-8 14-14 14s-12-4-14-14Z" fill={P.pink} opacity="0.9" /><path d="M50 66v12" stroke={P.rose} strokeWidth="4" strokeLinecap="round" />{name === 'cupCare' && <g><path d="M20 84h60" stroke={P.ink} strokeWidth="3" strokeLinecap="round" /><path d="M30 20c0-6 6-6 6-12M44 18c0-6 6-6 6-12" stroke={P.water} strokeWidth="3" fill="none" strokeLinecap="round" /></g>}</svg>;
    case 'cloth': case 'clothCare': return <svg {...s}>{bg}<rect x="24" y="44" width="52" height="12" rx="6" fill={P.haldi} /><rect x="26" y="54" width="50" height="12" rx="6" fill={P.teal} /><rect x="24" y="64" width="52" height="12" rx="6" fill={P.rose} />{name === 'clothCare' ? <g><circle cx="72" cy="24" r="10" fill={P.haldi} />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M${72 + Math.cos(i * 0.785) * 13} ${24 + Math.sin(i * 0.785) * 13}l${Math.cos(i * 0.785) * 4} ${Math.sin(i * 0.785) * 4}`} stroke={P.haldi} strokeWidth="2.5" strokeLinecap="round" />)}</g> : <circle cx="64" cy="50" r="2.5" fill="#fff" />}</svg>;
    case 'clock': return <svg {...s}>{bg}<circle cx="50" cy="50" r="28" fill="#fff" stroke={P.indigo} strokeWidth="4" /><path d="M50 32v18l12 8" stroke={P.sindoor} strokeWidth="4" fill="none" strokeLinecap="round" /></svg>;
    case 'shower': return <svg {...s}>{bg}<path d="M30 28h30a8 8 0 0 1 8 8" stroke={P.ink} strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M58 40h20" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />{[0, 1, 2, 3].map((i) => <path key={i} d={`M${61 + i * 5} 48v${10 + (i % 2) * 8}`} stroke={P.water} strokeWidth="3" strokeLinecap="round" />)}<circle cx="34" cy="70" r="8" fill={P.pink} /><circle cx="44" cy="74" r="5" fill={P.cream} stroke={P.water} strokeWidth="2" /></svg>;
    case 'bin': return <svg {...s}>{bg}<path d="M32 40h36l-4 38H36Z" fill={P.teal} /><rect x="28" y="32" width="44" height="8" rx="3" fill={P.ink} /><path d="M44 32v-4h12v4" stroke={P.ink} strokeWidth="3" fill="none" /><rect x="40" y="16" width="20" height="10" rx="3" fill={P.pink} transform="rotate(-12 50 21)" /></svg>;
    case 'sun': return <svg {...s}>{bg}<circle cx="50" cy="38" r="14" fill={P.haldi} />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M${50 + Math.cos(i * 0.785) * 19} ${38 + Math.sin(i * 0.785) * 19}l${Math.cos(i * 0.785) * 6} ${Math.sin(i * 0.785) * 6}`} stroke={P.haldi} strokeWidth="3" strokeLinecap="round" />)}<path d="M18 70h64" stroke={P.ink} strokeWidth="2" /><rect x="28" y="70" width="14" height="14" fill={P.rose} /><rect x="58" y="70" width="14" height="14" fill={P.teal} /></svg>;
    case 'kit': return <svg {...s}>{bg}<rect x="24" y="36" width="52" height="38" rx="10" fill={P.teal} /><path d="M24 46h52" stroke={P.sindoor} strokeWidth="4" /><circle cx="50" cy="60" r="7" fill={P.haldi} /><rect x="34" y="26" width="14" height="14" rx="3" fill={P.pink} /><rect x="52" y="28" width="12" height="12" rx="2" fill="#fff" /></svg>;
    case 'talk': return <svg {...s}>{bg}<path d="M18 30h38a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H32l-8 8v-8h-6a6 6 0 0 1-6-6V36a6 6 0 0 1 6-6Z" fill={P.haldi} /><path d="M50 46h30a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-2v8l-8-8H50a6 6 0 0 1-6-6V52a6 6 0 0 1 6-6Z" fill={P.rose} /><text x="30" y="49" fontFamily="Baloo 2" fontWeight="800" fontSize="16" fill={P.ink}>?</text><path d="m58 58 4 4 8-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>;
    case 'myth': return <svg {...s}>{bg}<circle cx="50" cy="50" r="26" fill={P.haldi} /><path d="m40 50 7 7 14-14" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" /></svg>;
    case 'plate': return <svg {...s}>{bg}<circle cx="50" cy="52" r="32" fill="#fff" stroke="#D9CBB0" strokeWidth="3" /><path d="M50 52V20a32 32 0 0 1 30 22Z" fill={P.neem} /><path d="M50 52 80 42a32 32 0 0 1-14 38Z" fill={P.sindoor} /><path d="M50 52 66 80a32 32 0 0 1-32 0Z" fill={P.haldi} /><path d="M50 52 34 80a32 32 0 0 1-14-38Z" fill={P.terracotta} /><path d="M50 52 20 42a32 32 0 0 1 30-22Z" fill={P.cream} /></svg>;
    case 'fruitveg': return <svg {...s}>{bg}<circle cx="36" cy="56" r="14" fill="#C9392A" /><circle cx="62" cy="58" r="13" fill="#E88A2A" /><path d="M46 30 54 74 60 74 52 30Z" fill="#E57A2C" transform="rotate(-25 52 52)" /><path d="M36 42c0-5 4-7 6-8" stroke={P.neem} strokeWidth="3" fill="none" /></svg>;
    case 'protein': return <svg {...s}>{bg}<ellipse cx="38" cy="54" rx="13" ry="17" fill="#F6EEDC" stroke="#D9CBB0" strokeWidth="2" /><path d="M54 52h30l-4 18H58Z" fill="#C8CCCF" /><ellipse cx="69" cy="52" rx="15" ry="4" fill="#7B2E22" /></svg>;
    case 'bones': return <svg {...s}>{bg}<path d="M32 30a6 6 0 1 1 8 8l20 20a6 6 0 1 1 8 8 6 6 0 1 1-8-8L40 38a6 6 0 1 1-8-8Z" fill="#fff" stroke="#D9CBB0" strokeWidth="2" /><rect x="60" y="20" width="18" height="26" rx="4" fill="#fff" stroke={P.indigo} strokeWidth="2.5" /><rect x="60" y="28" width="18" height="8" fill={P.indigo} /></svg>;
    case 'water': return <svg {...s}>{bg}<path d="M50 18c12 18 20 28 20 40a20 20 0 0 1-40 0c0-12 8-22 20-40Z" fill={P.water} /><path d="M40 60a10 10 0 0 0 8 10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>;
    case 'habits': return <svg {...s}>{bg}<circle cx="50" cy="54" r="24" fill="#fff" stroke="#D9CBB0" strokeWidth="3" /><circle cx="44" cy="50" r="7" fill={P.haldi} /><circle cx="58" cy="56" r="6" fill={P.neem} /><path d="M20 30v40M80 30v40" stroke={P.ink} strokeWidth="3" strokeLinecap="round" /><circle cx="50" cy="20" r="6" fill={P.sindoor} /></svg>;
  }
}

export function Rangoli({ size = 120, className = '' }: { size?: number; className?: string }) {
  const petals = (r: number, n: number, rx: number, ry: number, color: string) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 360;
      return <ellipse key={`${r}-${i}`} cx={50 + r} cy={50} rx={rx} ry={ry} fill={color} transform={`rotate(${a} 50 50)`} />;
    });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className={className}>
      {petals(30, 12, 14, 6, P.indigo)}
      {petals(22, 12, 11, 5, P.haldi)}
      {petals(14, 8, 9, 4, P.sindoor)}
      <circle cx="50" cy="50" r="7" fill={P.cream} />
      <circle cx="50" cy="50" r="3.5" fill={P.sindoor} />
    </svg>
  );
}
