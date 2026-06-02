'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';

const MAX_PLAYERS = 5;

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_active: boolean;
}

/* ─── Modal règles ───────────────────────────── */
function RulesModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#141414] border border-[#E8651A]/50 rounded-2xl overflow-hidden animate-bounce-in">
        <div className="bg-[#E8651A] px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="CSL" className="w-10 h-10 object-contain" />
          <div>
            <h2 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-2xl text-white leading-none">RÈGLES DU VOTE</h2>
            <p className="text-white/80 text-xs">CSL Basket — All-Star Game</p>
          </div>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { icon: '🏀', title: '5 joueurs par équipe', desc: "Sélectionnez 5 joueurs dans l'Équipe 1, puis 5 dans l'Équipe 2." },
            { icon: '🧑‍💼', title: 'Assignez les coachs', desc: "Tous les coachs sont affichés — choisissez dans quelle équipe chacun doit jouer." },
            { icon: '🔒', title: 'Vote unique', desc: "Votre code ne peut être utilisé qu'une seule fois. Le vote est définitif." },
            { icon: '🏆', title: 'Résultats', desc: "Les 5 joueurs les plus votés par équipe formeront les 5 majeurs !" },
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
        <div className="px-6 pb-6">
          <button onClick={onAccept}
            className="btn-shimmer w-full py-4 rounded-xl text-white transition-all"
            style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.5rem', letterSpacing:'0.05em', background:'#E8651A', boxShadow:'0 0 20px rgba(232,101,26,0.4)'}}>
            J&apos;AI COMPRIS — VOTER !
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Carte joueur ───────────────────────────── */
function PlayerCard({ player, selected, canSelect, teamColor, onClick }: {
  player: Player; selected: boolean; canSelect: boolean; teamColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={!canSelect && !selected}
      className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300"
      style={{
        borderColor: selected ? teamColor : '#1E1E1E',
        background: selected ? `${teamColor}1a` : '#141414',
        boxShadow: selected ? `0 0 0 2px ${teamColor}, 0 0 20px ${teamColor}50` : 'none',
        opacity: (!canSelect && !selected) ? 0.4 : 1,
        cursor: (!canSelect && !selected) ? 'not-allowed' : 'pointer',
      }}>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{background: teamColor}}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center z-10">
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: teamColor}} className="text-sm leading-none">{player.number}</span>
      </div>
      <div className="relative mt-3 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#1E1E1E] flex items-center justify-center">
        {player.photo_url
          ? <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" />
          : <span style={{fontFamily:'Bebas Neue,sans-serif',color:`${teamColor}80`}} className="text-3xl">{player.first_name[0]}{player.last_name[0]}</span>
        }
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: selected ? teamColor : 'white'}} className="text-base sm:text-lg leading-tight">{player.first_name.toUpperCase()}</span>
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: selected ? teamColor : 'white'}} className="text-base sm:text-lg leading-tight">{player.last_name.toUpperCase()}</span>
        <span className="text-xs text-white/40 mt-0.5">{player.position}</span>
      </div>
    </button>
  );
}

/* ─── Carte coach avec choix équipe ─────────── */
function CoachAssignCard({ coach, assigned, onAssign }: {
  coach: Coach;
  assigned: 1 | 2 | null;
  onAssign: (team: 1 | 2) => void;
}) {
  const assignedColor = assigned === 1 ? '#E8651A' : assigned === 2 ? '#3B9EF0' : null;

  return (
    <div className="flex flex-col rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        borderColor: assignedColor ?? '#1E1E1E',
        background: assignedColor ? `${assignedColor}0d` : '#141414',
        boxShadow: assignedColor ? `0 0 0 2px ${assignedColor}, 0 0 20px ${assignedColor}40` : 'none',
      }}>
      {/* Photo + nom */}
      <div className="flex flex-col items-center gap-2 p-4 pb-3">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1E1E1E] flex items-center justify-center border-2 transition-all"
          style={{borderColor: assignedColor ?? '#2a2a2a'}}>
          {coach.photo_url
            ? <img src={coach.photo_url} alt={coach.last_name} className="w-full h-full object-cover object-top" />
            : <span style={{fontFamily:'Bebas Neue,sans-serif', color: assignedColor ?? 'rgba(255,255,255,0.3)'}} className="text-3xl">
                {coach.first_name[0]}{coach.last_name[0]}
              </span>
          }
        </div>
        <div className="text-center">
          <p style={{fontFamily:'Bebas Neue,sans-serif', color: assignedColor ?? 'white'}} className="text-lg leading-tight">{coach.first_name.toUpperCase()}</p>
          <p style={{fontFamily:'Bebas Neue,sans-serif', color: assignedColor ?? 'white'}} className="text-lg leading-tight">{coach.last_name.toUpperCase()}</p>
        </div>
      </div>

      {/* Boutons E1 / E2 */}
      <div className="flex border-t border-[#1E1E1E]">
        <button
          onClick={() => onAssign(1)}
          className="flex-1 py-3 text-sm font-black tracking-wider transition-all"
          style={{
            background: assigned === 1 ? '#E8651A' : 'transparent',
            color: assigned === 1 ? 'white' : 'rgba(255,255,255,0.3)',
            borderRight: '1px solid #1E1E1E',
          }}>
          ÉQUIPE 1
        </button>
        <button
          onClick={() => onAssign(2)}
          className="flex-1 py-3 text-sm font-black tracking-wider transition-all"
          style={{
            background: assigned === 2 ? '#3B9EF0' : 'transparent',
            color: assigned === 2 ? 'white' : 'rgba(255,255,255,0.3)',
          }}>
          ÉQUIPE 2
        </button>
      </div>
    </div>
  );
}

/* ─── Modal confirmation ─────────────────────── */
function ConfirmModal({ t1Players, t2Players, t1Coaches, t2Coaches, allCoaches, onConfirm, onCancel, loading }: {
  t1Players: Player[]; t2Players: Player[];
  t1Coaches: string[]; t2Coaches: string[];
  allCoaches: Coach[];
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const getCoach = (id: string) => allCoaches.find(c => c.id === id);

  const TeamSection = ({ label, color, players, coachIds }: {
    label: string; color: string; players: Player[]; coachIds: string[];
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{background: color}} />
        <p style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:13, letterSpacing:'0.1em'}}>{label}</p>
      </div>
      {players.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-[#1E1E1E] bg-[#0A0A0A]">
          <span style={{fontFamily:'Bebas Neue,sans-serif', color}} className="text-base w-4 text-center">{i+1}</span>
          <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
            {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:10}}>{p.first_name[0]}</span>}
          </div>
          <span className="flex-1 font-semibold text-white text-xs">{p.first_name} {p.last_name} <span className="text-white/30">#{p.number}</span></span>
        </div>
      ))}
      {coachIds.map(id => {
        const c = getCoach(id);
        if (!c) return null;
        return (
          <div key={id} className="flex items-center gap-2 p-2 rounded-lg border border-[#1E1E1E] bg-[#0A0A0A]">
            <span className="text-base">🧑‍💼</span>
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
              {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:10}}>{c.first_name[0]}</span>}
            </div>
            <span className="flex-1 font-semibold text-white text-xs">{c.first_name} {c.last_name}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 flex flex-col gap-5 animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <h2 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-white">Confirmer votre vote</h2>
          <p className="text-white/50 text-sm mt-1">Ce vote est définitif et ne pourra pas être modifié.</p>
        </div>
        <TeamSection label="ÉQUIPE 1" color="#E8651A" players={t1Players} coachIds={t1Coaches} />
        <div className="h-px bg-[#1E1E1E]" />
        <TeamSection label="ÉQUIPE 2" color="#3B9EF0" players={t2Players} coachIds={t2Coaches} />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[#1E1E1E] text-white/60 hover:text-white font-semibold transition-all">Modifier</button>
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

/* ─── Page principale ────────────────────────── */
type Step = 't1_select' | 't2_select' | 'coaches_assign';

export default function VotePage() {
  const router = useRouter();

  const [t1Players, setT1Players] = useState<Player[]>([]);
  const [t2Players, setT2Players] = useState<Player[]>([]);
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);

  const [t1SelectedIds, setT1SelectedIds] = useState<string[]>([]);
  const [t2SelectedIds, setT2SelectedIds] = useState<string[]>([]);
  // coachAssignments : coachId -> 1 | 2 | null
  const [coachAssignments, setCoachAssignments] = useState<Record<string, 1 | 2 | null>>({});

  const [step, setStep] = useState<Step>('t1_select');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const codeId = sessionStorage.getItem('vote_code_id');
    if (!codeId) { router.replace('/'); return; }
    Promise.all([
      supabase.from('players').select('*').eq('is_active', true).eq('team', 1).order('last_name'),
      supabase.from('players').select('*').eq('is_active', true).eq('team', 2).order('last_name'),
      supabase.from('coaches').select('*').eq('is_active', true).order('last_name'),
    ]).then(([{data:p1},{data:p2},{data:co}]) => {
      if (p1) setT1Players(p1);
      if (p2) setT2Players(p2);
      if (co) {
        setAllCoaches(co);
        // Init assignments à null
        const init: Record<string, 1 | 2 | null> = {};
        co.forEach(c => { init[c.id] = null; });
        setCoachAssignments(init);
      }
      setLoadingData(false);
    });
  }, [router]);

  function togglePlayer(team: 1 | 2, id: string) {
    if (team === 1) {
      setT1SelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length >= MAX_PLAYERS ? prev : [...prev, id]);
    } else {
      setT2SelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length >= MAX_PLAYERS ? prev : [...prev, id]);
    }
  }

  function assignCoach(coachId: string, team: 1 | 2) {
    setCoachAssignments(prev => ({
      ...prev,
      [coachId]: prev[coachId] === team ? null : team,
    }));
  }

  const t1CoachIds = Object.entries(coachAssignments).filter(([, t]) => t === 1).map(([id]) => id);
  const t2CoachIds = Object.entries(coachAssignments).filter(([, t]) => t === 2).map(([id]) => id);
  const allAssigned = allCoaches.length > 0 && allCoaches.every(c => coachAssignments[c.id] !== null);
  const eachTeamHasCoach = t1CoachIds.length >= 1 && t2CoachIds.length >= 1;

  async function submitVote() {
    setSubmitting(true);
    const codeId = sessionStorage.getItem('vote_code_id');
    const allPlayerIds = [...t1SelectedIds, ...t2SelectedIds];
    const { error } = await supabase.rpc('submit_vote', {
      p_code_id:           codeId,
      p_player_1:          allPlayerIds[0] ?? null,
      p_player_2:          allPlayerIds[1] ?? null,
      p_player_3:          allPlayerIds[2] ?? null,
      p_player_4:          allPlayerIds[3] ?? null,
      p_player_5:          allPlayerIds[4] ?? null,
      p_bonus_player:      null,
      p_head_coach:        t1CoachIds[0]   ?? null,
      p_assistant_coach:   t1CoachIds[1]   ?? null,
      p_player_6:          allPlayerIds[5] ?? null,
      p_player_7:          allPlayerIds[6] ?? null,
      p_player_8:          allPlayerIds[7] ?? null,
      p_player_9:          allPlayerIds[8] ?? null,
      p_player_10:         allPlayerIds[9] ?? null,
      p_bonus_player_2:    null,
      p_head_coach_2:      t2CoachIds[0]   ?? null,
      p_assistant_coach_2: t2CoachIds[1]   ?? null,
    });
    setSubmitting(false);
    if (error) { alert('Une erreur est survenue. Veuillez réessayer.'); console.error(error); return; }
    sessionStorage.removeItem('vote_code_id');
    sessionStorage.removeItem('vote_code');

    const result = {
      t1Players: t1Players.filter(p => t1SelectedIds.includes(p.id)),
      t2Players: t2Players.filter(p => t2SelectedIds.includes(p.id)),
      t1Coaches: allCoaches.filter(c => t1CoachIds.includes(c.id)),
      t2Coaches: allCoaches.filter(c => t2CoachIds.includes(c.id)),
    };
    sessionStorage.setItem('vote_result', JSON.stringify(result));
    router.push('/merci');
  }

  const t1Selected = t1Players.filter(p => t1SelectedIds.includes(p.id));
  const t2Selected = t2Players.filter(p => t2SelectedIds.includes(p.id));

  const STEPS: Step[] = ['t1_select', 't2_select', 'coaches_assign'];
  const currentIdx = STEPS.indexOf(step);

  const stepColors: Record<Step, string> = {
    t1_select:      '#E8651A',
    t2_select:      '#3B9EF0',
    coaches_assign: '#D4AF37',
  };
  const stepColor = stepColors[step];

  const stepMeta: Record<Step, { title: string; sub: string }> = {
    t1_select:      { title: 'ÉQUIPE 1 — 5 JOUEURS',  sub: 'Sélectionnez exactement 5 joueurs' },
    t2_select:      { title: 'ÉQUIPE 2 — 5 JOUEURS',  sub: 'Sélectionnez exactement 5 joueurs' },
    coaches_assign: { title: 'ASSIGNEZ LES COACHS',   sub: 'Choisissez dans quelle équipe chaque coach doit jouer' },
  };

  function goBack() {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  }

  const canProceed =
    (step === 't1_select'      && t1SelectedIds.length === MAX_PLAYERS) ||
    (step === 't2_select'      && t2SelectedIds.length === MAX_PLAYERS) ||
    (step === 'coaches_assign' && allAssigned && eachTeamHasCoach);

  const nextLabel = () => {
    if (step === 't1_select') return t1SelectedIds.length === MAX_PLAYERS
      ? 'PASSER À L\'ÉQUIPE 2 →'
      : `Sélectionnez encore ${MAX_PLAYERS - t1SelectedIds.length} joueur${MAX_PLAYERS - t1SelectedIds.length > 1 ? 's' : ''}`;
    if (step === 't2_select') return t2SelectedIds.length === MAX_PLAYERS
      ? 'CHOISIR LES COACHS →'
      : `Sélectionnez encore ${MAX_PLAYERS - t2SelectedIds.length} joueur${MAX_PLAYERS - t2SelectedIds.length > 1 ? 's' : ''}`;
    if (step === 'coaches_assign') {
      if (!allAssigned) {
        const remaining = allCoaches.filter(c => coachAssignments[c.id] === null).length;
        return `Assignez encore ${remaining} coach${remaining > 1 ? 's' : ''}`;
      }
      return '✅ VALIDER MON VOTE';
    }
    return '';
  };

  function handleNext() {
    if (step === 'coaches_assign') { setShowConfirm(true); return; }
    setStep(STEPS[currentIdx + 1]);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const allReady = t1SelectedIds.length === 5 && t2SelectedIds.length === 5 && allAssigned && eachTeamHasCoach;

  if (loadingData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" style={{width:40,height:40,borderWidth:3}} />
        <p className="text-white/50">Chargement...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pb-32">
      {showRules && <RulesModal onAccept={() => setShowRules(false)} />}

      {/* Header sticky */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1E1E1E]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="CSL" className="w-8 h-8 object-contain" />
              <div>
                <h1 style={{fontFamily:'Bebas Neue,sans-serif', color: stepColor}} className="text-2xl sm:text-3xl leading-none">
                  {stepMeta[step].title}
                </h1>
                <p className="text-white/40 text-xs mt-0.5">{stepMeta[step].sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span style={{fontFamily:'Bebas Neue,sans-serif', color: stepColor}} className="text-lg">{currentIdx + 1}/3</span>
              {currentIdx > 0 && (
                <button onClick={goBack} className="text-sm text-white/50 hover:text-[#E8651A] transition-colors">← Retour</button>
              )}
              {(step === 't1_select' || step === 't2_select') && (
                <span style={{fontFamily:'Bebas Neue,sans-serif', color: stepColor}} className="text-4xl leading-none">
                  {step === 't1_select' ? t1SelectedIds.length : t2SelectedIds.length}
                  <span className="text-white/30 text-2xl">/{MAX_PLAYERS}</span>
                </span>
              )}
            </div>
          </div>

          {/* Barre progression */}
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="h-2 flex-1 rounded-full transition-all duration-500"
                style={{ background: i <= currentIdx ? stepColors[s] : '#1E1E1E', boxShadow: i <= currentIdx ? `0 0 8px ${stepColors[s]}60` : 'none' }} />
            ))}
          </div>

          {/* Mini récap joueurs */}
          {(step === 't1_select' || step === 't2_select') && (
            <div className="flex gap-2 flex-wrap">
              {(step === 't1_select' ? t1Selected : t2Selected).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${stepColor}20`, color: stepColor, border: `1px solid ${stepColor}40` }}>
                  {p.first_name} {p.last_name}
                </div>
              ))}
            </div>
          )}

          {/* Mini récap coachs assignés */}
          {step === 'coaches_assign' && (
            <div className="flex gap-3">
              {[{label:'É1', color:'#E8651A', ids: t1CoachIds}, {label:'É2', color:'#3B9EF0', ids: t2CoachIds}].map(({label, color, ids}) => (
                <div key={label} className="flex items-center gap-1.5 flex-wrap">
                  <span style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:11}}>{label} :</span>
                  {ids.length === 0
                    ? <span className="text-white/25 text-xs italic">aucun</span>
                    : ids.map(id => {
                        const c = allCoaches.find(x => x.id === id);
                        return c ? (
                          <span key={id} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{background:`${color}20`, color, border:`1px solid ${color}40`}}>
                            {c.first_name}
                          </span>
                        ) : null;
                      })
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ─ Joueurs E1 ─ */}
        {step === 't1_select' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {t1Players.map(player => (
              <PlayerCard key={player.id} player={player} teamColor="#E8651A"
                selected={t1SelectedIds.includes(player.id)}
                canSelect={t1SelectedIds.length < MAX_PLAYERS || t1SelectedIds.includes(player.id)}
                onClick={() => togglePlayer(1, player.id)} />
            ))}
          </div>
        )}

        {/* ─ Joueurs E2 ─ */}
        {step === 't2_select' && (
          <>
            <div className="mb-6 p-4 rounded-2xl border flex items-center gap-3" style={{borderColor:'rgba(59,158,240,0.3)',background:'rgba(59,158,240,0.05)'}}>
              <span className="text-2xl">🏀</span>
              <div>
                <p style={{fontFamily:'Bebas Neue,sans-serif', color:'#3B9EF0', fontSize:14, letterSpacing:'0.1em'}}>ÉQUIPE 1 COMPLÈTE ✓ — PASSEZ À L&apos;ÉQUIPE 2</p>
                <p className="text-white/40 text-xs">Sélectionnez maintenant 5 joueurs de l&apos;Équipe 2</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
              {t2Players.map(player => (
                <PlayerCard key={player.id} player={player} teamColor="#3B9EF0"
                  selected={t2SelectedIds.includes(player.id)}
                  canSelect={t2SelectedIds.length < MAX_PLAYERS || t2SelectedIds.includes(player.id)}
                  onClick={() => togglePlayer(2, player.id)} />
              ))}
            </div>
          </>
        )}

        {/* ─ Assignation coachs ─ */}
        {step === 'coaches_assign' && (
          <>
            <div className="mb-6 p-4 rounded-2xl border flex items-start gap-3" style={{borderColor:'rgba(212,175,55,0.3)',background:'rgba(212,175,55,0.04)'}}>
              <span className="text-2xl">🧑‍💼</span>
              <div>
                <h3 style={{fontFamily:'Bebas Neue,sans-serif', color:'#D4AF37'}} className="text-xl">Assignez chaque coach à une équipe</h3>
                <p className="text-white/50 text-sm mt-1">Tous les coachs doivent être assignés. Chaque équipe doit avoir au moins un coach.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allCoaches.map(coach => (
                <CoachAssignCard
                  key={coach.id}
                  coach={coach}
                  assigned={coachAssignments[coach.id] ?? null}
                  onAssign={(team) => assignCoach(coach.id, team)}
                />
              ))}
            </div>

            {/* Résumé assignation */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[{label:'ÉQUIPE 1', color:'#E8651A', ids:t1CoachIds}, {label:'ÉQUIPE 2', color:'#3B9EF0', ids:t2CoachIds}].map(({label, color, ids}) => (
                <div key={label} className="p-3 rounded-xl border" style={{borderColor:`${color}30`, background:`${color}08`}}>
                  <p style={{fontFamily:'Bebas Neue,sans-serif', color, fontSize:12, letterSpacing:'0.1em'}} className="mb-2">{label} — {ids.length} coach{ids.length > 1 ? 's' : ''}</p>
                  {ids.length === 0
                    ? <p className="text-white/25 text-xs italic">Aucun coach assigné</p>
                    : ids.map(id => {
                        const c = allCoaches.find(x => x.id === id);
                        return c ? (
                          <div key={id} className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0">
                              {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover"/> : null}
                            </div>
                            <span className="text-white text-xs font-semibold">{c.first_name} {c.last_name}</span>
                          </div>
                        ) : null;
                      })
                  }
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bouton fixe bas */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="btn-shimmer w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
            style={{
              fontFamily:'Bebas Neue,sans-serif', fontSize:'1.5rem', letterSpacing:'0.05em',
              background: canProceed ? stepColor : '#1E1E1E',
              color: canProceed ? 'white' : 'rgba(255,255,255,0.3)',
              boxShadow: canProceed ? `0 0 0 2px ${stepColor}, 0 0 30px ${stepColor}80` : 'none',
              cursor: !canProceed ? 'not-allowed' : 'pointer',
            }}>
            {nextLabel()}
          </button>
        </div>
      </div>

      {/* Modal confirmation */}
      {showConfirm && allReady && (
        <ConfirmModal
          t1Players={t1Selected}
          t2Players={t2Selected}
          t1Coaches={t1CoachIds}
          t2Coaches={t2CoachIds}
          allCoaches={allCoaches}
          onConfirm={submitVote}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </main>
  );
}
