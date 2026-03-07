'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';

const MAX_PLAYERS = 5;

// ─── Pop-up règles ────────────────────────────────────────────
function RulesModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#141414] border border-[#E8651A]/50 rounded-2xl overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className="bg-[#E8651A] px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="CSL" className="w-10 h-10 object-contain" />
          <div>
            <h2 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-2xl text-white leading-none">RÈGLES DU VOTE</h2>
            <p className="text-white/80 text-xs">CSL Basket St Vallier — All-Star Game</p>
          </div>
        </div>

        {/* Rules */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { icon: '1️⃣', title: '5 joueurs titulaires', desc: 'Sélectionnez exactement 5 joueurs que vous voulez voir au All-Star Game.' },
            { icon: '⭐', title: 'Le Superstar Bonus', desc: 'Parmi vos 5 joueurs, attribuez le bonus à celui qui mérite le plus d\'être mis en avant.' },
            { icon: '🔒', title: 'Vote unique', desc: 'Votre code ne peut être utilisé qu\'une seule fois. Le vote est définitif.' },
            { icon: '🏆', title: 'Résultats', desc: 'Les 5 joueurs les plus votés seront sélectionnés pour le All-Star Game !' },
          ].map(r => (
            <div key={r.title} className="flex gap-3 items-start">
              <span className="text-2xl flex-shrink-0">{r.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{r.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onAccept}
            className="btn-shimmer w-full py-4 rounded-xl text-white transition-all hover:scale-[1.02]"
            style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.5rem', letterSpacing:'0.05em', background:'#E8651A', boxShadow:'0 0 20px rgba(232,101,26,0.4)'}}>
            J&apos;AI COMPRIS — VOTER !
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Player Card ──────────────────────────────────────────────
function PlayerCard({ player, selected, isBonus, canSelect, onClick }: {
  player: Player; selected: boolean; isBonus: boolean; canSelect: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!canSelect && !selected}
      className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300"
      style={{
        borderColor: isBonus ? '#FFD700' : selected ? '#E8651A' : '#1E1E1E',
        background: isBonus ? 'rgba(255,215,0,0.05)' : selected ? 'rgba(232,101,26,0.1)' : '#141414',
        boxShadow: isBonus ? '0 0 0 2px #FFD700, 0 0 30px rgba(255,215,0,0.3)' : selected ? '0 0 0 2px #E8651A, 0 0 20px rgba(232,101,26,0.3)' : 'none',
        opacity: (!canSelect && !selected) ? 0.4 : 1,
        cursor: (!canSelect && !selected) ? 'not-allowed' : 'pointer',
      }}
    >
      {isBonus && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10 whitespace-nowrap" style={{background:'#FFD700'}}>
          ⭐ BONUS
        </div>
      )}
      {selected && !isBonus && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{background:'#E8651A'}}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center z-10">
        <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-sm text-[#E8651A] leading-none">{player.number}</span>
      </div>
      <div className="relative mt-3 w-20 h-20 sm:w-24 sm:h-24 clip-hex overflow-hidden bg-[#1E1E1E] flex items-center justify-center">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" />
        ) : (
          <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-[#E8651A]/50">{player.first_name[0]}{player.last_name[0]}</span>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: isBonus ? '#FFD700' : selected ? '#E8651A' : 'white'}} className="text-base sm:text-lg leading-tight">
          {player.first_name.toUpperCase()}
        </span>
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: isBonus ? '#FFD700' : selected ? '#E8651A' : 'white'}} className="text-base sm:text-lg leading-tight">
          {player.last_name.toUpperCase()}
        </span>
        <span className="text-xs text-white/40 mt-0.5">{player.position}</span>
      </div>
    </button>
  );
}

// ─── Confirmation modal ───────────────────────────────────────
function ConfirmModal({ players, bonusPlayer, onConfirm, onCancel, loading }: {
  players: Player[]; bonusPlayer: Player; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 flex flex-col gap-6 animate-bounce-in">
        <div className="text-center">
          <h2 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-white">Confirmer votre vote</h2>
          <p className="text-white/50 text-sm mt-1">Ce vote est définitif et ne pourra pas être modifié.</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Vos 5 titulaires</p>
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
              style={{borderColor: p.id === bonusPlayer.id ? '#FFD700' : '#1E1E1E', background: p.id === bonusPlayer.id ? 'rgba(255,215,0,0.05)' : '#0A0A0A'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A] w-5 text-center">{i + 1}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0">
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.last_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xs text-[#E8651A]">{p.first_name[0]}</span></div>
                }
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white text-sm">{p.first_name} {p.last_name}</span>
                <span className="text-white/40 text-xs ml-2">#{p.number}</span>
              </div>
              {p.id === bonusPlayer.id && (
                <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full uppercase" style={{background:'#FFD700'}}>⭐ Bonus</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[#1E1E1E] text-white/60 hover:text-white font-semibold transition-all">
            Modifier
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="btn-shimmer flex-1 py-3 rounded-xl text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.25rem', background:'#E8651A'}}>
            {loading ? <><div className="spinner" /> Envoi...</> : 'VALIDER'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Vote Page ───────────────────────────────────────────
export default function VotePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bonusId, setBonusId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'bonus'>('select');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    const codeId = sessionStorage.getItem('vote_code_id');
    if (!codeId) { router.replace('/'); return; }
    supabase.from('players').select('*').eq('is_active', true).order('last_name')
      .then(({ data }) => { if (data) setPlayers(data); setLoadingPlayers(false); });
  }, [router]);

  function togglePlayer(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= MAX_PLAYERS) return prev;
      return [...prev, id];
    });
  }

  async function submitVote() {
    setSubmitting(true);
    const codeId = sessionStorage.getItem('vote_code_id');
    const { error } = await supabase.rpc('submit_vote', {
      p_code_id: codeId,
      p_player_1: selectedIds[0],
      p_player_2: selectedIds[1],
      p_player_3: selectedIds[2],
      p_player_4: selectedIds[3],
      p_player_5: selectedIds[4],
      p_bonus_player: bonusId,
    });
    setSubmitting(false);
    if (error) { alert('Une erreur est survenue. Veuillez réessayer.'); return; }
    sessionStorage.removeItem('vote_code_id');
    sessionStorage.removeItem('vote_code');
    const selectedPlayers = players.filter(p => selectedIds.includes(p.id));
    const bonus = players.find(p => p.id === bonusId)!;
    sessionStorage.setItem('vote_result', JSON.stringify({ players: selectedPlayers, bonus }));
    router.push('/merci');
  }

  const selectedPlayers = players.filter(p => selectedIds.includes(p.id));
  const bonusPlayer = players.find(p => p.id === bonusId);

  if (loadingPlayers) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" style={{width:40,height:40,borderWidth:3}} />
        <p className="text-white/50">Chargement des joueurs...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pb-32">

      {/* Pop-up règles */}
      {showRules && <RulesModal onAccept={() => setShowRules(false)} />}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1E1E1E]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="CSL" className="w-8 h-8 object-contain" />
              <div>
                <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-2xl sm:text-3xl text-white leading-none">
                  {step === 'select' ? 'CHOISISSEZ VOS 5 JOUEURS' : 'ATTRIBUEZ LE BONUS'}
                </h1>
                <p className="text-white/40 text-xs mt-0.5">
                  {step === 'select' ? 'Sélectionnez exactement 5 joueurs' : 'Lequel de vos 5 reçoit le bonus ?'}
                </p>
              </div>
            </div>
            {step === 'select' && (
              <div className="flex flex-col items-end gap-0.5">
                <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-4xl text-[#E8651A] leading-none">
                  {selectedIds.length}<span className="text-white/30 text-2xl">/{MAX_PLAYERS}</span>
                </span>
              </div>
            )}
            {step === 'bonus' && (
              <button onClick={() => { setStep('select'); setBonusId(null); }} className="text-sm text-white/50 hover:text-[#E8651A] transition-colors">
                ← Modifier
              </button>
            )}
          </div>
          {step === 'select' && (
            <div className="flex gap-1.5">
              {Array.from({length: MAX_PLAYERS}).map((_, i) => (
                <div key={i} className="h-2 flex-1 rounded-full transition-all duration-500"
                  style={{background: i < selectedIds.length ? '#E8651A' : '#1E1E1E',
                  boxShadow: i < selectedIds.length ? '0 0 8px rgba(232,101,26,0.6)' : 'none'}} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 1 — Sélection */}
      {step === 'select' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {players.map(player => (
              <PlayerCard key={player.id} player={player}
                selected={selectedIds.includes(player.id)} isBonus={false}
                canSelect={selectedIds.length < MAX_PLAYERS || selectedIds.includes(player.id)}
                onClick={() => togglePlayer(player.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Bonus */}
      {step === 'bonus' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start" style={{borderColor:'rgba(255,215,0,0.3)',background:'rgba(255,215,0,0.03)'}}>
            <span className="text-3xl">⭐</span>
            <div>
              <h3 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#FFD700]">Superstar Bonus</h3>
              <p className="text-white/60 text-sm mt-1">Parmi vos 5 joueurs, lequel mérite le bonus ? Il recevra des points supplémentaires.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {selectedPlayers.map(player => (
              <PlayerCard key={player.id} player={player} selected={true}
                isBonus={bonusId === player.id} canSelect={true}
                onClick={() => setBonusId(prev => prev === player.id ? null : player.id)} />
            ))}
          </div>
          {bonusId && (
            <div className="mt-6 p-4 rounded-xl border text-center animate-fade-in" style={{borderColor:'rgba(255,215,0,0.3)',background:'rgba(255,215,0,0.05)'}}>
              <p className="text-[#FFD700] text-sm">⭐ <strong>{bonusPlayer?.first_name} {bonusPlayer?.last_name}</strong> recevra le Superstar Bonus</p>
            </div>
          )}
        </div>
      )}

      {/* Bouton bas */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
        <div className="max-w-lg mx-auto">
          {step === 'select' ? (
            <button onClick={() => { setBonusId(null); setStep('bonus'); window.scrollTo({top:0,behavior:'smooth'}); }}
              disabled={selectedIds.length < MAX_PLAYERS}
              className="btn-shimmer w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.5rem', letterSpacing:'0.05em',
                background: selectedIds.length === MAX_PLAYERS ? '#E8651A' : '#1E1E1E',
                color: selectedIds.length === MAX_PLAYERS ? 'white' : 'rgba(255,255,255,0.3)',
                boxShadow: selectedIds.length === MAX_PLAYERS ? '0 0 0 2px #E8651A, 0 0 30px rgba(232,101,26,0.5)' : 'none',
                cursor: selectedIds.length < MAX_PLAYERS ? 'not-allowed' : 'pointer'}}>
              {selectedIds.length === MAX_PLAYERS ? <>CHOISIR LE BONUS →</> : `Sélectionnez encore ${MAX_PLAYERS - selectedIds.length} joueur${MAX_PLAYERS - selectedIds.length > 1 ? 's' : ''}`}
            </button>
          ) : (
            <button onClick={() => setShowConfirm(true)} disabled={!bonusId}
              className="btn-shimmer w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.5rem', letterSpacing:'0.05em',
                background: bonusId ? '#E8651A' : '#1E1E1E',
                color: bonusId ? 'white' : 'rgba(255,255,255,0.3)',
                boxShadow: bonusId ? '0 0 0 2px #E8651A, 0 0 30px rgba(232,101,26,0.5)' : 'none',
                cursor: !bonusId ? 'not-allowed' : 'pointer'}}>
              {bonusId ? <>⭐ VALIDER MON VOTE</> : 'Attribuez le bonus pour continuer'}
            </button>
          )}
        </div>
      </div>

      {showConfirm && bonusPlayer && (
        <ConfirmModal players={selectedPlayers} bonusPlayer={bonusPlayer}
          onConfirm={submitVote} onCancel={() => setShowConfirm(false)} loading={submitting} />
      )}
    </main>
  );
}
