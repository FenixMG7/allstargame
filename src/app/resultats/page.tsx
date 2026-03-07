'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Player } from '@/lib/supabase';

const COURT_POSITIONS = [
  { top: '75%', left: '50%', label: 'Meneur' },
  { top: '55%', left: '20%', label: 'Ailier G' },
  { top: '55%', left: '80%', label: 'Ailier D' },
  { top: '30%', left: '30%', label: 'Intérieur G' },
  { top: '30%', left: '70%', label: 'Intérieur D' },
];

interface PlayerScore {
  player: Player;
  votes: number;
  bonuses: number;
}

interface CourtPlayerProps {
  player: Player;
  position: { top: string; left: string; label: string };
  isBonus: boolean;
  rank: number;
  votes: number;
}

function CourtPlayer({ player, position, isBonus, rank, votes }: CourtPlayerProps) {
  const borderColor = isBonus ? '#FFD700' : '#E8651A';
  const nameColor = isBonus ? '#FFD700' : 'white';
  const badgeBg = rank === 1 ? '#FFD700' : '#E8651A';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ top: position.top, left: position.left, zIndex: 10 }}
    >
      <div className="relative">
        {isBonus && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-black px-1.5 py-0.5 rounded-full z-20"
            style={{ background: '#FFD700' }}
          >
            ⭐ BONUS
          </div>
        )}
        <div className="relative">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            style={{ zIndex: 1 }}
          >
            <polygon
              points="50,2 61,35 96,35 68,57 79,91 50,70 21,91 32,57 4,35 39,35"
              fill="none"
              stroke={borderColor}
              strokeWidth="3"
              style={{ filter: `drop-shadow(0 0 6px ${borderColor})` }}
            />
          </svg>
          <div
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden m-1"
            style={{ zIndex: 2 }}
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
                  className="text-lg"
                >
                  {player.first_name[0]}{player.last_name[0]}
                </span>
              </div>
            )}
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-[#0A0A0A] z-10"
            style={{ background: badgeBg }}
          >
            <span
              style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'black' }}
              className="text-[10px] leading-none font-bold"
            >
              {rank}
            </span>
          </div>
        </div>
        <div className="text-center mt-1">
          <p
            style={{
              fontFamily: 'Bebas Neue,sans-serif',
              color: nameColor,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            }}
            className="text-[11px] sm:text-xs leading-tight"
          >
            {player.last_name.toUpperCase()}
          </p>
          <p
            className="text-[9px] text-white/60"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {votes} votes
          </p>
        </div>
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, fetchResults)
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
      <div className="max-w-lg mx-auto flex flex-col gap-6">

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
                className="relative w-full rounded-2xl overflow-hidden border-2 border-[#E8651A]/40"
                style={{
                  paddingBottom: '110%',
                  background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5c1e 40%, #226622 70%, #1e5c1e 100%)',
                  boxShadow: '0 0 30px rgba(232,101,26,0.3)',
                }}
              >
                <div className="absolute inset-0">
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 110"
                    preserveAspectRatio="none"
                  >
                    <line x1="5" y1="5" x2="95" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                    <line x1="5" y1="5" x2="5" y2="105" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                    <line x1="95" y1="5" x2="95" y2="105" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                    <line x1="5" y1="105" x2="95" y2="105" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                    <rect x="30" y="5" width="40" height="25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
                    <circle cx="50" cy="30" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                    <path d="M 10 105 L 10 40 A 42 42 0 0 1 90 40 L 90 105" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
                    <circle cx="50" cy="10" r="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
                    <circle cx="50" cy="30" r="1" fill="rgba(255,255,255,0.5)"/>
                  </svg>
                  <div
                    className="absolute"
                    style={{ top: '45%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.08 }}
                  >
                    <img src="/logo.png" alt="" className="w-24 h-24 object-contain" />
                  </div>
                  {top5.map((s, i) => (
                    <CourtPlayer
                      key={s.player.id}
                      player={s.player}
                      position={COURT_POSITIONS[i]}
                      isBonus={bonusLeader?.player.id === s.player.id}
                      rank={i + 1}
                      votes={s.votes}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                      style={{
                        fontFamily: 'Bebas Neue,sans-serif',
                        color: i < 5 ? '#E8651A' : 'rgba(255,255,255,0.3)',
                      }}
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
                    <span
                      style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(232,101,26,0.5)' }}
                      className="text-sm"
                    >
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
                      <span
                        style={{ fontFamily: 'Bebas Neue,sans-serif' }}
                        className="text-lg text-[#E8651A]"
                      >
                        {s.votes}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(s.votes / maxVotes) * 100}%`,
                        background: i < 5 ? '#E8651A' : '#333',
                      }}
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
