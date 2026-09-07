import React, { useState } from 'react';
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
  X
} from 'lucide-react';

export default function Landing({ onNavigateToLogin }) {
  const [showArchModal, setShowArchModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar Superior Minimalista */}
      <header className="h-16 px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            S
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">GRUPO SOLE</span>
            <span className="text-[11px] text-slate-500 font-medium leading-none">División Rinnai Perú</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Azure SQL Online</span>
          </div>
          <button 
            onClick={onNavigateToLogin}
            className="btn btn-primary text-xs py-2 px-3.5 shadow-xs"
          >
            Ingresar al Sistema <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>CMMS Enterprise v4.2 • Planta Industrial</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Gestión inteligente de mantenimiento y trazabilidad operativa de planta
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Plataforma centralizada para Corporación Rinnai. Control de órdenes de trabajo, cronogramas preventivos, imputación por Centros de Costo (CECO), soporte nativo de canibalización al $0 y diagnóstico asistido por IA.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button 
            onClick={onNavigateToLogin}
            className="btn btn-primary py-2.5 px-5 text-sm shadow-sm"
          >
            Acceder a la Plataforma <ArrowRight size={16} />
          </button>
          <button 
            onClick={() => setShowArchModal(true)}
            className="btn btn-secondary py-2.5 px-4 text-sm"
          >
            Arquitectura Técnica
          </button>
        </div>
      </section>

      {/* Métricas Clave */}
      <section className="py-8 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Disponibilidad Planta</span>
            <div className="text-3xl font-bold text-slate-900 tracking-tight my-1 font-mono">98.4%</div>
            <span className="text-xs text-emerald-600 font-medium">Meta corporativa cumplida</span>
          </div>

          <div className="stat-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tiempo Respuesta</span>
            <div className="text-3xl font-bold text-slate-900 tracking-tight my-1 font-mono">&lt;16ms</div>
            <span className="text-xs text-slate-500 font-medium">Conexión directa Azure SQL</span>
          </div>

          <div className="stat-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Canibalización $0</span>
            <div className="text-3xl font-bold text-slate-900 tracking-tight my-1 font-mono">100%</div>
            <span className="text-xs text-blue-600 font-medium">Alineación contable con SAP</span>
          </div>

          <div className="stat-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Matriz RBAC</span>
            <div className="text-3xl font-bold text-slate-900 tracking-tight my-1 font-mono">4 Roles</div>
            <span className="text-xs text-purple-600 font-medium">Permisos granulares en vivo</span>
          </div>
        </div>
      </section>

      {/* Módulos Principales */}
      <section className="py-12 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Capacidades del Sistema</h2>
          <p className="text-sm text-slate-500 mt-1">Diseñado para la operación en planta de ingenieros, técnicos y operarios</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 mb-4">
              <Wrench size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Órdenes de Trabajo (OT)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pipeline operativo en 4 etapas: Solicitud, En Planta, Finalizada y Cierre Contable con cálculo automático de horas-técnico y downtime.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-4">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Cronograma Preventivo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Planificación por horómetro o frecuencia fija con reprogramaciones auditables exclusivas para supervisores.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Diagnóstico Asistido IA</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Motor de análisis de averías que sugiere causas raíz, checklists recomendados y advertencias de seguridad LOTO.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 mb-4">
              <Boxes size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Almacén & Canibalización</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trazabilidad dual para repuestos oficiales de compra SAP y piezas reutilizadas con costo $0 USD para no alterar balances.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-4">
              <DollarSign size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Centros de Costo (CECO)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Imputación financiera directa de repuestos y horas de mano de obra por línea de producción y CECO contable.
            </p>
          </div>

          <div className="siatc-card flex flex-col p-6 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Gobernanza & Matriz RBAC</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Control granular de permisos por rol (Administrador, Supervisor, Técnico, Operador) configurable en tiempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Limpio */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 Grupo SOLE • Corporación Rinnai. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Azure SQL Online
            </span>
            <span>v4.2.0 Enterprise</span>
          </div>
        </div>
      </footer>

      {/* Modal de Arquitectura */}
      {showArchModal && (
        <div className="modal-overlay" onClick={() => setShowArchModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                Arquitectura Técnica de la Solución
              </h3>
              <button 
                onClick={() => setShowArchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1">Frontend:</strong>
                React 18 SPA construida con Vite, Tailwind CSS y componentes modulares responsive adaptados a móviles y tablets de planta.
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1">Backend:</strong>
                Node.js con Express, JWT, Helmet, Rate Limiting y Pool de conexiones persistente con Azure SQL Database.
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1">Base de Datos:</strong>
                Azure SQL Server (soledb-puntoventa), esquema MANSOLE, tablas relacionales con integridad referencial completa y RLS por CECO.
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
              <button className="btn btn-primary text-xs" onClick={() => setShowArchModal(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
