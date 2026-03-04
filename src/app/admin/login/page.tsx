'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Code secret bypass
    if (email === '01234' && password === '01234') {
      sessionStorage.setItem('admin_bypass', 'true');
      router.push('/admin');
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (err) { setError('Email ou mot de passe incorrect.'); return; }
    router.push('/admin');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#141414] border border-[#E8651A]/30 mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 style={{fontFamily:'Bebas Neue,sans-serif'}} className="text-4xl text-white">ADMIN</h1>
          <p className="text-white/40 text-sm mt-1">Espace d&apos;administration</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-white/50 text-xs uppercase tracking-wider">Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@monclub.fr"
              className="w-full bg-[#141414] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A] transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-white/50 text-xs uppercase tracking-wider">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#141414] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8651A] transition-all"
              required
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full text-white py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            style={{fontFamily:'Bebas Neue,sans-serif', fontSize:'1.25rem', letterSpacing:'0.05em', background:'#E8651A'}}
          >
            {loading ? <><div className="spinner" /> Connexion...</> : 'SE CONNECTER'}
          </button>
        </form>
      </div>
    </main>
  );
}
