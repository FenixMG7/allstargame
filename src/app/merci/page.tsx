'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@/lib/supabase';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}

interface VoteResult {
  players: Player[];
  bonus: Player;
  headCoach?: Coach;
  assistantCoach?: Coach;
}

const COURT_POSITIONS = [
  { top: '72%', left: '50%' },
  { top: '52%', left: '22%' },
  { top: '52%', left: '78%' },
  { top: '28%', left: '28%' },
  { top: '28%', left: '72%' },
];

function StarFrame({ isBonus }: { isBonus: boolean }) {
  const color = isBonus ? '#FFD700' : '#E8651A';
  const id = isBonus ? 'glow-gold' : 'glow-orange';
  return (
    <svg viewBox="0 0 110 110" width="80" height="80" className="absolute inset-0 -m-2" style={{ zIndex: 1 }}>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points="55,4 67,38 103,38 75,59 86,94 55,73 24,94 35,59 7,38 43,38"
        fill="none" stroke={color} strokeWidth="3.5" filter={`url(#${id})`}
        style={{ animation: isBonus ? 'pulse-gold 1.5s ease-in-out infinite' : 'pulse-orange 2s ease-in-out infinite' }}/>
      {isBonus && [0,1,2,3,4].map(i => {
        const a = (i*72-90)*Math.PI/180;
        return <circle key={i} cx={55+48*Math.cos(a)} cy={55+48*Math.sin(a)} r="2.5" fill={color}
          style={{ filter:'drop-shadow(0 0 4px rgba(255,215,0,0.8))' }}/>;
      })}
    </svg>
  );
}

function CourtPlayer({ player, position, isBonus, index }: {
  player: Player; position: { top: string; left: string }; isBonus: boolean; index: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index*300); return () => clearTimeout(t); }, [index]);
  
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ top: position.top, left: position.left, zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%,-50%) scale(${visible?1:0.3})`,
        transition: `opacity 0.5s ease ${index*300}ms, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index*300}ms` }}>
      
      {isBonus && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-black px-1.5 py-0.5 rounded-full z-30"
          style={{ background:'#FFD700', boxShadow:'0 0 8px rgba(255,215,0,0.8)' }}>⭐ BONUS</div>
      )}
      
      {/* CORRECTION 1 : Remplacement du style en ligne par les classes Tailwind (w-16 = 64px, h-16 = 64px) */}
      <div className="relative w-16 h-16">
        <StarFrame isBonus={isBonus}/>
        <div className="absolute rounded-full overflow-hidden bg-[#1A1A1A] flex items-center justify-center"
          style={{ zIndex:2, top:6, left:6, right:6, bottom:6 }}>
          {player.photo_url
            ? <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top"/>
            : <span style={{ fontFamily:'Bebas Neue,sans-serif', color:'#E8651A' }} className="text-base">{player.first_name[0]}{player.last_name[0]}</span>
          }
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A0A0A]"
          style={{ background:'#E8651A', zIndex:3 }}>
          <span style={{ fontFamily:'Bebas Neue,sans-serif', color:'white', fontSize:10 }}>{player.number}</span>
        </div>
      </div>
      
      {/* CORRECTION 2 : Changement de mt-1.5 à mt-3 pour laisser respirer l'étoile (qui déborde de 8px en bas) */}
      <div className="text-center mt-3">
        <p style={{ fontFamily:'Bebas Neue,sans-serif', color: isBonus?'#FFD700':'white',
          textShadow:'0 1px 6px rgba(0,0,0,1)', fontSize:11 }} className="leading-tight">
          {player.last_name.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function CoachCard({ coach, role, delay }: { coach: Coach; role: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="flex flex-col items-center gap-2 transition-all duration-500"
      style={{ opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(16px)' }}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 bg-[#1A1A1A] flex items-center justify-center"
          style={{ borderColor:'#E8651A', boxShadow:'0 0 16px rgba(232,101,26,0.4)' }}>
          {coach.photo_url
            ? <img src={coach.photo_url} alt={coach.last_name} className="w-full h-full object-cover object-top"/>
            : <span style={{ fontFamily:'Bebas Neue,sans-serif', color:'#E8651A', fontSize:20 }}>{coach.first_name[0]}{coach.last_name[0]}</span>
          }
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white px-2 py-0.5 rounded-full"
          style={{ background:'#E8651A' }}>{role}</div>
      </div>
      <div className="text-center mt-2">
        <p style={{ fontFamily:'Bebas Neue,sans-serif', color:'#E8651A', fontSize:13 }} className="leading-tight">
          {coach.first_name.toUpperCase()} {coach.last_name.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

export default function MerciPage() {
  const router = useRouter();
  const [result, setResult] = useState<VoteResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('vote_result');
    if (!stored) { router.replace('/'); return; }
    setResult(JSON.parse(stored));
    sessionStorage.removeItem('vote_result');
    fireConfetti();
  }, [router]);

  async function fireConfetti() {
    const confetti = (await import('canvas-confetti')).default;
    const colors = ['#E8651A','#FFD700','#ffffff','#FF8040'];
    confetti({ particleCount:100, spread:80, origin:{y:0.6}, colors });
    setTimeout(() => confetti({ particleCount:60, angle:60, spread:55, origin:{x:0}, colors }), 300);
    setTimeout(() => confetti({ particleCount:60, angle:120, spread:55, origin:{x:1}, colors }), 500);
    setTimeout(() => confetti({ particleCount:40, spread:100, origin:{y:0.4}, colors, shapes:['star'] }), 800);
  }

  if (!result) return null;
  const hasCoaches = result.headCoach || result.assistantCoach;

  return (
    <main className="min-h-screen pb-16 flex flex-col items-center px-4 py-8">
      <style>{`
        @keyframes pulse-gold { 0%,100%{opacity:1;filter:drop-shadow(0 0 6px rgba(255,215,0,0.9));} 50%{opacity:0.7;filter:drop-shadow(0 0 14px rgba(255,215,0,1));} }
        @keyframes pulse-orange { 0%,100%{opacity:1;filter:drop-shadow(0 0 4px rgba(232,101,26,0.7));} 50%{opacity:0.8;filter:drop-shadow(0 0 10px rgba(232,101,26,1));} }
      `}</style>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-6 page-enter">
        <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain animate-float"/>
        <div className="text-center">
          <h1 style={{ fontFamily:'Bebas Neue,sans-serif' }} className="text-5xl text-white glow-text">MERCI !</h1>
          <p className="text-white/50 text-sm mt-1">Votre sélection a bien été enregistrée</p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_,i) => (
            <svg key={i} viewBox="0 0 51 49" className="w-4 h-4" fill="#E8651A">
              <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z"/>
            </svg>
          ))}
        </div>
      </div>

      {/* Terrain */}
      <div className="w-full max-w-sm mb-6 page-enter">
        <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-3">Votre équipe All-Star</p>
        <div className="relative w-full rounded-2xl overflow-hidden"
          style={{ paddingBottom:'115%', background:'linear-gradient(180deg,#1a1a1a 0%,#202020 100%)',
            border:'2px solid rgba(232,101,26,0.4)', boxShadow:'0 0 40px rgba(232,101,26,0.2), inset 0 0 60px rgba(0,0,0,0.5)' }}>
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{ backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 40px)' }}/>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" preserveAspectRatio="none">
              <rect x="3" y="3" width="94" height="109" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" rx="0.5"/>
              <rect x="31" y="3" width="38" height="22" fill="rgba(232,101,26,0.06)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
              <line x1="31" y1="25" x2="69" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
              <path d="M 31 25 A 19 19 0 0 1 69 25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" strokeDasharray="2,1.5"/>
              <path d="M 31 25 A 19 19 0 0 0 69 25" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
              <rect x="43" y="3" width="14" height="3" fill="rgba(232,101,26,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4"/>
              <circle cx="50" cy="6.5" r="2.5" fill="none" stroke="rgba(255,165,0,0.9)" strokeWidth="0.7"/>
              <path d="M 8 112 L 8 52 A 44 44 0 0 1 92 52 L 92 112" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
              <line x1="3" y1="52" x2="8" y2="52" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
              <line x1="92" y1="52" x2="97" y2="52" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
              <circle cx="50" cy="112" r="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="3,2"/>
            </svg>
            <div className="absolute" style={{ top:'55%',left:'50%',transform:'translate(-50%,-50%)',opacity:0.05,zIndex:1 }}>
              <img src="/logo.png" alt="" className="w-24 h-24 object-contain"/>
            </div>
            {result.players.map((player,i) => (
              <CourtPlayer key={player.id} player={player} position={COURT_POSITIONS[i]}
                isBonus={player.id===result.bonus.id} index={i}/>
            ))}
          </div>
        </div>
      </div>

      {/* Staff coachs */}
      {hasCoaches && (
        <div className="w-full max-w-sm mb-6 page-enter">
          <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-4">Votre staff</p>
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5">
            <div className="flex justify-around gap-6">
              {result.headCoach && <CoachCard coach={result.headCoach} role="PRINCIPAL" delay={600}/>}
              {result.assistantCoach && <CoachCard coach={result.assistantCoach} role="ADJOINT" delay={900}/>}
            </div>
          </div>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="w-full max-w-sm bg-[#141414] border border-[#1E1E1E] rounded-2xl overflow-hidden mb-6 page-enter">
        <div className="px-4 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A]">
          <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Récapitulatif</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {result.players.map((player,i) => {
            const isBonus = player.id === result.bonus.id;
            return (
              <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
                style={{ borderColor: isBonus?'rgba(255,215,0,0.5)':'#1E1E1E', background: isBonus?'rgba(255,215,0,0.05)':'#0A0A0A' }}>
                <span style={{ fontFamily:'Bebas Neue,sans-serif',color:'#E8651A' }} className="text-xl w-6 text-center">{i+1}</span>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover"/>
                    : <span style={{ fontFamily:'Bebas Neue,sans-serif',color:'rgba(232,101,26,0.5)' }} className="text-sm">{player.first_name[0]}</span>
                  }
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm block" style={{ color: isBonus?'#FFD700':'white' }}>
                    {player.first_name} {player.last_name}
                  </span>
                  <span className="text-white/40 text-xs">#{player.number} · {player.position}</span>
                </div>
                {isBonus && <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full" style={{ background:'#FFD700' }}>⭐ BONUS</span>}
              </div>
            );
          })}

          {hasCoaches && (
            <>
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-[#1E1E1E]"/>
                <span className="text-white/20 text-xs uppercase tracking-widest">Staff</span>
                <div className="flex-1 h-px bg-[#1E1E1E]"/>
              </div>
              {[
                { coach: result.headCoach, icon: '🧑‍💼', label: 'Coach Principal' },
                { coach: result.assistantCoach, icon: '👨‍💼', label: 'Coach Adjoint' },
              ].filter(x => x.coach).map(({ coach, icon, label }) => (
                <div key={coach!.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1E1E1E] bg-[#0A0A0A]">
                  <span className="text-lg w-6 text-center">{icon}</span>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                    {coach!.photo_url
                      ? <img src={coach!.photo_url} alt="" className="w-full h-full object-cover"/>
                      : <span style={{ fontFamily:'Bebas Neue,sans-serif',color:'rgba(232,101,26,0.5)' }} className="text-sm">{coach!.first_name[0]}</span>
                    }
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-white block">{coach!.first_name} {coach!.last_name}</span>
                    <span className="text-white/40 text-xs">{label}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <button onClick={() => router.push('/')} className="text-white/30 hover:text-[#E8651A] transition-colors text-sm">
        ← Retour à l&apos;accueil
      </button>
    </main>
  );
}
 
 
