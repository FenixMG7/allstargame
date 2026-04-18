'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */
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
  isPlaceholder?: boolean;
}

interface CoachScore {
  coach: Coach;
  headVotes: number;
  assistantVotes: number;
  total: number;
}

interface TeamCoaches {
  headCoach: CoachScore | null;
  assistantCoach: CoachScore | null;
}

interface TeamData {
  players: PlayerScore[];
  coaches: TeamCoaches;
  bonusLeaderId: string | null;
}

/* ═══════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════ */
const COURT_POSITIONS = [
  { top: '82%', left: '50%', label: 'Meneur' },
  { top: '58%', left: '15%', label: 'Ailier G' },
  { top: '58%', left: '85%', label: 'Ailier D' },
  { top: '28%', left: '28%', label: 'Intérieur G' },
  { top: '28%', left: '72%', label: 'Intérieur D' },
];

/* Joueur placeholder */
function makePlaceholder(slot: number): PlayerScore {
  return {
    player: { id: `placeholder-${slot}`, first_name: 'Joueur', last_name: `N°${slot}` },
    votes: 0,
    bonuses: 0,
    isPlaceholder: true,
  };
}

/* Répartition alternée en deux équipes */
function splitIntoTeams(scores: PlayerScore[], coaches: CoachScore[]): [TeamData, TeamData] {
  const raw1 = scores.filter((_, i) => i % 2 === 0).slice(0, 5);
  const raw2 = scores.filter((_, i) => i % 2 === 1).slice(0, 5);

  const pad = (arr: PlayerScore[], start: number): PlayerScore[] => {
    const r = [...arr];
    let s = start;
    while (r.length < 5) r.push(makePlaceholder(s++));
    return r;
  };

  const p1 = pad(raw1, 1);
  const p2 = pad(raw2, 1);

  const bonusLeader = (arr: PlayerScore[]) => {
    const real = arr.filter(s => !s.isPlaceholder && s.bonuses > 0);
    if (!real.length) return null;
    return real.reduce((a, b) => a.bonuses > b.bonuses ? a : b).player.id;
  };

  // Trier par votes head_coach et assistant_coach séparément
  const byHead = [...coaches].sort((a, b) => b.headVotes - a.headVotes);
  const byAsst = [...coaches].sort((a, b) => b.assistantVotes - a.assistantVotes);

  // Principal E1 = 1er vote head, Principal E2 = 2ème vote head
  // Adjoint E1   = 1er vote assistant, Adjoint E2 = 2ème vote assistant
  return [
    {
      players: p1,
      coaches: {
        headCoach:      byHead[0] ?? null,
        assistantCoach: byAsst[0] ?? null,
      },
      bonusLeaderId: bonusLeader(p1),
    },
    {
      players: p2,
      coaches: {
        headCoach:      byHead[1] ?? null,
        assistantCoach: byAsst[1] ?? null,
      },
      bonusLeaderId: bonusLeader(p2),
    },
  ];
}

/* ═══════════════════════════════════════════════════
   SVG TERRAIN 3D  (ids SVG uniques par instance)
═══════════════════════════════════════════════════ */
function BasketballCourt3D({ uid }: { uid: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id={`go-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`gw-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`gs-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id={`cg-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a0a0a"/>
          <stop offset="50%" stopColor="#121212"/>
          <stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <radialGradient id={`rg-${uid}`} cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#E8651A" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#E8651A" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <polygon points="40,500 360,500 320,80 80,80" fill={`url(#cg-${uid})`} stroke="rgba(232,101,26,0.3)" strokeWidth="2"/>
      <g stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" filter={`url(#gw-${uid})`}>
        <line x1="80" y1="80" x2="320" y2="80"/>
        <line x1="40" y1="500" x2="80" y2="80"/>
        <line x1="360" y1="500" x2="320" y2="80"/>
        <line x1="40" y1="500" x2="360" y2="500"/>
      </g>
      <g stroke="rgba(232,101,26,0.7)" strokeWidth="2" fill="none" filter={`url(#go-${uid})`}>
        <polygon points="140,80 260,80 240,220 160,220"/>
        <line x1="160" y1="220" x2="240" y2="220"/>
      </g>
      <ellipse cx="200" cy="220" rx="40" ry="25" stroke="rgba(232,101,26,0.6)" strokeWidth="1.5" fill="none" filter={`url(#go-${uid})`}/>
      <path d="M 160 220 A 40 25 0 0 1 240 220" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="8,6" fill="none"/>
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" filter={`url(#gw-${uid})`}>
        <line x1="100" y1="80" x2="75" y2="280"/>
        <line x1="300" y1="80" x2="325" y2="280"/>
        <path d="M 75 280 Q 200 400 325 280"/>
      </g>
      <path d="M 170 130 Q 200 155 230 130" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      <line x1="175" y1="95" x2="225" y2="95" stroke="rgba(255,255,255,0.8)" strokeWidth="3" filter={`url(#gw-${uid})`}/>
      <line x1="200" y1="95" x2="200" y2="115" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      <circle cx="200" cy="115" r="12" fill={`url(#rg-${uid})`}/>
      <circle cx="200" cy="115" r="12" stroke="#E8651A" strokeWidth="3" fill="none" filter={`url(#gs-${uid})`}/>
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5">
        <line x1="192" y1="127" x2="195" y2="145"/>
        <line x1="200" y1="127" x2="200" y2="148"/>
        <line x1="208" y1="127" x2="205" y2="145"/>
      </g>
      <path d="M 130 500 A 70 40 0 0 1 270 500" stroke="rgba(232,101,26,0.5)" strokeWidth="2" fill="none" filter={`url(#go-${uid})`}/>
      <circle cx="200" cy="500" r="4" fill="#E8651A" filter={`url(#go-${uid})`}/>
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="1">
        <line x1="145" y1="140" x2="155" y2="140"/><line x1="145" y1="165" x2="155" y2="165"/>
        <line x1="145" y1="190" x2="155" y2="190"/><line x1="245" y1="140" x2="255" y2="140"/>
        <line x1="245" y1="165" x2="255" y2="165"/><line x1="245" y1="190" x2="255" y2="190"/>
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   ÉTOILE
═══════════════════════════════════════════════════ */
function StarFrame({ isBonus, isPlaceholder }: { isBonus: boolean; isPlaceholder: boolean }) {
  const color = isPlaceholder ? 'rgba(255,255,255,0.12)' : isBonus ? '#FFD700' : '#E8651A';
  const id = isPlaceholder ? 'ph' : isBonus ? 'g' : 'o';
  return (
    <svg viewBox="0 0 110 110" width="92" height="92" className="absolute inset-0 -m-3.5" style={{ zIndex: 1 }}>
      <defs>
        <filter id={`sf-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points="55,4 67,38 103,38 75,59 86,94 55,73 24,94 35,59 7,38 43,38"
        fill="none" stroke={color} strokeWidth="3.5" filter={`url(#sf-${id})`}/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   JOUEUR SUR LE TERRAIN
═══════════════════════════════════════════════════ */
interface CourtPlayerProps {
  score: PlayerScore;
  position: { top: string; left: string };
  isBonus: boolean;
  rank: number;
  animDelay: number;
}

function CourtPlayer({ score, position, isBonus, rank, animDelay }: CourtPlayerProps) {
  const [visible, setVisible] = useState(false);
  const { player, votes, isPlaceholder } = score;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  const badgeBg = isPlaceholder ? '#282828' : rank === 1 ? '#FFD700' : '#E8651A';
  const badgeColor = rank === 1 && !isPlaceholder ? 'black' : 'white';
  const nameColor = isPlaceholder ? 'rgba(255,255,255,0.22)' : isBonus ? '#FFD700' : 'white';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{
        top: position.top, left: position.left, zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%,-50%) scale(${visible ? 1 : 0.3})`,
        transition: `opacity 0.5s ease ${animDelay}ms,transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}ms`,
      }}
    >
      {isBonus && !isPlaceholder && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold text-black px-2 py-0.5 rounded-full z-30 tracking-wide"
          style={{ background: 'linear-gradient(90deg,#FFDF00,#D4AF37)', boxShadow: '0 0 15px rgba(255,215,0,0.9)' }}>
          ⭐ BONUS
        </div>
      )}
      <div className="relative" style={{ width: 66, height: 66 }}>
        <StarFrame isBonus={isBonus} isPlaceholder={!!isPlaceholder} />
        <div className="absolute rounded-full overflow-hidden border-2 border-[#0A0A0A]"
          style={{ zIndex: 2, top: 6, left: 6, right: 6, bottom: 6, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8),0 5px 15px rgba(0,0,0,0.6)' }}>
          <div className="w-full h-full flex items-center justify-center" style={{ background: isPlaceholder ? '#111' : '#1A1A1A' }}>
            {player.photo_url && !isPlaceholder && (
              <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" style={{ filter: 'contrast(1.1) saturate(1.1)' }}/>
            )}
            {isPlaceholder
              ? <span style={{ fontSize: 20, lineHeight: 1 }}>❓</span>
              : <span className="absolute" style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'white', fontSize: 14, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                  {player.first_name[0]}{player.last_name[0]}
                </span>
            }
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: badgeBg, zIndex: 3, boxShadow: `0 0 10px ${badgeBg}80`, border: '2.5px solid #0A0A0A' }}>
          <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: badgeColor, fontSize: 12, paddingTop: '1px' }}>{rank}</span>
        </div>
      </div>
      <div className="text-center mt-3 bg-[#0A0A0A]/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5">
        <p style={{ fontFamily: 'Bebas Neue,sans-serif', color: nameColor, textShadow: '0 2px 4px rgba(0,0,0,1)', fontSize: 13, letterSpacing: '0.5px' }} className="leading-none">
          {isPlaceholder ? player.last_name : player.last_name.toUpperCase()}
        </p>
        <p style={{ fontSize: 10, color: isPlaceholder ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '2px' }}>
          {isPlaceholder ? 'En attente' : `${votes} votes`}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BANDEAU COACHS D'UNE ÉQUIPE
═══════════════════════════════════════════════════ */
function CoachSlot({ cs, role }: { cs: CoachScore | null; role: string }) {
  if (!cs) return (
    <div className="flex items-center gap-2 opacity-30">
      <div className="w-9 h-9 rounded-full bg-[#1C1C1C] border border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
        <span style={{ fontSize: 14 }}>❓</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">{role}</span>
        <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>En attente</span>
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#1C1C1C] flex-shrink-0"
        style={{ border: '2px solid #E8651A', boxShadow: '0 0 10px rgba(232,101,26,0.25)' }}>
        {cs.coach.photo_url
          ? <img src={cs.coach.photo_url} alt={cs.coach.last_name} className="w-full h-full object-cover object-top"/>
          : <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A', fontSize: 13 }}>
              {cs.coach.first_name[0]}{cs.coach.last_name[0]}
            </span>
        }
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">{role}</span>
        <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A', fontSize: 13, letterSpacing: '0.04em' }}>
          {cs.coach.first_name.toUpperCase()} {cs.coach.last_name.toUpperCase()}
        </span>
        <span className="text-[10px] text-white/25">{cs.total} vote{cs.total !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

function TeamCoachBanner({ coaches }: { coaches: TeamCoaches }) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(232,101,26,0.06)', border: '1px solid rgba(232,101,26,0.18)' }}>
      <CoachSlot cs={coaches.headCoach} role="Coach Principal" />
      <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }}/>
      <CoachSlot cs={coaches.assistantCoach} role="Coach Adjoint" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TERRAIN COMPLET (label + court + coachs)
═══════════════════════════════════════════════════ */
function TeamCourt({ team, teamLabel, teamColor, animKey }: {
  team: TeamData; teamLabel: string; teamColor: string; animKey: number;
}) {
  const uid = teamLabel.replace(/\s/g, '_');
  return (
    <div className="flex flex-col gap-2">
      {/* Label équipe */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: `${teamColor}35` }}/>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: `${teamColor}15`, border: `1px solid ${teamColor}45` }}>
          <div className="w-2 h-2 rounded-full" style={{ background: teamColor, boxShadow: `0 0 6px ${teamColor}` }}/>
          <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: teamColor, fontSize: 14, letterSpacing: '0.15em' }}>
            {teamLabel}
          </span>
        </div>
        <div className="flex-1 h-px" style={{ background: `${teamColor}35` }}/>
      </div>

      {/* Court */}
      <div
        key={`court-${uid}-${animKey}`}
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          paddingBottom: '125%',
          background: 'linear-gradient(180deg,#050505 0%,#0a0a0a 50%,#121212 100%)',
          border: `1px solid ${teamColor}28`,
          boxShadow: `0 0 40px ${teamColor}15,0 20px 40px -10px rgba(0,0,0,0.9),inset 0 0 80px ${teamColor}07`,
        }}
      >
        <div className="absolute inset-0">
          <BasketballCourt3D uid={uid} />
          <div className="absolute" style={{ top: '45%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.04, zIndex: 1 }}>
            <img src="/logo.png" alt="" className="w-28 h-28 object-contain"/>
          </div>
          {team.players.map((s, i) => (
            <CourtPlayer
              key={`${s.player.id}-${uid}-${animKey}`}
              score={s}
              position={COURT_POSITIONS[i]}
              isBonus={!s.isPlaceholder && team.bonusLeaderId === s.player.id}
              rank={i + 1}
              animDelay={i * 180}
            />
          ))}
        </div>
      </div>

      {/* Coachs */}
      <TeamCoachBanner coaches={team.coaches} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COMPOSANTS CLASSEMENT (réutilisables)
═══════════════════════════════════════════════════ */
function Avatar({ photoUrl, firstName, lastName, size = 44, borderColor = '#E8651A', active = false }: {
  photoUrl?: string; firstName: string; lastName: string;
  size?: number; borderColor?: string; active?: boolean;
}) {
  return (
    <div className="relative flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-[#1C1C1C]"
      style={{ width: size, height: size, border: `2px solid ${borderColor}`, boxShadow: active ? `0 0 12px ${borderColor}60` : 'none' }}>
      {photoUrl && <img src={photoUrl} alt={lastName} className="absolute inset-0 w-full h-full object-cover object-top"/>}
      {!photoUrl && <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: borderColor, fontSize: size * 0.32, lineHeight: 1 }}>{firstName[0]}{lastName[0]}</span>}
    </div>
  );
}

function ProgressBar({ pct, active }: { pct: number; active: boolean }) {
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.max(pct, 2)}%`, background: active ? 'linear-gradient(90deg,#b04800,#E8651A,#ff8c47)' : '#2a2a2a', boxShadow: active ? '0 0 8px rgba(232,101,26,0.5)' : 'none' }}/>
    </div>
  );
}

function RankBadge({ rank, active }: { rank: number; active: boolean }) {
  if (rank <= 3) return <span className="text-lg leading-none">{['🥇','🥈','🥉'][rank - 1]}</span>;
  return <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: active ? '#E8651A' : 'rgba(255,255,255,0.18)', lineHeight: 1 }}>{rank}</span>;
}

function TeamBadge({ num }: { num: 1 | 2 }) {
  const color = num === 1 ? '#E8651A' : '#3B9EF0';
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest flex-shrink-0"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      E{num}
    </span>
  );
}

function PlayerRow({ score, rank, maxVotes }: { score: PlayerScore; rank: number; maxVotes: number }) {
  const active = rank <= 10;
  const inTop5 = rank <= 5;
  const teamNum: 1 | 2 = rank % 2 === 1 ? 1 : 2;
  const pct = maxVotes > 0 ? (score.votes / maxVotes) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: inTop5 ? 'linear-gradient(90deg,rgba(232,101,26,0.13) 0%,rgba(14,14,14,1) 70%)' : 'rgba(12,12,12,0.9)',
        border: `1px solid ${inTop5 ? 'rgba(232,101,26,0.25)' : 'rgba(255,255,255,0.04)'}`,
      }}>
      <div className="w-7 flex-shrink-0 flex items-center justify-center"><RankBadge rank={rank} active={inTop5} /></div>
      <Avatar photoUrl={score.player.photo_url} firstName={score.player.first_name} lastName={score.player.last_name}
        size={42} borderColor={inTop5 ? '#E8651A' : '#2a2a2a'} active={inTop5} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamBadge num={teamNum} />
            <span className="font-bold text-sm leading-tight truncate" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
              {score.player.first_name} <span style={{ color: inTop5 ? '#E8651A' : 'rgba(255,255,255,0.22)' }}>{score.player.last_name.toUpperCase()}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {score.bonuses > 0 && <span className="text-[11px] font-bold text-[#FFD700]" style={{ textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>⭐×{score.bonuses}</span>}
            <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 20, color: inTop5 ? '#E8651A' : 'rgba(255,255,255,0.2)', lineHeight: 1 }}>{score.votes}</span>
          </div>
        </div>
        <ProgressBar pct={pct} active={inTop5} />
      </div>
    </div>
  );
}

function CoachRow({ cs, rank, maxTotal, role, teamNum }: {
  cs: CoachScore; rank: number; maxTotal: number;
  role: string | null; teamNum: 1 | 2 | null;
}) {
  const inTop4 = !!role; // mis en avant si rôle assigné
  const pct = maxTotal > 0 ? (cs.total / maxTotal) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: inTop4 ? 'linear-gradient(90deg,rgba(232,101,26,0.13) 0%,rgba(14,14,14,1) 70%)' : 'rgba(12,12,12,0.9)',
        border: `1px solid ${inTop4 ? 'rgba(232,101,26,0.25)' : 'rgba(255,255,255,0.04)'}`,
      }}>
      <div className="w-7 flex-shrink-0 flex items-center justify-center"><RankBadge rank={rank} active={inTop4} /></div>
      <Avatar photoUrl={cs.coach.photo_url} firstName={cs.coach.first_name} lastName={cs.coach.last_name}
        size={42} borderColor={inTop4 ? '#E8651A' : '#2a2a2a'} active={inTop4} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {teamNum && <TeamBadge num={teamNum} />}
            <span className="font-bold text-sm leading-tight truncate" style={{ color: inTop4 ? '#fff' : 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
              {cs.coach.first_name} <span style={{ color: inTop4 ? '#E8651A' : 'rgba(255,255,255,0.22)' }}>{cs.coach.last_name.toUpperCase()}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {cs.headVotes > 0 && <span className="text-[10px] text-white/30">🧑‍💼×{cs.headVotes}</span>}
            {cs.assistantVotes > 0 && <span className="text-[10px] text-white/30">👨‍💼×{cs.assistantVotes}</span>}
            <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 20, color: inTop4 ? '#E8651A' : 'rgba(255,255,255,0.2)', lineHeight: 1 }}>{cs.total}</span>
          </div>
        </div>
        <ProgressBar pct={pct} active={inTop4} />
      </div>
      {role && (
        <span className="flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest"
          style={{ background: 'rgba(232,101,26,0.15)', color: '#E8651A', border: '1px solid rgba(232,101,26,0.35)' }}>
          {role}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════ */
export default function ResultatsPage() {
  const [allScores, setAllScores] = useState<PlayerScore[]>([]);
  const [coachScores, setCoachScores] = useState<CoachScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [view, setView] = useState<'equipes' | 'classement' | 'coachs'>('equipes');
  const [animKey, setAnimKey] = useState(0);

  const fetchResults = useCallback(async () => {
    const [{ data: players }, { data: coaches }, { data: votes }] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true),
      supabase.from('coaches').select('*').eq('is_active', true),
      supabase.from('votes').select('player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,bonus_player_id,head_coach_id,assistant_coach_id'),
    ]);

    if (!players || !votes) return;

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

    setAllScores(scored);
    setTotalVotes(votes.length);

    if (coaches && coaches.length > 0) {
      const headCount: Record<string, number> = {};
      const asstCount: Record<string, number> = {};
      coaches.forEach((c: Coach) => { headCount[c.id] = 0; asstCount[c.id] = 0; });
      votes.forEach((v: Record<string, string | null>) => {
        if (v.head_coach_id && headCount[v.head_coach_id] !== undefined) headCount[v.head_coach_id]++;
        if (v.assistant_coach_id && asstCount[v.assistant_coach_id] !== undefined) asstCount[v.assistant_coach_id]++;
      });
      setCoachScores(
        coaches
          .map((c: Coach) => ({
            coach: c,
            headVotes: headCount[c.id] || 0,
            assistantVotes: asstCount[c.id] || 0,
            total: (headCount[c.id] || 0) + (asstCount[c.id] || 0),
          }))
          .sort((a: CoachScore, b: CoachScore) => b.total - a.total)
      );
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

  const [team1, team2] = splitIntoTeams(allScores, coachScores);
  const maxVotes = allScores[0]?.votes || 1;

  const tabs = [
    { id: 'equipes', label: '🏀 Équipes' },
    { id: 'classement', label: '📊 Joueurs' },
    ...(coachScores.length > 0 ? [{ id: 'coachs', label: '🧑‍💼 Coachs' }] : []),
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div style={{ width: 40, height: 40, borderWidth: 3, borderStyle: 'solid', borderColor: '#E8651A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <main className="min-h-screen pb-16 px-4 py-8 bg-[#050505]">
      <div className="max-w-lg mx-auto flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <img src="/logo.png" alt="CSL" className="w-14 h-14 object-contain" style={{ animation: 'float 6s ease-in-out infinite' }}/>
          <h1 style={{ fontFamily: 'Bebas Neue,sans-serif' }} className="text-5xl text-white tracking-wide drop-shadow-lg leading-none">RÉSULTATS</h1>
          <p className="text-white/40 text-xs tracking-widest uppercase font-semibold">All-Star Game · CSL Basket</p>
          <div className="flex items-center gap-2 mt-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.8)' }}/>
            <span className="text-xs text-white/55 font-medium">{totalVotes} votes exprimés · Live</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex rounded-xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id as 'equipes' | 'classement' | 'coachs')}
              className="flex-1 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200"
              style={{
                background: view === v.id ? '#E8651A' : 'transparent',
                color: view === v.id ? '#ffffff' : 'rgba(255,255,255,0.35)',
                boxShadow: view === v.id ? '0 4px 14px rgba(232,101,26,0.45)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* ══════════════ VUE ÉQUIPES ══════════════ */}
        {view === 'equipes' && (
          <div className="flex flex-col gap-8">
            <TeamCourt team={team1} teamLabel="ÉQUIPE 1" teamColor="#E8651A" animKey={animKey} />

            {/* VS separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
              <div className="px-4 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(255,255,255,0.35)', fontSize: 20, letterSpacing: '0.2em' }}>VS</span>
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
            </div>

            <TeamCourt team={team2} teamLabel="ÉQUIPE 2" teamColor="#3B9EF0" animKey={animKey} />
          </div>
        )}

        {/* ══════════════ VUE CLASSEMENT JOUEURS ══════════════ */}
        {view === 'classement' && (
          <div className="flex flex-col gap-2">
            <p className="text-center text-[#E8651A] font-black text-[10px] uppercase tracking-[0.25em] mb-1">
              Classement général · {allScores.length} joueurs
            </p>
            {allScores.map((s, i) => (
              <PlayerRow key={s.player.id} score={s} rank={i + 1} maxVotes={maxVotes} />
            ))}
          </div>
        )}

        {/* ══════════════ VUE COACHS ══════════════ */}
        {view === 'coachs' && (
          <div className="flex flex-col gap-2">
            <p className="text-center text-[#E8651A] font-black text-[10px] uppercase tracking-[0.25em] mb-1">
              Classement coachs
            </p>

            {/* Vue par équipe */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              {([
                { label: 'ÉQUIPE 1', color: '#E8651A', team: team1.coaches },
                { label: 'ÉQUIPE 2', color: '#3B9EF0', team: team2.coaches },
              ] as { label: string; color: string; team: TeamCoaches }[]).map(({ label, color, team }) => (
                <div key={label} className="flex flex-col gap-2 p-3 rounded-xl"
                  style={{ background: `${color}0c`, border: `1px solid ${color}28` }}>
                  <span style={{ fontFamily: 'Bebas Neue,sans-serif', color, fontSize: 12, letterSpacing: '0.15em' }}>{label}</span>
                  {[
                    { cs: team.headCoach, role: 'Principal' },
                    { cs: team.assistantCoach, role: 'Adjoint' },
                  ].map(({ cs, role }) => (
                    <div key={role} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#1C1C1C] flex-shrink-0"
                        style={{ border: `1.5px solid ${cs ? color : 'rgba(255,255,255,0.12)'}`, opacity: cs ? 1 : 0.4 }}>
                        {cs?.coach.photo_url
                          ? <img src={cs.coach.photo_url} alt={cs.coach.last_name} className="w-full h-full object-cover object-top"/>
                          : <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: cs ? color : 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                              {cs ? `${cs.coach.first_name[0]}${cs.coach.last_name[0]}` : '?'}
                            </span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>{role}</p>
                        <p className="text-xs font-bold leading-tight truncate" style={{ color: cs ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                          {cs ? <>{cs.coach.first_name} <span style={{ color }}>{cs.coach.last_name.toUpperCase()}</span></> : 'En attente'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
              <span className="text-[10px] text-white/22 font-bold tracking-widest uppercase">Classement complet</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
            </div>

            {coachScores.map((cs, i) => {
              // Déterminer le rôle : principal si 1er ou 2ème par headVotes, adjoint sinon
              const byHead = [...coachScores].sort((a, b) => b.headVotes - a.headVotes);
              const byAsst = [...coachScores].sort((a, b) => b.assistantVotes - a.assistantVotes);
              const headRank  = byHead.findIndex(c => c.coach.id === cs.coach.id) + 1;
              const asstRank  = byAsst.findIndex(c => c.coach.id === cs.coach.id) + 1;
              // Assigner le rôle le plus favorable (1er ou 2ème)
              let role: string | null = null;
              let teamNum: 1 | 2 | null = null;
              if (headRank === 1) { role = 'PRINCIPAL'; teamNum = 1; }
              else if (headRank === 2) { role = 'PRINCIPAL'; teamNum = 2; }
              else if (asstRank === 1) { role = 'ADJOINT'; teamNum = 1; }
              else if (asstRank === 2) { role = 'ADJOINT'; teamNum = 2; }
              return (
                <CoachRow key={cs.coach.id} cs={cs} rank={i + 1} maxTotal={coachScores[0]?.total || 1}
                  role={role} teamNum={teamNum} />
              );
            })}
          </div>
        )}

      </div>

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      `}</style>
    </main>
  );
}
