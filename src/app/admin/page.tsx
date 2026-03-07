'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';

interface PlayerScore {
  player: Player;
  votes: number;
  bonuses: number;
}

function AdminNav({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = [
    { id: 'results', label: '📊 Résultats' },
    { id: 'codes', label: '🎫 Codes' },
    { id: 'players', label: '🏀 Joueurs' },
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

function ResultsTab() {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [stats, setStats] = useState({ totalVotes: 0, totalCodes: 0, usedCodes: 0 });
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const { data: players } = await supabase.from('players').select('*').eq('is_active', true);
    if (!players) return;
    const { data: votes } = await supabase.from('votes').select('player_1_id,player_2_id,player_3_id,player_4_id,player_5_id,bonus_player_id');
    const { count: totalCodes } = await supabase.from('voting_codes').select('*', { count: 'exact', head: true });
    const { count: usedCodes } = await supabase.from('voting_codes').select('*', { count: 'exact', head: true }).eq('status', 'used');
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

    setScores(scored);
    setStats({ totalVotes: votes.length, totalCodes: totalCodes || 0, usedCodes: usedCodes || 0 });
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
      <div className="flex flex-col gap-3">
        {scores.map((s, i) => (
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
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white text-sm">{s.player.first_name} {s.player.last_name}</span>
                <div className="flex items-center gap-3 ml-2">
                  {s.bonuses > 0 && <span className="text-xs text-[#FFD700]">⭐ ×{s.bonuses}</span>}
                  <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#E8651A]">{s.votes}</span>
                </div>
              </div>
              <div c
