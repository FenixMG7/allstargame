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

        <div className="flex flex-col items-center gap-3 animate-float">
          <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center text-3xl border border-[#E8651A]/30" style={{boxShadow:'0 0 0 2px #E8651A, 0 0 30px rgba(232,101,26,0.5)'}}>
            🏀
          </div>
          <p className="text-white/50 text-xs uppercase tracking-widest">Votre Club</p>
        </div>

        <div className="tex
