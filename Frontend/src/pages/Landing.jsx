import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Cpu, 
  DollarSign, 
  Wrench, 
  Boxes, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Server,
  Layers,
  X,
  Play,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calculator,
  ChevronRight,
  Database,
  Lock,
  Zap,
  Users
} from 'lucide-react';

export default function Landing({ onNavigateToLogin }) {
  const [showArchModal, setShowArchModal] = useState(false);
  const [demoTab, setDemoTab] = useState('workorders'); // 'workorders' | 'kpis' | 'ai'
  
  // Estado para la calculadora interactiva de ROI
  const [machinesCount, setMachinesCount] = useState(25);
  const [downtimeHours, setDowntimeHours] = useState(12);
  const hourlyCostUSD = 180; // Costo promedio por hora de parada en línea industrial
  const estimatedSavings = Math.round(machinesCount * (downtimeHours * 0.35) * hourlyCostUSD);
  const hoursRecovered = Math.round(machinesCount * (downtimeHours * 0.35));

  // Simulación de interacción en el Copiloto IA
  const [aiDemoRunning, setAiDemoRunning] = useState(false);
  const [aiDemoResult, setAiDemoResult] = useState(null);

  const runAiDemo = () => {
    setAiDemoRunning(true);
    setAiDemoResult(null);
    setTimeout(() => {
      setAiDemoResult({
        causes: ['Válvula solenoide 4/3 atascada por sedimento', 'Baja presión de precarga en acumulador'],
        steps: ['1. Realizar purga y verificación de manómetro primario', '2. Limpieza de cartucho de filtro 10 micras', '3. Calibración de presostato diferencial'],
        loto: 'Protocolo LOTO: Bloquear disyuntor QF-04 y despresurizar línea hidráulica antes de intervenir.'
      });
      setAiDemoRunning(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* Fondos y Luces Aurora Animadas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-sky-200/40 via-blue-200/30 to-indigo-200/40 blur-[100px] pointer-events-none -z-10 rounded-full animate-pulse-glow" />
      <div className="absolute top-96 right-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/40 to-teal-200/30 blur-[90px] pointer-events-none -z-10 rounded-full" />
      
      {/* Trama de cuadrícula de ingeniería (Dot Grid) */}
      <div className="absolute inset-0 bg-dot-grid bg-dot-grid-mask pointer-events-none -z-10" />

      {/* Navbar Superior Sticky */}
      <header className="h-16 px-6 md:px-12 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-base shadow-sm ring-1 ring-slate-950/10">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">GRUPO SOLE</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">CMMS v4.2</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-none">División Rinnai Perú</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>Azure SQL Online • 16ms</span>
          </div>

          <button 
            onClick={onNavigateToLogin}
            className="btn btn-primary text-xs py-2 px-4 shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 group"
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto text-center relative">
        
        {/* Badge superior animado */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs mb-6 cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => setShowArchModal(true)}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span className="text-slate-800 font-medium">Nueva Generación CMMS Industrial</span>
          <span className="text-slate-400">|</span>
          <span className="text-blue-600 font-semibold flex items-center gap-1">
            Ver Arquitectura <ChevronRight size={13} />
          </span>
        </motion.div>

        {/* Titular Principal */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6"
        >
          El control total de planta y mantenimiento{' '}
          <span className="gradient-text-hero">
            que maximiza la disponibilidad.
          </span>
        </motion.h1>

        {/* Subtítulo enfocado en valor comercial */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Diseñado para <strong>Corporación Rinnai</strong>. Unifica órdenes de trabajo, cronogramas preventivos, imputación contable por Centros de Costo (CECO), <strong>canibalización de repuestos al $0</strong> y diagnóstico predictivo asistido por IA.
        </motion.p>

        {/* Botones de Acción */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-3 flex-wrap mb-14"
        >
          <button 
            onClick={onNavigateToLogin}
            className="btn btn-primary py-3 px-6 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
          >
            <span>Acceder a la Plataforma</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => {
              const demoElem = document.getElementById('demo-interactive');
              if (demoElem) demoElem.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn btn-secondary py-3 px-5 text-sm font-semibold"
          >
            Ver Simulación Interactiva ↓
          </button>
        </motion.div>

        {/* ========================================================================= */}
        {/* HERO SHOWCASE CARD INTERACTIVO (El producto en vivo) */}
        {/* ========================================================================= */}
        <motion.div 
          id="demo-interactive"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto perspective-1000"
        >
          {/* Badge Flotante Superior Izquierdo */}
          <div className="hidden lg:flex items-center gap-3 p-3 px-4 rounded-xl glass-card text-xs font-semibold text-slate-800 shadow-lg absolute -top-6 -left-6 z-20 animate-float">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <div className="text-left">
              <div className="text-slate-900 font-bold">-38% Tiempo de Parada</div>
              <div className="text-slate-500 text-[11px]">Planta Industrial-01</div>
            </div>
          </div>

          {/* Badge Flotante Inferior Derecho */}
          <div className="hidden lg:flex items-center gap-3 p-3 px-4 rounded-xl glass-card text-xs font-semibold text-slate-800 shadow-lg absolute -bottom-6 -right-6 z-20 animate-float-slow">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
            <div className="text-left">
              <div className="text-slate-900 font-bold">$14,200 USD Ahorrados</div>
              <div className="text-slate-500 text-[11px]">Trazabilidad Canibalización $0</div>
            </div>
          </div>

          {/* Contenedor Mockup 3D */}
          <div className="mockup-3d bg-white rounded-2xl border border-slate-200/90 overflow-hidden text-left shadow-2xl">
            {/* Barra de Ventana Mac-Style */}
            <div className="h-11 bg-slate-100/90 border-b border-slate-200 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-500 font-mono font-medium">mansole.gruposole.com/app</span>
              </div>

              {/* Selector de Pestañas Interactivas del Demo */}
              <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setDemoTab('workorders')}
                  className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                    demoTab === 'workorders' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Órdenes (OTs)
                </button>
                <button
                  onClick={() => setDemoTab('kpis')}
                  className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                    demoTab === 'kpis' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  KPIs & OEE
                </button>
                <button
                  onClick={() => setDemoTab('ai')}
                  className={`text-xs font-semibold px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                    demoTab === 'ai' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  <Sparkles size={12} /> Copiloto IA
                </button>
              </div>
            </div>

            {/* Contenido Dinámico del Demo */}
            <div className="p-6 bg-slate-50/50 min-h-[360px]">
              <AnimatePresence mode="wait">
                {demoTab === 'workorders' && (
                  <motion.div 
                    key="tab-wo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline en Planta en Tiempo Real</div>
                      <span className="badge badge-success text-[11px]">3 Activas Ahora</span>
                    </div>

                    {/* Card OT 1 */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3 hover:border-slate-300 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600">OT-2026-089</span>
                          <span className="badge badge-danger text-[10px]">Correctivo</span>
                          <span className="text-xs font-bold text-red-600">● Urgente</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">[PRENSA-01] Prensa Hidráulica 100T Rexroth</h4>
                        <p className="text-xs text-slate-500">CECO-SOL-101 • Línea Estampado Termas Sole</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs">
                          <div className="font-semibold text-slate-800">Juan Pérez (1.5h)</div>
                          <div className="text-slate-400 font-mono text-[11px]">Downtime: 35 min</div>
                        </div>
                        <span className="badge badge-info text-xs px-3 py-1">En Planta</span>
                      </div>
                    </div>

                    {/* Card OT 2 */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3 hover:border-slate-300 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800">OT-2026-088</span>
                          <span className="badge badge-info text-[10px]">Preventivo</span>
                          <span className="text-xs font-bold text-emerald-600">● Normal</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">[FANUC-02] Robot Soldadura MIG Celda 3</h4>
                        <p className="text-xs text-slate-500">CECO-SOL-104 • Celda Automatizada</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs">
                          <div className="font-semibold text-slate-800">Carlos Admin (2.0h)</div>
                          <div className="text-slate-400 font-mono text-[11px]">Repuesto: $0 (Reusado)</div>
                        </div>
                        <span className="badge badge-success text-xs px-3 py-1">Finalizada</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {demoTab === 'kpis' && (
                  <motion.div 
                    key="tab-kpi"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">Disponibilidad (OEE)</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">98.4%</div>
                      <div className="text-[11px] text-emerald-600 font-bold mt-1">↑ +2.1% este mes</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">MTTR Promedio</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">1.4 hrs</div>
                      <div className="text-[11px] text-blue-600 font-bold mt-1">Resolución ágil</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">MTBF Confiabilidad</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">410 hrs</div>
                      <div className="text-[11px] text-indigo-600 font-bold mt-1">Tiempo entre fallas</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">Cumplimiento PM</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">96.2%</div>
                      <div className="text-[11px] text-purple-600 font-bold mt-1">24 OTs cerradas</div>
                    </div>

                    <div className="col-span-2 md:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">Imputación a CECO Línea Ensamble: <strong className="font-mono text-emerald-700">$3,450 USD</strong></div>
                      <span className="badge badge-mono text-xs">Cierre mensual en regla</span>
                    </div>
                  </motion.div>
                )}

                {demoTab === 'ai' && (
                  <motion.div 
                    key="tab-ai"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-5 rounded-xl border border-indigo-100 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Simulación Copiloto IA de Mantenimiento</div>
                          <div className="text-[11px] text-slate-500">Prueba diagnóstica en tiempo real para técnicos</div>
                        </div>
                      </div>

                      <button
                        onClick={runAiDemo}
                        disabled={aiDemoRunning}
                        className="btn btn-primary text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
                      >
                        {aiDemoRunning ? 'Analizando síntoma...' : '▶ Ejecutar Diagnóstico IA'}
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                      <strong>Síntoma reportado por el operador:</strong> <em>"Pérdida de presión en circuito primario de prensa Rexroth y ruido de cavitación al descender el émbolo."</em>
                    </div>

                    {aiDemoResult && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 pt-2 text-xs border-t border-slate-100"
                      >
                        <div>
                          <strong className="text-red-700 font-semibold block mb-1">Causas Probables Detectadas:</strong>
                          <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                            {aiDemoResult.causes.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-emerald-700 font-semibold block mb-1">Procedimiento de Solución In-Situ:</strong>
                          <ol className="list-decimal pl-5 text-slate-700 space-y-0.5 font-medium">
                            {aiDemoResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-2 rounded text-amber-800 font-medium text-[11px]">
                          ⚠️ {aiDemoResult.loto}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* CALCULADORA INTERACTIVA DE RETORNO DE INVERSIÓN (ROI) */}
      {/* ========================================================================= */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Luz de fondo en la tarjeta de ROI */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Calculator size={13} /> Calculadora de Impacto Operativo
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                ¿Cuánto dinero pierde tu planta en paradas imprevistas?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ajusta los parámetros reales de tu fábrica para estimar el ahorro anual inmediato que genera MANSOLE mediante mantenimiento predictivo y canibalización de repuestos al $0.
              </p>

              {/* Slider 1: Número de Máquinas */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Máquinas y Equipos en Planta:</span>
                  <span className="font-mono text-blue-400 font-bold text-sm">{machinesCount} activos</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="150" 
                  value={machinesCount} 
                  onChange={e => setMachinesCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Slider 2: Horas de parada mensual */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Horas promedio de parada mensual por equipo:</span>
                  <span className="font-mono text-blue-400 font-bold text-sm">{downtimeHours} hrs/mes</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="40" 
                  value={downtimeHours} 
                  onChange={e => setDowntimeHours(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Resultado del Ahorro */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center flex flex-col justify-center space-y-4 shadow-inner">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">Ahorro Operativo Anual Estimado</span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 tracking-tight">
                ${estimatedSavings.toLocaleString()} <span className="text-lg text-slate-300 font-sans font-normal">USD</span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                Recuperación de <strong className="text-white font-bold">{hoursRecovered} horas-hombre</strong> de producción efectiva al mes.
              </div>
              <button 
                onClick={onNavigateToLogin}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-md mt-2"
              >
                Comenzar a optimizar planta →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6 PILARES DE VALOR EMPRESARIAL */}
      {/* ========================================================================= */}
      <section className="py-14 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Diseñado para la realidad del piso de planta
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Desde operarios reportando averías en smartphones hasta directores analizando costos contables por CECO.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 mb-4 group-hover:scale-105 transition-transform">
              <Wrench size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Órdenes de Trabajo (OT)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ciclo integral de mantenimiento: asignación de múltiples técnicos, registro de horas-hombre, checklist in-situ y cálculo de downtime en segundos.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-4 group-hover:scale-105 transition-transform">
              <Cpu size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Cronograma Preventivo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cálculo por frecuencia y horómetro de máquina. Reprogramación controlada con trazabilidad auditable exclusiva para supervisores.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 mb-4 group-hover:scale-105 transition-transform">
              <Sparkles size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Copiloto IA Industrial</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Recomendaciones predictivas en tiempo real. Analiza síntomas mecánicos o eléctricos y guía al técnico con protocolos de seguridad LOTO.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 mb-4 group-hover:scale-105 transition-transform">
              <Boxes size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Kardex & Canibalización al $0</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trazabilidad nativa para piezas retiradas de equipos en desuso o hallazgos. No altera costos de almacén ni balances contables de SAP.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-4 group-hover:scale-105 transition-transform">
              <DollarSign size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Centros de Costo (CECO)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Imputación financiera por línea de producción. Sepa con precisión matemática cuánto gasta cada área en mantenimiento correctivo vs preventivo.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 mb-4 group-hover:scale-105 transition-transform">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Seguridad RBAC Granular</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Matriz interactiva de permisos en tiempo real. 4 roles preconfigurados (Admin, Supervisor, Técnico, Operador) para control irrompible.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">S</div>
            <span>© 2026 Grupo SOLE — División Rinnai Perú. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Azure SQL Cloud (soledb-puntoventa)
            </span>
            <span>Versión 4.2.0</span>
          </div>
        </div>
      </footer>

      {/* Modal de Arquitectura Técnica */}
      {showArchModal && (
        <div className="modal-overlay" onClick={() => setShowArchModal(false)}>
          <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database size={18} className="text-blue-600" />
                Arquitectura Técnica de MANSOLE
              </h3>
              <button 
                onClick={() => setShowArchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 font-semibold flex items-center gap-1.5">
                  <Cpu size={14} className="text-blue-600" /> Frontend SPA React 18
                </strong>
                Construido con Vite, Tailwind CSS y Framer Motion. 100% responsive optimizado para tabletas industriales y celulares de operarios en planta.
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 font-semibold flex items-center gap-1.5">
                  <Server size={14} className="text-emerald-600" /> Backend Node.js & Express
                </strong>
                API RESTful protegida con JWT, Helmet, Rate Limiting y Pool de conexiones de alta concurrencia con reconexión automática.
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 font-semibold flex items-center gap-1.5">
                  <Database size={14} className="text-purple-600" /> Azure SQL Database Persistente
                </strong>
                Base de datos Microsoft Azure SQL (`soledb-puntoventa`), esquema `MANSOLE`. Tablas con integridad referencial completa y Row-Level Security (RLS) por CECO.
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
              <button className="btn btn-primary text-xs" onClick={() => setShowArchModal(false)}>
                Cerrar Documentación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
