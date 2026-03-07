'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Player } from '@/lib/supabase';

const COURT_POSITIONS = [
  { top: '72%', left: '50%', label: 'Meneur' },
  { top: '52%', left: '22%', label: 'Ailier G' },
  { top: '52%', left: '78%', label: 'Ailier D' },
  { top: '28%', left: '28%', label: 'Intérieur G' },
  { top: '28%', left: '72%', label: 'Intérieur D' },
];

interface PlayerScore {
  player: Player;
  votes: number;
  bonuses: number;
}

function StarFrame({ isBonus }: { isBonus: boolean }) {
  const color = isBonus ? '#FFD700' : '#E8651A';
  return (
    <svg
      viewBox="0 0 110 110"
      width="80"
      height="80"
      className="absolute inset-0 -m-2"
      style={{ zIndex: 1 }}
    >
      <defs>
        <filter id={`glow-${isBonus ? 'gold' : 'orange'}`} x="-50%" y="-50%" width="200%" height="200%">
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
        filter={`url(#glow-${isBonus ? 'gold' : 'orange'})`}
        style={{
          animation: isBonus
            ? 'pulse-gold 1.5s ease-in-out infinite'
            : 'pulse-orange 2s ease-in-out infinite',
        }}
      />
      {isBonus && [0,1,2,3,4].map(i => {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x = 55 + 48 * Math.cos(angle);
        const y = 55 + 48 * Math.sin(angle);
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill={color}
            style={{ filter: `drop-shadow(0 0 4px rgba(255,215,0,0.8))` }} />
        );
      })}
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
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.3})`,
        transition: `opacity 0.5s ease ${animDelay}ms, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}ms`,
      }}
    >
      {isBonus && (
        <div
          className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-black px-1.5 py-0.5 rounded-full z-30"
          style={{ background: '#FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.8)' }}
        >
          ⭐ BONUS
        </div>
      )}

      <div className="relative" style={{ width: 64, height: 64 }}>
        <StarFrame isBonus={isBonus} />
        <div
          className="absolute rounded-full overflow-hidden"
          style={{ zIndex: 2, top: 6, left: 6, right: 6, bottom: 6 }}
        >
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.last_name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
              <span
                style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A' }}
                className="text-base"
              >
                {player.first_name[0]}{player.last_name[0]}
              </span>
            </div>
          )}
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A0A0A]"
          style={{ background: badgeBg, zIndex: 3 }}
        >
          <span
            style={{ fontFamily: 'Bebas Neue,sans-serif', color: badgeColor, fontSize: 10 }}
          >
            {rank}
          </span>
        </div>
      </div>

      <div className="text-center mt-1.5">
        <p
          style={{
            fontFamily: 'Bebas Neue,sans-serif',
            color: nameColor,
            textShadow: '0 1px 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8)',
            fontSize: 11,
          }}
          className="leading-tight"
        >
          {player.last_name.toUpperCase()}
        </p>
        <p
          style={{
            fontSize: 9,
            textShadow: '0 1px 4px rgba(0,0,0,1)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {votes} votes
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );

  return (
    <main className="min-h-screen pb-16 px-4 py-8">
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px rgba(255,215,0,0.9)); }
          50% { opacity: 0.7; filter: drop-shadow(0 0 14px rgba(255,215,0,1)); }
        }
        @keyframes pulse-orange {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px rgba(232,101,26,0.7)); }
          50% { opacity: 0.8; filter: drop-shadow(0 0 10px rgba(232,101,26,1)); }
        }
      `}</style>

      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain animate-float" />
          <h1 style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-5xl text-white glow-text">
            RÉSULTATS
          </h1>
          <p className="text-white/40 text-sm">All-Star Game · CSL Basket St Vallier</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/40">{totalVotes} votes exprimés · Temps réel</span>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex bg-[#141414] rounded-xl p-1 border border-[#1E1E1E]">
          {[
            { id: 'terrain', label: '🏀 Terrain' },
            { id: 'classement', label: '📊 Classement' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id as 'terrain' | 'classement')}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: view === v.id ? '#E8651A' : 'transparent',
                color: view === v.id ? 'white' : 'rgba(255,255,255,0.5)',
                boxShadow: view === v.id ? '0 0 12px rgba(232,101,26,0.4)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Vue terrain */}
        {view === 'terrain' && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-white/40 text-xs uppercase tracking-widest">
              Top 5 — Équipe All-Star actuelle
            </p>
            {top5.length < 5 ? (
              <div className="text-center py-12 text-white/40">
                <p className="text-4xl mb-3">🗳️</p>
                <p>En attente de votes...</p>
                <p className="text-sm mt-1">Le terrain s&apos;affichera dès les premiers votes</p>
              </div>
            ) : (
              <div
                key={animKey}
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  paddingBottom: '115%',
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #202020 100%)',
                  border: '2px solid rgba(232,101,26,0.4)',
                  boxShadow: '0 0 40px rgba(232,101,26,0.2), inset 0 0 60px rgba(0,0,0,0.5)',
                }}
              >
                <div className="absolute inset-0">
                  {/* Parquet */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px)',
                  }} />

                  {/* Lignes terrain */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 115"
                    preserveAspectRatio="none"
                  >
                    {/* Bordure */}
                    <rect x="3" y="3" width="94" height="109" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" rx="0.5"/>
                    {/* Raquette */}
                    <rect x="31" y="3" width="38" height="22" fill="rgba(232,101,26,0.06)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
                    {/* Ligne lancer franc */}
                    <line x1="31" y1="25" x2="69" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
                    {/* Demi-cercle lancer franc haut (pointillés) */}
                    <path d="M 31 25 A 19 19 0 0 1 69 25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" strokeDasharray="2,1.5"/>
                    {/* Demi-cercle lancer franc bas */}
                    <path d="M 31 25 A 19 19 0 0 0 69 25" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
                    {/* Panier */}
                    <rect x="43" y="3" width="14" height="3" fill="rgba(232,101,26,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4"/>
                    <circle cx="50" cy="6.5" r="2.5" fill="none" stroke="rgba(255,165,0,0.9)" strokeWidth="0.7"/>
                    {/* Arc 3 points */}
                    <path d="M 8 112 L 8 52 A 44 44 0 0 1 92 52 L 92 112" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
                    {/* Coins 3pts */}
                    <line x1="3" y1="52" x2="8" y2="52" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
                    <line x1="92" y1="52" x2="97" y2="52" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6"/>
                    {/* Cercle bas */}
                    <circle cx="50" cy="112" r="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="3,2"/>
                  </svg>

                  {/* Logo watermark */}
                  <div
                    className="absolute"
                    style={{ top: '55%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.05, zIndex: 1 }}
                  >
                    <img src="/logo.png" alt="" className="w-28 h-28 object-contain" />
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
                      animDelay={i * 300}
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
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{
                  borderColor: i < 5 ? 'rgba(232,101,26,0.4)' : '#1E1E1E',
                  background: i < 5 ? 'rgba(232,101,26,0.05)' : '#141414',
                }}
              >
                <div className="w-8 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-xl">{['🥇','🥈','🥉'][i]}</span>
                  ) : (
                    <span
                      style={{ fontFamily: 'Bebas Neue,sans-serif', color: i < 5 ? '#E8651A' : 'rgba(255,255,255,0.3)' }}
                      className="text-xl"
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center border"
                  style={{ borderColor: i < 5 ? '#E8651A' : '#1E1E1E' }}
                >
                  {s.player.photo_url ? (
                    <img src={s.player.photo_url} alt={s.player.last_name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(232,101,26,0.5)' }} className="text-sm">
                      {s.player.first_name[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: i < 5 ? 'white' : 'rgba(255,255,255,0.6)' }}
                    >
                      {s.player.first_name} {s.player.last_name}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {s.bonuses > 0 && <span className="text-xs text-[#FFD700]">⭐×{s.bonuses}</span>}
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-lg text-[#E8651A]">
                        {s.votes}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(s.votes / maxVotes) * 100}%`, background: i < 5 ? '#E8651A' : '#333' }}
                    />
                  </div>
                </div>
                {i < 5 && (
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(232,101,26,0.2)' }}
                  >
                    <svg viewBox="0 0 51 49" className="w-3 h-3" fill="#E8651A">
                      <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
