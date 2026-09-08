import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Bot, ShieldCheck, Zap } from 'lucide-react';

export default function IndustrialBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracker
    const mouse = {
      x: null,
      y: null,
      radius: 130
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Particle nodes (simulating plant sensor telemetry nodes)
    let particles = [];
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);

    const colors = [
      'rgba(56, 189, 248, ',  // sky-400
      'rgba(99, 102, 241, ',  // indigo-500
      'rgba(16, 185, 129, ',  // emerald-500
      'rgba(147, 197, 253, '  // blue-300
    ];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1.2;
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        this.baseAlpha = Math.random() * 0.4 + 0.3;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(time) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce from borders
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Subtle mouse repulsion/interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.x -= Math.cos(angle) * force * 2;
            this.y -= Math.sin(angle) * force * 2;
          }
        }

        // Pulse alpha
        this.currentAlpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.2;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.baseColor}${Math.max(0.1, Math.min(1, this.currentAlpha))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${this.baseColor}0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    initParticles();

    let startTime = performance.now();

    const animate = (currentTime) => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = currentTime - startTime;

      // Draw connecting telemetry lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 125;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // Connect to mouse if close
      if (mouse.x !== null && mouse.y !== null) {
        for (let i = 0; i < particles.length; i++) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(elapsed);
        particles[i].draw();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#070c18]">
      {/* 1. Luces Aurora / Nebulosas Animadas con Pulsos Suaves */}
      <div 
        className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-indigo-600/10 blur-[130px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div 
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-indigo-600/25 via-purple-600/15 to-blue-500/10 blur-[140px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
      <div 
        className="absolute -bottom-32 left-1/4 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-cyan-500/10 blur-[120px] animate-pulse"
        style={{ animationDuration: '9s', animationDelay: '4s' }}
      />

      {/* 2. Cuadrícula Tecnológica de Ingeniería (Cyber Grid) */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* 3. Canvas Interactivo de Nodos de Telemetría */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4. Viñeta perimetral suave para enfocar el centro */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(7,12,24,0.75)_100%)]" />

      {/* 5. Micro-Tarjetas Flotantes de Telemetría Industrial (Desktop) */}
      <div className="hidden xl:block absolute inset-0 max-w-7xl mx-auto pointer-events-none">
        {/* Chip Flotante 1 (Izquierda Superior) */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 left-8 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-3 text-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
            <Activity size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <span>Línea Metalmecánica</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <span className="text-[10px] text-slate-400">OEE 89.4% • 32 Activos Operativos</span>
          </div>
        </motion.div>

        {/* Chip Flotante 2 (Izquierda Inferior) */}
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [0, -1, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-28 left-12 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-3 text-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xs">
            <Cpu size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-100">Red IoT Industrial</div>
            <span className="text-[10px] text-slate-400">48 Sensores de Presión & Temp</span>
          </div>
        </motion.div>

        {/* Chip Flotante 3 (Derecha Superior) */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, -1, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-36 right-8 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-3 text-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xs">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <span>DeepSeek V4 Flash</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">IA RAG</span>
            </div>
            <span className="text-[10px] text-slate-400">Diagnóstico Predictivo Listo</span>
          </div>
        </motion.div>

        {/* Chip Flotante 4 (Derecha Inferior) */}
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, 1, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-24 right-12 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-3 text-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xs">
            <Zap size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-100">Protocolo LOTO Seguro</div>
            <span className="text-[10px] text-slate-400">0 Incidentes • Azure SQL Activo</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
