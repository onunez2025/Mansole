import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrendingUp, Clock, Cpu, CheckCircle2, AlertTriangle, DollarSign, Boxes, ArrowUpRight } from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '../components/UI';

// Caché en cliente para que al volver a la pestaña Dashboard cargue en 0ms
let cachedKpiData = null;

export default function Dashboard({ currentUser }) {
  const [kpi, setKpi] = useState(cachedKpiData);
  const [loading, setLoading] = useState(!cachedKpiData);

  useEffect(() => {
    api.getKPIs().then(data => {
      cachedKpiData = data;
      setKpi(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading && !kpi) {
    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E' }}>Resumen Ejecutivo Operativo</h3>
          <p style={{ fontSize: '14px', color: '#8A919E' }}>Sincronizando telemetría en tiempo real desde Azure SQL...</p>
        </div>
        <CardSkeleton count={4} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <TableSkeleton rows={3} cols={3} />
          <TableSkeleton rows={3} cols={3} />
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Disponibilidad de Planta', value: `${kpi.overallAvailability}%`, desc: 'Meta mensual > 95%', icon: <TrendingUp size={24} color="#10B981" />, bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', textColor: '#10B981' },
    { title: 'MTTR (T. Med. Reparación)', value: `${kpi.mttrHours} hrs`, desc: 'Promedio resolución correctivos', icon: <Clock size={24} color="#38BDF8" />, bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.3)', textColor: '#38BDF8' },
    { title: 'MTBF (T. Entre Fallas)', value: `${kpi.mtbfHours} hrs`, desc: 'Confiabilidad operativa en planta', icon: <Cpu size={24} color="#818CF8" />, bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', textColor: '#818CF8' },
    { title: 'Cumplimiento Preventivo', value: `${kpi.preventiveCompliance}%`, desc: `${kpi.closedOrdersCount} OTs finalizadas`, icon: <CheckCircle2 size={24} color="#C084FC" />, bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', textColor: '#C084FC' },
  ];

  return (
    <div>
      {/* Saludo institucional y rol */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="cyber-badge" style={{ fontSize: '10px' }}>PANEL EJECUTIVO</span>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>// TELEMETRÍA EN VIVO AZURE SQL</span>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0 }}>Indicadores Clave de Desempeño (KPIs)</h3>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>Monitoreo en tiempo real de disponibilidad, confiabilidad y costos en Corporación Rinnai</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)', 
            padding: '6px 14px', 
            borderRadius: '8px', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '12px', 
            fontFamily: 'monospace',
            color: '#94A3B8'
          }}>
            PERÍODO: <strong style={{ color: '#38BDF8' }}>JUL - AGO 2026</strong>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Indicadores Cyber */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {cards.map((c, i) => (
          <div key={i} className="siatc-card" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px', 
            padding: '22px 24px', 
            border: `1px solid ${c.border}`,
            background: 'rgba(15, 23, 42, 0.75)',
            boxShadow: `0 4px 20px rgba(0,0,0,0.3)`
          }}>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '12px', 
              background: c.bg, 
              border: `1px solid ${c.border}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0 
            }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'monospace' }}>{c.title}</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: '4px 0', letterSpacing: '-0.5px' }}>{c.value}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: c.textColor }}>● {c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Tablas: Top Fallas y Gastos por CECO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Ranking Máquinas con más fallas */}
        <div className="siatc-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <AlertTriangle color="#EF4444" size={20} />
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>Ranking Activos con Más Incidencias</h4>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código / Activo</th>
                  <th>CECO</th>
                  <th>Fallas</th>
                  <th>Downtime</th>
                </tr>
              </thead>
              <tbody>
                {kpi.topFailingAssets.map((a, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '800', color: '#FFFFFF', fontFamily: 'monospace' }}>[{a.code}]</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{a.name}</div>
                    </td>
                    <td><span className="badge badge-warning">{a.ceco}</span></td>
                    <td style={{ fontWeight: '800', color: '#EF4444', fontFamily: 'monospace' }}>{a.failuresCount} fallas</td>
                    <td style={{ fontWeight: '700', color: '#CBD5E1', fontFamily: 'monospace' }}>{a.downtimeMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gasto por Centro de Costo (CECO) */}
        <div className="siatc-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign color="#10B981" size={20} />
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>Imputación de Gastos por CECO</h4>
            </div>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '800', 
              color: '#10B981', 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '4px 10px', 
              borderRadius: '8px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontFamily: 'monospace'
            }}>
              TOTAL: ${kpi.totalMaintenanceCost.toLocaleString()} USD
            </span>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Centro de Costo</th>
                  <th>Área / Línea</th>
                  <th>Gasto USD</th>
                  <th>% Total</th>
                </tr>
              </thead>
              <tbody>
                {kpi.expensesByCostCenter.map((exp, idx) => (
                  <tr key={idx}>
                    <td><span className="badge badge-info">{exp.ceco}</span></td>
                    <td style={{ fontWeight: '600', color: '#F8FAFC' }}>{exp.areaName}</td>
                    <td style={{ fontWeight: '800', color: '#10B981', fontFamily: 'monospace' }}>${exp.amount.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '56px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${exp.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #0284C7, #38BDF8)' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', fontFamily: 'monospace' }}>{exp.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trazabilidad Almacén y Canibalización */}
      <div className="siatc-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <Boxes color="#38BDF8" size={20} />
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
            Consumo en Almacén & Repuestos Canibalizados (Costo $0 USD)
          </h4>
        </div>
        <div className="table-container" style={{ marginTop: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Repuesto / Código</th>
                <th>Consumo OTs</th>
                <th>Costo Acumulado</th>
                <th>Trazabilidad SAP / Reutilización</th>
              </tr>
            </thead>
            <tbody>
              {kpi.sparePartsConsumption.map((p, idx) => {
                const isZero = p.totalCost === 0;
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: '#FFFFFF' }}>{p.name} <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '12px' }}>({p.code})</span></td>
                    <td style={{ fontWeight: '600', color: '#94A3B8' }}>{p.usedQuantity} unidades</td>
                    <td style={{ fontWeight: '800', fontSize: '14px', color: isZero ? '#10B981' : '#FFFFFF', fontFamily: 'monospace' }}>
                      ${p.totalCost.toFixed(2)} USD
                    </td>
                    <td>
                      {isZero ? (
                        <span className="badge badge-success">♻️ Canibalizado / Reutilizado ($0 USD)</span>
                      ) : (
                        <span className="badge badge-info">📦 Compra Estándar SAP</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
