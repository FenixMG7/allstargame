'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOver, setIsOver] = useState(false);
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setIsOver(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return { timeLeft, isOver };
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#141414] rounded-lg overflow-hidden flex items-center justify-center" style={{boxShadow:'0 0 0 1px rgba(232,101,26,0.3)'}}>
        <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-4xl sm:text-5xl text-[#E8651A] leading-none">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState('ALL-STAR GAME');
  const [eventDate, setEventDate] = useState('2026-04-01T20:00:00');
  const [isOpen, setIsOpen] = useState(false);

  const { timeLeft, isOver } = useCountdown(eventDate);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('vote_settings').select('*').single();
      if (data) {
        setEventName(data.event_name);
        setEventDate(data.event_date);
        setIsOpen(data.is_open);
      }
    }
    fetchSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    const cleanCode = code.trim().toUpperCase();
    const { data, error: err } = await supabase
      .from('voting_codes')
      .select('id, status')
      .eq('code', cleanCode)
      .single();
    setLoading(false);
    if (err || !data) { setError('❌ Code invalide. Vérifiez votre code et réessayez.'); return; }
    if (data.status === 'used') { setError('⚠️ Ce code a déjà été utilisé pour voter.'); return; }
    if (data.status === 'disabled') { setError('🚫 Ce code a été désactivé.'); return; }
    sessionStorage.setItem('vote_code_id', data.id);
    sessionStorage.setItem('vote_code', cleanCode);
    router.push('/vote');
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8651A] to-transparent opacity-60" />

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8 page-enter">

        {/* Logo CSL */}
        <div className="flex flex-col items-center gap-3 animate-float">
          <img
            src="/logo.png"
            alt="CSL Basket St Vallier"
            className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(232,101,26,0.5)]"
          />
        </div>

        <div className="text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#E8651A]" />
            <span className="text-[#E8651A] text-xs uppercase tracking-[0.3em] font-semibold">CSL Basket St Vallier</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#E8651A]" />
          </div>
          <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-7xl sm:text-8xl text-white leading-none tracking-wide glow-text">
            {eventName}
          </h1>
          <div className="flex gap-2 mt-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} viewBox="0 0 51 49" className="w-5 h-5" fill="#E8651A">
                <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
              </svg>
            ))}
          </div>
        </div>

        {!isOver && (
          <div className="w-full">
            <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-4">
              {isOpen ? 'Vote clôture dans' : 'Le vote ouvre dans'}
            </p>
            <div className="flex justify-center gap-3 sm:gap-5">
              <FlipDigit value={timeLeft.days} label="Jours" />
              <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-[#E8651A] self-center pb-5">:</span>
              <FlipDigit value={timeLeft.hours} label="Heures" />
              <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-[#E8651A] self-center pb-5">:</span>
              <FlipDigit value={timeLeft.minutes} label="Min" />
              <span style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-3xl text-[#E8651A] self-center pb-5">:</span>
              <FlipDigit value={timeLeft.seconds} label="Sec" />
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="w-full text-center py-4 px-6 rounded-xl bg-[#141414] border border-[#1E1E1E]">
            <p className="text-white/60">Le vote n&apos;est pas encore ouvert.</p>
            <p className="text-white/40 text-sm mt-1">Revenez bientôt !</p>
          </div>
        )}

        {isOpen && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-white/60 text-sm uppercase tracking-wider">Votre code de vote</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="Ex : ASG-X7K2-P9QR"
                className="w-full bg-[#141414] border border-[#1E1E1E] rounded-xl px-5 py-4 text-2xl text-center text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A] transition-all tracking-widest uppercase"
                style={{fontFamily:'Bebas Neue,sans-serif'}}
                maxLength={15}
                autoComplete="off"
              />
              {error && <p className="text-red-400 text-sm text-center mt-1 animate-fade-in">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-shimmer w-full bg-[#E8651A] hover:bg-[#FF8040] disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.5rem', letterSpacing:'0.05em', boxShadow:'0 0 0 2px #E8651A, 0 0 30px rgba(232,101,26,0.5)'}}
            >
              {loading ? <><div className="spinner" /> Vérification...</> : <>
                <svg viewBox="0 0 51 49" className="w-6 h-6" fill="currentColor">
                  <path d="M25.5 0L31.4 18.6H51L35.8 30.1L41.7 48.7L25.5 37.2L9.3 48.7L15.2 30.1L0 18.6H19.6L25.5 0Z" />
                </svg>
                VOTER MAINTENANT
              </>}
            </button>
          </form>
        )}

        <p className="text-white/25 text-xs text-center mt-4 leading-relaxed">
          Un code par personne · Vote unique et définitif<br />
          CSL Basket St Vallier
        </p>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8651A] to-transparent opacity-30" />
    </main>
  );
}
