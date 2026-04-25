'use client';

import { useState, useEffect } from 'react';
import { supabase, Player } from '@/lib/supabase';

// ─── TYPES ─────────────────────────────────────────────────
interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  team: number;
}

interface Vote {
  player_1_id: string | null;
  player_2_id: string | null;
  player_3_id: string | null;
  player_4_id: string | null;
  player_5_id: string | null;
  player_6_id: string | null;
  player_7_id: string | null;
  player_8_id: string | null;
  player_9_id: string | null;
  player_10_id: string | null;
  head_coach_id: string | null;
  assistant_coach_id: string | null;
  head_coach_2_id: string | null;
  assistant_coach_2_id: string | null;
}

interface ItemResult {
  data: Player | Coach;
  count: number;
}

// ─── COMPOSANT RÉSULTAT INDIVIDUEL ─────────────────────────
function ResultCard({ item, count, totalVotes, color }: { item: Player | Coach, count: number, totalVotes: number, color: string }) {
  const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-[#141414] border border-[#1E1E1E] rounded-xl">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 border-2" style={{borderColor: count > 0 ? color : '#1E1E1E'}}>
        {item.photo_url ? (
          <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/20">
            {item.first_name[0]}{item.last_name[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-end mb-1">
          <p className="text-sm font-bold text-white truncate uppercase">
            {item.first_name[0]}. {item.last_name}
          </p>
          <p className="text-xs font-black" style={{color}}>
            {count} <span className="text-white/30 text-[10px]">VOTES</span>
          </p>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────
export default function ResultatsPage() {
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [results, setResults] = useState<{
    t1Players: ItemResult[],
    t2Players: ItemResult[],
    t1Coaches: ItemResult[],
    t2Coaches: ItemResult[]
  }>({ t1Players: [], t2Players: [], t1Coaches: [], t2Coaches: [] });

  useEffect(() => {
    async function fetchData() {
      try {
        const [pRes, cRes, vRes] = await Promise.all([
          supabase.from('players').select('*'),
          supabase.from('coaches').select('*'),
          supabase.from('votes').select('*')
        ]);

        const players = (pRes.data as Player[]) || [];
        const coaches = (cRes.data as Coach[]) || [];
        const votes = (vRes.data as Vote[]) || [];

        setTotalVotes(votes.length);

        // Compteurs
        const counts: Record<string, number> = {};
        
        votes.forEach(v => {
          // Liste de toutes les colonnes d'ID dans ton vote
          const ids = [
            v.player_1_id, v.player_2_id, v.player_3_id, v.player_4_id, v.player_5_id,
            v.player_6_id, v.player_7_id, v.player_8_id, v.player_9_id, v.player_10_id,
            v.head_coach_id, v.assistant_coach_id, v.head_coach_2_id, v.assistant_coach_2_id
          ];
          
          ids.forEach(id => {
            if (id) counts[id] = (counts[id] || 0) + 1;
          });
        });

        // Formater et trier les résultats
        const format = (items: any[]) => items
          .map(item => ({ data: item, count: counts[item.id] || 0 }))
          .sort((a, b) => b.count - a.count);

        setResults({
          t1Players: format(players.filter(p => p.team === 1)),
          t2Players: format(players.filter(p => p.team === 2)),
          t1Coaches: format(coaches.filter(c => c.team === 1)),
          t2Coaches: format(coaches.filter(c => c.team === 2))
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#E8651A]" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 style={{fontFamily:'Bebas Neue, sans-serif'}} className="text-5xl md:text-7xl tracking-tighter">
            RÉSULTATS DES <span className="text-[#E8651A]">VOTES</span>
          </h1>
          <div className="inline-block px-4 py-1 bg-[#1E1E1E] rounded-full text-sm text-white/60 mt-4 border border-white/5">
            {totalVotes} VOTANTS AU TOTAL
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* ÉQUIPE 1 */}
          <section className="space-y-8">
            <div className="border-l-4 border-[#E8651A] pl-4">
              <h2 style={{fontFamily:'Bebas Neue, sans-serif'}} className="text-4xl text-[#E8651A]">ÉQUIPE 1</h2>
              <p className="text-white/40 text-sm">CLASSEMENT DES JOUEURS ET COACHS</p>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">5 Majeur potentiel</p>
              {results.t1Players.map(r => (
                <ResultCard key={r.data.id} item={r.data} count={r.count} totalVotes={totalVotes} color="#E8651A" />
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5">
              <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Staff Technique</p>
              {results.t1Coaches.map(r => (
                <ResultCard key={r.data.id} item={r.data} count={r.count} totalVotes={totalVotes} color="#E8651A" />
              ))}
            </div>
          </section>

          {/* ÉQUIPE 2 */}
          <section className="space-y-8">
            <div className="border-l-4 border-[#3B9EF0] pl-4 text-right lg:text-left">
              <h2 style={{fontFamily:'Bebas Neue, sans-serif'}} className="text-4xl text-[#3B9EF0]">ÉQUIPE 2</h2>
              <p className="text-white/40 text-sm">CLASSEMENT DES JOUEURS ET COACHS</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase lg:text-left text-right">5 Majeur potentiel</p>
              {results.t2Players.map(r => (
                <ResultCard key={r.data.id} item={r.data} count={r.count} totalVotes={totalVotes} color="#3B9EF0" />
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5">
              <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase lg:text-left text-right">Staff Technique</p>
              {results.t2Coaches.map(r => (
                <ResultCard key={r.data.id} item={r.data} count={r.count} totalVotes={totalVotes} color="#3B9EF0" />
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
