'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@/lib/supabase';

interface Coach { id: string; first_name: string; last_name: string; photo_url?: string | null; }

interface VoteResult {
  t1Players: Player[];
  t1HeadCoach: Coach | null;
  t1AssistantCoach: Coach | null;
  t2Players: Player[];
  t2HeadCoach: Coach | null;
  t2AssistantCoach: Coach | null;
}

const COURT_POSITIONS = [
  { top: '72%', left: '50%' }, { top: '52%', left: '22%' }, { top: '52%', left: '78%' },
  { top: '28%', left: '28%' }, { top: '28%', left: '72%' },
];

/* ─── Étoile ─ */
function StarFrame() {
  const color = '#E8651A';
  const id = 'glow-orange';
  return (
    <svg viewBox="0 0 110 110" width="80" height="80" className="absolute inset-0 -m-2" style={{zIndex:1}}>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points="55,4 67,38 103,38 75,59 86,94 55,73 24,94 35,59 7,38 43,38"
        fill="none" stroke={color} strokeWidth="3.5" filter={`url(#${id})`}
        style={{animation: 'pulse-orange 2s ease-in-out infinite'}}/>
    </svg>
  );
}

/* ─── Joueur terrain ─ */
function CourtPlayer({ player, position, index, teamColor }: {
  player: Player; position:{top:string;left:string}; index:number; teamColor:string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),index*300);return()=>clearTimeout(t);},[index]);

  // Numéro valide = non null, non undefined, non 0
  const hasNumber = player.number != null && player.number !== 0;

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{top:position.top,left:position.left,zIndex:10,opacity:visible?1:0,
        transform:`translate(-50%,-50%) scale(${visible?1:0.3})`,
        transition:`opacity 0.5s ease ${index*300}ms,transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index*300}ms`}}>

      <div className="relative w-16 h-16">
        <StarFrame/>
        <div className="absolute rounded-full overflow-hidden bg-[#1A1A1A] flex items-center justify-center"
          style={{zIndex:2,top:6,left:6,right:6,bottom:6}}>
          {player.photo_url
            ? <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top"/>
            : <span style={{fontFamily:'Bebas Neue,sans-serif',color:teamColor}} className="text-base">{player.first_name[0]}{player.last_name[0]}</span>
          }
        </div>
        {/* ✅ MODIF 3 : afficher le badge numéro SEULEMENT si le joueur a un numéro */}
        {hasNumber && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A0A0A]"
            style={{background:teamColor,zIndex:3}}>
            <span style={{fontFamily:'Bebas Neue,sans-serif',color:'white',fontSize:10}}>{player.number}</span>
          </div>
        )}
      </div>
      <div className="text-center mt-3 flex flex-col items-center gap-0.5">
        <p style={{fontFamily:'Bebas Neue,sans-serif',color:'white',textShadow:'0 1px 6px rgba(0,0,0,1)',fontSize:11}} className="leading-tight">{player.last_name.toUpperCase()}</p>
        <p style={{fontFamily:'Bebas Neue,sans-serif',color:'white',textShadow:'0 1px 6px rgba(0,0,0,1)',fontSize:10}} className="leading-tight opacity-70">{player.first_name.toUpperCase()}</p>
      </div>
    </div>
  );
}

/* ─── Terrain ─ */
function TeamCourt({ players, teamColor, teamLabel }: {
  players: Player[]; teamColor: string; teamLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{background:`${teamColor}35`}}/>
        <span style={{fontFamily:'Bebas Neue,sans-serif',color:teamColor,fontSize:12,letterSpacing:'0.15em'}}>{teamLabel}</span>
        <div className="flex-1 h-px" style={{background:`${teamColor}35`}}/>
      </div>
      <div className="relative w-full rounded-2xl overflow-hidden"
        style={{paddingBottom:'115%',background:'linear-gradient(180deg,#1a1a1a 0%,#202020 100%)',
          border:`2px solid ${teamColor}50`,boxShadow:`0 0 40px ${teamColor}25,inset 0 0 60px rgba(0,0,0,0.5)`}}>
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 40px)'}}/>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" preserveAspectRatio="none">
            <rect x="3" y="3" width="94" height="109" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" rx="0.5"/>
            <rect x="31" y="3" width="38" height="22" fill="rgba(232,101,26,0.06)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
            <line x1="31" y1="25" x2="69" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
            <path d="M 31 25 A 19 19 0 0 1 69 25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" strokeDasharray="2,1.5"/>
            <path d="M 31 25 A 19 19 0 0 0 69 25" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
            <rect x="43" y="3" width="14" height="3" fill="rgba(232,101,26,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4"/>
            <circle cx="50" cy="6.5" r="2.5" fill="none" stroke="rgba(255,165,0,0.9)" strokeWidth="0.7"/>
            <path d="M 8 112 L 8 52 A 44 44 0 0 1 92 52 L 92 112" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
            <circle cx="50" cy="112" r="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="3,2"/>
          </svg>
          <div className="absolute" style={{top:'55%',left:'50%',transform:'translate(-50%,-50%)',opacity:0.05,zIndex:1}}>
            <img src="/logo.png" alt="" className="w-20 h-20 object-contain"/>
          </div>
          {players.map((player,i) => (
            <CourtPlayer key={player.id} player={player} position={COURT_POSITIONS[i]}
              index={i} teamColor={teamColor}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Carte coach ─ */
function CoachCard({ coach, role, delay, teamColor }: { coach: Coach | null; role: string; delay: number; teamColor: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),delay);return()=>clearTimeout(t);},[delay]);
  if (!coach) return (
    <div className="flex flex-col items-center gap-2 transition-all duration-500"
      style={{opacity:visible?0.3:0,transform:visible?'translateY(0)':'translateY(16px)'}}>
      <div className="w-14 h-14 rounded-full border-2 bg-[#1A1A1A] flex items-center justify-center"
        style={{borderColor:`${teamColor}40`}}>
        <span className="text-white/20 text-lg">?</span>
      </div>
      <p style={{fontFamily:'Bebas Neue,sans-serif',color:`${teamColor}50`,fontSize:11}} className="leading-tight text-center">{role}</p>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-2 transition-all duration-500"
      style={{opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(16px)'}}>
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 bg-[#1A1A1A] flex items-center justify-center"
          style={{borderColor:teamColor,boxShadow:`0 0 14px ${teamColor}50`}}>
          {coach.photo_url
            ? <img src={coach.photo_url} alt={coach.last_name} className="w-full h-full object-cover object-top"/>
            : <span style={{fontFamily:'Bebas Neue,sans-serif',color:teamColor,fontSize:18}}>{coach.first_name[0]}{coach.last_name[0]}</span>
          }
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white px-2 py-0.5 rounded-full"
          style={{background:teamColor}}>{role}</div>
      </div>
      <div className="text-center mt-2">
        <p style={{fontFamily:'Bebas Neue,sans-serif',color:teamColor,fontSize:12}} className="leading-tight">
          {coach.first_name.toUpperCase()} {coach.last_name.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

/* ─── Page Merci ─ */
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
    const colors = ['#E8651A','#3B9EF0','#FFD700','#ffffff'];
    confetti({ particleCount:100, spread:80, origin:{y:0.6}, colors });
    setTimeout(() => confetti({ particleCount:60, angle:60, spread:55, origin:{x:0}, colors }), 300);
    setTimeout(() => confetti({ particleCount:60, angle:120, spread:55, origin:{x:1}, colors }), 500);
    setTimeout(() => confetti({ particleCount:40, spread:100, origin:{y:0.4}, colors, shapes:['star'] }), 800);
  }

  if (!result) return null;

  return (
    <main className="min-h-screen pb-16 flex flex-col items-center px-4 py-8">
      <style>{`
        @keyframes pulse-orange{0%,100%{opacity:1;filter:drop-shadow(0 0 4px rgba(232,101,26,0.7));}50%{opacity:0.8;filter:drop-shadow(0 0 10px rgba(232,101,26,1));}}
      `}</style>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-6 page-enter">
        <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain animate-float"/>
        <div className="text-center">
          <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-5xl text-white glow-text">MERCI !</h1>
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

      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* ── Équipe 1 ── */}
        <div className="page-enter">
          <TeamCourt players={result.t1Players} teamColor="#E8651A" teamLabel="VOTRE ÉQUIPE 1"/>
          <div className="mt-3 bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4">
            <div className="flex justify-around gap-4">
              <CoachCard coach={result.t1HeadCoach} role="PRINCIPAL" delay={600} teamColor="#E8651A"/>
              <CoachCard coach={result.t1AssistantCoach} role="ADJOINT" delay={900} teamColor="#E8651A"/>
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
          <span style={{fontFamily:'Bebas Neue,sans-serif',color:'rgba(255,255,255,0.3)',fontSize:20,letterSpacing:'0.2em'}}>VS</span>
          <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
        </div>

        {/* ── Équipe 2 ── */}
        <div className="page-enter">
          <TeamCourt players={result.t2Players} teamColor="#3B9EF0" teamLabel="VOTRE ÉQUIPE 2"/>
          <div className="mt-3 bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4">
            <div className="flex justify-around gap-4">
              <CoachCard coach={result.t2HeadCoach} role="PRINCIPAL" delay={1200} teamColor="#3B9EF0"/>
              <CoachCard coach={result.t2AssistantCoach} role="ADJOINT" delay={1500} teamColor="#3B9EF0"/>
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl overflow-hidden page-enter">
          <div className="px-4 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A]">
            <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Récapitulatif complet</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {/* E1 */}
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px" style={{background:'rgba(232,101,26,0.3)'}}/>
              <span style={{fontFamily:'Bebas Neue,sans-serif',color:'#E8651A',fontSize:11,letterSpacing:'0.15em'}}>ÉQUIPE 1</span>
              <div className="flex-1 h-px" style={{background:'rgba(232,101,26,0.3)'}}/>
            </div>
            {result.t1Players.map((player,i) => {
              const hasNumber = player.number != null && player.number !== 0;
              return (
                <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
                  style={{borderColor:'#1E1E1E',background:'#0A0A0A'}}>
                  <span style={{fontFamily:'Bebas Neue,sans-serif',color:'#E8651A'}} className="text-xl w-6 text-center">{i+1}</span>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                    {player.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color:'rgba(232,101,26,0.5)'}} className="text-sm">{player.first_name[0]}</span>}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm block" style={{color:'white'}}>{player.first_name} {player.last_name}</span>
                    {/* ✅ MODIF 3 : afficher le numéro uniquement si défini */}
                    <span className="text-white/40 text-xs">
                      {hasNumber ? `#${player.number}` : ''}{hasNumber && player.position ? ' · ' : ''}{player.position || ''}
                    </span>
                  </div>
                </div>
              );
            })}
            {([{c:result.t1HeadCoach,r:'🧑‍💼 Principal'},{c:result.t1AssistantCoach,r:'👨‍💼 Adjoint'}] as const).map(({c,r})=> c ? (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1E1E1E] bg-[#0A0A0A]">
                <span className="text-lg w-6 text-center">{r.split(' ')[0]}</span>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                  {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color:'rgba(232,101,26,0.5)'}} className="text-sm">{c.first_name[0]}</span>}
                </div>
                <div className="flex-1"><span className="font-semibold text-sm text-white block">{c.first_name} {c.last_name}</span><span className="text-white/40 text-xs">{r.split(' ').slice(1).join(' ')}</span></div>
              </div>
            ) : null)}

            {/* E2 */}
            <div className="flex items-center gap-2 py-1 mt-2">
              <div className="flex-1 h-px" style={{background:'rgba(59,158,240,0.3)'}}/>
              <span style={{fontFamily:'Bebas Neue,sans-serif',color:'#3B9EF0',fontSize:11,letterSpacing:'0.15em'}}>ÉQUIPE 2</span>
              <div className="flex-1 h-px" style={{background:'rgba(59,158,240,0.3)'}}/>
            </div>
            {result.t2Players.map((player,i) => {
              const hasNumber = player.number != null && player.number !== 0;
              return (
                <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
                  style={{borderColor:'#1E1E1E',background:'#0A0A0A'}}>
                  <span style={{fontFamily:'Bebas Neue,sans-serif',color:'#3B9EF0'}} className="text-xl w-6 text-center">{i+1}</span>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                    {player.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color:'rgba(59,158,240,0.5)'}} className="text-sm">{player.first_name[0]}</span>}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm block" style={{color:'white'}}>{player.first_name} {player.last_name}</span>
                    {/* ✅ MODIF 3 : afficher le numéro uniquement si défini */}
                    <span className="text-white/40 text-xs">
                      {hasNumber ? `#${player.number}` : ''}{hasNumber && player.position ? ' · ' : ''}{player.position || ''}
                    </span>
                  </div>
                </div>
              );
            })}
            {([{c:result.t2HeadCoach,r:'🧑‍💼 Principal'},{c:result.t2AssistantCoach,r:'👨‍💼 Adjoint'}] as const).map(({c,r})=> c ? (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1E1E1E] bg-[#0A0A0A]">
                <span className="text-lg w-6 text-center">{r.split(' ')[0]}</span>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                  {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color:'rgba(59,158,240,0.5)'}} className="text-sm">{c.first_name[0]}</span>}
                </div>
                <div className="flex-1"><span className="font-semibold text-sm text-white block">{c.first_name} {c.last_name}</span><span className="text-white/40 text-xs">{r.split(' ').slice(1).join(' ')}</span></div>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      <button onClick={() => router.push('/')} className="text-white/30 hover:text-[#E8651A] transition-colors text-sm mt-6">
        ← Retour à l&apos;accueil
      </button>
    </main>
  );
}
