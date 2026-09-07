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
  Layers, 
  Activity, 
  Zap, 
  Terminal, 
  Database, 
  Sparkles,
  Server,
  Lock,
  Compass,
  X
} from 'lucide-react';

export default function Landing({ onNavigateToLogin }) {
  const [showArchModal, setShowArchModal] = useState(false);

  return (
    <div className="cyber-bg cyber-grid" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Institucional Futurista */}
      <header style={{ 
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)', 
        padding: '16px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'rgba(8, 12, 22, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 50 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #6366F1 100%)',
            color: '#FFFFFF',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '22px',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.5)'
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#F8FAFC', letterSpacing: '0.5px' }}>
              GRUPO SOLE <span style={{ color: '#38BDF8', fontSize: '12px', verticalAlign: 'middle', fontWeight: '800' }}>CMMS 4.0</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', letterSpacing: '1px' }}>
              CORPORACIÓN RINNAI • ECOSISTEMA SIATC
            </div>
          </div>
        </div>

        {/* Indicadores de telemetría en vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '6px 14px', 
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '12px',
            fontWeight: '700',
            color: '#34D399'
          }} className="hidden md:flex">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', display: 'inline-block' }} />
            AZURE SQL CLOUD: EN LÍNEA (18ms)
          </div>

          <button className="btn-cyber" onClick={onNavigateToLogin}>
            Ingresar al Sistema <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section Futurista */}
      <section style={{ padding: '70px 24px 40px', maxWidth: '1240px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        
        {/* Glow de fondo decorativo */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '250px',
          background: 'radial-gradient(ellipse, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="cyber-badge" style={{ marginBottom: '24px' }}>
            <Zap size={14} color="#38BDF8" /> IIoT SOLE-NET v4.2 • SISTEMA PREDICTIVO NEURAL RINNAI
          </div>

          <h1 style={{ 
            fontSize: 'clamp(32px, 5vw, 58px)', 
            fontWeight: '900', 
            color: '#F8FAFC', 
            lineHeight: '1.12', 
            maxWidth: '960px', 
            margin: '0 auto 20px', 
            letterSpacing: '-1.5px' 
          }}>
            Gestión Inteligente de Mantenimiento y Telemetría Industrial para el <span style={{ 
              background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>Área de Producción</span>
          </h1>

          <p style={{ fontSize: '17px', color: '#94A3B8', maxWidth: '780px', margin: '0 auto 36px', lineHeight: '1.6' }}>
            Arquitectura monolítica de alto rendimiento para <strong>Corporación Rinnai</strong>. Combina telemetría de activos en tiempo real, control financiero por Centros de Costo (CECO), IA diagnóstica para fallas mecánicas y soporte nativo de canibalización al $0.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button className="btn-cyber" style={{ padding: '14px 32px', fontSize: '15px' }} onClick={onNavigateToLogin}>
              🚀 Acceder a la Plataforma CMMS <ArrowRight size={18} />
            </button>
            <button className="btn-cyber-outline" style={{ padding: '14px 28px', fontSize: '15px' }} onClick={() => setShowArchModal(true)}>
              <Terminal size={18} /> Ver Arquitectura Técnica
            </button>
          </div>

          {/* HUD de Telemetría en Vivo (Simulación de Planta) */}
          <div className="cyber-card" style={{ padding: '24px', textAlign: 'left', maxWidth: '1050px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="#38BDF8" />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#F1F5F9', letterSpacing: '0.5px' }}>
                  TELEMETRÍA EN TIEMPO REAL • PLANTA INDUSTRIAL CALLAO
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                SISTEMA MONITOREADO 24/7
              </span>
            </div>

            {/* 4 KPIs Clave estilo HUD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Disponibilidad Planta</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#34D399', margin: '4px 0' }}>99.85%</div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>● Meta mensual superada (&gt;95%)</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>MTTR (Resolución)</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#38BDF8', margin: '4px 0' }}>1.8 hrs</div>
                <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '600' }}>● Tiempo medio correctivo</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>MTBF (Confiabilidad)</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#818CF8', margin: '4px 0' }}>468 hrs</div>
                <div style={{ fontSize: '11px', color: '#818CF8', fontWeight: '600' }}>● Confiabilidad operativa alta</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Cumplimiento Preventivo</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#C084FC', margin: '4px 0' }}>98.2%</div>
                <div style={{ fontSize: '11px', color: '#C084FC', fontWeight: '600' }}>● 23 OTs ejecutadas a tiempo</div>
              </div>
            </div>

            {/* Consola de Eventos en Vivo */}
            <div style={{ background: '#020617', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '12px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><span style={{ color: '#38BDF8' }}>[12:54:12] TELEMETRÍA:</span> Prensa Hidráulica 200T #1 operando a 185 bar con ciclo nominal.</div>
              <div><span style={{ color: '#34D399' }}>[12:54:18] MOTOR IA:</span> Diagnóstico completado en OT-2026-10. Sin anomalías térmicas.</div>
              <div><span style={{ color: '#FBBF24' }}>[12:54:25] KARDEX ALMACÉN:</span> Válvula proporcional canibalizada ingresada con valor $0.00 USD.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Características Clave / Requerimientos Resueltos */}
      <section style={{ padding: '60px 24px 80px', maxWidth: '1240px', margin: '0 auto', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
            Pilares Tecnológicos de la Plataforma
          </h2>
          <p style={{ fontSize: '15px', color: '#94A3B8', marginTop: '8px' }}>
            Resolución total de las directrices críticas operativas y financieras de Corporación Rinnai
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* 1. CECO & Áreas */}
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', marginBottom: '16px' }}>
              <DollarSign size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
              Control Contable por CECO
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Cada máquina y equipo de la planta pertenece jerárquicamente a un Área (Ensamble, Metalmecánica, Pintura), auditando cada costo de mano de obra y repuestos directamente al Centro de Costo correspondiente.
            </p>
          </div>

          {/* 2. Canibalización */}
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', marginBottom: '16px' }}>
              <Boxes size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
              Canibalización sin Stock SAP ($0)
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Permite registrar componentes reusados de maquinaria en desuso. Su costo unitario se congela en <strong>$0.00 USD</strong>, preservando la exactitud de los balances contables en SAP y habilitando economías circulares.
            </p>
          </div>

          {/* 3. Múltiples Técnicos */}
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', marginBottom: '16px' }}>
              <Wrench size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
              Cuadrillas de Múltiples Técnicos
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Asignación simultánea de cuadrillas de mantenimiento a una sola Orden de Trabajo (OT), consolidando automáticamente horas laboradas, costo de mano de obra y consumo de insumos para el acta final.
            </p>
          </div>

          {/* 4. Asistente IA */}
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', marginBottom: '16px' }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
              Diagnóstico Neural con Asistente IA
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Motor de Inteligencia Artificial que analiza en milisegundos los síntomas reportados por los técnicos, sugiriendo posibles causas raíz de la avería, pasos de reparación y protocolos de bloqueo LOTO.
            </p>
          </div>

          {/* 5. Reprogramación Preventivos */}
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8', marginBottom: '16px' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
              Cronograma con Auditoría
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Permite a los supervisores posponer fechas programadas por motivos operativos o ventanas de producción, registrando obligatoriamente la justificación auditable del cambio en la base de datos.
            </p>
          </div>

          {/* 6. Actas PDF Formales */}
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FB7185', marginBottom: '16px' }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
              Generación de Actas en PDF
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Motor backend que compila actas oficiales de mantenimiento con membrete Grupo SOLE, desglose de costos imputables al CECO y líneas de firma digital para el cierre técnico.
            </p>
          </div>
        </div>
      </section>

      {/* Modal de Arquitectura Técnica */}
      {showArchModal && (
        <div className="modal-overlay" onClick={() => setShowArchModal(false)}>
          <div className="modal-content cyber-card" style={{ maxWidth: '680px', color: '#F8FAFC' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={20} color="#38BDF8" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#F8FAFC' }}>
                  Arquitectura Técnica del Ecosistema CMMS
                </h3>
              </div>
              <button onClick={() => setShowArchModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#CBD5E1', lineHeight: '1.6' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '4px' }}>⚡ Frontend Moderno:</strong>
                React 18 con Vite, Tailwind CSS, Lucide Icons, Sonner Toasts y arquitectura responsiva adaptable para pantallas táctiles industriales.
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <strong style={{ color: '#34D399', display: 'block', marginBottom: '4px' }}>🗄️ Backend Transaccional:</strong>
                Node.js + Express con pool optimizado para Azure SQL Server (Esquema MANSOLE), consultas parametrizadas a prueba de inyecciones y micro-caché para telemetría instantánea.
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <strong style={{ color: '#C084FC', display: 'block', marginBottom: '4px' }}>🤖 Inteligencia Artificial & Seguridad RBAC:</strong>
                Diagnóstico asistido in-situ, autenticación por tokens JWT y matriz de permisos por roles (Admin, Supervisor, Técnico, Operador).
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-cyber" onClick={() => { setShowArchModal(false); onNavigateToLogin(); }}>
                Ingresar a la Plataforma <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '28px 40px', background: 'rgba(8, 12, 22, 0.95)', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
        <p style={{ margin: 0 }}>© 2026 Grupo SOLE Corporación Rinnai • Área de Mantenimiento y Producción Industrial. Todos los derechos reservados.</p>
        <p style={{ marginTop: '4px', fontSize: '11px', color: '#475569' }}>Ecosistema Cloud SIATC • Versión Monolito Empresarial v4.2</p>
      </footer>
    </div>
  );
}
