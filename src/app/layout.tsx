import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "All-Star Game — Vote",
  description: "Votez pour vos 5 joueurs préférés du All-Star Game",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="gradient-mesh min-h-screen">
        <div className="noise-overlay" />
        <ParticlesBackground />
        <div className="relative z-10">
          {children}
        </div>
        {/* Analyse des performances Vercel */}
        <SpeedInsights />
      </body>
    </html>
  );
}

function ParticlesBackground() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5.3) % 100}%`,
    delay: `${(i * 0.7) % 8}s`,
    duration: `${6 + (i % 5)}s`,
    size: `${2 + (i % 3)}px`,
    drift: `${((i % 7) - 3) * 20}px`,
  }));

  return (
    <div className="particles-bg">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--drift': p.drift,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
