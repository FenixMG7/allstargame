Je vais créer une version avec des données mockées pour que vous puissiez voir le preview du terrain sans avoir besoin de Supabase.
Action: file_editor create /app/src/app/preview/page.tsx --file-text "'use client';

import { useState, useEffect } from 'react';

// Positions ajustées pour la vue perspective 3D du demi-terrain
const COURT_POSITIONS = [
  { top: '82%', left: '50%', label: 'Meneur' },
  { top: '58%', left: '15%', label: 'Ailier G' },
  { top: '58%', left: '85%', label: 'Ailier D' },
  { top: '28%', left: '28%', label: 'Intérieur G' },
  { top: '28%', left: '72%', label: 'Intérieur D' },
];

// Données mockées pour le preview
const MOCK_PLAYERS = [
  { id: '1', first_name: 'LeBron', last_name: 'James', photo_url: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', votes: 156, bonuses: 45 },
  { id: '2', first_name: 'Stephen', last_name: 'Curry', photo_url: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png', votes: 142, bonuses: 38 },
  { id: '3', first_name: 'Kevin', last_name: 'Durant', photo_url: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png', votes: 128, bonuses: 32 },
  { id: '4', first_name: 'Giannis', last_name: 'Antetokounmpo', photo_url: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png', votes: 115, bonuses: 28 },
  { id: '5', first_name: 'Nikola', last_name: 'Jokic', photo_url: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png', votes: 98, bonuses: 52 },
];

// Composant SVG du terrain de basket en perspective 3D avec effet néon
function BasketballCourt3D() {
  return (
    <svg
      className=\"absolute inset-0 w-full h-full\"
      viewBox=\"0 0 400 500\"
      preserveAspectRatio=\"xMidYMid slice\"
    >
      <defs>
        <filter id=\"glow-orange\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\">
          <feGaussianBlur stdDeviation=\"3\" result=\"blur\"/>
          <feMerge>
            <feMergeNode in=\"blur\"/>
            <feMergeNode in=\"SourceGraphic\"/>
          </feMerge>
        </filter>
        <filter id=\"glow-white\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\">
          <feGaussianBlur stdDeviation=\"2\" result=\"blur\"/>
          <feMerge>
            <feMergeNode in=\"blur\"/>
            <feMergeNode in=\"SourceGraphic\"/>
          </feMerge>
        </filter>
        <filter id=\"glow-strong\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\">
          <feGaussianBlur stdDeviation=\"4\" result=\"blur\"/>
          <feMerge>
            <feMergeNode in=\"blur\"/>
            <feMergeNode in=\"blur\"/>
            <feMergeNode in=\"SourceGraphic\"/>
          </feMerge>
        </filter>
        <linearGradient id=\"courtGradient\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">
          <stop offset=\"0%\" stopColor=\"#0a0a0a\"/>
          <stop offset=\"50%\" stopColor=\"#121212\"/>
          <stop offset=\"100%\" stopColor=\"#1a1a1a\"/>
        </linearGradient>
        <radialGradient id=\"rimGlow\" cx=\"50%\" cy=\"50%\" r=\"80%\">
          <stop offset=\"0%\" stopColor=\"#E8651A\" stopOpacity=\"0.8\"/>
          <stop offset=\"100%\" stopColor=\"#E8651A\" stopOpacity=\"0\"/>
        </radialGradient>
      </defs>

      {/* Fond du terrain en perspective */}
      <polygon 
        points=\"40,500 360,500 320,80 80,80\" 
        fill=\"url(#courtGradient)\"
        stroke=\"rgba(232,101,26,0.3)\"
        strokeWidth=\"2\"
      />
      
      {/* Lignes extérieures */}
      <g stroke=\"rgba(255,255,255,0.6)\" strokeWidth=\"1.5\" fill=\"none\" filter=\"url(#glow-white)\">
        <line x1=\"80\" y1=\"80\" x2=\"320\" y2=\"80\"/>
        <line x1=\"40\" y1=\"500\" x2=\"80\" y2=\"80\"/>
        <line x1=\"360\" y1=\"500\" x2=\"320\" y2=\"80\"/>
        <line x1=\"40\" y1=\"500\" x2=\"360\" y2=\"500\"/>
      </g>

      {/* Raquette en perspective */}
      <g stroke=\"rgba(232,101,26,0.7)\" strokeWidth=\"2\" fill=\"none\" filter=\"url(#glow-orange)\">
        <polygon points=\"140,80 260,80 240,220 160,220\"/>
        <line x1=\"160\" y1=\"220\" x2=\"240\" y2=\"220\"/>
      </g>
      
      {/* Cercle des lancers francs */}
      <ellipse 
        cx=\"200\" cy=\"220\" rx=\"40\" ry=\"25\"
        stroke=\"rgba(232,101,26,0.6)\" strokeWidth=\"1.5\" fill=\"none\"
        filter=\"url(#glow-orange)\"
      />
      <path 
        d=\"M 160 220 A 40 25 0 0 1 240 220\" 
        stroke=\"rgba(255,255,255,0.3)\" strokeWidth=\"1\" strokeDasharray=\"8,6\" fill=\"none\"
      />

      {/* Ligne à 3 points */}
      <g stroke=\"rgba(255,255,255,0.5)\" strokeWidth=\"1.5\" fill=\"none\" filter=\"url(#glow-white)\">
        <line x1=\"100\" y1=\"80\" x2=\"75\" y2=\"280\"/>
        <line x1=\"300\" y1=\"80\" x2=\"325\" y2=\"280\"/>
        <path d=\"M 75 280 Q 200 400 325 280\"/>
      </g>

      {/* Zone restrictive */}
      <path d=\"M 170 130 Q 200 155 230 130\" stroke=\"rgba(255,255,255,0.3)\" strokeWidth=\"1\" fill=\"none\"/>

      {/* Panneau */}
      <line x1=\"175\" y1=\"95\" x2=\"225\" y2=\"95\" stroke=\"rgba(255,255,255,0.8)\" strokeWidth=\"3\" filter=\"url(#glow-white)\"/>
      <line x1=\"200\" y1=\"95\" x2=\"200\" y2=\"110\" stroke=\"rgba(255,255,255,0.5)\" strokeWidth=\"1.5\"/>

      {/* Cerceau avec glow orange */}
      <circle cx=\"200\" cy=\"115\" r=\"12\" fill=\"url(#rimGlow)\"/>
      <circle cx=\"200\" cy=\"115\" r=\"12\" stroke=\"#E8651A\" strokeWidth=\"3\" fill=\"none\" filter=\"url(#glow-strong)\"/>
      
      {/* Filet */}
      <g stroke=\"rgba(255,255,255,0.2)\" strokeWidth=\"0.5\">
        <line x1=\"192\" y1=\"127\" x2=\"195\" y2=\"145\"/>
        <line x1=\"200\" y1=\"127\" x2=\"200\" y2=\"148\"/>
        <line x1=\"208\" y1=\"127\" x2=\"205\" y2=\"145\"/>
      </g>

      {/* Cercle central */}
      <path d=\"M 130 500 A 70 40 0 0 1 270 500\" stroke=\"rgba(232,101,26,0.5)\" strokeWidth=\"2\" fill=\"none\" filter=\"url(#glow-orange)\"/>
      <circle cx=\"200\" cy=\"500\" r=\"4\" fill=\"#E8651A\" filter=\"url(#glow-orange)\"/>

      {/* Marqueurs raquette */}
      <g stroke=\"rgba(255,255,255,0.4)\" strokeWidth=\"1\">
        <line x1=\"145\" y1=\"140\" x2=\"155\" y2=\"140\"/>
        <line x1=\"145\" y1=\"165\" x2=\"155\" y2=\"165\"/>
        <line x1=\"145\" y1=\"190\" x2=\"155\" y2=\"190\"/>
        <line x1=\"245\" y1=\"140\" x2=\"255\" y2=\"140\"/>
        <line x1=\"245\" y1=\"165\" x2=\"255\" y2=\"165\"/>
        <line x1=\"245\" y1=\"190\" x2=\"255\" y2=\"190\"/>
      </g>
    </svg>
  );
}

function StarFrame({ isBonus }: { isBonus: boolean }) {
  const color = isBonus ? '#FFD700' : '#E8651A';
  return (
    <svg className=\"absolute inset-0 w-full h-full\" viewBox=\"0 0 100 100\">
      <defs>
        <filter id={`star-glow-${isBonus ? 'gold' : 'orange'}`} x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\">
          <feGaussianBlur stdDeviation=\"2\" result=\"blur\"/>
          <feMerge>
            <feMergeNode in=\"blur\"/>
            <feMergeNode in=\"SourceGraphic\"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx=\"50\" cy=\"50\" r=\"45\" fill=\"none\" stroke={color} strokeWidth=\"3\"
        filter={`url(#star-glow-${isBonus ? 'gold' : 'orange'})`} opacity=\"0.8\"/>
    </svg>
  );
}

interface CourtPlayerProps {
  player: typeof MOCK_PLAYERS[0];
  position: typeof COURT_POSITIONS[0];
  isBonus: boolean;
  rank: number;
  animDelay: number;
}

function CourtPlayer({ player, position, isBonus, rank, animDelay }: CourtPlayerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  const badgeBg = rank === 1 ? '#FFD700' : '#E8651A';
  const badgeColor = rank === 1 ? 'black' : 'white';
  const nameColor = isBonus ? '#FFD700' : 'white';

  return (
    <div
      className=\"absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group\"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.3})`,
        transition: `opacity 0.5s ease ${animDelay}ms, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}ms`,
      }}
    >
      {isBonus && (
        <div
          className=\"absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold text-black px-2 py-0.5 rounded-full z-30 tracking-wide\"
          style={{ background: 'linear-gradient(90deg, #FFDF00, #D4AF37)', boxShadow: '0 0 15px rgba(255,215,0,0.9)' }}
        >
          ⭐ BONUS
        </div>
      )}

      <div className=\"relative\" style={{ width: 66, height: 66 }}>
        <StarFrame isBonus={isBonus} />
        <div
          className=\"absolute rounded-full overflow-hidden border-2 border-[#0A0A0A]\"
          style={{ zIndex: 2, top: 6, left: 6, right: 6, bottom: 6, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.6)' }}
        >
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.last_name} className=\"w-full h-full object-cover object-top filter contrast-110 saturate-110\"/>
          ) : (
            <div className=\"w-full h-full bg-[#1A1A1A] flex items-center justify-center\">
              <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: '#E8651A' }} className=\"text-lg\">
                {player.first_name[0]}{player.last_name[0]}
              </span>
            </div>
          )}
        </div>
        <div
          className=\"absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-[2.5px] border-[#0A0A0A]\"
          style={{ background: badgeBg, zIndex: 3, boxShadow: `0 0 10px ${badgeBg}80` }}
        >
          <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: badgeColor, fontSize: 12, paddingTop: '1px' }}>{rank}</span>
        </div>
      </div>

      <div className=\"text-center mt-3 bg-[#0A0A0A]/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5\">
        <p style={{ fontFamily: 'Bebas Neue,sans-serif', color: nameColor, textShadow: '0 2px 4px rgba(0,0,0,1)', fontSize: 13, letterSpacing: '0.5px' }} className=\"leading-none\">
          {player.last_name.toUpperCase()}
        </p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '2px' }}>
          {player.votes} <span className=\"text-white/40\">votes</span>
        </p>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const [view, setView] = useState<'terrain' | 'classement'>('terrain');
  const [animKey, setAnimKey] = useState(0);
  const totalVotes = MOCK_PLAYERS.reduce((acc, p) => acc + p.votes, 0);
  const maxVotes = MOCK_PLAYERS[0].votes;
  
  // Le joueur avec le plus de bonus
  const bonusLeader = MOCK_PLAYERS.reduce((a, b) => a.bonuses > b.bonuses ? a : b);

  return (
    <main className=\"min-h-screen pb-16 px-4 py-8 bg-[#050505]\">
      <style>{`
        .spinner { border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      <div className=\"max-w-lg mx-auto flex flex-col gap-6\">
        {/* Badge Preview */}
        <div className=\"bg-orange-500/20 border border-orange-500/50 rounded-lg px-4 py-2 text-center\">
          <span className=\"text-orange-400 text-sm font-semibold\">🎨 MODE PREVIEW - Données mockées</span>
        </div>

        <div className=\"flex flex-col items-center gap-2 text-center\">
          <div className=\"w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center animate-float\">
            <span className=\"text-3xl\">🏀</span>
          </div>
          <h1 style={{ fontFamily: 'Bebas Neue,sans-serif' }} className=\"text-5xl text-white tracking-wide drop-shadow-lg\">RÉSULTATS</h1>
          <p className=\"text-white/50 text-sm tracking-wider uppercase font-semibold\">All-Star Game · CSL Basket</p>
          <div className=\"flex items-center gap-2 mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/10\">
            <div className=\"w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]\" />
            <span className=\"text-xs text-white/60 font-medium\">{totalVotes} votes exprimés · Live</span>
          </div>
        </div>

        <div className=\"flex bg-[#111] rounded-xl p-1.5 border border-white/5 shadow-inner\">
          {[{ id: 'terrain', label: '🏀 Terrain' }, { id: 'classement', label: '📊 Classement' }].map(v => (
            <button
              key={v.id}
              onClick={() => { setView(v.id as 'terrain' | 'classement'); setAnimKey(k => k + 1); }}
              className=\"flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300\"
              style={{
                background: view === v.id ? '#E8651A' : 'transparent',
                color: view === v.id ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: view === v.id ? '0 4px 15px rgba(232,101,26,0.4)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'terrain' && (
          <div className=\"flex flex-col gap-4\">
            <p className=\"text-center text-[#E8651A] font-bold text-xs uppercase tracking-[0.2em]\">Le 5 Majeur</p>
            <div
              key={animKey}
              className=\"relative w-full rounded-2xl overflow-hidden\"
              style={{
                paddingBottom: '125%',
                background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #121212 100%)',
                border: '1px solid rgba(232,101,26,0.2)',
                boxShadow: '0 0 60px rgba(232,101,26,0.15), 0 20px 50px -10px rgba(0,0,0,0.9), inset 0 0 100px rgba(232,101,26,0.05)',
              }}
            >
              <div className=\"absolute inset-0\">
                <BasketballCourt3D />
                <div className=\"absolute\" style={{ top: '45%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.05, zIndex: 1 }}>
                  <div className=\"w-28 h-28 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full flex items-center justify-center\">
                    <span className=\"text-6xl opacity-50\">🏀</span>
                  </div>
                </div>
                {MOCK_PLAYERS.map((player, i) => (
                  <CourtPlayer
                    key={`${player.id}-${animKey}`}
                    player={player}
                    position={COURT_POSITIONS[i]}
                    isBonus={bonusLeader.id === player.id}
                    rank={i + 1}
                    animDelay={i * 200}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'classement' && (
          <div className=\"flex flex-col gap-3\">
            {MOCK_PLAYERS.map((player, i) => (
              <div
                key={player.id}
                className=\"flex items-center gap-3 p-3.5 rounded-xl border transition-all\"
                style={{
                  borderColor: i < 5 ? 'rgba(232,101,26,0.3)' : 'rgba(255,255,255,0.05)',
                  background: i < 5 ? 'linear-gradient(90deg, rgba(232,101,26,0.1) 0%, rgba(10,10,10,1) 100%)' : '#0A0A0A',
                }}
              >
                <div className=\"w-8 text-center flex-shrink-0 drop-shadow-md\">
                  {i < 3 ? <span className=\"text-2xl\">{['🥇','🥈','🥉'][i]}</span> : (
                    <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: i < 5 ? '#E8651A' : 'rgba(255,255,255,0.2)' }} className=\"text-2xl\">{i + 1}</span>
                  )}
                </div>
                <div className=\"w-11 h-11 rounded-full overflow-hidden bg-[#1E1E1E] flex-shrink-0 flex items-center justify-center border-2\" style={{ borderColor: i < 5 ? '#E8651A' : '#333' }}>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.last_name} className=\"w-full h-full object-cover\" />
                  ) : (
                    <span style={{ fontFamily: 'Bebas Neue,sans-serif', color: 'rgba(232,101,26,0.5)' }} className=\"text-lg\">{player.first_name[0]}</span>
                  )}
                </div>
                <div className=\"flex-1 min-w-0 pr-2\">
                  <div className=\"flex items-center justify-between mb-1.5\">
                    <span className=\"font-bold text-sm truncate tracking-wide\" style={{ color: i < 5 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                      {player.first_name} {player.last_name.toUpperCase()}
                    </span>
                    <div className=\"flex items-center gap-2 ml-2 flex-shrink-0\">
                      {player.bonuses > 0 && <span className=\"text-xs text-[#FFD700] drop-shadow-md\">⭐×{player.bonuses}</span>}
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif' }} className=\"text-xl text-[#E8651A]\">{player.votes}</span>
                    </div>
                  </div>
                  <div className=\"h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5\">
                    <div
                      className=\"h-full rounded-full transition-all duration-1000 ease-out relative\"
                      style={{ width: `${(player.votes / maxVotes) * 100}%`, background: i < 5 ? 'linear-gradient(90deg, #A04000, #E8651A)' : '#333' }}
                    >
                      {i < 5 && <div className=\"absolute inset-0 bg-white/20 w-1/2 blur-sm\" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
"
Observation: Create successful: /app/src/app/preview/page.tsx
