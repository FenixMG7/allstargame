'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Player } from '@/lib/supabase';

const COURT_POSITIONS = [
  { top: '75%', left: '50%', label: 'Meneur' },
  { top: '50%', left: '20%', label: 'Ailier G' },
  { top: '50%', left: '80%', label: 'Ailier D' },
  { top: '22%', left: '30%', label: 'Intérieur G' },
  { top: '22%', left: '70%', label: 'Intérieur D' },
];

interface PlayerScore {
  player: Player;
  votes: number;
  bonuses: number;
}

function StarFrame({ isBonus }: { isBonus: boolean }) {
  const color = isBonus ? '#FFD700' : '#E8651A';
  const glowColor = isBonus ? 'rgba(255, 215, 0, 0.6)' : 'rgba(232, 101, 26, 0.6)';
  
  return (
    <svg
  className="absolute inset-0 w-full h-full"
  viewBox="0 0 100 115"
  preserveAspectRatio="none"
>
  {/* Ligne de fond (baseline) */}
  <line x1="0" y1="2" x2="100" y2="2" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Raquette (clé) */}
  <rect x="35" y="2" width="30" height="28" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Ligne lancer franc */}
  <line x1="35" y1="30" x2="65" y2="30" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Cercle lancer franc (extérieur plein) */}
  <path d="M 35 30 A 15 15 0 0 0 65 30" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Cercle lancer franc (intérieur pointillé) */}
  <path d="M 35 30 A 15 15 0 0 1 65 30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="1.5,1.5"/>

  {/* Panneau */}
  <line x1="45" y1="6" x2="55" y2="6" stroke="rgba(255,255,255,0.9)" strokeWidth="0.7"/>

  {/* Cercle panier */}
  <circle cx="50" cy="9" r="1.8" fill="none" stroke="#E8651A" strokeWidth="0.7"/>

  {/* Zone restrictive (no-charge semi-circle) */}
  <path d="M 44 12 A 6 6 0 0 0 56 12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4"/>

  {/* Ligne 3 points (coins) */}
  <line x1="10" y1="2" x2="10" y2="32" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
  <line x1="90" y1="2" x2="90" y2="32" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Arc 3 points (corrigé et centré sur le panier) */}
  <path d="M 10 32 A 40 40 0 0 0 90 32" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Ligne médiane */}
  <line x1="0" y1="113" x2="100" y2="113" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>

  {/* Cercle central (demi visible) */}
  <circle cx="50" cy="113" r="15" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
</svg>
  );
}

interface CourtPlayerProps {
  player: Player;
  position: typeof COURT_POSITIONS[0];
  isBonus: boolean;
  rank: number;
  votes: number;
  animDelay: number;
}

function CourtPlayer({ player, position, isBonus, rank, votes, animDelay }: CourtPlayerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  const badgeBg = rank === 1 ? '#FFD700' : '#E8651A';
  const badgeColor = rank === 1 ? 'black' : 'white';
  const nameColor = isBonus ? '#FFD700' : 'white';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.3})`,
        transition: `opacity 0.5s ease ${animDelay}ms, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}ms`,
      }}
    >
      {isBonus && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold text-black px-2 py-0.5 rounded-full z-30 tracking-wide"
          style={{ 
            background: 'linear-gradient(90deg, #FFDF00, #D4AF37)', 
            boxShadow: '0 0 15px rgba(255,215,0,0.9)' 
          }}
        >
          ⭐ BONUS
        </div>
      )}

      <div className="relative" style={{ width: 66, height: 66 }}>
        <StarFrame isBonus={isBonus} />
        
        {/* Conteneur photo avec bordure noire profonde */}
        <div
          className="absolute rounded-full overflow-hidden border-2 border-[#0A0A0A]"
          style={{ 
            zIndex: 2, top: 6, left: 6, right: 6, bottom: 6,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.6)'
          }}
        >
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.last_name}
              className="w-full h-full object-cover object-top filter contrast-110 saturate-110"
            />
          ) : (
            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
              <span
                style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A' }}
                className="text-lg"
              >
                {player.first_name[0]}{player.last_name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Badge de classement */}
        <div
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-[2.5px] border-[#0A0A0A]"
          style={{ 
            background: badgeBg, 
            zIndex: 3,
            boxShadow: `0 0 10px ${badgeBg}80`
          }}
        >
          <span
            style={{ fontFamily: 'Bebas Neue,sans-serif', color: badgeColor, fontSize: 12, paddingTop: '1px' }}
          >
            {rank}
          </span>
        </div>
      </div>

      <div className="text-center mt-3 bg-[#0A0A0A]/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5">
        <p
          style={{
            fontFamily: 'Bebas Neue,sans-serif',
            color: nameColor,
            textShadow: '0 2px 4px rgba(0,0,0,1)',
            fontSize: 13,
            letterSpacing: '0.5px'
          }}
          className="leading-none"
        >
          {player.last_name.toUpperCase()}
        </p>
        <p
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 500,
            marginTop: '2px'
          }}
        >
          {votes} <span className="text-white/40">votes</span>
        </p>
      </div>
    </div>
  );
}

export default function ResultatsPage() {
  const [top5, setTop5] = useState<PlayerScore[]>([]);
  const [allScores, setAllScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [view, setView] = useState<'terrain' | 'classement'>('terrain');
  const [animKey, setAnimKey] = useState(0);

  const fetchResults = useCallback(async () => {
    const { data: players } = await supabase.from('players').select('*').eq('is_active', true);
    if (!players) return;
    const { data: votes } = await supabase
      .from('votes')
      .select('player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,bonus_player_id');
    if (!votes) return;

    const voteCount: Record<string, number> = {};
    const bonusCount: Record<string, number> = {};
    players.forEach(p => { voteCount[p.id] = 0; bonusCount[p.id] = 0; });
    votes.forEach(v => {
      [v.player_1_id, v.player_2_id, v.player_3_id, v.player_4_id, v.player_5_id].forEach(id => {
        if (id && voteCount[id] !== undefined) voteCount[id]++;
      });
      if (v.bonus_player_id && bonusCount[v.bonus_player_id] !== undefined) bonusCount[v.bonus_player_id]++;
    });

    const scored = players
      .map(p => ({ player: p, votes: voteCount[p.id] || 0, bonuses: bonusCount[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes || b.bonuses - a.bonuses);

    setTop5(scored.slice(0, 5));
    setAllScores(scored);
    setTotalVotes(votes.length);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResults();
    const channel = supabase
      .channel('resultats-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
        fetchResults();
        setAnimKey(k => k + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchResults]);

  const maxVotes = allScores[0]?.votes || 1;
  const bonusLeader = top5.length > 0
    ? top5.reduce((a, b) => a.bonuses > b.bonuses ? a : b)
    : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: '#E8651A', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <main className="min-h-screen pb-16 px-4 py-8 bg-[#050505]">
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px rgba(255,215,0,0.8)); transform: scale(1); }
          50% { opacity: 0.85; filter: drop-shadow(0 0 20px rgba(255,215,0,1)); transform: scale(1.02); }
        }
        @keyframes pulse-orange {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(232,101,26,0.6)); transform: scale(1); }
          50% { opacity: 0.85; filter: drop-shadow(0 0 15px rgba(232,101,26,0.9)); transform: scale(1.02); }
        }
        .spinner {
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain animate-float" />
          <h1 style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-5xl text-white tracking-wide drop-shadow-lg">
            RÉSULTATS
          </h1>
          <p className="text-white/50 text-sm tracking-wider uppercase font-semibold">All-Star Game · CSL Basket</p>
          <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-xs text-white/60 font-medium">{totalVotes} votes exprimés · Live</span>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex bg-[#111] rounded-xl p-1.5 border border-white/5 shadow-inner">
          {[
            { id: 'terrain', label: '🏀 Terrain' },
            { id: 'classement', label: '📊 Classement' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id as 'terrain' | 'classement')}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
              style={{
                background: view === v.id ? '#E8651A' : 'transparent',
                color: view === v.id ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: view === v.id ? '0 4px 15px rgba(232,101,26,0.4)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Vue terrain */}
        {view === 'terrain' && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-[#E8651A] font-bold text-xs uppercase tracking-[0.2em]">
              Le 5 Majeur
            </p>
            {top5.length < 5 ? (
              <div className="text-center py-16 text-white/40 bg-[#0A0A0A] rounded-2xl border border-white/5">
                <p className="text-5xl mb-4 opacity-50">🗳️</p>
                <p className="font-medium text-lg text-white/70">En attente de votes...</p>
                <p className="text-sm mt-2">Le terrain s&apos;affichera bientôt</p>
              </div>
            ) : (
              <div
                key={animKey}
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  paddingBottom: '115%',
                  /* Effet Spotlight sur le terrain sombre */
                  background: 'radial-gradient(circle at 50% 40%, #1a1a1a 0%, #050505 80%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.02)',
                }}
              >
                <div className="absolute inset-0">
                  {/* Lignes du terrain refondues (Premium / Minimaliste) */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 115"
                    preserveAspectRatio="none"
                  >
                    <g stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none">
                      {/* Bordure extérieure */}
                      <rect x="2" y="2" width="96" height="111" rx="1" />
                      
                      {/* Raquette extérieure */}
                      <rect x="32" y="2" width="36" height="28" />
                      {/* Raquette intérieure (Peinture) */}
                      <rect x="38" y="2" width="24" height="28" fill="rgba(255,255,255,0.02)" />
                      
                      {/* Ligne des lancers francs */}
                      <line x1="32" y1="30" x2="68" y2="30" strokeWidth="0.6" />
                      
                      {/* Cercles lancer franc */}
                      <path d="M 38 30 A 12 12 0 0 1 62 30" strokeDasharray="1.5,1.5" />
                      <path d="M 38 30 A 12 12 0 0 0 62 30" />
                      
                      {/* Panier et Planche */}
                      <line x1="44" y1="5" x2="56" y2="5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
                      <line x1="49" y1="5" x2="49" y2="7.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
                      <circle cx="50" cy="9" r="2.5" stroke="#E8651A" strokeWidth="0.6" fill="rgba(232,101,26,0.1)"/>

                      {/* Ligne 3 points */}
                      {/* Coins */}
                      <line x1="6" y1="2" x2="6" y2="32" />
                      <line x1="94" y1="2" x2="94" y2="32" />
                      {/* Arc 3 points */}
                      <path d="M 6 32 A 44 44 0 0 0 94 32" strokeWidth="0.5" />
                      
                      {/* Rond central bas (milieu de terrain) */}
                      <circle cx="50" cy="113" r="15" />
                      <line x1="2" y1="113" x2="98" y2="113" strokeWidth="0.6" />
                    </g>
                  </svg>

                  {/* Filigrane central ultra discret */}
                  <div
                    className="absolute"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.03, zIndex: 1 }}
                  >
                    <img src="/logo.png" alt="" className="w-32 h-32 object-contain grayscale" />
                  </div>

                  {/* Joueurs animés */}
                  {top5.map((s, i) => (
                    <CourtPlayer
                      key={`${s.player.id}-${animKey}`}
                      player={s.player}
                      position={COURT_POSITIONS[i]}
                      isBonus={bonusLeader?.player.id === s.player.id}
                      rank={i + 1}
                      votes={s.votes}
                      animDelay={i * 200} // Animation légèrement plus rapide
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vue classement */}
        {view === 'classement' && (
          <div className="flex flex-col gap-3">
            {allScores.map((s, i) => (
              <div
                key={s.player.id}
                className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                style={{
                  borderColor: i < 5 ? 'rgba(232,101,26,0.3)' : 'rgba(255,255,255,0.05)',
                  background: i < 5 ? 'linear-gradient(90deg, rgba(232,101,26,0.1) 0%, rgba(10,10,10,1) 100%)' : '#0A0A0A',
                }}
              >
                <div className="w-8 text-center flex-shrink-0 drop-shadow-md">
                  {i < 3 ? (
                    <span className="text-2xl">{['🥇','🥈','🥉'][i]}</span>
                  ) : (
                    <span
                      style={{ fontFamily: 'Bebas Neue,sans-serif', color: i < 5 ? '#E8651A' : 'rgba(255,255,255,0.2)' }}
                      className="text-2xl"
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                
                <div
                  className="w-11 h-11 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center border-2"
                  style={{ borderColor: i < 5 ? '#E8651A' : '#333' }}
                >
                  {s.player.photo_url ? (
                    <img src={s.player.photo_url} alt={s.player.last_name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(232,101,26,0.5)' }} className="text-lg">
                      {s.player.first_name[0]}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="font-bold text-sm truncate tracking-wide"
                      style={{ color: i < 5 ? 'white' : 'rgba(255,255,255,0.5)' }}
                    >
                      {s.player.first_name} {s.player.last_name.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {s.bonuses > 0 && <span className="text-xs text-[#FFD700] drop-shadow-md">⭐×{s.bonuses}</span>}
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-xl text-[#E8651A]">
                        {s.votes}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{ 
                        width: `${(s.votes / maxVotes) * 100}%`, 
                        background: i < 5 ? 'linear-gradient(90deg, #A04000, #E8651A)' : '#333' 
                      }}
                    >
                      {i < 5 && <div className="absolute inset-0 bg-white/20 w-1/2 blur-sm" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
