'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@/lib/supabase';

interface VoteResult {
  players: Player[];
  bonus: Player;
}

// Positions sur le demi-terrain (en %)
const COURT_POSITIONS = [
  { top: '75%', left: '50%', label: 'Meneur' },
  { top: '55%', left: '20%', label: 'Ailier G' },
  { top: '55%', left: '80%', label: 'Ailier D' },
  { top: '30%', left: '30%', label: 'Intérieur G' },
  { top: '30%', left: '70%', label: 'Intérieur D' },
];

function CourtPlayer({ player, position, isBonus, index }: {
  player: Player; position: typeof COURT_POSITIONS[0]; isBonus: boolean; index: number;
}) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      style={{top: position.top, left: position.left, zIndex: 10}}>
      <div className="relative">
        {isBonus && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-black px-1.5 py-0.5 rounded-full z-20"
            style={{background:'#FFD700'}}>⭐ BONUS</div>
        )}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 flex-shrink-0"
          style={{
            borderColor: isBonus ? '#FFD700' : '#E8651A',
            boxShadow: isBonus
              ? '0 0 0 2px #FFD700, 0 0 15px rgba(255,215,0,0.6)'
              : '0 0 0 2px #E8651A, 0 0 10px rgba(232,101,26,0.5)'
          }}>
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
              <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A]">
                {player.first_name[0]}{player.last_name[0]}
              </span>
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-[#0A0A0A]"
          style={{background:'#E8651A'}}>
          <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-[10px] text-white leading-none">{player.number}</span>
        </div>
      </div>
      <div className="text-center mt-1">
        <p style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-[11px] sm:text-xs leading-tight"
          style={{color: isBonus ? '#FFD700' : 'white', textShadow:'0 1px 4px rgba(0,0,0,0.9)'}}>
          {player.last_name.toUpperCase()}
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
    const colors = ['#E8651A', '#FFD700', '#ffffff', '#FF8040'];
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors }), 300);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors }), 500);
    setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { y: 0.4 }, colors, shapes: ['star'] }), 800);
  }

  if (!result) return null;

  return (
    <main className="min-h-screen pb-16 flex flex-col items-center px-4 py-8">

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-6 page-enter">
        <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain animate-float" />
        <div className="text-center">
          <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-5xl text-white glow-text">MERCI !</h1>
          <p className="text-white/50 text-sm mt-1">Votre sélection a bien été enregistrée</p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg key={i} viewBox="0 0 51 49" className="w-4 h-4" fill="#E8651A">
              <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Demi-terrain */}
      <div className="w-full max-w-sm mb-6 page-enter">
        <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-3">Votre équipe All-Star</p>
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#E8651A]/40"
          style={{
            paddingBottom: '110%',
            background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5c1e 40%, #226622 70%, #1e5c1e 100%)',
            boxShadow: '0 0 30px rgba(232,101,26,0.3)'
          }}>

          {/* Lignes terrain */}
          <div className="absolute inset-0">
            {/* Arc principal */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 110" preserveAspectRatio="none">
              {/* Ligne de fond */}
              <line x1="5" y1="5" x2="95" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              {/* Lignes côtés */}
              <line x1="5" y1="5" x2="5" y2="105" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              <line x1="95" y1="5" x2="95" y2="105" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              {/* Ligne de fond bas */}
              <line x1="5" y1="105" x2="95" y2="105" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              {/* Raquette */}
              <rect x="30" y="5" width="40" height="25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
              {/* Cercle lancer franc */}
              <circle cx="50" cy="30" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              {/* Arc à 3 points */}
              <path d="M 10 105 L 10 40 A 42 42 0 0 1 90 40 L 90 105" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
              {/* Cercle central panier */}
              <circle cx="50" cy="10" r="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Point lancer franc */}
              <circle cx="50" cy="30" r="1" fill="rgba(255,255,255,0.5)"/>
            </svg>

            {/* Logo au centre */}
            <div className="absolute" style={{top:'45%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.08}}>
              <img src="/logo.png" alt="" className="w-24 h-24 object-contain" />
            </div>

            {/* Joueurs */}
            {result.players.map((player, i) => (
              <CourtPlayer
                key={player.id}
                player={player}
                position={COURT_POSITIONS[i]}
                isBonus={player.id === result.bonus.id}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Liste joueurs */}
      <div className="w-full max-w-sm bg-[#141414] border border-[#1E1E1E] rounded-2xl overflow-hidden mb-6 page-enter">
        <div className="px-4 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A]">
          <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Récapitulatif</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {result.players.map((player, i) => {
            const isBonus = player.id === result.bonus.id;
            return (
              <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
                style={{borderColor: isBonus ? 'rgba(255,215,0,0.5)' : '#1E1E1E', background: isBonus ? 'rgba(255,215,0,0.05)' : '#0A0A0A'}}>
                <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#E8651A] w-6 text-center">{i + 1}</span>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover" />
                    : <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-sm text-[#E8651A]/50">{player.first_name[0]}</span>
                  }
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm block" style={{color: isBonus ? '#FFD700' : 'white'}}>
                    {player.first_name} {player.last_name}
                  </span>
                  <span className="text-white/40 text-xs">#{player.number} · {player.position}</span>
                </div>
                {isBonus && (
                  <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full" style={{background:'#FFD700'}}>⭐ BONUS</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => router.push('/')} className="text-white/30 hover:text-[#E8651A] transition-colors text-sm">
        ← Retour à l&apos;accueil
      </button>

    </main>
  );
}
