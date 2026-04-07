'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  is_active?: boolean;
}

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

interface PlayerScore {
  player: Player;
  votes: number;
  bonuses: number;
}

interface CoachScore {
  coach: Coach;
  headVotes: number;
  assistantVotes: number;
  total: number;
}

const COURT_POSITIONS = [
  { top: '82%', left: '50%', label: 'Meneur' },
  { top: '58%', left: '15%', label: 'Ailier G' },
  { top: '58%', left: '85%', label: 'Ailier D' },
  { top: '28%', left: '28%', label: 'Intérieur G' },
  { top: '28%', left: '72%', label: 'Intérieur D' },
];

function BasketballCourt3D() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-white" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="courtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a0a0a"/>
          <stop offset="50%" stopColor="#121212"/>
          <stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <radialGradient id="rimGlow" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#E8651A" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#E8651A" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <polygon points="40,500 360,500 320,80 80,80" fill="url(#courtGradient)" stroke="rgba(232,101,26,0.3)" strokeWidth="2"/>
      <g stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" filter="url(#glow-white)">
        <line x1="80" y1="80" x2="320" y2="80"/>
        <line x1="40" y1="500" x2="80" y2="80"/>
        <line x1="360" y1="500" x2="320" y2="80"/>
        <line x1="40" y1="500" x2="360" y2="500"/>
      </g>
      <g stroke="rgba(232,101,26,0.7)" strokeWidth="2" fill="none" filter="url(#glow-orange)">
        <polygon points="140,80 260,80 240,220 160,220"/>
        <line x1="160" y1="220" x2="240" y2="220"/>
      </g>
      <ellipse cx="200" cy="220" rx="40" ry="25" stroke="rgba(232,101,26,0.6)" strokeWidth="1.5" fill="none" filter="url(#glow-orange)"/>
      <path d="M 160 220 A 40 25 0 0 1 240 220" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="8,6" fill="none"/>
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" filter="url(#glow-white)">
        <line x1="100" y1="80" x2="75" y2="280"/>
        <line x1="300" y1="80" x2="325" y2="280"/>
        <path d="M 75 280 Q 200 400 325 280"/>
      </g>
      <path d="M 170 130 Q 200 155 230 130" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      <line x1="175" y1="95" x2="225" y2="95" stroke="rgba(255,255,255,0.8)" strokeWidth="3" filter="url(#glow-white)"/>
      {/* MODIFICATION 2 : Support panier centré */}
      <line x1="200" y1="95" x2="200" y2="115" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      <circle cx="200" cy="115" r="12" fill="url(#rimGlow)"/>
      <circle cx="200" cy="115" r="12" stroke="#E8651A" strokeWidth="3" fill="none" filter="url(#glow-strong)"/>
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5">
        <line x1="192" y1="127" x2="195" y2="145"/>
        <line x1="200" y1="127" x2="200" y2="148"/>
        <line x1="208" y1="127" x2="205" y2="145"/>
      </g>
      <path d="M 130 500 A 70 40 0 0 1 270 500" stroke="rgba(232,101,26,0.5)" strokeWidth="2" fill="none" filter="url(#glow-orange)"/>
      <circle cx="200" cy="500" r="4" fill="#E8651A" filter="url(#glow-orange)"/>
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="1">
        <line x1="145" y1="140" x2="155" y2="140"/>
        <line x1="145" y1="165" x2="155" y2="165"/>
        <line x1="145" y1="190" x2="155" y2="190"/>
        <line x1="245" y1="140" x2="255" y2="140"/>
        <line x1="245" y1="165" x2="255" y2="165"/>
        <line x1="245" y1="190" x2="255" y2="190"/>
      </g>
    </svg>
  );
}

function StarFrame({ isBonus }: { isBonus: boolean }) {
  const color = isBonus ? '#FFD700' : '#E8651A';
  const filterId = isBonus ? 'star-glow-gold' : 'star-glow-orange';
  return (
    /* MODIFICATION 1 : Étoile plus grande via les dimensions et marges */
    <svg viewBox="0 0 110 110" width="92" height="92" className="absolute inset-0 -m-3.5" style={{ zIndex: 1 }}>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
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

interface CourtPlayerProps {
  player: Player;
  position: { top: string; left: string; label: string };
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
          style={{ background: 'linear-gradient(90deg, #FFDF00, #D4AF37)', boxShadow: '0 0 15px rgba(255,215,0,0.9)' }}
        >
          ⭐ BONUS
        </div>
      )}
      <div className="relative" style={{ width: 66, height: 66 }}>
        <StarFrame isBonus={isBonus} />
        <div
          className="absolute rounded-full overflow-hidden border-2 border-[#0A0A0A]"
          style={{ zIndex: 2, top: 6, left: 6, right: 6, bottom: 6, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.6)' }}
        >
          {/* MODIFICATION 3 : Initiales toujours présentes en fond/overlay */}
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" style={{ filter: 'contrast(1.1) saturate(1.1)' }}/>
            ) : null}
            <span className="absolute" style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'white', fontSize: 14, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
              {player.first_name[0]}{player.last_name[0]}
            </span>
          </div>
        </div>
        <div
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: badgeBg, zIndex: 3, boxShadow: `0 0 10px ${badgeBg}80`, border: '2.5px solid #0A0A0A' }}
        >
          <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: badgeColor, fontSize: 12, paddingTop: '1px' }}>{rank}</span>
        </div>
      </div>
      <div className="text-center mt-3 bg-[#0A0A0A]/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5">
        <p style={{ fontFamily: 'Bebas Neue,sans-serif', color: nameColor, textShadow: '0 2px 4px rgba(0,0,0,1)', fontSize: 13, letterSpacing: '0.5px' }} className="leading-none">{player.last_name.toUpperCase()}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '2px' }}>{votes} <span className="text-white/40">votes</span></p>
      </div>
    </div>
  );
}

export default function ResultatsPage() {
  const [top5, setTop5] = useState<PlayerScore[]>([]);
  const [allScores, setAllScores] = useState<PlayerScore[]>([]);
  const [coachScores, setCoachScores] = useState<CoachScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [view, setView] = useState<'terrain' | 'classement' | 'coachs'>('terrain');
  const [animKey, setAnimKey] = useState(0);

  const fetchResults = useCallback(async () => {
    const [
      { data: players },
      { data: coaches },
      { data: votes },
    ] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true),
      supabase.from('coaches').select('*').eq('is_active', true),
      supabase.from('votes').select('player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,bonus_player_id,head_coach_id,assistant_coach_id'),
    ]);

    if (!players || !votes) return;

    // ── Joueurs ──
    const voteCount: Record<string, number> = {};
    const bonusCount: Record<string, number> = {};
    players.forEach((p: Player) => { voteCount[p.id] = 0; bonusCount[p.id] = 0; });
    votes.forEach((v: Record<string, string | null>) => {
      [v.player_1_id, v.player_2_id, v.player_3_id, v.player_4_id, v.player_5_id].forEach(id => {
        if (id && voteCount[id] !== undefined) voteCount[id]++;
      });
      if (v.bonus_player_id && bonusCount[v.bonus_player_id] !== undefined) bonusCount[v.bonus_player_id]++;
    });

    const scored = players
      .map((p: Player) => ({ player: p, votes: voteCount[p.id] || 0, bonuses: bonusCount[p.id] || 0 }))
      .sort((a: PlayerScore, b: PlayerScore) => b.votes - a.votes || b.bonuses - a.bonuses);

    setTop5(scored.slice(0, 5));
    setAllScores(scored);
    setTotalVotes(votes.length);

    // ── Coachs ──
    if (coaches && coaches.length > 0) {
      const headCount: Record<string, number> = {};
      const asstCount: Record<string, number> = {};
      coaches.forEach((c: Coach) => { headCount[c.id] = 0; asstCount[c.id] = 0; });
      votes.forEach((v: Record<string, string | null>) => {
        if (v.head_coach_id && headCount[v.head_coach_id] !== undefined) headCount[v.head_coach_id]++;
        if (v.assistant_coach_id && asstCount[v.assistant_coach_id] !== undefined) asstCount[v.assistant_coach_id]++;
      });
      const cs: CoachScore[] = coaches
        .map((c: Coach) => ({
          coach: c,
          headVotes: headCount[c.id] || 0,
          assistantVotes: asstCount[c.id] || 0,
          total: (headCount[c.id] || 0) + (asstCount[c.id] || 0),
        }))
        .sort((a: CoachScore, b: CoachScore) => b.total - a.total);
      setCoachScores(cs);
    }

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
  const bonusLeader = top5.length > 0 ? top5.reduce((a, b) => a.bonuses > b.bonuses ? a : b) : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div style={{ width: 40, height: 40, borderWidth: 3, borderStyle: 'solid', borderColor: '#E8651A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <main className="min-h-screen pb-16 px-4 py-8 bg-[#050505]">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="CSL" className="w-16 h-16 object-contain" style={{ animation: 'float 6s ease-in-out infinite' }} />
          <h1 style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-5xl text-white tracking-wide drop-shadow-lg">RÉSULTATS</h1>
          <p className="text-white/50 text-sm tracking-wider uppercase font-semibold">All-Star Game · CSL Basket</p>
          <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
            <span className="text-xs text-white/60 font-medium">{totalVotes} votes exprimés · Live</span>
          </div>
        </div>

        <div className="flex bg-[#111] rounded-xl p-1.5 border border-white/5 gap-1" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
          {[
            { id: 'terrain', label: '🏀 Terrain' },
            { id: 'classement', label: '📊 Joueurs' },
            ...(coachScores.length > 0 ? [{ id: 'coachs', label: '🧑‍💼 Coachs' }] : []),
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id as 'terrain' | 'classement' | 'coachs')}
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

        {view === 'terrain' && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-[#E8651A] font-bold text-xs uppercase tracking-[0.2em]">Le 5 Majeur</p>
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
                  paddingBottom: '125%',
                  background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #121212 100%)',
                  border: '1px solid rgba(232,101,26,0.2)',
                  boxShadow: '0 0 60px rgba(232,101,26,0.15), 0 20px 50px -10px rgba(0,0,0,0.9), inset 0 0 100px rgba(232,101,26,0.05)',
                }}
              >
                <div className="absolute inset-0">
                  <BasketballCourt3D />
                  <div className="absolute" style={{ top: '45%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.05, zIndex: 1 }}>
                    <img src="/logo.png" alt="" className="w-28 h-28 object-contain grayscale" />
                  </div>
                  {top5.map((s, i) => (
                    <CourtPlayer
                      key={`${s.player.id}-${animKey}`}
                      player={s.player}
                      position={COURT_POSITIONS[i]}
                      isBonus={bonusLeader?.player.id === s.player.id}
                      rank={i + 1}
                      votes={s.votes}
                      animDelay={i * 200}
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
                className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                style={{
                  borderColor: i < 5 ? 'rgba(232,101,26,0.3)' : 'rgba(255,255,255,0.05)',
                  background: i < 5 ? 'linear-gradient(90deg, rgba(232,101,26,0.1) 0%, rgba(10,10,10,1) 100%)' : '#0A0A0A',
                }}
              >
                <div className="w-8 text-center flex-shrink-0 drop-shadow-md">
                  {i < 3 ? <span className="text-2xl">{['🥇','🥈','🥉'][i]}</span> : (
                    <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: i < 5 ? '#E8651A' : 'rgba(255,255,255,0.2)' }} className="text-2xl">{i + 1}</span>
                  )}
                </div>
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center" style={{ border: `2px solid ${i < 5 ? '#E8651A' : '#333'}` }}>
                  <div className="w-full h-full relative flex items-center justify-center">
                    {s.player.photo_url ? (
                      <img src={s.player.photo_url} alt={s.player.last_name} className="w-full h-full object-cover" />
                    ) : null}
                    <span className="absolute" style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{s.player.first_name[0]}{s.player.last_name[0]}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm truncate tracking-wide" style={{ color: i < 5 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                      {s.player.first_name} {s.player.last_name.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {s.bonuses > 0 && <span className="text-xs text-[#FFD700] drop-shadow-md">⭐×{s.bonuses}</span>}
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-xl text-[#E8651A]">{s.votes}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${(s.votes / maxVotes) * 100}%`, background: i < 5 ? 'linear-gradient(90deg, #A04000, #E8651A)' : '#333' }}
                    >
                      {i < 5 && <div className="absolute inset-0 bg-white/20 w-1/2 blur-sm" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* ── VUE COACHS ── */}
        {view === 'coachs' && (
          <div className="flex flex-col gap-4">
            {/* Top 2 en avant */}
            {coachScores.length >= 1 && (
              <div className="grid grid-cols-2 gap-4">
                {coachScores.slice(0, 2).map((cs, i) => (
                  <div key={cs.coach.id}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border"
                    style={{
                      borderColor: i === 0 ? 'rgba(232,101,26,0.6)' : 'rgba(232,101,26,0.2)',
                      background: i === 0 ? 'rgba(232,101,26,0.08)' : 'rgba(232,101,26,0.03)',
                    }}>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {i === 0 ? '🧑‍💼 Principal' : '👨‍💼 Adjoint'}
                    </div>
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 bg-[#1A1A1A] flex items-center justify-center"
                        style={{ borderColor: '#E8651A', boxShadow: '0 0 16px rgba(232,101,26,0.4)' }}>
                        {cs.coach.photo_url
                          ? <img src={cs.coach.photo_url} alt={cs.coach.last_name} className="w-full h-full object-cover object-top"/>
                          : <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A', fontSize: 24 }}>
                              {cs.coach.first_name[0]}{cs.coach.last_name[0]}
                            </span>
                        }
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0A0A0A]"
                        style={{ background: '#E8651A' }}>
                        <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'white', fontSize: 11 }}>{i + 1}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A', fontSize: 15 }} className="leading-tight">
                        {cs.coach.first_name.toUpperCase()} {cs.coach.last_name.toUpperCase()}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{cs.total} vote{cs.total > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Classement complet */}
            {coachScores.map((cs, i) => (
              <div key={cs.coach.id}
                className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                style={{
                  borderColor: i < 2 ? 'rgba(232,101,26,0.3)' : 'rgba(255,255,255,0.05)',
                  background: i < 2 ? 'linear-gradient(90deg, rgba(232,101,26,0.1) 0%, rgba(10,10,10,1) 100%)' : '#0A0A0A',
                }}>
                <div className="w-8 text-center flex-shrink-0">
                  {i < 2
                    ? <span className="text-2xl">{['🥇','🥈'][i]}</span>
                    : <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(255,255,255,0.2)' }} className="text-2xl">{i + 1}</span>
                  }
                </div>
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center relative"
                  style={{ border: `2px solid ${i < 2 ? '#E8651A' : '#333'}` }}>
                  {cs.coach.photo_url
                    ? <img src={cs.coach.photo_url} alt={cs.coach.last_name} className="w-full h-full object-cover"/>
                    : null
                  }
                  <span className="absolute" style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {cs.coach.first_name[0]}{cs.coach.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm truncate" style={{ color: i < 2 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                      {cs.coach.first_name} {cs.coach.last_name.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {cs.headVotes > 0 && <span className="text-xs text-white/40">🧑‍💼×{cs.headVotes}</span>}
                      {cs.assistantVotes > 0 && <span className="text-xs text-white/40">👨‍💼×{cs.assistantVotes}</span>}
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-xl text-[#E8651A]">{cs.total}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${(cs.total / (coachScores[0]?.total || 1)) * 100}%`,
                        background: i < 2 ? 'linear-gradient(90deg, #A04000, #E8651A)' : '#333' }}>
                      {i < 2 && <div className="absolute inset-0 bg-white/20 w-1/2 blur-sm"/>}
                    </div>
                  </div>
                </div>
                {i < 2 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0"
                    style={{ color: '#E8651A', borderColor: 'rgba(232,101,26,0.4)' }}>
                    {i === 0 ? 'PRINCIPAL' : 'ADJOINT'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }`}</style>
    </main>
  );
}
