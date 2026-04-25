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
  team?: number | null;
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
            { icon: '🏀', title: '5 joueurs par équipe', desc: 'Sélectionnez 5 joueurs dans l\'Équipe 1, puis 5 dans l\'Équipe 2.' },
            { icon: '🧑‍💼', title: 'Coachs par équipe', desc: 'Votez pour un coach principal et un adjoint pour chaque équipe.' },
            { icon: '🔒', title: 'Vote unique', desc: 'Votre code ne peut être utilisé qu\'une seule fois. Le vote est définitif.' },
            { icon: '🏆', title: 'Résultats', desc: 'Les 5 joueurs les plus votés par équipe formeront les 5 majeurs !' },
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
  const borderColor = selected ? teamColor : '#1E1E1E';
  const bg = selected ? `${teamColor}1a` : '#141414';
  const shadow = selected ? `0 0 0 2px ${teamColor}, 0 0 20px ${teamColor}50` : 'none';
  return (
    <button onClick={onClick} disabled={!canSelect && !selected}
      className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300"
      style={{ borderColor, background: bg, boxShadow: shadow,
        opacity: (!canSelect && !selected) ? 0.4 : 1,
        cursor: (!canSelect && !selected) ? 'not-allowed' : 'pointer' }}>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{background: teamColor}}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center z-10">
        <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-sm leading-none" style2={{color: teamColor}}>{player.number}</span>
      </div>
      <div className="relative mt-3 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#1E1E1E] flex items-center justify-center">
        {player.photo_url
          ? <img src={player.photo_url} alt={player.last_name} className="w-full h-full object-cover object-top" />
          : <span style={{fontFamily:'Bebas Neue,sans-serif',color:`${teamColor}80`}} className="text-3xl">{player.first_name[0]}{player.last_name[0]}</span>
        }
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: selected ? teamColor : 'white'}} className="text-base sm:text-lg leading-tight">
          {player.first_name.toUpperCase()}
        </span>
        <span style={{fontFamily:'Bebas Neue,sans-serif', color: selected ? teamColor : 'white'}} className="text-base sm:text-lg leading-tight">
          {player.last_name.toUpperCase()}
        </span>
        <span className="text-xs text-white/40 mt-0.5">{player.position}</span>
      </div>
    </button>
  );
}

/* ─── Carte coach ────────────────────────────── */
function CoachCard({ coach, selected, role, teamColor, onClick }: {
  coach: Coach; selected: boolean; role?: string; teamColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 w-full"
      style={{
        borderColor: selected ? teamColor : '#1E1E1E',
        background: selected ? `${teamColor}1a` : '#141414',
        boxShadow: selected ? `0 0 0 2px ${teamColor}, 0 0 20px ${teamColor}50` : 'none',
      }}>
      {selected && role && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10 whitespace-nowrap" style={{background: teamColor}}>
          {role}
        </div>
      )}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{background: teamColor}}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1E1E1E] flex items-center justify-center border-2"
        style={{borderColor: selected ? teamColor : '#1E1E1E'}}>
        {coach.photo_url
          ? <img src={coach.photo_url} alt={coach.last_name} className="w-full h-full object-cover object-top" />
          : <span style={{fontFamily:'Bebas Neue,sans-serif',color:`${teamColor}80`}} className="text-3xl">{coach.first_name[0]}{coach.last_name[0]}</span>
        }
      </div>
      <div className="text-center">
        <p style={{fontFamily:'Bebas Neue,sans-serif', color: selected ? teamColor : 'white'}} className="text-lg leading-tight">{coach.first_name.toUpperCase()}</p>
        <p style={{fontFamily:'Bebas Neue,sans-serif', color: selected ? teamColor : 'white'}} className="text-lg leading-tight">{coach.last_name.toUpperCase()}</p>
      </div>
    </button>
  );
}

/* ─── Modal confirmation ─────────────────────── */
function ConfirmModal({ t1Players, t1Head, t1Asst, t2Players, t2Head, t2Asst, onConfirm, onCancel, loading }: {
  t1Players: Player[]; t1Head: Coach; t1Asst: Coach;
  t2Players: Player[]; t2Head: Coach; t2Asst: Coach;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const TeamSection = ({ label, color, players, head, asst }: {
    label: string; color: string;
    players: Player[]; head: Coach; asst: Coach;
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
      {[{c:head,r:'🧑‍💼 Principal'},{c:asst,r:'👨‍💼 Adjoint'}].map(({c,r}) => (
        <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-[#1E1E1E] bg-[#0A0A0A]">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center">
            {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover"/> : <span style={{fontFamily:'Bebas Neue,sans-serif',color,fontSize:10}}>{c.first_name[0]}</span>}
          </div>
          <span className="flex-1 font-semibold text-white text-xs">{c.first_name} {c.last_name}</span>
          <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded-full border border-[#1E1E1E] whitespace-nowrap">{r}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 flex flex-col gap-5 animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <h2 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-white">Confirmer votre vote</h2>
          <p className="text-white/50 text-sm mt-1">Ce vote est définitif et ne pourra pas être modifié.</p>
        </div>
        <TeamSection label="ÉQUIPE 1" color="#E8651A" players={t1Players} head={t1Head} asst={t1Asst} />
        <div className="h-px bg-[#1E1E1E]" />
        <TeamSection label="ÉQUIPE 2" color="#3B9EF0" players={t2Players} head={t2Head} asst={t2Asst} />
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

/* ─── Page principale vote ───────────────────── */
type Step =
  | 't1_select' | 't1_headcoach' | 't1_assistantcoach'
  | 't2_select' | 't2_headcoach' | 't2_assistantcoach';

export default function VotePage() {
  const router = useRouter();

  // Data
  const [t1Players, setT1Players] = useState<Player[]>([]);
  const [t2Players, setT2Players] = useState<Player[]>([]);
  const [t1Coaches, setT1Coaches] = useState<Coach[]>([]);
  const [t2Coaches, setT2Coaches] = useState<Coach[]>([]);

  // Sélections E1
  const [t1SelectedIds, setT1SelectedIds] = useState<string[]>([]);
  const [t1HeadId, setT1HeadId] = useState<string | null>(null);
  const [t1AsstId, setT1AsstId] = useState<string | null>(null);

  // Sélections E2
  const [t2SelectedIds, setT2SelectedIds] = useState<string[]>([]);
  const [t2HeadId, setT2HeadId] = useState<string | null>(null);
  const [t2AsstId, setT2AsstId] = useState<string | null>(null);

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
      supabase.from('coaches').select('*').eq('is_active', true).eq('team', 1).order('last_name'),
      supabase.from('coaches').select('*').eq('is_active', true).eq('team', 2).order('last_name'),
    ]).then(([{data:p1},{data:p2},{data:c1},{data:c2}]) => {
      if (p1) setT1Players(p1);
      if (p2) setT2Players(p2);
      if (c1) setT1Coaches(c1);
      if (c2) setT2Coaches(c2);
      setLoadingData(false);
    });
  }, [router]);

  function togglePlayer(team: 1|2, id: string) {
    if (team === 1) {
      setT1SelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length >= MAX_PLAYERS ? prev : [...prev, id]);
    } else {
      setT2SelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length >= MAX_PLAYERS ? prev : [...prev, id]);
    }
  }

  async function submitVote() {
    setSubmitting(true);
    const codeId = sessionStorage.getItem('vote_code_id');
    // Combiner les 10 joueurs : 5 E1 + 5 E2
    const allPlayerIds = [...t1SelectedIds, ...t2SelectedIds];
    const { error } = await supabase.rpc('submit_vote', {
      p_code_id: codeId,
      p_player_1: allPlayerIds[0],
      p_player_2: allPlayerIds[1],
      p_player_3: allPlayerIds[2],
      p_player_4: allPlayerIds[3],
      p_player_5: allPlayerIds[4],
      p_bonus_player: null,
      p_head_coach: t1HeadId,
      p_assistant_coach: t1AsstId,
      p_player_6: allPlayerIds[5],
      p_player_7: allPlayerIds[6],
      p_player_8: allPlayerIds[7],
      p_player_9: allPlayerIds[8],
      p_player_10: allPlayerIds[9],
      p_bonus_player_2: null,
      p_head_coach_2: t2HeadId,
      p_assistant_coach_2: t2AsstId,
    });
    setSubmitting(false);
    if (error) { alert('Une erreur est survenue. Veuillez réessayer.'); console.error(error); return; }
    sessionStorage.removeItem('vote_code_id');
    sessionStorage.removeItem('vote_code');

    const t1Selected = t1Players.filter(p => t1SelectedIds.includes(p.id));
    const t2Selected = t2Players.filter(p => t2SelectedIds.includes(p.id));
    const result = {
      t1Players: t1Selected,
      t1HeadCoach: t1Coaches.find(c => c.id === t1HeadId)!,
      t1AssistantCoach: t1Coaches.find(c => c.id === t1AsstId)!,
      t2Players: t2Selected,
      t2HeadCoach: t2Coaches.find(c => c.id === t2HeadId)!,
      t2AssistantCoach: t2Coaches.find(c => c.id === t2AsstId)!,
    };
    sessionStorage.setItem('vote_result', JSON.stringify(result));
    router.push('/merci');
  }

  // Dérivés
  const t1Selected = t1Players.filter(p => t1SelectedIds.includes(p.id));
  const t2Selected = t2Players.filter(p => t2SelectedIds.includes(p.id));

  // Étapes & labels
  const STEPS: Step[] = ['t1_select','t1_headcoach','t1_assistantcoach','t2_select','t2_headcoach','t2_assistantcoach'];
  const currentIdx = STEPS.indexOf(step);

  const isT1 = step.startsWith('t1');
  const teamColor = isT1 ? '#E8651A' : '#3B9EF0';
  const teamLabel = isT1 ? 'ÉQUIPE 1' : 'ÉQUIPE 2';

  const stepMeta: Record<Step, { title: string; sub: string }> = {
    t1_select:        { title: 'ÉQUIPE 1 — 5 JOUEURS',     sub: 'Sélectionnez exactement 5 joueurs' },
    t1_headcoach:     { title: 'ÉQUIPE 1 — COACH PRINCIPAL', sub: 'Choisissez le coach principal' },
    t1_assistantcoach:{ title: 'ÉQUIPE 1 — COACH ADJOINT',   sub: 'Choisissez le coach adjoint' },
    t2_select:        { title: 'ÉQUIPE 2 — 5 JOUEURS',     sub: 'Sélectionnez exactement 5 joueurs' },
    t2_headcoach:     { title: 'ÉQUIPE 2 — COACH PRINCIPAL', sub: 'Choisissez le coach principal' },
    t2_assistantcoach:{ title: 'ÉQUIPE 2 — COACH ADJOINT',   sub: 'Choisissez le coach adjoint' },
  };

  function goBack() {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  }

  // Bouton suivant
  const canProceed =
    (step === 't1_select'         && t1SelectedIds.length === MAX_PLAYERS) ||
    (step === 't1_headcoach'      && !!t1HeadId) ||
    (step === 't1_assistantcoach' && !!t1AsstId) ||
    (step === 't2_select'         && t2SelectedIds.length === MAX_PLAYERS) ||
    (step === 't2_headcoach'      && !!t2HeadId) ||
    (step === 't2_assistantcoach' && !!t2AsstId);

  const nextLabel = () => {
    if (step === 't1_select')         return t1SelectedIds.length === MAX_PLAYERS ? 'CHOISIR LE COACH →' : `Sélectionnez encore ${MAX_PLAYERS - t1SelectedIds.length} joueur${MAX_PLAYERS - t1SelectedIds.length > 1 ? 's' : ''}`;
    if (step === 't1_headcoach')      return 'CHOISIR LE COACH ADJOINT →';
    if (step === 't1_assistantcoach') return 'PASSER À L\'ÉQUIPE 2 →';
    if (step === 't2_select')         return t2SelectedIds.length === MAX_PLAYERS ? 'CHOISIR LE COACH →' : `Sélectionnez encore ${MAX_PLAYERS - t2SelectedIds.length} joueur${MAX_PLAYERS - t2SelectedIds.length > 1 ? 's' : ''}`;
    if (step === 't2_headcoach')      return 'CHOISIR LE COACH ADJOINT →';
    if (step === 't2_assistantcoach') return '✅ VALIDER MON VOTE';
    return '';
  };

  function handleNext() {
    if (step === 't2_assistantcoach') { setShowConfirm(true); return; }
    setStep(STEPS[currentIdx + 1]);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const allReady =
    t1SelectedIds.length === 5 && t1HeadId && t1AsstId &&
    t2SelectedIds.length === 5 && t2HeadId && t2AsstId;

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
                <h1 style={{fontFamily:'Bebas Neue,sans-serif', color: teamColor}} className="text-2xl sm:text-3xl leading-none">
                  {stepMeta[step].title}
                </h1>
                <p className="text-white/40 text-xs mt-0.5">{stepMeta[step].sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span style={{fontFamily:'Bebas Neue,sans-serif', color: teamColor}} className="text-lg">{currentIdx + 1}/6</span>
              {currentIdx > 0 && (
                <button onClick={goBack} className="text-sm text-white/50 hover:text-[#E8651A] transition-colors">← Retour</button>
              )}
              {(step === 't1_select' || step === 't2_select') && (
                <span style={{fontFamily:'Bebas Neue,sans-serif', color: teamColor}} className="text-4xl leading-none">
                  {step === 't1_select' ? t1SelectedIds.length : t2SelectedIds.length}
                  <span className="text-white/30 text-2xl">/{MAX_PLAYERS}</span>
                </span>
              )}
            </div>
          </div>

          {/* Barre de progression */}
          <div className="flex gap-1">
            {STEPS.map((s, i) => {
              const sColor = s.startsWith('t1') ? '#E8651A' : '#3B9EF0';
              return (
                <div key={s} className="h-2 flex-1 rounded-full transition-all duration-500"
                  style={{ background: i <= currentIdx ? sColor : '#1E1E1E', boxShadow: i <= currentIdx ? `0 0 8px ${sColor}60` : 'none' }} />
              );
            })}
          </div>

          {/* Mini récap sélection courante */}
          {(step === 't1_select' || step === 't2_select') && (
            <div className="flex gap-2 flex-wrap">
              {(step === 't1_select' ? t1Selected : t2Selected).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${teamColor}20`, color: teamColor, border: `1px solid ${teamColor}40` }}>
                  {p.first_name} {p.last_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ─ E1 sélection ─ */}
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

        {/* ─ E1 head coach ─ */
        {step === 't1_headcoach' && (
          <>
            <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start" style={{borderColor:'rgba(232,101,26,0.3)',background:'rgba(232,101,26,0.03)'}}>
              <span className="text-3xl">🧑‍💼</span>
              <div>
                <h3 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#E8651A]">Coach Principal — Équipe 1</h3>
                <p className="text-white/60 text-sm mt-1">Choisissez le coach principal de l&apos;Équipe 1.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {t1Coaches.map(coach => (
                <CoachCard key={coach.id} coach={coach} teamColor="#E8651A"
                  selected={t1HeadId === coach.id} role="🧑‍💼 PRINCIPAL"
                  onClick={() => setT1HeadId(prev => prev === coach.id ? null : coach.id)} />
              ))}
            </div>
          </>
        )}

        {/* ─ E1 assistant coach ─ */}
        {step === 't1_assistantcoach' && (
          <>
            <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start" style={{borderColor:'rgba(232,101,26,0.3)',background:'rgba(232,101,26,0.03)'}}>
              <span className="text-3xl">👨‍💼</span>
              <div>
                <h3 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#E8651A]">Coach Adjoint — Équipe 1</h3>
                <p className="text-white/60 text-sm mt-1">Choisissez le coach adjoint de l&apos;Équipe 1.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {t1Coaches.filter(c => c.id !== t1HeadId).map(coach => (
                <CoachCard key={coach.id} coach={coach} teamColor="#E8651A"
                  selected={t1AsstId === coach.id} role="👨‍💼 ADJOINT"
                  onClick={() => setT1AsstId(prev => prev === coach.id ? null : coach.id)} />
              ))}
            </div>
          </>
        )}

        {/* ─ Transition E1→E2 ─ */}
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

        {/* ─ E2 head coach ─ */
        {step === 't2_headcoach' && (
          <>
            <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start" style={{borderColor:'rgba(59,158,240,0.3)',background:'rgba(59,158,240,0.05)'}}>
              <span className="text-3xl">🧑‍💼</span>
              <div>
                <h3 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#3B9EF0]">Coach Principal — Équipe 2</h3>
                <p className="text-white/60 text-sm mt-1">Choisissez le coach principal de l&apos;Équipe 2.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {t2Coaches.map(coach => (
                <CoachCard key={coach.id} coach={coach} teamColor="#3B9EF0"
                  selected={t2HeadId === coach.id} role="🧑‍💼 PRINCIPAL"
                  onClick={() => setT2HeadId(prev => prev === coach.id ? null : coach.id)} />
              ))}
            </div>
          </>
        )}

        {/* ─ E2 assistant coach ─ */}
        {step === 't2_assistantcoach' && (
          <>
            <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start" style={{borderColor:'rgba(59,158,240,0.3)',background:'rgba(59,158,240,0.05)'}}>
              <span className="text-3xl">👨‍💼</span>
              <div>
                <h3 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-xl text-[#3B9EF0]">Coach Adjoint — Équipe 2</h3>
                <p className="text-white/60 text-sm mt-1">Choisissez le coach adjoint de l&apos;Équipe 2.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {t2Coaches.filter(c => c.id !== t2HeadId).map(coach => (
                <CoachCard key={coach.id} coach={coach} teamColor="#3B9EF0"
                  selected={t2AsstId === coach.id} role="👨‍💼 ADJOINT"
                  onClick={() => setT2AsstId(prev => prev === coach.id ? null : coach.id)} />
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
              background: canProceed ? teamColor : '#1E1E1E',
              color: canProceed ? 'white' : 'rgba(255,255,255,0.3)',
              boxShadow: canProceed ? `0 0 0 2px ${teamColor}, 0 0 30px ${teamColor}80` : 'none',
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
          t1Head={t1Coaches.find(c => c.id === t1HeadId)!}
          t1Asst={t1Coaches.find(c => c.id === t1AsstId)!}
          t2Players={t2Selected}
          t2Head={t2Coaches.find(c => c.id === t2HeadId)!}
          t2Asst={t2Coaches.find(c => c.id === t2AsstId)!}
          onConfirm={submitVote}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </main>
  );
}
