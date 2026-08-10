import React from 'react';
import { ShieldCheck, Cpu, DollarSign, Wrench, Boxes, FileText, ArrowRight, CheckCircle2, Layers, BarChart3 } from 'lucide-react';

export default function Landing({ onNavigateToLogin }) {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Institucional */}
      <header style={{ 
        borderBottom: '1px solid #E2E4E9', 
        padding: '16px 48px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 50 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#4C5F80',
            color: '#FFFFFF',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(76, 95, 128, 0.25)'
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1A1C1E', letterSpacing: '0.3px' }}>
              GRUPO SOLE
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#4C5F80', letterSpacing: '0.8px' }}>
              CORPORACIÓN RINNAI • SIATC PLATFORMS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', fontWeight: '600', color: '#515254' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#05B169' }}>
            <CheckCircle2 size={16} /> Entorno Producción Active
          </span>
          <span>SQL Server + Azure App Service</span>
          <button className="btn btn-primary" onClick={onNavigateToLogin}>
            Ingresar a la Plataforma <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 48px', maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: '#EAEFF8', color: '#3B527A', borderRadius: '999px', fontSize: '13px', fontWeight: '700', marginBottom: '24px', border: '1px solid #C4D2E8' }}>
          <ShieldCheck size={16} /> SISTEMA MONOLÍTICO DE GESTIÓN DE MANTENIMIENTO INDUSTRIAL
        </div>
        <h1 style={{ fontSize: '54px', fontWeight: '900', color: '#1A1C1E', lineHeight: '1.15', maxWidth: '950px', margin: '0 auto 24px', letterSpacing: '-1px' }}>
          Inteligencia y Trazabilidad en Mantenimiento para el <span style={{ color: '#4C5F80', textDecoration: 'underline', textDecorationColor: '#A3B5D1' }}>Área de Producción</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#515254', maxWidth: '760px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Diseñado bajo los estándares de arquitectura del Ecosistema SIATC para Grupo SOLE Corporación Rinnai. Combina diagnóstico asistido por IA, control financiero por Centros de Costo (CECO) y gestión nativa de repuestos canibalizados.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={onNavigateToLogin}>
            Acceder al Sistema CMMS <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px' }} onClick={() => alert("Arquitectura: React Vite + Node.js Express + SQL Server (MSSQL) + Azure Blob Storage + Asistente IA Antigravity.")}>
            Ver Arquitectura Técnica
          </button>
        </div>
      </section>

      {/* Características Clave / Requerimientos Resueltos */}
      <section style={{ background: '#F9FAFB', borderTop: '1px solid #E2E4E9', borderBottom: '1px solid #E2E4E9', padding: '64px 48px', flex: 1 }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1C1E' }}>Solución Especializada para Planta Industrial</h2>
            <p style={{ fontSize: '15px', color: '#8A919E', marginTop: '8px' }}>Resolución total de las 7 directrices críticas operativas de Corporación Rinnai</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* 1. CECO & Áreas */}
            <div className="siatc-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: '#EAF0FB', borderRadius: '12px', color: '#3B72D4' }}>
                <DollarSign size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', marginBottom: '6px' }}>Control Contable por CECO</h3>
                <p style={{ fontSize: '14px', color: '#515254', lineHeight: '1.5' }}>
                  Cada máquina y equipo de la planta pertenece jerárquicamente a un Área (Ensamble, Metalmecánica, Pintura), enlazando y auditando cada orden de trabajo al presupuesto del Centro de Costo correspondiente.
                </p>
              </div>
            </div>

            {/* 2. Canibalización & Hallazgos */}
            <div className="siatc-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: '#E7F9F0', borderRadius: '12px', color: '#05B169' }}>
                <Boxes size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', marginBottom: '6px' }}>Canibalización sin Stock SAP ($0)</h3>
                <p style={{ fontSize: '14px', color: '#515254', lineHeight: '1.5' }}>
                  Permite integrar al inventario componentes reusados o hallazgos retirados de otras máquinas en desuso. Su costo se congela en <strong>$0.00 USD</strong> para preservar la integridad financiera histórica de SAP.
                </p>
              </div>
            </div>

            {/* 3. Múltiples Técnicos */}
            <div className="siatc-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: '#FEF7EC', borderRadius: '12px', color: '#E58D14' }}>
                <Wrench size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', marginBottom: '6px' }}>Múltiples Técnicos por OT</h3>
                <p style={{ fontSize: '14px', color: '#515254', lineHeight: '1.5' }}>
                  Asignación simultánea de cuadrillas de mantenimiento a una sola Orden de Trabajo (OT), sumando automáticamente horas laboradas, mano de obra y consumo de almacén para el acta final.
                </p>
              </div>
            </div>

            {/* 4. Asistente IA */}
            <div className="siatc-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: '#F2EEFE', borderRadius: '12px', color: '#6A35E0' }}>
                <Cpu size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', marginBottom: '6px' }}>Diagnóstico Asistido por IA</h3>
                <p style={{ fontSize: '14px', color: '#515254', lineHeight: '1.5' }}>
                  Motor de Inteligencia Artificial que analiza en milisegundos el síntoma reportado por los técnicos, sugiriendo posibles causas raíz de la falla y pasos de reparación con protocolos de bloqueo LOTO.
                </p>
              </div>
            </div>

            {/* 5. Reprogramación Preventivos */}
            <div className="siatc-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: '#E8EEF8', borderRadius: '12px', color: '#4C5F80' }}>
                <Layers size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', marginBottom: '6px' }}>Reprogramación con Auditoría</h3>
                <p style={{ fontSize: '14px', color: '#515254', lineHeight: '1.5' }}>
                  El cronograma preventivo permite a supervisores editar y aplazar fechas programadas por motivos operativos o ventanas de producción, registrando obligatoriamente la justificación del cambio.
                </p>
              </div>
            </div>

            {/* 6. Actas PDF Formales */}
            <div className="siatc-card" style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: '#FDF1F2', borderRadius: '12px', color: '#DF2935' }}>
                <FileText size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', marginBottom: '6px' }}>Exportación Formal en Actas PDF</h3>
                <p style={{ fontSize: '14px', color: '#515254', lineHeight: '1.5' }}>
                  Generador backend con PDFKit que produce informes oficiales de mantenimiento con membrete Grupo SOLE, costos imputables al CECO y líneas de firma para cierre técnico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', background: '#FFFFFF', borderTop: '1px solid #E2E4E9', textAlign: 'center', fontSize: '13px', color: '#8A919E' }}>
        <p>© 2026 Grupo SOLE Corporación Rinnai • Área de Mantenimiento y Producción. Todos los derechos reservados.</p>
        <p style={{ marginTop: '4px', fontSize: '12px' }}>Estándar de Seguridad y Diseño del Ecosistema SIATC Cloud</p>
      </footer>
    </div>
  );
}
