'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';

const MAX_PLAYERS = 5;

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
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border transition-all"
              style={{borderColor: p.id === bonusPlayer.id ? '#FFD700' : '#1E1E1E', background: p.id === bonusPlayer.id ? 'rgba(255,215,0,0.05)' : '#0A0A0A'}}>
              <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A] w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <span className="font-semibold text-white text-sm">{p.first_name} {p.last_name}</span>
                <span className="text-white/40 text-xs ml-2">#{p.number}</span>
              </div>
              {p.id === bonusPlayer.id && (
                <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{background:'#FFD700'}}>⭐ Bonus</span>
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
            style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.25rem', letterSpacing:'0.05em', background:'#E8651A'}}>
            {loading ? <><div className="spinner" /> Envoi...</> : 'VALIDER'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VotePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bonusId, setBonusId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'bonus'>('select');
  const [showConfirm, setShowConfirm] = useState(false);
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
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1E1E1E]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-2xl sm:text-3xl text-white leading-none">
                {step === 'select' ? 'CHOISISSEZ VOS 5 JOUEURS' : 'ATTRIBUEZ LE BONUS'}
              </h1>
              <p className="text-white/40 text-xs mt-0.5">
                {step === 'select' ? 'Sélectionnez exactement 5 joueurs
