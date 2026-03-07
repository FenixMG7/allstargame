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
              <div className="h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${(s.votes/maxVotes)*100}%`, background:'#E8651A'}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodesTab() {
  const [quantity, setQuantity] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<{code:string;status:string}[]>([]);
  const [generated, setGenerated] = useState<string[]>([]);

  useEffect(() => { fetchCodes(); }, []);

  async function fetchCodes() {
    const { data } = await supabase.from('voting_codes').select('code,status').order('created_at',{ascending:false}).limit(100);
    if (data) setCodes(data);
  }

  async function generateCodes() {
    setGenerating(true);
    const newCodes = Array.from({length: quantity}, () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const seg = (n: number) => Array.from({length:n},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
      return `ASG-${seg(4)}-${seg(4)}`;
    });
    const { error } = await supabase.from('voting_codes').insert(newCodes.map(code => ({code,status:'valid'})));
    if (!error) { setGenerated(newCodes); fetchCodes(); }
    setGenerating(false);
  }

  function exportCSV(data: string[], filename: string) {
    const csv = ['Code', ...data].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }

  const valid = codes.filter(c => c.status === 'valid').length;
  const used = codes.filter(c => c.status === 'used').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Valides',value:valid,color:'#4ade80'},
          {label:'Utilisés',value:used,color:'#E8651A'},
          {label:'Total',value:codes.length,color:'white'}
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 text-center">
            <div style={{fontFamily:'Bebas Neue,sans-serif',color:s.color}} className="text-3xl">{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Générer des codes</h3>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-white/40 text-xs">Quantité</label>
            <input type="number" min={1} max={1000} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]" />
          </div>
          <button onClick={generateCodes} disabled={generating}
            className="font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            style={{background:'#E8651A',color:'white'}}>
            {generating ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Génération...</> : '✨ Générer'}
          </button>
        </div>
        {generated.length > 0 && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-green-400 text-sm">✅ {generated.length} codes générés</p>
              <button onClick={() => exportCSV(generated, `codes-${Date.now()}.csv`)} className="text-xs text-[#E8651A] hover:underline">📥 CSV</button>
            </div>
            <div className="max-h-32 overflow-y-auto bg-[#0A0A0A] rounded-lg p-3 font-mono text-xs text-white/60 grid grid-cols-2 gap-1">
              {generated.slice(0,20).map(c => <span key={c}>{c}</span>)}
              {generated.length > 20 && <span className="text-white/30">+{generated.length-20} autres...</span>}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => exportCSV(codes.map(c=>c.code), `tous-codes-${Date.now()}.csv`)}
        className="text-sm text-[#E8651A] border border-[#E8651A]/30 hover:border-[#E8651A] px-4 py-2 rounded-lg transition-all self-start">
        📥 Exporter tous les codes (CSV)
      </button>
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">
        <table className="w-full admin-table">
          <thead><tr><th className="text-left">Code</th><th className="text-left">Statut</th></tr></thead>
          <tbody>
            {codes.slice(0,50).map(c => (
              <tr key={c.code}>
                <td className="font-mono text-white/80 text-sm">{c.code}</td>
                <td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                  style={{background: c.status==='valid' ? 'rgba(74,222,128,0.2)' : 'rgba(232,101,26,0.2)', color: c.status==='valid' ? '#4ade80' : '#E8651A'}}>
                  {c.status==='valid' ? 'Valide' : 'Utilisé'}
                </span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayersTab() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState({first_name:'',last_name:'',number:'',position:'PG'});
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string|null>(null);

  useEffect(() => { fetchPlayers(); }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('last_name');
    if (data) setPlayers(data);
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('players').insert({...form, number: Number(form.number), is_active: true});
    setForm({first_name:'',last_name:'',number:'',position:'PG'});
    fetchPlayers();
    setSaving(false);
  }

  async function uploadPhoto(playerId: string, file: File) {
    setUploadingId(playerId);
    const ext = file.name.split('.').pop();
    const path = `${playerId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('players').upload(path, file, { upsert: true });
    if (uploadError) { alert('Erreur upload: ' + uploadError.message); setUploadingId(null); return; }
    const { data: urlData } = supabase.storage.from('players').getPublicUrl(path);
    await supabase.from('players').update({ photo_url: urlData.publicUrl + '?t=' + Date.now() }).eq('id', playerId);
    fetchPlayers();
    setUploadingId(null);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('players').update({is_active: !current}).eq('id', id);
    fetchPlayers();
  }

  async function deletePlayer(id: string) {
    if (!confirm('Supprimer ce joueur ?')) return;
    await supabase.from('players').delete().eq('id', id);
    fetchPlayers();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Ajouter un joueur</h3>
        <form onSubmit={addPlayer} className="grid grid-cols-2 gap-3">
          {[
            {key:'first_name',placeholder:'Prénom'},
            {key:'last_name',placeholder:'Nom'},
            {key:'number',placeholder:'Numéro',type:'number'}
          ].map(f => (
            <input key={f.key} type={f.type||'text'} placeholder={f.placeholder}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm(prev => ({...prev,[f.key]:e.target.value}))}
              required
              className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A]" />
          ))}
          <select value={form.position} onChange={e => setForm(prev => ({...prev,position:e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]">
            {['PG','SG','SF','PF','C'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="submit" disabled={saving}
            className="col-span-2 font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            style={{background:'#E8651A',color:'white'}}>
            {saving ? 'Ajout...' : '+ Ajouter le joueur'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {players.map(p => (
          <div key={p.id} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-4">
            {/* Photo */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center">
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.last_name} className="w-full h-full object-cover" />
                  : <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A]/50">{p.first_name[0]}</span>
                }
              </div>
              {/* Bouton upload */}
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                style={{background:'#E8651A'}}>
                {uploadingId === p.id
                  ? <div className="spinner" style={{width:12,height:12,borderWidth:2,borderColor:'white',borderTopColor:'transparent'}} />
                  : <span className="text-white text-xs">📷</span>
                }
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadPhoto(p.id, e.target.files[0])} />
              </label>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-lg text-[#E8651A]">#{p.number}</span>
                <span className="font-semibold text-white truncate">{p.first_name} {p.last_name}</span>
              </div>
              <span className="text-white/40 text-xs">{p.position}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => toggleActive(p.id, p.is_active)}
                className="w-10 h-5 rounded-full transition-all relative"
                style={{background: p.is_active ? '#4ade80' : '#1E1E1E'}}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                  style={{left: p.is_active ? '22px' : '2px'}} />
              </button>
              <button onClick={() => deletePlayer(p.id)} className="text-red-400/40 hover:text-red-400 transition-colors">🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState({is_open:false,event_name:'',event_date:''});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('vote_settings').select('*').single().then(({data}) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

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

  if (loading) return <div className="spinner" style={{width:24,height:24,borderWidth:2}} />;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Paramètres</h3>
        <div className="flex flex-col gap-2">
          <label className="text-white/50 text-xs uppercase tracking-wider">Nom de l&apos;événement</label>
          <input value={settings.event_name} onChange={e => setSettings(s=>({...s,event_name:e.target.value}))}
            className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8651A]" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-white/50 text-xs uppercase tracking-wider">Date de l&apos;événement</label>
          <input type="datetime-local" value={settings.event_date?.slice(0,16)}
            onChange={e => setSettings(s=>({...s,event_date:e.target.value}))}
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
            <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
              style={{left: settings.is_open ? '26px' : '4px'}} />
          </button>
        </div>
        <button onClick={save} disabled={saving}
          className="font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
          style={{background:'#E8651A',color:'white'}}>
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>
      <div className="rounded-xl p-5 flex flex-col gap-3"
        style={{background:'rgba(153,27,27,0.2)',border:'1px solid rgba(153,27,27,0.5)'}}>
        <h3 className="font-semibold text-red-400 text-sm uppercase tracking-wider">⚠️ Zone dangereuse</h3>
        <p className="text-white/40 text-xs">Supprime tous les votes de manière irréversible.</p>
        <button onClick={resetVotes} className="font-semibold py-2 rounded-lg transition-all text-sm text-white"
          style={{background:'#b91c1c'}}>
          🗑 Réinitialiser tous les votes
        </button>
      </div>
    </div>
  );
}

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
              <p className="text-white/40 text-xs">All-Star Game · CSL Basket St Vallier</p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-white/40 hover:text-[#E8651A] transition-colors">
            Déconnexion →
          </button>
        </div>
        <div className="mb-6"><AdminNav active={tab} onChange={setTab} /></div>
        {tab === 'results' && <ResultsTab />}
        {tab === 'codes' && <CodesTab />}
        {tab === 'players' && <PlayersTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </main>
  );
}
