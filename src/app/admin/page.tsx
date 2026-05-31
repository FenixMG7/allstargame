'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';

interface PlayerScore {
  player: Player & { team?: number | null };
  votes: number;
  bonuses: number;
}

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_active: boolean;
  team?: number | null;
}

interface CoachScore {
  coach: Coach;
  headVotes: number;
  assistantVotes: number;
  total: number;
}

const HEAD_WEIGHT = 1.5;
const ASST_WEIGHT = 1;

/* ─── Nav ─────────────────────────────────────── */
function AdminNav({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = [
    { id: 'results',  label: '📊 Résultats' },
    { id: 'equipes',  label: '⭐ Équipes' },
    { id: 'codes',    label: '🎫 Codes' },
    { id: 'players',  label: '🏀 Joueurs' },
    { id: 'coaches',  label: '🧑‍💼 Coachs' },
    { id: 'settings', label: '⚙️ Paramètres' },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: active === t.id ? '#E8651A' : '#141414',
            color: active === t.id ? 'white' : 'rgba(255,255,255,0.6)',
            border: `1px solid ${active === t.id ? '#E8651A' : '#1E1E1E'}`,
            boxShadow: active === t.id ? '0 0 12px rgba(232,101,26,0.4)' : 'none',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Badge équipe ────────────────────────────── */
function TeamBadge({ team, onChange }: { team: number | null | undefined; onChange: (t: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2].map(n => (
        <button key={n} onClick={() => onChange(n)}
          className="w-8 h-6 rounded text-[10px] font-black transition-all"
          style={{
            background: team === n ? (n === 1 ? '#E8651A' : '#3B9EF0') : '#1A1A1A',
            color: team === n ? 'white' : 'rgba(255,255,255,0.3)',
            border: `1px solid ${team === n ? (n === 1 ? '#E8651A' : '#3B9EF0') : '#333'}`,
          }}>
          E{n}
        </button>
      ))}
    </div>
  );
}

/* ─── Onglet Résultats ─────────────────────────── */
function ResultsTab() {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [coachScores1, setCoachScores1] = useState<CoachScore[]>([]);
  const [coachScores2, setCoachScores2] = useState<CoachScore[]>([]);
  const [stats, setStats] = useState({ totalVotes: 0, totalCodes: 0, usedCodes: 0 });
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const { data: players } = await supabase.from('players').select('*').eq('is_active', true);
    const { data: coaches } = await supabase.from('coaches').select('*').eq('is_active', true);
    if (!players) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const votesRes = await fetch(
      `${supabaseUrl}/rest/v1/votes?select=player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,bonus_player_id,head_coach_id,assistant_coach_id,head_coach_2_id,assistant_coach_2_id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawVotes: any[] = await votesRes.json();

    const { count: totalCodes } = await supabase.from('voting_codes').select('*', { count: 'exact', head: true });
    const { count: usedCodes } = await supabase.from('voting_codes').select('*', { count: 'exact', head: true }).eq('status', 'used');

    if (!Array.isArray(rawVotes)) return;

    const voteCount: Record<string, number> = {};
    const bonusCount: Record<string, number> = {};
    players.forEach(p => { voteCount[p.id] = 0; bonusCount[p.id] = 0; });
    rawVotes.forEach(v => {
      [v.player_1_id, v.player_2_id, v.player_3_id, v.player_4_id, v.player_5_id].forEach(id => {
        if (id && voteCount[id] !== undefined) voteCount[id]++;
      });
      if (v.bonus_player_id && bonusCount[v.bonus_player_id] !== undefined) bonusCount[v.bonus_player_id]++;
    });

    const scored = players
      .map(p => ({ player: p, votes: voteCount[p.id] || 0, bonuses: bonusCount[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes || b.bonuses - a.bonuses);

    setScores(scored);
    setStats({ totalVotes: rawVotes.length, totalCodes: totalCodes || 0, usedCodes: usedCodes || 0 });

    if (coaches && coaches.length > 0) {
      const hc1: Record<string,number> = {}, ac1: Record<string,number> = {};
      const hc2: Record<string,number> = {}, ac2: Record<string,number> = {};
      coaches.forEach(c => { hc1[c.id]=0; ac1[c.id]=0; hc2[c.id]=0; ac2[c.id]=0; });

      rawVotes.forEach(v => {
        if (v.head_coach_id        && hc1[v.head_coach_id]       !==undefined) hc1[v.head_coach_id]++;
        if (v.assistant_coach_id   && ac1[v.assistant_coach_id]  !==undefined) ac1[v.assistant_coach_id]++;
        if (v.head_coach_2_id      && hc2[v.head_coach_2_id]     !==undefined) hc2[v.head_coach_2_id]++;
        if (v.assistant_coach_2_id && ac2[v.assistant_coach_2_id]!==undefined) ac2[v.assistant_coach_2_id]++;
      });

      const buildCS = (c: Coach, hMap: Record<string,number>, aMap: Record<string,number>): CoachScore => ({
        coach: c,
        headVotes:      hMap[c.id] || 0,
        assistantVotes: aMap[c.id] || 0,
        total: (hMap[c.id]||0)*HEAD_WEIGHT + (aMap[c.id]||0)*ASST_WEIGHT,
      });

      const c1 = coaches.filter(c=>c.team===1).map(c=>buildCS(c,hc1,ac1)).sort((a,b)=>b.total-a.total);
      const c2 = coaches.filter(c=>c.team===2).map(c=>buildCS(c,hc2,ac2)).sort((a,b)=>b.total-a.total);
      setCoachScores1(c1);
      setCoachScores2(c2);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResults();
    const channel = supabase.channel('votes-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, fetchResults)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchResults]);

  const maxVotes = scores[0]?.votes || 1;
  const team1 = scores.filter(s => s.player.team === 1);
  const team2 = scores.filter(s => s.player.team === 2);

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" style={{width:32,height:32,borderWidth:3}} /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Votes exprimés', value: stats.totalVotes, icon: '🗳️' },
          { label: 'Codes utilisés', value: `${stats.usedCodes}/${stats.totalCodes}`, icon: '🎫' },
          { label: 'Participation', value: stats.totalCodes > 0 ? `${Math.round((stats.usedCodes/stats.totalCodes)*100)}%` : '—', icon: '📈' },
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-[#E8651A]">{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-white/40">Mise à jour en temps réel</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ label: 'ÉQUIPE 1', color: '#E8651A', list: team1 }, { label: 'ÉQUIPE 2', color: '#3B9EF0', list: team2 }].map(({ label, color, list }) => (
          <div key={label} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-2">
            <span style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:14, letterSpacing:'0.1em'}}>{label} — Top 5</span>
            {list.slice(0,5).map((s, i) => (
              <div key={s.player.id} className="flex items-center gap-2">
                <span style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:16, width:18, flexShrink:0}}>{i+1}</span>
                <span className="text-white text-xs font-semibold truncate flex-1">{s.player.first_name} {s.player.last_name}</span>
                <span style={{fontFamily:'Bebas Neue,sans-serif', color}} className="text-sm flex-shrink-0">{s.votes}</span>
              </div>
            ))}
            {list.length === 0 && <span className="text-white/25 text-xs italic">Aucun joueur assigné</span>}
          </div>
        ))}
      </div>

      {(coachScores1.length > 0 || coachScores2.length > 0) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[#1E1E1E]"/>
            <span className="text-white/50 text-xs uppercase tracking-widest font-semibold px-2">🧑‍💼 Résultats Coachs</span>
            <div className="h-px flex-1 bg-[#1E1E1E]"/>
          </div>
          <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl p-3 flex items-center gap-2">
            <span className="text-[#E8651A] text-sm">⚖️</span>
            <span className="text-white/40 text-xs">Pondération · Coach principal = <span className="text-[#E8651A] font-bold">1.5 pts</span> · Coach adjoint = <span className="text-[#3B9EF0] font-bold">1 pt</span></span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'ÉQUIPE 1', color: '#E8651A', list: coachScores1 },
              { label: 'ÉQUIPE 2', color: '#3B9EF0', list: coachScores2 },
            ].map(({ label, color, list }) => (
              <div key={label} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-2">
                <span style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:14, letterSpacing:'0.1em'}}>{label}</span>
                {list.length === 0 ? (
                  <span className="text-white/25 text-xs italic">Aucun vote</span>
                ) : (
                  list.map((cs, i) => {
                    const roleLabel = i === 0 ? 'PRINCIPAL' : i === 1 ? 'ADJOINT' : '';
                    return (
                      <div key={cs.coach.id} className="flex items-center gap-2 p-2 rounded-lg border"
                        style={{borderColor: i < 2 ? `${color}40` : '#1E1E1E', background: i < 2 ? `${color}08` : 'transparent'}}>
                        <span style={{fontFamily:'Bebas Neue,sans-serif', color: i < 2 ? color : 'rgba(255,255,255,0.2)', fontSize:16, width:18, flexShrink:0}}>{i+1}</span>
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center border"
                          style={{borderColor: i < 2 ? color : '#333'}}>
                          {cs.coach.photo_url
                            ? <img src={cs.coach.photo_url} alt={cs.coach.last_name} className="w-full h-full object-cover"/>
                            : <span style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:10}}>{cs.coach.first_name[0]}{cs.coach.last_name[0]}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-xs font-semibold truncate block">{cs.coach.first_name} {cs.coach.last_name}</span>
                          <span className="text-white/30 text-[10px]">🧑‍💼×{cs.headVotes} · 👨‍💼×{cs.assistantVotes}</span>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span style={{fontFamily:'Bebas Neue,sans-serif', color: i < 2 ? color : 'rgba(255,255,255,0.2)', fontSize:18, lineHeight:1}}>
                            {cs.total % 1 === 0 ? cs.total : cs.total.toFixed(1)}
                          </span>
                          {roleLabel && i < 2 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full mt-0.5"
                              style={{background:`${color}20`,color,border:`1px solid ${color}40`}}>{roleLabel}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {scores.map((s, i) => {
          const teamColor = s.player.team === 1 ? '#E8651A' : s.player.team === 2 ? '#3B9EF0' : '#444';
          return (
            <div key={s.player.id} className="flex items-center gap-4 p-4 rounded-xl border transition-all"
              style={{borderColor: i === 0 ? 'rgba(232,101,26,0.5)' : '#1E1E1E', background: i === 0 ? 'rgba(232,101,26,0.05)' : '#141414'}}>
              <div className="text-3xl w-8 text-center flex-shrink-0"
                style={{fontFamily:'Bebas Neue,sans-serif', color: i === 0 ? '#E8651A' : i === 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}}>
                {i + 1}
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0">
                {s.player.photo_url
                  ? <img src={s.player.photo_url} alt={s.player.last_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-sm text-[#E8651A]/50">{s.player.first_name[0]}</span></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {s.player.team && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{background:`${teamColor}22`,color:teamColor,border:`1px solid ${teamColor}40`}}>E{s.player.team}</span>
                  )}
                  <span className="font-semibold text-white text-sm truncate">{s.player.first_name} {s.player.last_name}</span>
                  <div className="flex items-center gap-3 ml-auto">
                    {s.bonuses > 0 && <span className="text-xs text-[#FFD700]">⭐ ×{s.bonuses}</span>}
                    <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#E8651A]">{s.votes}</span>
                  </div>
                </div>
                <div className="h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{width:`${(s.votes/maxVotes)*100}%`, background: teamColor}} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Onglet Équipes Sélectionnées ─────────────── */
function EquipesTab() {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [coachScores1, setCoachScores1] = useState<CoachScore[]>([]);
  const [coachScores2, setCoachScores2] = useState<CoachScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('ALL STAR GAME');
  const [siteUrl, setSiteUrl] = useState('');

  useEffect(() => {
    setSiteUrl(window.location.origin);
    supabase.from('vote_settings').select('event_name').single().then(({ data }) => {
      if (data?.event_name) setEventName(data.event_name);
    });
    loadData();
  }, []);

  async function loadData() {
    const { data: pl } = await supabase.from('players').select('*').eq('is_active', true);
    const { data: co } = await supabase.from('coaches').select('*').eq('is_active', true);
    if (!pl) { setLoading(false); return; }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const votesRes = await fetch(
      `${supabaseUrl}/rest/v1/votes?select=player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,bonus_player_id,head_coach_id,assistant_coach_id,head_coach_2_id,assistant_coach_2_id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawVotes: any[] = await votesRes.json();
    if (!Array.isArray(rawVotes)) { setLoading(false); return; }

    const voteCount: Record<string, number> = {};
    const bonusCount: Record<string, number> = {};
    pl.forEach(p => { voteCount[p.id] = 0; bonusCount[p.id] = 0; });
    rawVotes.forEach(v => {
      [v.player_1_id, v.player_2_id, v.player_3_id, v.player_4_id, v.player_5_id].forEach((id: string) => {
        if (id && voteCount[id] !== undefined) voteCount[id]++;
      });
      if (v.bonus_player_id && bonusCount[v.bonus_player_id] !== undefined) bonusCount[v.bonus_player_id]++;
    });
    const scored = pl.map(p => ({ player: p, votes: voteCount[p.id] || 0, bonuses: bonusCount[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes);
    setScores(scored);

    if (co && co.length > 0) {
      const hc1: Record<string,number> = {}, ac1: Record<string,number> = {};
      const hc2: Record<string,number> = {}, ac2: Record<string,number> = {};
      co.forEach(c => { hc1[c.id]=0; ac1[c.id]=0; hc2[c.id]=0; ac2[c.id]=0; });
      rawVotes.forEach(v => {
        if (v.head_coach_id && hc1[v.head_coach_id]!==undefined) hc1[v.head_coach_id]++;
        if (v.assistant_coach_id && ac1[v.assistant_coach_id]!==undefined) ac1[v.assistant_coach_id]++;
        if (v.head_coach_2_id && hc2[v.head_coach_2_id]!==undefined) hc2[v.head_coach_2_id]++;
        if (v.assistant_coach_2_id && ac2[v.assistant_coach_2_id]!==undefined) ac2[v.assistant_coach_2_id]++;
      });
      const buildCS = (c: Coach, hMap: Record<string,number>, aMap: Record<string,number>): CoachScore => ({
        coach: c, headVotes: hMap[c.id]||0, assistantVotes: aMap[c.id]||0,
        total: (hMap[c.id]||0)*HEAD_WEIGHT + (aMap[c.id]||0)*ASST_WEIGHT,
      });
      setCoachScores1(co.filter(c=>c.team===1).map(c=>buildCS(c,hc1,ac1)).sort((a,b)=>b.total-a.total));
      setCoachScores2(co.filter(c=>c.team===2).map(c=>buildCS(c,hc2,ac2)).sort((a,b)=>b.total-a.total));
    }
    setLoading(false);
  }

  const all1 = scores.filter(s => s.player.team === 1);
  const all2 = scores.filter(s => s.player.team === 2);
  const headCoach1 = coachScores1[0] || null;
  const headCoach2 = coachScores2[0] || null;

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" style={{width:32,height:32,borderWidth:3}} /></div>;

  // Carte portrait : on adapte la taille des slots selon le nombre de joueurs
  const PlayerSlot = ({ ps, teamColor, index }: { ps: PlayerScore; teamColor: string; index: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, background: `${teamColor}30`, color: teamColor, border: `1px solid ${teamColor}50`, flexShrink: 0 }}>
        {index + 1}
      </div>
      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', border: `2px solid ${teamColor}`, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 8px ${teamColor}40`, flexShrink: 0 }}>
        {ps.player.photo_url
          ? <img src={ps.player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          : <span style={{ fontFamily: 'Bebas Neue, sans-serif', color: teamColor, fontSize: 14 }}>{ps.player.first_name[0]}{ps.player.last_name?.[0] || ''}</span>
        }
        {ps.player.number > 0 && (
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderTopLeftRadius: 4, background: teamColor, color: 'white', fontSize: 7, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ps.player.number}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', maxWidth: 44 }}>
        <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', lineHeight: 1.1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 44 }}>
          {ps.player.first_name.toUpperCase()}
        </p>
        <p style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'white', fontSize: 8, lineHeight: 1.1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 44 }}>
          {ps.player.last_name.toUpperCase()}
        </p>
      </div>
    </div>
  );

  const CoachSlot = ({ cs, teamColor, label }: { cs: CoachScore | null; teamColor: string; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, borderRadius: 10, padding: '6px 8px', background: `${teamColor}10`, border: `1px solid ${teamColor}30` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: cs ? '#1A1A1A' : '#0A0A0A', border: `2px solid ${cs ? teamColor : 'rgba(255,255,255,0.1)'}` }}>
        {cs?.coach.photo_url
          ? <img src={cs.coach.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          : <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ color: cs ? teamColor : 'rgba(255,255,255,0.2)' }}>
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: teamColor, margin: 0 }}>{label}</p>
        {cs
          ? <p style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'white', fontSize: 11, lineHeight: 1.2, margin: 0 }}>{cs.coach.first_name} {cs.coach.last_name}</p>
          : <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: 0 }}>En attente</p>
        }
      </div>
    </div>
  );

  // Grille joueurs : wrap automatique selon nb joueurs
  const PlayersGrid = ({ players, teamColor }: { players: PlayerScore[]; teamColor: string }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px 6px', justifyContent: 'center' }}>
      {players.length === 0
        ? <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '8px 0' }}>Aucun joueur assigné</p>
        : players.map((ps, i) => <PlayerSlot key={ps.player.id} ps={ps} teamColor={teamColor} index={i} />)
      }
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Instructions */}
      <div className="bg-[#0A0A0A] border border-[#E8651A]/30 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📸</span>
        <div>
          <p className="text-white font-semibold text-sm">Visuel Réseaux Sociaux</p>
          <p className="text-white/50 text-xs mt-1">
            Tous les membres des équipes classés par votes. Faites une capture d&apos;écran du cadre pour le partager.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={loadData} className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#1E1E1E] text-white/60 hover:text-white hover:border-[#E8651A] transition-all">
          🔄 Rafraîchir
        </button>
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <span>Équipe 1 : <span className="text-[#E8651A] font-bold">{all1.length}</span> joueurs</span>
          <span>·</span>
          <span>Équipe 2 : <span className="text-[#3B9EF0] font-bold">{all2.length}</span> joueurs</span>
        </div>
      </div>

      {/* ══ CARTE RÉSEAUX SOCIAUX ══ */}
      <div
        id="social-card"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'linear-gradient(180deg, #050A1A 0%, #0A0F24 25%, #0D0D0D 55%, #050505 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 0 60px rgba(232,101,26,0.2), 0 0 120px rgba(59,158,240,0.1)',
          border: '1px solid rgba(232,101,26,0.3)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          paddingBottom: 12,
        }}
      >
        {/* Fond décoratif */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,101,26,0.12) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,158,240,0.12) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, rgba(232,101,26,0.05) 0%, transparent 100%)' }} />
          <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 80, opacity: 0.1 }} viewBox="0 0 420 80" preserveAspectRatio="none">
            <path d="M 0 80 L 0 48 A 210 48 0 0 1 420 48 L 420 80 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <circle cx="210" cy="80" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,3"/>
          </svg>
          <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(212,175,55,0.15)', borderRadius: 14, pointerEvents: 'none' }} />
        </div>

        {/* ── HEADER ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 8px', gap: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(212,175,55,0.5)', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(212,175,55,0.3)' }}>
            <img src="/logo.png" alt="CSL" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 1 }}>
              <span style={{ color: '#D4AF37', fontSize: 10 }}>★</span>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 10, color: '#D4AF37', letterSpacing: '0.25em', margin: 0 }}>CSL BASKET ST VALLIER</p>
              <span style={{ color: '#D4AF37', fontSize: 10 }}>★</span>
            </div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'white', letterSpacing: '0.05em', lineHeight: 1, margin: 0, textShadow: '0 0 24px rgba(232,101,26,0.5)' }}>
              ÉQUIPES SÉLECTIONNÉES
            </h1>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#E8651A', letterSpacing: '0.1em', margin: 0, lineHeight: 1.2 }}>
              ★ AU {eventName} ★
            </p>
          </div>
        </div>

        {/* ── ÉQUIPE 1 ── */}
        <div style={{ position: 'relative', zIndex: 2, margin: '6px 10px 4px', borderRadius: 12, overflow: 'hidden', background: 'rgba(232,101,26,0.06)', border: '1px solid rgba(232,101,26,0.35)' }}>
          <div style={{ background: 'linear-gradient(90deg, rgba(232,101,26,0.85) 0%, rgba(232,101,26,0.4) 100%)', padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: 'white', letterSpacing: '0.2em', margin: 0 }}>ÉQUIPE 1</p>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{all1.length} JOUEURS</p>
          </div>
          <PlayersGrid players={all1} teamColor="#E8651A" />
        </div>

        {/* ── ÉQUIPE 2 ── */}
        <div style={{ position: 'relative', zIndex: 2, margin: '4px 10px', borderRadius: 12, overflow: 'hidden', background: 'rgba(59,158,240,0.06)', border: '1px solid rgba(59,158,240,0.35)' }}>
          <div style={{ background: 'linear-gradient(90deg, rgba(59,158,240,0.85) 0%, rgba(59,158,240,0.4) 100%)', padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: 'white', letterSpacing: '0.2em', margin: 0 }}>ÉQUIPE 2</p>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{all2.length} JOUEURS</p>
          </div>
          <PlayersGrid players={all2} teamColor="#3B9EF0" />
        </div>

        {/* ── COACHS ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 6, margin: '4px 10px 0' }}>
          <CoachSlot cs={headCoach1} teamColor="#E8651A" label="Coach Équipe 1" />
          <CoachSlot cs={headCoach2} teamColor="#3B9EF0" label="Coach Équipe 2" />
        </div>

        {/* ── FOOTER ── */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 8, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', margin: 0 }}>🏀 Votez sur place !</p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{siteUrl.replace('https://', '')}</p>
        </div>
      </div>

      {/* Guide */}
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-2 max-w-[420px]">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">📱 Comment partager</p>
        <ul className="text-white/40 text-xs flex flex-col gap-1">
          <li>1. Sur mobile : appui long sur l&apos;image → Enregistrer</li>
          <li>2. Sur PC : clic droit → Enregistrer l&apos;image sous...</li>
          <li>3. Ou utilisez l&apos;outil capture d&apos;écran de votre appareil</li>
        </ul>
      </div>
    </div>
  );
}

/* ─── Onglet Codes ─────────────────────────────── */
function CodesTab() {
  const [quantity, setQuantity] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<{code:string;status:string}[]>([]);
  const [generated, setGenerated] = useState<string[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [invalidating, setInvalidating] = useState(false);
  const [invalidateMsg, setInvalidateMsg] = useState('');
  const [availableCount, setAvailableCount] = useState({ range1: 0, range2: 0 });

  useEffect(() => { fetchCodes(); }, []);

  async function fetchCodes() {
    const { data } = await supabase.from('voting_codes').select('code,status').order('created_at',{ascending:false}).limit(500);
    if (data) {
      setCodes(data);
      const existingSet = new Set(data.map(c => c.code));
      const r1 = Array.from({length: 200}, (_, i) => String(9501 + i)).filter(c => !existingSet.has(c)).length;
      const r2 = Array.from({length: 20}, (_, i) => String(3911 + i)).filter(c => !existingSet.has(c)).length;
      setAvailableCount({ range1: r1, range2: r2 });
    }
  }

  async function generateCodes() {
    setGenerating(true);
    const range1 = Array.from({length: 200}, (_, i) => String(9501 + i));
    const range2 = Array.from({length: 20},  (_, i) => String(3911 + i));
    const allPossible = [...range1, ...range2];
    const { data: existingData } = await supabase.from('voting_codes').select('code');
    const existingSet = new Set((existingData || []).map(c => c.code));
    const available = allPossible.filter(c => !existingSet.has(c));
    if (available.length === 0) {
      alert('⚠️ Tous les codes des plages 9501-9700 et 3911-3930 ont déjà été générés !');
      setGenerating(false);
      return;
    }
    const toGenerate = available.slice(0, Math.min(quantity, available.length));
    const { error } = await supabase.from('voting_codes').insert(toGenerate.map(code => ({code, status: 'valid'})));
    if (!error) { setGenerated(toGenerate); fetchCodes(); }
    setGenerating(false);
  }

  async function invalidateCode() {
    setInvalidating(true);
    setInvalidateMsg('');
    const { data, error } = await supabase.from('voting_codes').update({ status: 'disabled' }).eq('code', searchCode.trim()).eq('status', 'valid').select();
    setInvalidating(false);
    if (error || !data || data.length === 0) {
      setInvalidateMsg('❌ Code introuvable ou déjà utilisé/invalidé.');
    } else {
      setInvalidateMsg(`✅ Code ${searchCode} invalidé avec succès.`);
      setSearchCode('');
      fetchCodes();
    }
    setTimeout(() => setInvalidateMsg(''), 4000);
  }

  async function quickInvalidate(code: string) {
    if (!confirm(`Invalider le code ${code} ?`)) return;
    await supabase.from('voting_codes').update({ status: 'disabled' }).eq('code', code);
    fetchCodes();
  }

  function exportCSV(data: string[], filename: string) {
    const csv = ['Code', ...data].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }

  const valid    = codes.filter(c => c.status === 'valid').length;
  const used     = codes.filter(c => c.status === 'used').length;
  const disabled = codes.filter(c => c.status === 'disabled').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        {[{label:'Valides',value:valid,color:'#4ade80'},{label:'Utilisés',value:used,color:'#E8651A'},{label:'Invalidés',value:disabled,color:'#f87171'}].map(s => (
          <div key={s.label} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 text-center">
            <div style={{fontFamily:'Bebas Neue,sans-serif',color:s.color}} className="text-3xl">{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0A0A0A] border border-[#E8651A]/30 rounded-xl p-4 flex flex-col gap-2">
        <p className="text-[#E8651A] text-xs font-bold uppercase tracking-wider">📌 Plages de codes</p>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="rounded-lg p-3 flex flex-col gap-1" style={{background:'rgba(232,101,26,0.08)',border:'1px solid rgba(232,101,26,0.2)'}}>
            <span className="text-white font-mono text-sm font-bold">9501 → 9700</span>
            <span className="text-white/40 text-xs">200 codes · {availableCount.range1} disponibles</span>
          </div>
          <div className="rounded-lg p-3 flex flex-col gap-1" style={{background:'rgba(59,158,240,0.08)',border:'1px solid rgba(59,158,240,0.2)'}}>
            <span className="text-white font-mono text-sm font-bold">3911 → 3930</span>
            <span className="text-white/40 text-xs">20 codes · {availableCount.range2} disponibles</span>
          </div>
        </div>
        <p className="text-white/25 text-[10px] mt-1">Total disponible : {availableCount.range1 + availableCount.range2} / 220 codes</p>
      </div>

      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Générer des codes</h3>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-white/40 text-xs">Quantité (max {availableCount.range1 + availableCount.range2} disponibles)</label>
            <input type="number" min={1} max={availableCount.range1 + availableCount.range2} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]" />
          </div>
          <button onClick={generateCodes} disabled={generating || availableCount.range1 + availableCount.range2 === 0}
            className="font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            style={{background:'#E8651A',color:'white'}}>
            {generating ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Génération...</> : '✨ Générer'}
          </button>
        </div>
        {generated.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-green-400 text-sm">✅ {generated.length} codes générés</p>
              <button onClick={() => exportCSV(generated, `codes-${Date.now()}.csv`)} className="text-xs text-[#E8651A] hover:underline">📥 CSV</button>
            </div>
            <div className="max-h-32 overflow-y-auto bg-[#0A0A0A] rounded-lg p-3 font-mono text-xs text-white/60 grid grid-cols-4 gap-1">
              {generated.slice(0,40).map(c => <span key={c}>{c}</span>)}
              {generated.length > 40 && <span className="text-white/30">+{generated.length-40} autres...</span>}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">🚫 Invalider un code</h3>
        <div className="flex gap-2">
          <input type="text" value={searchCode} onChange={e => setSearchCode(e.target.value)}
            placeholder="Ex: 9501 ou 3915"
            className="flex-1 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          <button onClick={invalidateCode} disabled={!searchCode.trim() || invalidating}
            className="font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-40 flex items-center gap-2 text-sm"
            style={{background:'#b91c1c',color:'white'}}>
            {invalidating ? <div className="spinner" style={{width:14,height:14,borderWidth:2}} /> : '🚫 Invalider'}
          </button>
        </div>
        {invalidateMsg && <p className={`text-sm ${invalidateMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{invalidateMsg}</p>}
      </div>

      <button onClick={() => exportCSV(codes.map(c=>c.code), `tous-codes-${Date.now()}.csv`)}
        className="text-sm text-[#E8651A] border border-[#E8651A]/30 hover:border-[#E8651A] px-4 py-2 rounded-lg transition-all self-start">
        📥 Exporter tous les codes (CSV)
      </button>

      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">
        <table className="w-full admin-table">
          <thead><tr><th className="text-left">Code</th><th className="text-left">Statut</th><th className="text-left">Action</th></tr></thead>
          <tbody>
            {codes.slice(0,100).map(c => (
              <tr key={c.code}>
                <td className="font-mono text-white/80 text-sm">{c.code}</td>
                <td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                  style={{background: c.status==='valid'?'rgba(74,222,128,0.2)':c.status==='disabled'?'rgba(248,113,113,0.2)':'rgba(232,101,26,0.2)',
                    color: c.status==='valid'?'#4ade80':c.status==='disabled'?'#f87171':'#E8651A'}}>
                  {c.status==='valid'?'Valide':c.status==='disabled'?'Invalidé':'Utilisé'}
                </span></td>
                <td>{c.status==='valid' && <button onClick={() => quickInvalidate(c.code)} className="text-red-400/40 hover:text-red-400 text-xs transition-colors px-1">🚫</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Onglet Joueurs ──────────────────────────── */
function PlayersTab() {
  type PlayerRow = Player & { team?: number | null };

  const [players,    setPlayers]    = useState<PlayerRow[]>([]);
  const [form,       setForm]       = useState({ first_name:'', last_name:'', number:'', position:'', team: 1 as number });
  const [saving,     setSaving]     = useState(false);
  const [uploadingId,setUploadingId]= useState<string|null>(null);

  const [editId,   setEditId]   = useState<string|null>(null);
  const [editForm, setEditForm] = useState({ first_name:'', last_name:'', number:'', position:'', team: 1 as number });

  const [csvPreview,   setCsvPreview]   = useState<{ first_name:string; last_name:string; number:string; position:string; team:number }[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvMsg,       setCsvMsg]       = useState('');
  const [showCsvPanel, setShowCsvPanel] = useState(false);

  useEffect(() => { fetchPlayers(); }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('team').order('last_name');
    if (data) setPlayers(data);
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('players').insert({
      first_name: form.first_name.trim(),
      last_name:  form.last_name.trim()  || '',
      number:     form.number.trim() ? Number(form.number) : 0,
      position:   form.position.trim()   || '',
      team:       form.team,
      is_active:  true,
    });
    setForm({ first_name:'', last_name:'', number:'', position:'', team: 1 });
    fetchPlayers();
    setSaving(false);
  }

  function openEdit(p: PlayerRow) {
    setEditId(p.id);
    setEditForm({
      first_name: p.first_name,
      last_name:  p.last_name  || '',
      number:     p.number != null && p.number !== 0 ? String(p.number) : '',
      position:   p.position   || '',
      team:       p.team ?? 1,
    });
  }

  async function saveEdit(id: string) {
    await supabase.from('players').update({
      first_name: editForm.first_name.trim(),
      last_name:  editForm.last_name.trim()  || '',
      number:     editForm.number.trim() ? Number(editForm.number) : 0,
      position:   editForm.position.trim()   || '',
      team:       editForm.team,
    }).eq('id', id);
    setEditId(null);
    fetchPlayers();
  }

  function parseCSV(text: string) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase()
      .replace('prénom','first_name').replace('prenom','first_name')
      .replace('nom','last_name').replace('numéro','number').replace('numero','number')
      .replace('poste','position').replace('équipe','team').replace('equipe','team'));
    const idx = (k: string) => headers.indexOf(k);
    return lines.slice(1).map(line => {
      const cols = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
      const get  = (k: string) => idx(k) >= 0 ? (cols[idx(k)] || '') : '';
      return {
        first_name: get('first_name'),
        last_name:  get('last_name'),
        number:     get('number'),
        position:   get('position'),
        team:       get('team') === '2' ? 2 : 1,
      };
    }).filter(r => r.first_name.trim());
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string);
      setCsvPreview(rows);
      setCsvMsg(rows.length > 0
        ? `${rows.length} joueur(s) détecté(s) — vérifiez avant d'importer`
        : '❌ Aucun joueur valide. Vérifiez le format CSV.');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  async function importCSV() {
    if (!csvPreview.length) return;
    setCsvImporting(true);
    const { error } = await supabase.from('players').insert(
      csvPreview.map(r => ({
        first_name: r.first_name,
        last_name:  r.last_name  || '',
        number:     r.number ? Number(r.number) : 0,
        position:   r.position   || '',
        team:       r.team,
        is_active:  true,
      }))
    );
    setCsvImporting(false);
    if (error) {
      setCsvMsg('❌ Erreur : ' + error.message);
    } else {
      setCsvMsg(`✅ ${csvPreview.length} joueur(s) importé(s) !`);
      setCsvPreview([]);
      fetchPlayers();
      setTimeout(() => { setCsvMsg(''); setShowCsvPanel(false); }, 3000);
    }
  }

  async function assignTeam(playerId: string, team: number) {
    await supabase.from('players').update({ team }).eq('id', playerId);
    fetchPlayers();
  }

  async function uploadPhoto(playerId: string, file: File) {
    setUploadingId(playerId);
    try {
      const found = players.find(p => p.id === playerId);
      if (found?.photo_url) {
        const segments = found.photo_url.split('/');
        const oldName = segments[segments.length - 1].split('?')[0];
        await supabase.storage.from('players').remove([oldName]);
      }
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `player-${playerId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('players').upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type });
      if (uploadError) { alert('Erreur upload photo : ' + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from('players').getPublicUrl(path);
      await supabase.from('players').update({ photo_url: urlData.publicUrl }).eq('id', playerId);
      fetchPlayers();
    } catch (err) {
      console.error(err);
      alert("Erreur inattendue lors de l'upload.");
    } finally {
      setUploadingId(null);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('players').update({ is_active: !current }).eq('id', id);
    fetchPlayers();
  }

  async function deletePlayer(id: string) {
    if (!confirm('Supprimer ce joueur ?')) return;
    await supabase.from('players').delete().eq('id', id);
    fetchPlayers();
  }

  const team1     = players.filter(p => p.team === 1);
  const team2     = players.filter(p => p.team === 2);
  const unassigned= players.filter(p => !p.team);

  const inputCls  = "bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-2.5 py-1.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#E8651A] w-full";
  const POSITIONS = ['PG','SG','SF','PF','C'];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-1">Ajouter un joueur</h3>
        <p className="text-white/30 text-xs mb-4">Seuls le prénom et l&apos;équipe sont obligatoires.</p>
        <form onSubmit={addPlayer} className="grid grid-cols-2 gap-3">
          <input placeholder="Prénom *" value={form.first_name} required
            onChange={e => setForm(p => ({...p, first_name: e.target.value}))}
            className="bg-[#0A0A0A] border border-[#E8651A]/40 rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          <input placeholder="Nom (optionnel)" value={form.last_name}
            onChange={e => setForm(p => ({...p, last_name: e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          <input type="number" placeholder="Numéro (optionnel)" value={form.number}
            onChange={e => setForm(p => ({...p, number: e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          <select value={form.position} onChange={e => setForm(p => ({...p, position: e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]">
            <option value="">Poste (optionnel)</option>
            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <div className="col-span-2 flex items-center gap-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Équipe * :</span>
            {[1, 2].map(n => (
              <button key={n} type="button" onClick={() => setForm(p => ({...p, team: n}))}
                className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: form.team === n ? (n === 1 ? '#E8651A' : '#3B9EF0') : '#1A1A1A',
                  color: form.team === n ? 'white' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${form.team === n ? (n === 1 ? '#E8651A' : '#3B9EF0') : '#333'}`,
                }}>
                Équipe {n}
              </button>
            ))}
          </div>
          <button type="submit" disabled={saving}
            className="col-span-2 font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            style={{background:'#E8651A',color:'white'}}>
            {saving ? 'Ajout...' : '+ Ajouter'}
          </button>
        </form>
      </div>

      {/* Import CSV */}
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">
        <button onClick={() => setShowCsvPanel(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">📂</span>
            <div>
              <p className="font-semibold text-white text-sm">Import CSV</p>
              <p className="text-white/35 text-xs">Ajouter plusieurs joueurs depuis un fichier</p>
            </div>
          </div>
          <span className="text-white/30 text-sm">{showCsvPanel ? '▲' : '▼'}</span>
        </button>
        {showCsvPanel && (
          <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#1E1E1E]">
            <div className="bg-[#0A0A0A] rounded-xl p-4 flex flex-col gap-2 mt-4">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Format CSV</p>
              <div className="mt-1 p-3 bg-black/40 rounded-lg font-mono text-[11px] text-white/50 overflow-x-auto">
                <div>first_name,last_name,number,position,team</div>
                <div>Lucas,Martin,7,PG,1</div>
                <div>Tom,,23,,2</div>
              </div>
            </div>
            <label className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-[#E8651A]/60 hover:bg-[#E8651A]/5"
              style={{borderColor:'rgba(255,255,255,0.1)'}}>
              <span className="text-3xl">📄</span>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Choisir un fichier CSV</p>
                <p className="text-white/30 text-xs mt-0.5">.csv · UTF-8</p>
              </div>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVFile} />
            </label>
            {csvMsg && (
              <p className={`text-sm font-medium ${csvMsg.startsWith('✅') ? 'text-green-400' : csvMsg.startsWith('❌') ? 'text-red-400' : 'text-[#E8651A]'}`}>
                {csvMsg}
              </p>
            )}
            {csvPreview.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Aperçu — {csvPreview.length} joueur(s)</p>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5">
                  {csvPreview.map((r, i) => {
                    const tc = r.team === 1 ? '#E8651A' : '#3B9EF0';
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E]">
                        <span className="text-white/25 text-xs w-4 text-center flex-shrink-0">{i+1}</span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{background:`${tc}20`,border:`1px solid ${tc}40`}}>
                          <span style={{fontFamily:'Bebas Neue,sans-serif',color:tc,fontSize:11}}>
                            {r.first_name[0]}{r.last_name?.[0] || ''}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-xs font-semibold">{r.first_name} {r.last_name}</span>
                          <span className="text-white/30 text-xs ml-2">{r.number ? `#${r.number}` : '—'} · {r.position || '—'}</span>
                        </div>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{background:`${tc}20`,color:tc,border:`1px solid ${tc}40`}}>E{r.team}</span>
                        <button onClick={() => setCsvPreview(prev => prev.filter((_,j)=>j!==i))}
                          className="text-red-400/30 hover:text-red-400 text-xs transition-colors flex-shrink-0">✕</button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={importCSV} disabled={csvImporting}
                  className="font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{background:'#E8651A',color:'white'}}>
                  {csvImporting
                    ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Import...</>
                    : `⬆️ Importer ${csvPreview.length} joueur${csvPreview.length>1?'s':''}`}
                </button>
                <button onClick={() => setCsvPreview([])}
                  className="text-white/25 hover:text-white/50 text-xs transition-colors text-center">Annuler</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{n:1,color:'#E8651A',list:team1},{n:2,color:'#3B9EF0',list:team2}].map(({n,color,list}) => (
          <div key={n} className="rounded-xl p-3 flex flex-col gap-1" style={{background:`${color}0c`,border:`1px solid ${color}28`}}>
            <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:13,letterSpacing:'0.1em'}}>ÉQUIPE {n}</span>
            <span style={{fontFamily:'Bebas Neue,sans-serif',color}} className="text-2xl">{list.length}</span>
            <span className="text-white/30 text-xs">joueur{list.length!==1?'s':''}</span>
          </div>
        ))}
      </div>

      {[
        {label:'ÉQUIPE 1', color:'#E8651A', list: team1},
        {label:'ÉQUIPE 2', color:'#3B9EF0', list: team2},
        {label:'NON ASSIGNÉS', color:'#666', list: unassigned},
      ].map(({label, color, list}) => list.length > 0 && (
        <div key={label}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1" style={{background:`${color}30`}} />
            <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:11,letterSpacing:'0.15em'}}>{label}</span>
            <div className="h-px flex-1" style={{background:`${color}30`}} />
          </div>
          <div className="flex flex-col gap-3">
            {list.map(p => (
              <div key={p.id} className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">
                {editId !== p.id && (
                  <div className="p-4 flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center">
                        {p.photo_url
                          ? <img src={p.photo_url} alt={p.last_name} className="w-full h-full object-cover" />
                          : <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A]/50">{p.first_name[0]}</span>
                        }
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110" style={{background:'#E8651A'}}>
                        {uploadingId === p.id
                          ? <div className="spinner" style={{width:12,height:12,borderWidth:2,borderColor:'white',borderTopColor:'transparent'}} />
                          : <span className="text-white text-xs">📷</span>}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && uploadPhoto(p.id, e.target.files[0])} />
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {p.number && p.number !== 0 ? <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A]">#{p.number}</span> : null}
                        <span className="font-semibold text-white truncate">{p.first_name} {p.last_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.position && <span className="text-white/40 text-xs">{p.position}</span>}
                        {p.position && <span className="text-white/20 text-xs">·</span>}
                        <TeamBadge team={p.team} onChange={(t) => assignTeam(p.id, t)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[#E8651A]/20 text-white/40 hover:text-[#E8651A]">
                        ✏️
                      </button>
                      <button onClick={() => toggleActive(p.id, p.is_active)}
                        className="w-10 h-5 rounded-full transition-all relative"
                        style={{background: p.is_active ? '#4ade80' : '#1E1E1E'}}>
                        <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                          style={{left: p.is_active ? '22px' : '2px'}} />
                      </button>
                      <button onClick={() => deletePlayer(p.id)} className="text-red-400/40 hover:text-red-400 transition-colors">🗑</button>
                    </div>
                  </div>
                )}
                {editId === p.id && (
                  <div className="p-4 flex flex-col gap-3" style={{background:'rgba(232,101,26,0.04)',borderTop:'2px solid rgba(232,101,26,0.4)'}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#E8651A] text-xs font-black uppercase tracking-widest">✏️ Modifier le joueur</span>
                      <button onClick={() => setEditId(null)} className="text-white/30 hover:text-white text-xs transition-colors">✕ Annuler</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Prénom *" value={editForm.first_name} required
                        onChange={e => setEditForm(f => ({...f, first_name: e.target.value}))}
                        className={inputCls.replace('border-[#1E1E1E]','border-[#E8651A]/40')} />
                      <input placeholder="Nom (optionnel)" value={editForm.last_name}
                        onChange={e => setEditForm(f => ({...f, last_name: e.target.value}))}
                        className={inputCls} />
                      <input type="number" placeholder="Numéro (optionnel)" value={editForm.number}
                        onChange={e => setEditForm(f => ({...f, number: e.target.value}))}
                        className={inputCls} />
                      <select value={editForm.position}
                        onChange={e => setEditForm(f => ({...f, position: e.target.value}))}
                        className={inputCls}>
                        <option value="">Poste (optionnel)</option>
                        {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs uppercase tracking-wider">Équipe :</span>
                      {[1,2].map(n => (
                        <button key={n} type="button" onClick={() => setEditForm(f => ({...f, team: n}))}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: editForm.team===n ? (n===1?'#E8651A':'#3B9EF0') : '#1A1A1A',
                            color: editForm.team===n ? 'white' : 'rgba(255,255,255,0.4)',
                            border: `1px solid ${editForm.team===n ? (n===1?'#E8651A':'#3B9EF0') : '#333'}`,
                          }}>E{n}</button>
                      ))}
                    </div>
                    <button onClick={() => saveEdit(p.id)}
                      disabled={!editForm.first_name.trim()}
                      className="font-semibold py-2 rounded-lg transition-all disabled:opacity-40 text-sm"
                      style={{background:'#E8651A',color:'white'}}>
                      💾 Sauvegarder
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Onglet Coachs ───────────────────────────── */
function CoachesTab() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [form, setForm] = useState({ first_name:'', last_name:'', team: 1 as number });
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string|null>(null);

  useEffect(() => { fetchCoaches(); }, []);

  async function fetchCoaches() {
    const { data } = await supabase.from('coaches').select('*').order('team').order('last_name');
    if (data) setCoaches(data);
  }

  async function addCoach(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('coaches').insert({ ...form, is_active: true });
    setForm({ first_name:'', last_name:'', team: 1 });
    fetchCoaches();
    setSaving(false);
  }

  async function assignTeam(coachId: string, team: number) {
    await supabase.from('coaches').update({ team }).eq('id', coachId);
    fetchCoaches();
  }

  async function uploadPhoto(coachId: string, file: File) {
    setUploadingId(coachId);
    try {
      const found = coaches.find(c => c.id === coachId);
      if (found?.photo_url) {
        const segments = found.photo_url.split('/');
        const oldName = segments[segments.length - 1].split('?')[0];
        await supabase.storage.from('players').remove([oldName]);
      }
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `coach-${coachId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('players').upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type });
      if (uploadError) { alert('Erreur upload photo : ' + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from('players').getPublicUrl(path);
      await supabase.from('coaches').update({ photo_url: urlData.publicUrl }).eq('id', coachId);
      fetchCoaches();
    } catch (err) {
      console.error(err);
      alert('Erreur inattendue lors de l\'upload.');
    } finally {
      setUploadingId(null);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('coaches').update({ is_active: !current }).eq('id', id);
    fetchCoaches();
  }

  async function deleteCoach(id: string) {
    if (!confirm('Supprimer ce coach ?')) return;
    await supabase.from('coaches').delete().eq('id', id);
    fetchCoaches();
  }

  const team1 = coaches.filter(c => c.team === 1);
  const team2 = coaches.filter(c => c.team === 2);
  const unassigned = coaches.filter(c => !c.team);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Ajouter un coach</h3>
        <form onSubmit={addCoach} className="grid grid-cols-2 gap-3">
          <input placeholder="Prénom" value={form.first_name} onChange={e => setForm(prev => ({...prev, first_name: e.target.value}))} required
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          <input placeholder="Nom" value={form.last_name} onChange={e => setForm(prev => ({...prev, last_name: e.target.value}))} required
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          <div className="col-span-2 flex items-center gap-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Équipe :</span>
            {[1, 2].map(n => (
              <button key={n} type="button" onClick={() => setForm(prev => ({...prev, team: n}))}
                className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: form.team === n ? (n === 1 ? '#E8651A' : '#3B9EF0') : '#1A1A1A',
                  color: form.team === n ? 'white' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${form.team === n ? (n === 1 ? '#E8651A' : '#3B9EF0') : '#333'}`,
                }}>
                Équipe {n}
              </button>
            ))}
          </div>
          <button type="submit" disabled={saving}
            className="col-span-2 font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            style={{background:'#E8651A',color:'white'}}>
            {saving ? 'Ajout...' : '+ Ajouter le coach'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{n:1,color:'#E8651A',list:team1},{n:2,color:'#3B9EF0',list:team2}].map(({n,color,list}) => (
          <div key={n} className="rounded-xl p-3 flex flex-col gap-1" style={{background:`${color}0c`,border:`1px solid ${color}28`}}>
            <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:13,letterSpacing:'0.1em'}}>ÉQUIPE {n}</span>
            <span style={{fontFamily:'Bebas Neue,sans-serif',color}} className="text-2xl">{list.length}</span>
            <span className="text-white/30 text-xs">coach{list.length!==1?'s':''}</span>
          </div>
        ))}
      </div>

      {[
        {label:'ÉQUIPE 1', color:'#E8651A', list: team1},
        {label:'ÉQUIPE 2', color:'#3B9EF0', list: team2},
        {label:'NON ASSIGNÉS', color:'#666', list: unassigned},
      ].map(({label, color, list}) => list.length > 0 && (
        <div key={label}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1" style={{background:`${color}30`}} />
            <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:11,letterSpacing:'0.15em'}}>{label}</span>
            <div className="h-px flex-1" style={{background:`${color}30`}} />
          </div>
          <div className="flex flex-col gap-3">
            {list.map(c => (
              <div key={c.id} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center">
                    {c.photo_url
                      ? <img src={c.photo_url} alt={c.last_name} className="w-full h-full object-cover" />
                      : <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A]/50">{c.first_name[0]}</span>
                    }
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110" style={{background:'#E8651A'}}>
                    {uploadingId === c.id
                      ? <div className="spinner" style={{width:12,height:12,borderWidth:2,borderColor:'white',borderTopColor:'transparent'}} />
                      : <span className="text-white text-xs">📷</span>
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(c.id, e.target.files[0])} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white truncate block">{c.first_name} {c.last_name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/30 text-xs">Coach ·</span>
                    <TeamBadge team={c.team} onChange={(t) => assignTeam(c.id, t)} />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => toggleActive(c.id, c.is_active)}
                    className="w-10 h-5 rounded-full transition-all relative"
                    style={{background: c.is_active ? '#4ade80' : '#1E1E1E'}}>
                    <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                      style={{left: c.is_active ? '22px' : '2px'}} />
                  </button>
                  <button onClick={() => deleteCoach(c.id)} className="text-red-400/40 hover:text-red-400 transition-colors">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Onglet Paramètres ───────────────────────── */
function SettingsTab() {
  const [settings, setSettings] = useState({is_open:false, event_name:'', event_date:''});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');

  useEffect(() => {
    setSiteUrl(window.location.origin);
    supabase.from('vote_settings').select('*').single().then(({data}) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  const resultatsUrl = `${siteUrl}/resultats`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(resultatsUrl)}&bgcolor=141414&color=E8651A&qzone=2`;

  async function save() {
    setSaving(true);
    await supabase.from('vote_settings').update(settings).eq('id',1);
    setSaving(false);
    alert('Paramètres sauvegardés !');
  }

  async function resetVotes() {
    if (!confirm('⚠️ Supprimer TOUS les votes ?\n\nCette action est IRRÉVERSIBLE.')) return;
    if (!confirm('Êtes-vous VRAIMENT sûr ?')) return;
    await supabase.from('votes').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('voting_codes').update({status:'valid',used_at:null}).neq('id','00000000-0000-0000-0000-000000000000');
    alert('Votes réinitialisés.');
  }

  async function resetEverything() {
    if (!confirm('💀 RÉINITIALISATION TOTALE\n\nCeci va supprimer :\n- Tous les votes\n- Tous les codes\n- Tous les joueurs\n- Tous les coachs\n\nCette action est IRRÉVERSIBLE !')) return;
    if (!confirm('⚠️ DERNIÈRE CHANCE — Êtes-vous ABSOLUMENT sûr ?')) return;
    await supabase.from('votes').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('voting_codes').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('coaches').delete().neq('id','00000000-0000-0000-0000-000000000000');
    alert('✅ Réinitialisation totale effectuée.');
  }

  if (loading) return <div className="spinner" style={{width:24,height:24,borderWidth:2}} />;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="bg-[#141414] border border-[#E8651A]/30 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">📱 QR Code Résultats</h3>
        <p className="text-white/40 text-xs">Affichez ce QR code sur l&apos;écran TV pour que les spectateurs voient les résultats en direct.</p>
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E]">
            <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
          </div>
          <div className="w-full bg-[#0A0A0A] rounded-lg px-3 py-2 border border-[#1E1E1E] flex items-center justify-between gap-2">
            <span className="text-white/50 text-xs font-mono truncate">{resultatsUrl}</span>
            <button onClick={() => {navigator.clipboard.writeText(resultatsUrl); alert('Lien copié !');}} className="text-[#E8651A] text-xs hover:underline flex-shrink-0">📋 Copier</button>
          </div>
          <a href={resultatsUrl} target="_blank" rel="noopener noreferrer"
            className="w-full text-center py-2.5 rounded-lg text-sm font-semibold border border-[#E8651A]/40 text-[#E8651A] hover:bg-[#E8651A]/10 transition-all">
            🔗 Ouvrir la page résultats
          </a>
        </div>
      </div>
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Paramètres</h3>
        <div className="flex flex-col gap-2">
          <label className="text-white/50 text-xs uppercase tracking-wider">Nom de l&apos;événement</label>
          <input value={settings.event_name} onChange={e => setSettings(s=>({...s,event_name:e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-white/50 text-xs uppercase tracking-wider">Date de l&apos;événement</label>
          <input type="datetime-local" value={settings.event_date?.slice(0,16)} onChange={e => setSettings(s=>({...s,event_date:e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]" />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E]">
          <div>
            <p className="font-semibold text-white text-sm">Vote ouvert</p>
            <p className="text-white/40 text-xs">Activer pour permettre les votes</p>
          </div>
          <button onClick={() => setSettings(s=>({...s,is_open:!s.is_open}))}
            className="w-12 h-6 rounded-full transition-all relative"
            style={{background: settings.is_open ? '#4ade80' : '#1E1E1E'}}>
            <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all" style={{left: settings.is_open ? '26px' : '4px'}} />
          </button>
        </div>
        <button onClick={save} disabled={saving}
          className="font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
          style={{background:'#E8651A',color:'white'}}>
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>
      <div className="rounded-xl p-5 flex flex-col gap-4" style={{background:'rgba(153,27,27,0.2)',border:'1px solid rgba(153,27,27,0.5)'}}>
        <h3 className="font-semibold text-red-400 text-sm uppercase tracking-wider">⚠️ Zone dangereuse</h3>
        <div className="flex flex-col gap-2">
          <p className="text-white/40 text-xs">Réinitialise uniquement les votes (garde joueurs et codes).</p>
          <button onClick={resetVotes} className="font-semibold py-2 rounded-lg transition-all text-sm text-white" style={{background:'#b91c1c'}}>
            🗑 Réinitialiser les votes
          </button>
        </div>
        <div className="h-px bg-red-900/40" />
        <div className="flex flex-col gap-2">
          <p className="text-white/40 text-xs">💀 Supprime absolument tout — votes, codes, joueurs et coachs.</p>
          <button onClick={resetEverything} className="font-semibold py-2 rounded-lg transition-all text-sm text-white border border-red-400/50" style={{background:'rgba(153,27,27,0.5)'}}>
            💀 RÉINITIALISATION TOTALE
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page Admin ──────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('results');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const bypass = sessionStorage.getItem('admin_bypass');
    if (bypass === 'true') { setChecking(false); return; }
    supabase.auth.getSession().then(({data}) => {
      if (!data.session) router.replace('/admin/login');
      else setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const bypassActive = sessionStorage.getItem('admin_bypass');
      if (bypassActive === 'true') return;
      if (!session) router.replace('/admin/login');
      else setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function logout() {
    sessionStorage.removeItem('admin_bypass');
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
    </div>
  );

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CSL" className="w-10 h-10 object-contain" />
            <div>
              <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-4xl text-white leading-none">ADMIN</h1>
              <p className="text-white/40 text-xs">All-Star Game · CSL Basket</p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-white/40 hover:text-[#E8651A] transition-colors">Déconnexion →</button>
        </div>
        <div className="mb-6"><AdminNav active={tab} onChange={setTab} /></div>
        {tab === 'results'  && <ResultsTab />}
        {tab === 'equipes'  && <EquipesTab />}
        {tab === 'codes'    && <CodesTab />}
        {tab === 'players'  && <PlayersTab />}
        {tab === 'coaches'  && <CoachesTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </main>
  );
}
