'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  number?: string;
  position?: string;
}

interface VoteResult {
  players: Player[];
  bonus: Player;
}

const COURT_POSITIONS = [
  { top: '78%', left: '50%' },
  { top: '52%', left: '18%' },
  { top: '52%', left: '82%' },
  { top: '24%', left: '30%' },
  { top: '24%', left: '70%' },
];

function BasketballCourt2D() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" preserveAspectRatio="xMidYMid meet">
      <rect x="5" y="3" width="90" height="109" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" rx="1"/>
      <rect x="31" y="3" width="38" height="24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <line x1="31" y1="27" x2="69" y2="27" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <path d="M 31 27 A 19 19 0 0 0 69 27" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <path d="M 31 27 A 19 19 0 0 1 69 27" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2,2"/>
      <line x1="44" y1="7" x2="56" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8"/>
      {/* MODIFICATION 2 : Support panier centré */}
      <line x1="50" y1="7" x2="50" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
      <circle cx="50" cy="11" r="2.5" fill="none" stroke="#E8651A" strokeWidth="0.8"/>
      <path d="M 44 14 A 6 6 0 0 0 56 14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"/>
      <line x1="5" y1="3" x2="5" y2="35" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <line x1="95" y1="3" x2="95" y2="35" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <path d="M 5 35 A 45 45 0 0 0 95 35" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <line x1="5" y1="112" x2="95" y2="112" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
      <path d="M 35 112 A 15 15 0 0 1 65 112" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
    </svg>
  );
}

function StarFrame({ isBonus }: { isBonus: boolean }) {
  const color = isBonus ? '#FFD700' : '#E8651A';
  const filterId = isBonus ? 'glow-merci-gold' : 'glow-merci-orange';
  
  return (
    /* MODIFICATION 1 : Étoile plus grande (width/height 90, -m-3) */
    <svg viewBox="0 0 110 110" width="90" height="90" className="absolute inset-0 -m-3" style={{ zIndex: 1 }}>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon
        points="55,4 67,38 103,38 75,59 86,94 55,73 24,94 35,59 7,38 43,38"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}

function CourtPlayer({ player, position, isBonus, index }: {
  player: Player;
  position: { top: string; left: string };
  isBonus: boolean;
  index: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 300);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        top: position.top,
        left: position.left,
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.3})`,
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: `opacity 0.5s ease ${index * 300}ms, transform 0.5s ease ${index * 300}ms`,
      }}
    >
      {isBonus && (
        <div
          className="absolute -top-5 left-1/2 whitespace-nowrap text-[9px] font-bold text-black px-1.5 py-0.5 rounded-full z-30"
          style={{ transform: 'translateX(-50%)', background: '#FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.8)' }}
        >
          ⭐ BONUS
        </div>
      )}

      <div className="relative" style={{ width: 64, height: 64 }}>
        <StarFrame isBonus={isBonus} />
        <div className="absolute rounded-full overflow-hidden" style={{ zIndex: 2, top: 6, left: 6, right: 6, bottom: 6 }}>
          {/* MODIFICATION 3 : Initiales avec ou sans photo */}
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" />
            ) : null}
            <span className="absolute" style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'white', fontSize: 14, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
              {player.first_name[0]}{player.last_name[0]}
            </span>
          </div>
        </div>
        <div
          className="absolute w-5 h-5 rounded-full flex items-center justify-center"
          style={{ bottom: -4, right: -4, background: '#E8651A', zIndex: 3, border: '2px solid #0A0A0A' }}
        >
          <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'white', fontSize: 10 }}>
            {player.number || (index + 1)}
          </span>
        </div>
      </div>

      <div className="text-center mt-1.5">
        <p style={{ fontFamily: 'Bebas Neue,sans-serif', color: isBonus ? '#FFD700' : 'white', textShadow: '0 1px 6px rgba(0,0,0,1)', fontSize: 11 }}>
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
    if (!stored) {
      router.replace('/');
      return;
    }
    try {
      setResult(JSON.parse(stored));
      sessionStorage.removeItem('vote_result');
      fireConfetti();
    } catch {
      router.replace('/');
    }
  }, [router]);

  async function fireConfetti() {
    try {
      const confetti = (await import('canvas-confetti')).default;
      const colors = ['#E8651A', '#FFD700', '#ffffff', '#FF8040'];
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors });
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors }), 300);
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors }), 500);
    } catch {
      // Confetti non disponible
    }
  }

  if (!result) return null;

  return (
    <main className="min-h-screen pb-16 flex flex-col items-center px-4 py-8 bg-[#050505]">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-3 mb-6">
        <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain animate-float" />
        <div className="text-center">
          <h1 style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-5xl text-white drop-shadow-lg">MERCI !</h1>
          <p className="text-white/50 text-sm mt-1">Votre sélection a bien été enregistrée</p>
        </div>
        <div className="flex items-center gap-1">
          {[0,1,2,3,4].map((i) => (
            <svg key={i} viewBox="0 0 51 49" className="w-4 h-4" fill="#E8651A">
              <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
            </svg>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm mb-6">
        <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-3">Votre équipe All-Star</p>
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            paddingBottom: '115%',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #151515 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute inset-0">
            <BasketballCourt2D />
            <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.04, zIndex: 1 }}>
              <img src="/logo.png" alt="" className="w-20 h-20 object-contain grayscale" />
            </div>
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

      <div className="w-full max-w-sm bg-[#141414] border border-[#1E1E1E] rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A]">
          <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Récapitulatif</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {result.players.map((player, i) => {
            const isBonus = player.id === result.bonus.id;
            return (
              <div
                key={player.id}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{
                  border: `1px solid ${isBonus ? 'rgba(255,215,0,0.5)' : '#1E1E1E'}`,
                  background: isBonus ? 'rgba(255,215,0,0.05)' : '#0A0A0A',
                }}
              >
                <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A' }} className="text-xl w-6 text-center">{i + 1}</span>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(232,101,26,0.5)' }} className="text-sm">{player.first_name[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm block" style={{ color: isBonus ? '#FFD700' : 'white' }}>
                    {player.first_name} {player.last_name}
                  </span>
                  <span className="text-white/40 text-xs">#{player.number} · {player.position}</span>
                </div>
                {isBonus && (
                  <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full" style={{ background: '#FFD700' }}>
                    ⭐ BONUS
                  </span>
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
