'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Network, Bot, Zap, Crosshair, Package, Lock, Key, UserMinus } from 'lucide-react';

/* ── Animated scanning line ── */
function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute left-0 right-0 h-[2px] opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #06b6d4 30%, #06b6d4 70%, transparent 100%)',
          animation: 'scanDown 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/* ── Floating particle field ── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(6, 182, 212, ${p.o})`;
        ctx!.fill();
      }
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(6, 182, 212, ${0.06 * (1 - dist / 120)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}

/* ── Feature card ── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group glass-panel p-6 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)] hover:-translate-y-1">
      <div className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2 font-mono tracking-wide">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Stat counter ── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold text-cyan-400 font-mono" style={{ textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
        {value}
      </div>
      <div className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-1">{label}</div>
    </div>
  );
}

/* ── Tech badge ── */
function TechBadge({ name }: { name: string }) {
  return (
    <span className="px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/30 text-cyan-300 text-[11px] font-mono font-bold tracking-wider hover:bg-cyan-900/40 hover:border-cyan-400/40 transition-all duration-300">
      {name}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030712]">
      <ParticleField />

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <ScanLine />

        {/* Corner HUD brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-cyan-500/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-cyan-500/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-red-500/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-red-500/30" />

        {/* Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl bg-cyan-500/10 rounded-full scale-150" />
          <div className="relative w-28 h-28 rounded-2xl border-2 border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.2)] backdrop-blur-sm">
            <Image src="/icon.svg" alt="SIFT.Glass" width={80} height={80} className="drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4">
          <span className="text-white" style={{ textShadow: '0 0 30px rgba(255,255,255,0.15)' }}>SIFT</span>
          <span className="text-cyan-400" style={{ textShadow: '0 0 40px rgba(6,182,212,0.6)' }}>.Glass</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-2 leading-relaxed">
          AI-powered incident response that <span className="text-cyan-300 font-semibold">finds evil</span> in real time.
        </p>
        <p className="text-sm text-zinc-500 font-mono tracking-wide mb-10">
          Watch an autonomous agent investigate, correlate, and reconstruct attack kill chains — live.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="group relative px-8 py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-500 bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              LAUNCH DASHBOARD
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <a
            href="#features"
            className="px-8 py-4 rounded-xl font-bold text-base tracking-wide border border-zinc-700 text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-all duration-300"
          >
            LEARN MORE
          </a>
        </div>

        {/* Stats row */}
        <div className="flex gap-12 md:gap-20">
          <Stat value="4" label="Scenarios" />
          <Stat value="<200ms" label="Detection" />
          <Stat value="91%" label="Confidence" />
          <Stat value="24/7" label="Autonomous" />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 animate-bounce">
          <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative z-10 px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-cyan-400/60 uppercase">Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 mb-4">
            Built for <span className="text-cyan-400">Finding Evil</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            An autonomous investigation engine powered by OpenClaw MCP tools, real-time Supabase streaming, and interactive attack graph visualization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Network size={32} strokeWidth={1.5} />}
            title="Attack Graph"
            desc="Interactive React Flow visualization maps attack chains across IPs, hashes, files, domains, and processes in real time."
          />
          <FeatureCard
            icon={<Bot size={32} strokeWidth={1.5} />}
            title="AI Agent"
            desc="Autonomous OpenClaw-powered agent investigates alerts, queries VirusTotal, AbuseIPDB, and correlates across data sources."
          />
          <FeatureCard
            icon={<Zap size={32} strokeWidth={1.5} />}
            title="Real-Time"
            desc="Live Supabase Realtime subscriptions push investigation updates instantly — no polling, no refresh needed."
          />
          <FeatureCard
            icon={<Crosshair size={32} strokeWidth={1.5} />}
            title="Kill Chains"
            desc="Agent reconstructs complete attack narratives — from initial access through lateral movement to data exfiltration."
          />
        </div>
      </section>

      {/* ── SCENARIOS SECTION ── */}
      <section className="relative z-10 px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-cyan-400/60 uppercase">Investigations</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 mb-4">
            4 Pre-Built <span className="text-red-400">Threat Scenarios</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <Package size={32} strokeWidth={1.5} />, name: 'Supply-Chain Attack', desc: 'Malicious npm package drops reverse shell, exfiltrates data to C2 server via TLS.' },
            { icon: <Lock size={32} strokeWidth={1.5} />, name: 'Ransomware Outbreak', desc: 'LockBit variant encrypts hospital network, spreads via SMB exploitation.' },
            { icon: <Key size={32} strokeWidth={1.5} />, name: 'Credential Stuffing', desc: 'Botnet uses leaked credentials to breach corporate SSO and pivot internally.' },
            { icon: <UserMinus size={32} strokeWidth={1.5} />, name: 'Insider Threat', desc: 'Privileged engineer exfiltrates source code via encrypted USB and Tor network.' },
          ].map((s) => (
            <div key={s.name} className="glass-panel p-6 flex items-start gap-4 hover:border-cyan-500/20 transition-all duration-300 group">
              <span className="text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform">{s.icon}</span>
              <div>
                <h3 className="text-base font-bold text-white font-mono tracking-wide mb-1">{s.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK SECTION ── */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto text-center">
        <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-cyan-400/60 uppercase">Tech Stack</span>
        <h2 className="text-3xl font-extrabold text-white mt-3 mb-8">
          Production-Grade <span className="text-cyan-400">Architecture</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4', 'React Flow', 'Supabase Realtime', 'OpenClaw MCP', 'Python Agent', 'VirusTotal', 'AbuseIPDB'].map((t) => (
            <TechBadge key={t} name={t} />
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 px-6 py-32 text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 blur-3xl bg-cyan-500/5 rounded-full scale-150" />
          <h2 className="relative text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to <span className="text-red-400">Find Evil</span>?
          </h2>
        </div>
        <p className="text-zinc-400 mb-10 max-w-lg mx-auto">
          Launch the SOC dashboard and watch the AI agent investigate threats in real time.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-xl font-bold text-lg bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_60px_rgba(6,182,212,0.4)] transition-all duration-500 active:scale-95"
        >
          LAUNCH DASHBOARD
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

      {/* ── SPONSORS SECTION ── */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="glass-panel p-8 md:p-12 text-center">
          <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-cyan-400/60 uppercase">Hackathon</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3 mb-2">
            FIND EVIL! <span className="text-red-400">2026</span>
          </h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-lg mx-auto">
            The first hackathon for autonomous incident response. $22,000 in prizes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-2">Organized by</div>
              <div className="text-lg font-bold text-white">SANS Institute</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-2">Platform</div>
              <div className="text-lg font-bold text-white">SIFT Workstation</div>
              <div className="text-xs text-zinc-500 mt-1">+ Protocol SIFT (MCP)</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-2">Prizes</div>
              <div className="text-lg font-bold text-white">$22,000+</div>
              <div className="text-xs text-zinc-500 mt-1">Cash + SANS courses</div>
            </div>
          </div>

          <a
            href="https://findevil.devpost.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            findevil.devpost.com
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-xs text-zinc-600 font-mono">
          SIFT.Glass — SANS &quot;Find Evil!&quot; AI Hackathon 2026
        </p>
      </footer>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes scanDown {
          0% { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
