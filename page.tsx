'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase, Player } from '@/lib/supabase';

const MAX_PLAYERS = 5;

// ─── Player Card ──────────────────────────────────────────────
function PlayerCard({
  player,
  selected,
  isBonus,
  canSelect,
  onClick,
}: {
  player: Player;
  selected: boolean;
  isBonus: boolean;
  canSelect: boolean;
  onClick: () => void;
}) {
  const positions: Record<string, string> = {
    PG: 'Meneur', SG: 'Arrière', SF: 'Ailier', PF: 'Ailier Fort', C: 'Pivot',
    meneur: 'Meneur', arrière: 'Arrière', ailier: 'Ailier',
  };

  const posLabel = positions[player.position] || player.position;

  return (
    <button
      onClick={onClick}
      disabled={!canSelect && !selected}
      className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 cursor-pointer text-left
        ${isBonus
          ? 'border-or bg-gradient-to-b from-or/10 to-transparent glow-gold scale-105'
          : selected
          ? 'border-orange-DEFAULT bg-gradient-to-b from-orange-DEFAULT/15 to-transparent glow-border-active'
          : canSelect
          ? 'border-noir-border bg-noir-card hover:border-orange-DEFAULT/50 hover:bg-noir-hover hover:scale-[1.03]'
          : 'border-noir-border bg-noir-card opacity-40 cursor-not-allowed'
        }`}
    >
      {/* Bonus crown */}
      {isBonus && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-or text-black text-[10px] font-bold px-2 py-0.5 rounded-full font-body uppercase tracking-wider z-10 whitespace-nowrap">
          ⭐ BONUS
        </div>
      )}

      {/* Selected checkmark */}
      {selected && !isBonus && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-orange-DEFAULT rounded-full flex items-center justify-center z-10">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Jersey number badge */}
      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-noir-border flex items-center justify-center z-10">
        <span className="font-display text-sm text-orange-DEFAULT leading-none">{player.number}</span>
      </div>

      {/* Photo in star frame */}
      <div className="relative mt-3">
        {/* Star glow ring */}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-0 transition-opacity duration-300
          ${isBonus ? 'bg-or opacity-30' : selected ? 'bg-orange-DEFAULT opacity-30 group-hover:opacity-50' : 'group-hover:opacity-20 bg-orange-DEFAULT'}
        `} />

        {/* Hexagonal photo frame */}
        <div className={`relative w-20 h-20 sm:w-24 sm:h-24 clip-hex overflow-hidden transition-all duration-300
          ${isBonus ? 'ring-2 ring-or' : selected ? 'ring-2 ring-orange-DEFAULT' : ''}
        `}>
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={`${player.first_name} ${player.last_name}`}
              fill
              className="object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-noir-border to-noir-DEFAULT flex items-center justify-center">
              <span className="font-display text-3xl text-orange-DEFAULT/50">{player.first_name[0]}{player.last_name[0]}</span>
            </div>
          )}
        </div>

        {/* Star shape overlay when selected */}
        {selected && (
          <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] opacity-30 animate-spin" style={{ animationDuration: '8s' }} viewBox="0 0 100 100">
            <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="none" stroke="#E8651A" strokeWidth="1" />
          </svg>
        )}
      </div>

      {/* Player info */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className={`font-display text-base sm:text-lg leading-tight transition-colors
          ${isBonus ? 'text-or' : selected ? 'text-orange-DEFAULT' : 'text-white group-hover:text-orange-DEFAULT'}
        `}>
          {player.first_name.toUpperCase()}
        </span>
        <span className={`font-display text-base sm:text-lg leading-tight transition-colors
          ${isBonus ? 'text-or' : selected ? 'text-orange-DEFAULT' : 'text-white group-hover:text-orange-DEFAULT'}
        `}>
          {player.last_name.toUpperCase()}
        </span>
        <span className="font-body text-xs text-white/40 mt-0.5">{posLabel}</span>
      </div>
    </button>
  );
}

// ─── Progress bar ─────────────────────────────────────────────
function ProgressBar({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all duration-500 ${
            i < current ? 'bg-orange-DEFAULT shadow-[0_0_8px_rgba(232,101,26,0.6)]' : 'bg-noir-border'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Confirmation modal ───────────────────────────────────────
function ConfirmModal({
  players,
  bonusPlayer,
  onConfirm,
  onCancel,
  loading,
}: {
  players: Player[];
  bonusPlayer: Player;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-noir-card border border-noir-border rounded-2xl p-6 flex flex-col gap-6 animate-bounce-in">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white">Confirmer votre vote</h2>
          <p className="font-body text-white/50 text-sm mt-1">Ce vote est définitif et ne pourra pas être modifié.</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-body text-white/60 text-xs uppercase tracking-widest mb-1">Vos 5 titulaires</p>
          {players.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all
              ${p.id === bonusPlayer.id ? 'border-or bg-or/10' : 'border-noir-border bg-noir-DEFAULT'}`}>
              <span className="font-display text-lg text-orange-DEFAULT w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <span className="font-body font-semibold text-white text-sm">{p.first_name} {p.last_name}</span>
                <span className="font-body text-white/40 text-xs ml-2">#{p.number}</span>
              </div>
              {p.id === bonusPlayer.id && (
                <span className="font-body text-[10px] font-bold bg-or text-black px-2 py-0.5 rounded-full uppercase tracking-wider">⭐ Bonus</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-noir-border text-white/60 hover:text-white hover:border-white/30 font-body font-semibold transition-all"
          >
            Modifier
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-shimmer flex-1 py-3 rounded-xl bg-orange-DEFAULT text-white font-display text-xl tracking-wider hover:bg-orange-light transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><div className="spinner" /> Envoi...</> : 'VALIDER'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Vote Page ───────────────────────────────────────────
type Step = 'select' | 'bonus';

export default function VotePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bonusId, setBonusId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // Guard: check code in session
  useEffect(() => {
    const codeId = sessionStorage.getItem('vote_code_id');
    if (!codeId) {
      router.replace('/');
      return;
    }
    fetchPlayers();
  }, [router]);

  async function fetchPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('last_name');
    if (data) setPlayers(data);
    setLoadingPlayers(false);
  }

  function togglePlayer(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= MAX_PLAYERS) return prev;
      return [...prev, id];
    });
  }

  function toggleBonus(id: string) {
    setBonusId(prev => prev === id ? null : id);
  }

  function goToBonus() {
    setBonusId(null);
    setStep('bonus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setStep('select');
    setBonusId(null);
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

    if (error) {
      alert('Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    // Clear session and go to merci
    sessionStorage.removeItem('vote_code_id');
    sessionStorage.removeItem('vote_code');
    const selectedPlayers = players.filter(p => selectedIds.includes(p.id));
    const bonus = players.find(p => p.id === bonusId)!;
    // Store result for merci page
    sessionStorage.setItem('vote_result', JSON.stringify({ players: selectedPlayers, bonus }));
    router.push('/merci');
  }

  const selectedPlayers = players.filter(p => selectedIds.includes(p.id));
  const bonusPlayer = players.find(p => p.id === bonusId);
  const canProceed = selectedIds.length === MAX_PLAYERS;
  const canSubmit = bonusId !== null;

  if (loadingPlayers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-10 h-10" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p className="font-body text-white/50">Chargement des joueurs...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-32">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-noir-DEFAULT/90 backdrop-blur-md border-b border-noir-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-white leading-none">
                {step === 'select' ? 'CHOISISSEZ VOS 5 JOUEURS' : 'ATTRIBUEZ LE BONUS'}
              </h1>
              <p className="font-body text-white/40 text-xs mt-0.5">
                {step === 'select'
                  ? 'Sélectionnez exactement 5 joueurs titulaires'
                  : 'Choisissez lequel de vos 5 joueurs reçoit le bonus'}
              </p>
            </div>
            {step === 'select' && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-display text-4xl text-orange-DEFAULT leading-none">
                  {selectedIds.length}<span className="text-white/30 text-2xl">/{MAX_PLAYERS}</span>
                </span>
                <span className="font-body text-white/40 text-xs">sélectionnés</span>
              </div>
            )}
            {step === 'bonus' && (
              <button onClick={goBack} className="font-body text-sm text-white/50 hover:text-orange-DEFAULT transition-colors flex items-center gap-1">
                ← Modifier
              </button>
            )}
          </div>

          {/* Progress */}
          {step === 'select' && <ProgressBar current={selectedIds.length} max={MAX_PLAYERS} />}
        </div>
      </div>

      {/* ── STEP 1: Select 5 players ── */}
      {step === 'select' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selected={selectedIds.includes(player.id)}
                isBonus={false}
                canSelect={selectedIds.length < MAX_PLAYERS || selectedIds.includes(player.id)}
                onClick={() => togglePlayer(player.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Assign bonus ── */}
      {step === 'bonus' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Bonus explanation */}
          <div className="mb-8 p-5 rounded-2xl border border-or/30 bg-or/5 flex gap-4 items-start">
            <span className="text-3xl">⭐</span>
            <div>
              <h3 className="font-display text-xl text-or">Superstar Bonus</h3>
              <p className="font-body text-white/60 text-sm mt-1">
                Parmi vos 5 joueurs sélectionnés, lequel mérite le bonus ? Ce joueur recevra des points supplémentaires dans le classement final.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {selectedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selected={true}
                isBonus={bonusId === player.id}
                canSelect={true}
                onClick={() => toggleBonus(player.id)}
              />
            ))}
          </div>

          {bonusId && (
            <div className="mt-6 p-4 rounded-xl border border-or/30 bg-or/5 text-center animate-fade-in">
              <p className="font-body text-or text-sm">
                ⭐ <strong>{bonusPlayer?.first_name} {bonusPlayer?.last_name}</strong> recevra le Superstar Bonus
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-gradient-to-t from-noir-DEFAULT via-noir-DEFAULT/95 to-transparent">
        <div className="max-w-lg mx-auto">
          {step === 'select' ? (
            <button
              onClick={goToBonus}
              disabled={!canProceed}
              className={`btn-shimmer w-full py-4 rounded-xl font-display text-2xl tracking-wider transition-all duration-300 flex items-center justify-center gap-3
                ${canProceed
                  ? 'bg-orange-DEFAULT text-white glow-border-active hover:bg-orange-light hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-noir-border text-white/30 cursor-not-allowed'
                }`}
            >
              {canProceed ? (
                <>CHOISIR LE BONUS <span className="text-xl">→</span></>
              ) : (
                `Sélectionnez encore ${MAX_PLAYERS - selectedIds.length} joueur${MAX_PLAYERS - selectedIds.length > 1 ? 's' : ''}`
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canSubmit}
              className={`btn-shimmer w-full py-4 rounded-xl font-display text-2xl tracking-wider transition-all duration-300 flex items-center justify-center gap-3
                ${canSubmit
                  ? 'bg-orange-DEFAULT text-white glow-border-active hover:bg-orange-light hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-noir-border text-white/30 cursor-not-allowed'
                }`}
            >
              {canSubmit ? (
                <>
                  <svg viewBox="0 0 51 49" className="w-6 h-6" fill="currentColor">
                    <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
                  </svg>
                  VALIDER MON VOTE
                </>
              ) : 'Attribuez le bonus pour continuer'}
            </button>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && bonusPlayer && (
        <ConfirmModal
          players={selectedPlayers}
          bonusPlayer={bonusPlayer}
          onConfirm={submitVote}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </main>
  );
}
