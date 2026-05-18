'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/* ══════════════════════════════════════ TYPES */
interface Player { id: string; first_name: string; last_name: string; photo_url?: string; team?: number | null; }
interface Coach  { id: string; first_name: string; last_name: string; photo_url?: string; team?: number | null; }
interface PlayerScore { player: Player; votes: number; isPlaceholder?: boolean; }
interface CoachScore  { coach: Coach; headVotes: number; assistantVotes: number; total: number; }
interface TeamCoaches { headCoach: CoachScore | null; assistantCoach: CoachScore | null; }
interface TeamData    { players: PlayerScore[]; coaches: TeamCoaches; }

const HEAD_WEIGHT = 1.5;
const ASST_WEIGHT = 1;

const COURT_POSITIONS = [
  { top: '82%', left: '50%' }, { top: '59%', left: '15%' }, { top: '58%', left: '85%' },
  { top: '28%', left: '28%' }, { top: '28%', left: '72%' },
];

function makePlaceholder(slot: number): PlayerScore {
  return { player: { id: `ph-${slot}`, first_name: 'Joueur', last_name: `N°${slot}` }, votes: 0, isPlaceholder: true };
}

function padTeam(scores: PlayerScore[]): PlayerScore[] {
  const r = [...scores];
  let s = r.length + 1;
  while (r.length < 5) r.push(makePlaceholder(s++));
  return r;
}

/* ══════════════════════════════════════ SVG TERRAIN */
function BasketballCourt3D({ uid }: { uid: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id={`go-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id={`gw-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id={`gs-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id={`cg-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0a0a0a"/><stop offset="50%" stopColor="#121212"/><stop offset="100%" stopColor="#1a1a1a"/></linearGradient>
        <radialGradient id={`rg-${uid}`} cx="50%" cy="50%" r="80%"><stop offset="0%" stopColor="#E8651A" stopOpacity="0.8"/><stop offset="100%" stopColor="#E8651A" stopOpacity="0"/></radialGradient>
      </defs>
      <polygon points="40,500 360,500 320,80 80,80" fill={`url(#cg-${uid})`} stroke="rgba(232,101,26,0.3)" strokeWidth="2"/>
      <g stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" filter={`url(#gw-${uid})`}>
        <line x1="80" y1="80" x2="320" y2="80"/><line x1="40" y1="500" x2="80" y2="80"/>
        <line x1="360" y1="500" x2="320" y2="80"/><line x1="40" y1="500" x2="360" y2="500"/>
      </g>
      <g stroke="rgba(232,101,26,0.7)" strokeWidth="2" fill="none" filter={`url(#go-${uid})`}>
        <polygon points="140,80 260,80 240,220 160,220"/><line x1="160" y1="220" x2="240" y2="220"/>
      </g>
      <ellipse cx="200" cy="220" rx="40" ry="25" stroke="rgba(232,101,26,0.6)" strokeWidth="1.5" fill="none" filter={`url(#go-${uid})`}/>
      <path d="M 160 220 A 40 25 0 0 1 240 220" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="8,6" fill="none"/>
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" filter={`url(#gw-${uid})`}>
        <line x1="100" y1="80" x2="75" y2="280"/><line x1="300" y1="80" x2="325" y2="280"/>
        <path d="M 75 280 Q 200 400 325 280"/>
      </g>
      <line x1="175" y1="95" x2="225" y2="95" stroke="rgba(255,255,255,0.8)" strokeWidth="3" filter={`url(#gw-${uid})`}/>
      <line x1="200" y1="95" x2="200" y2="115" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      <circle cx="200" cy="115" r="12" fill={`url(#rg-${uid})`}/>
      <circle cx="200" cy="115" r="12" stroke="#E8651A" strokeWidth="3" fill="none" filter={`url(#gs-${uid})`}/>
      <path d="M 130 500 A 70 40 0 0 1 270 500" stroke="rgba(232,101,26,0.5)" strokeWidth="2" fill="none" filter={`url(#go-${uid})`}/>
    </svg>
  );
}

/* ══════════════════════════════════════ ÉTOILE */
function StarFrame({ isPlaceholder }: { isPlaceholder: boolean }) {
  const color = isPlaceholder ? 'rgba(255,255,255,0.12)' : '#E8651A';
  return (
    <svg viewBox="0 0 110 110" width="92" height="92" className="absolute inset-0 -m-3.5" style={{zIndex:1}}>
      <defs>
        <filter id={`sf-${isPlaceholder?'p':'o'}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points="55,4 67,38 103,38 75,59 86,94 55,73 24,94 35,59 7,38 43,38"
        fill="none" stroke={color} strokeWidth="3.5" filter={`url(#sf-${isPlaceholder?'p':'o'})`}/>
    </svg>
  );
}

/* ══════════════════════════════════════ JOUEUR SUR TERRAIN
   ✅ MODIF 4 : correction superposition lettre + nom plus visible en bas (sans score)
*/
function CourtPlayer({ score, position, animDelay }: {
  score: PlayerScore; position: {top:string;left:string}; animDelay:number;
}) {
  const [visible, setVisible] = useState(false);
  const { player, isPlaceholder } = score;
  useEffect(() => { const t = setTimeout(() => setVisible(true), animDelay); return () => clearTimeout(t); }, [animDelay]);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ top:position.top, left:position.left, zIndex:10, opacity:visible?1:0,
        transform:`translate(-50%,-50%) scale(${visible?1:0.3})`,
        transition:`opacity 0.5s ease ${animDelay}ms,transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}ms` }}>
      <div className="relative" style={{width:66,height:66}}>
        <StarFrame isPlaceholder={!!isPlaceholder}/>
        <div className="absolute rounded-full overflow-hidden border-2 border-[#0A0A0A]"
          style={{zIndex:2,top:6,left:6,right:6,bottom:6}}>
          <div className="w-full h-full flex items-center justify-center" style={{background:isPlaceholder?'#111':'#1A1A1A'}}>
            {/* ✅ MODIF 4 : photo OU initiales (plus de superposition) */}
            {isPlaceholder ? (
              <span style={{fontSize:20,lineHeight:1}}>❓</span>
            ) : player.photo_url ? (
              <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" style={{filter:'contrast(1.1) saturate(1.1)'}}/>
            ) : (
              <span style={{fontFamily:'Bebas Neue,sans-serif',color:'white',fontSize:14,textShadow:'0 2px 4px rgba(0,0,0,0.9)'}}>
                {player.first_name[0]}{player.last_name[0]}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* ✅ MODIF 4 : nom prénom en bas, sans score */}
      <div className="text-center mt-3 bg-[#0A0A0A]/70 px-2 py-1.5 rounded-lg backdrop-blur-sm border border-white/5 min-w-[60px]">
        <p style={{fontFamily:'Bebas Neue,sans-serif',color:isPlaceholder?'rgba(255,255,255,0.22)':'white',fontSize:12}} className="leading-none">
          {isPlaceholder ? player.last_name : player.last_name.toUpperCase()}
        </p>
        {!isPlaceholder && (
          <p style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>
            {player.first_name.toUpperCase()}
          </p>
        )}
        {isPlaceholder && (
          <p style={{fontSize:10,color:'rgba(255,255,255,0.18)',marginTop:'2px'}}>En attente</p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════ BANDEAU COACHS (sans scores) */
function TeamCoachBanner({ coaches }: { coaches: TeamCoaches }) {
  const Slot = ({ cs, role }: { cs: CoachScore | null; role: string }) => (
    <div className="flex items-center gap-2" style={{opacity:cs?1:0.35}}>
      <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#1C1C1C] flex-shrink-0"
        style={{border:`2px solid ${cs?'#E8651A':'rgba(255,255,255,0.15)'}`}}>
        {cs?.coach.photo_url
          ? <img src={cs.coach.photo_url} alt={cs.coach.last_name} className="w-full h-full object-cover object-top"/>
          : <span style={{fontFamily:'Bebas Neue,sans-serif',color:cs?'#E8651A':'rgba(255,255,255,0.3)',fontSize:13}}>
              {cs?`${cs.coach.first_name[0]}${cs.coach.last_name[0]}`:'?'}
            </span>
        }
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">{role}</span>
        {/* ✅ MODIF 2 : nom du coach seulement, sans les stats de vote */}
        <span style={{fontFamily:'Bebas Neue,sans-serif',color:cs?'#E8651A':'rgba(255,255,255,0.25)',fontSize:13}}>
          {cs?`${cs.coach.first_name.toUpperCase()} ${cs.coach.last_name.toUpperCase()}`:'En attente'}
        </span>
      </div>
    </div>
  );
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap px-3 py-2.5 rounded-xl"
      style={{background:'rgba(232,101,26,0.06)',border:'1px solid rgba(232,101,26,0.18)'}}>
      <Slot cs={coaches.headCoach} role="Coach Principal"/>
      <div className="w-px h-8" style={{background:'rgba(255,255,255,0.08)'}}/>
      <Slot cs={coaches.assistantCoach} role="Coach Adjoint"/>
    </div>
  );
}

/* ══════════════════════════════════════ TERRAIN ÉQUIPE */
function TeamCourt({ team, teamLabel, teamColor, animKey }: {
  team: TeamData; teamLabel: string; teamColor: string; animKey: number;
}) {
  const uid = teamLabel.replace(/\s/g,'_');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{background:`${teamColor}35`}}/>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{background:`${teamColor}15`,border:`1px solid ${teamColor}45`}}>
          <div className="w-2 h-2 rounded-full" style={{background:teamColor,boxShadow:`0 0 6px ${teamColor}`}}/>
          <span style={{fontFamily:'Bebas Neue,sans-serif',color:teamColor,fontSize:14,letterSpacing:'0.15em'}}>{teamLabel}</span>
        </div>
        <div className="flex-1 h-px" style={{background:`${teamColor}35`}}/>
      </div>
      <div key={`${uid}-${animKey}`} className="relative w-full rounded-2xl overflow-hidden"
        style={{paddingBottom:'125%',background:'linear-gradient(180deg,#050505 0%,#0a0a0a 50%,#121212 100%)',
          border:`1px solid ${teamColor}28`,boxShadow:`0 0 40px ${teamColor}15,0 20px 40px -10px rgba(0,0,0,0.9)`}}>
        <div className="absolute inset-0">
          <BasketballCourt3D uid={uid}/>
          <div className="absolute" style={{top:'45%',left:'50%',transform:'translate(-50%,-50%)',opacity:0.04,zIndex:1}}>
            <img src="/logo.png" alt="" className="w-28 h-28 object-contain"/>
          </div>
          {team.players.map((s,i) => (
            <CourtPlayer key={`${s.player.id}-${uid}-${animKey}`} score={s}
              position={COURT_POSITIONS[i]} animDelay={i*180}/>
          ))}
        </div>
      </div>
      <TeamCoachBanner coaches={team.coaches}/>
    </div>
  );
}

/* ══════════════════════════════════════ PAGE PRINCIPALE
   ✅ MODIF 2 : suppression des onglets "Joueurs" et "Coachs" — vue publique = équipes uniquement
*/
export default function ResultatsPage() {
  const [team1Data, setTeam1Data] = useState<TeamData>({
    players: Array(5).fill(null).map((_,i)=>makePlaceholder(i+1)),
    coaches: {headCoach:null,assistantCoach:null},
  });
  const [team2Data, setTeam2Data] = useState<TeamData>({
    players: Array(5).fill(null).map((_,i)=>makePlaceholder(i+1)),
    coaches: {headCoach:null,assistantCoach:null},
  });
  const [loading,    setLoading]    = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [animKey,    setAnimKey]    = useState(0);

  const fetchResults = useCallback(async () => {
    type VoteRow = {
      player_1_id: string|null; player_2_id: string|null; player_3_id: string|null;
      player_4_id: string|null; player_5_id: string|null;
      player_6_id: string|null; player_7_id: string|null; player_8_id: string|null;
      player_9_id: string|null; player_10_id: string|null;
      head_coach_id: string|null; assistant_coach_id: string|null;
      head_coach_2_id: string|null; assistant_coach_2_id: string|null;
    };

    const [{ data: players }, { data: coaches }] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true),
      supabase.from('coaches').select('*').eq('is_active', true),
    ]);
    if (!players) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const votesRes = await fetch(
      `${supabaseUrl}/rest/v1/votes?select=player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,player_6_id,player_7_id,player_8_id,player_9_id,player_10_id,head_coach_id,assistant_coach_id,head_coach_2_id,assistant_coach_2_id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawVotes: any[] = await votesRes.json();
    if (!Array.isArray(rawVotes)) return;

    const votes: VoteRow[] = rawVotes.map(v => ({
      player_1_id:          v.player_1_id          ?? null,
      player_2_id:          v.player_2_id          ?? null,
      player_3_id:          v.player_3_id          ?? null,
      player_4_id:          v.player_4_id          ?? null,
      player_5_id:          v.player_5_id          ?? null,
      player_6_id:          v.player_6_id          ?? null,
      player_7_id:          v.player_7_id          ?? null,
      player_8_id:          v.player_8_id          ?? null,
      player_9_id:          v.player_9_id          ?? null,
      player_10_id:         v.player_10_id         ?? null,
      head_coach_id:        v.head_coach_id        ?? null,
      assistant_coach_id:   v.assistant_coach_id   ?? null,
      head_coach_2_id:      v.head_coach_2_id      ?? null,
      assistant_coach_2_id: v.assistant_coach_2_id ?? null,
    }));

    const voteCount: Record<string,number> = {};
    players.forEach(p => { voteCount[p.id] = 0; });
    votes.forEach(v => {
      [v.player_1_id,v.player_2_id,v.player_3_id,v.player_4_id,v.player_5_id].forEach(id => {
        if (id && voteCount[id] !== undefined) voteCount[id]++;
      });
      [v.player_6_id,v.player_7_id,v.player_8_id,v.player_9_id,v.player_10_id].forEach(id => {
        if (id && voteCount[id] !== undefined) voteCount[id]++;
      });
    });

    setTotalVotes(votes.length);

    const makeScores = (team: number) =>
      players
        .filter(p => p.team === team)
        .map(p => ({ player: p, votes: voteCount[p.id] || 0 }))
        .sort((a,b) => b.votes - a.votes);

    const s1 = makeScores(1);
    const s2 = makeScores(2);

    const t1Top5 = padTeam(s1.slice(0,5));
    const t2Top5 = padTeam(s2.slice(0,5));

    if (coaches && coaches.length > 0) {
      const hc1: Record<string,number> = {}, ac1: Record<string,number> = {};
      const hc2: Record<string,number> = {}, ac2: Record<string,number> = {};
      coaches.forEach(c => { hc1[c.id]=0; ac1[c.id]=0; hc2[c.id]=0; ac2[c.id]=0; });

      votes.forEach(v => {
        if (v.head_coach_id        && hc1[v.head_coach_id]       !==undefined) hc1[v.head_coach_id]++;
        if (v.assistant_coach_id   && ac1[v.assistant_coach_id]  !==undefined) ac1[v.assistant_coach_id]++;
        if (v.head_coach_2_id      && hc2[v.head_coach_2_id]     !==undefined) hc2[v.head_coach_2_id]++;
        if (v.assistant_coach_2_id && ac2[v.assistant_coach_2_id]!==undefined) ac2[v.assistant_coach_2_id]++;
      });

      const buildScore = (c: Coach, hMap: Record<string,number>, aMap: Record<string,number>): CoachScore => ({
        coach: c,
        headVotes:      hMap[c.id] || 0,
        assistantVotes: aMap[c.id] || 0,
        total: (hMap[c.id]||0) * HEAD_WEIGHT + (aMap[c.id]||0) * ASST_WEIGHT,
      });

      const c1 = coaches.filter(c=>c.team===1).map(c=>buildScore(c,hc1,ac1)).sort((a,b)=>b.total-a.total);
      const c2 = coaches.filter(c=>c.team===2).map(c=>buildScore(c,hc2,ac2)).sort((a,b)=>b.total-a.total);

      const pickCoaches = (list: CoachScore[]): TeamCoaches => {
        const assigned = new Set<string>();
        const pickBest = (sorted: CoachScore[]) => {
          const f = sorted.find(c => !assigned.has(c.coach.id));
          if (f) assigned.add(f.coach.id);
          return f ?? null;
        };
        const byHead = [...list].sort((a,b)=>b.headVotes-a.headVotes);
        const byAsst = [...list].sort((a,b)=>b.assistantVotes-a.assistantVotes);
        return { headCoach: pickBest(byHead), assistantCoach: pickBest(byAsst) };
      };

      setTeam1Data({ players: t1Top5, coaches: pickCoaches(c1) });
      setTeam2Data({ players: t2Top5, coaches: pickCoaches(c2) });
    } else {
      setTeam1Data({ players: t1Top5, coaches:{headCoach:null,assistantCoach:null} });
      setTeam2Data({ players: t2Top5, coaches:{headCoach:null,assistantCoach:null} });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResults();
    const ch = supabase.channel('resultats-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'votes'},()=>{fetchResults();setAnimKey(k=>k+1);})
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchResults]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div style={{width:40,height:40,borderWidth:3,borderStyle:'solid',borderColor:'#E8651A',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <main className="min-h-screen pb-16 px-4 py-8 bg-[#050505]">
      <div className="max-w-lg mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <img src="/logo.png" alt="CSL" className="w-14 h-14 object-contain" style={{animation:'float 6s ease-in-out infinite'}}/>
          <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-5xl text-white tracking-wide leading-none">RÉSULTATS</h1>
          <p className="text-white/40 text-xs tracking-widest uppercase font-semibold">All-Star Game · CSL Basket</p>
          {/* ✅ MODIF 2 : pas d'affichage du nombre total de votes */}
          <div className="flex items-center gap-2 mt-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{boxShadow:'0 0 8px rgba(34,197,94,0.8)'}}/>
            <span className="text-xs text-white/55 font-medium">Résultats en direct · Live</span>
          </div>
        </div>

        {/* ✅ MODIF 2 : vue unique "Équipes" — pas d'onglets avec classements */}
        <div className="flex flex-col gap-8">
          <TeamCourt team={team1Data} teamLabel="ÉQUIPE 1" teamColor="#E8651A" animKey={animKey}/>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
            <div className="px-4 py-1.5 rounded-full" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif',color:'rgba(255,255,255,0.35)',fontSize:20,letterSpacing:'0.2em'}}>VS</span>
            </div>
            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
          </div>
          <TeamCourt team={team2Data} teamLabel="ÉQUIPE 2" teamColor="#3B9EF0" animKey={animKey}/>
        </div>

      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </main>
  );
}
