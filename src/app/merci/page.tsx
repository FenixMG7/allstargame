'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@/lib/supabase';

interface VoteResult {
  players: Player[];
  bonus: Player;
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px]" style={{background:'rgba(232,101,26,0.1)'}} />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8 page-enter">

        <div className="animate-float">
          <div className="w-28 h-28 rounded-full bg-[#141414] border-2 border-[#E8651A] flex items-center justify-center" style={{boxShadow:'0 0 0 2px #E8651A, 0 0 30px rgba(232,101,26,0.5)'}}>
            <span className="text-6xl">🏆</span>
          </div>
        </div>

        <div className="text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 mb-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} viewBox="0 0 51 49" className="w-5 h-5" fill="#E8651A">
                <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
              </svg>
            ))}
          </div>
          <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-5xl sm:text-6xl text-white glow-text">MERCI !</h1>
          <p className="text-white/60 text-base mt-1 max-w-xs text-center">
            Votre vote a bien été enregistré. Découvrez les résultats lors de l&apos;événement !
          </p>
        </div>

        <div className="w-full bg-[#141414] border border-[#1E1E1E] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center gap-2">
            <svg viewBox="0 0 51 49" className="w-4 h-4" fill="#E8651A">
              <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
            </svg>
            <span className="text-white/60 text-xs uppercase tracking-widest font-semibold">Votre sélection</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {result.players.map((player, i) => {
              const isBonus = player.id === result.bonus.id;
              return (
                <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                  style={{borderColor: isBonus ? 'rgba(255,215,0,0.5)' : '#1E1E1E', background: isBonus ? 'rgba(255,215,0,0.05)' : '#0A0A0A'}}>
                  <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#E8651A] w-6 text-center flex-shrink-0">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover" />
                    ) : (
                      <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-sm text-[#E8651A]/50">{player.first_name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm block truncate" style={{color: isBonus ? '#FFD700' : 'white'}}>
                      {player.first_name} {player.last_name}
                    </span>
                    <span className="text-white/40 text-xs">#{player.number} · {player.position}</span>
                  </div>
                  {isBonus && (
                    <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0" style={{background:'#FFD700'}}>
                      ⭐ BONUS
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => router.push('/')} className="text-white/40 hover:text-[#E8651A] transition-colors text-sm flex items-center gap-2">
          ← Retour à l&apos;accueil
        </button>

      </div>
    </main>
  );
}
