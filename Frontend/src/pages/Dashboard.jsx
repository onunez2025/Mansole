import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrendingUp, Clock, Cpu, CheckCircle2, AlertTriangle, DollarSign, Boxes, ArrowUpRight } from 'lucide-react';

export default function Dashboard({ currentUser }) {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getKPIs().then(data => {
      setKpi(data);
      setLoading(false);
    });
  }, []);

  if (loading || !kpi) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#8A919E', fontWeight: '600' }}>⏳ Cargando telemetría e indicadores SQL Server...</div>;
  }

  const cards = [
    { title: 'Disponibilidad de Planta', value: `${kpi.overallAvailability}%`, desc: 'Meta mensual > 95%', icon: <TrendingUp size={24} color="#05B169" />, bg: '#E7F9F0', border: '#B8EBD1', textColor: '#05B169' },
    { title: 'MTTR (T. Mts. Reparación)', value: `${kpi.mttrHours} hrs`, desc: 'Promedio resolución correctivos', icon: <Clock size={24} color="#3B72D4" />, bg: '#EAF0FB', border: '#C5D6F5', textColor: '#3B72D4' },
    { title: 'MTBF (T. Entre Fallas)', value: `${kpi.mtbfHours} hrs`, desc: 'Confiabilidad operativa en planta', icon: <Cpu size={24} color="#4C5F80" />, bg: '#E8EEF8', border: '#CCD8ED', textColor: '#4C5F80' },
    { title: 'Cumplimiento Preventivo', value: `${kpi.preventiveCompliance}%`, desc: `${kpi.closedOrdersCount} OTs finalizadas exitosamente`, icon: <CheckCircle2 size={24} color="#6A35E0" />, bg: '#F2EEFE', border: '#D5C3FD', textColor: '#6A35E0' },
  ];

  return (
    <div>
      {/* Saludo institucional y rol */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E' }}>Resumen Ejecutivo Operativo</h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>Monitoreo en tiempo real de indicadores clave de mantenimiento (KPIs) en Corporación Rinnai</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#515254' }}>Período: <strong>Julio - Agosto 2026</strong></span>
        </div>
      </div>

      {/* Grid de Tarjetas de Indicadores SIATC */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {cards.map((c, i) => (
          <div key={i} className="siatc-card" style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '22px 24px', border: `1px solid ${c.border}` }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#8A919E', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.title}</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#1A1C1E', margin: '4px 0' }}>{c.value}</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: c.textColor }}>● {c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Tablas: Top Fallas y Gastos por CECO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Ranking Máquinas con más fallas */}
        <div className="siatc-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <AlertTriangle color="#DF2935" size={22} />
            <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E' }}>Ranking Activos con Más Incidencias</h4>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código / Máquina</th>
                  <th>CECO Asociado</th>
                  <th>Fallas</th>
                  <th>Downtime</th>
                </tr>
              </thead>
              <tbody>
                {kpi.topFailingAssets.map((a, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '800', color: '#1A1C1E' }}>[{a.code}]</div>
                      <div style={{ fontSize: '13px', color: '#515254', fontWeight: '600' }}>{a.name}</div>
                    </td>
                    <td><span className="badge badge-warning">{a.ceco}</span></td>
                    <td style={{ fontWeight: '800', color: '#DF2935' }}>{a.failuresCount} reportes</td>
                    <td style={{ fontWeight: '700', color: '#515254' }}>{a.downtimeMinutes} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gasto por Centro de Costo (CECO) */}
        <div className="siatc-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign color="#05B169" size={22} />
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E' }}>Imputación de Gastos por CECO</h4>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#05B169', background: '#E7F9F0', padding: '4px 10px', borderRadius: '8px', border: '1px solid #B8EBD1' }}>
              Total: ${kpi.totalMaintenanceCost.toLocaleString()} USD
            </span>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Centro de Costo (CECO)</th>
                  <th>Área / Línea</th>
                  <th>Gasto USD</th>
                  <th>% Total</th>
                </tr>
              </thead>
              <tbody>
                {kpi.expensesByCostCenter.map((exp, idx) => (
                  <tr key={idx}>
                    <td><span className="badge badge-info">{exp.ceco}</span></td>
                    <td style={{ fontWeight: '700', color: '#1A1C1E' }}>{exp.areaName}</td>
                    <td style={{ fontWeight: '800', color: '#1A1C1E' }}>${exp.amount.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '56px', height: '6px', background: '#E2E4E9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${exp.percentage}%`, height: '100%', background: '#4C5F80' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#515254' }}>{exp.percentage}%</span>
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
          <Boxes color="#4C5F80" size={22} />
          <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E' }}>
            Consumo Reciente en Almacén & Repuestos Canibalizados (Costo $0)
          </h4>
        </div>
        <div className="table-container" style={{ marginTop: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Repuesto / Código</th>
                <th>Cantidad Utilizada en OTs</th>
                <th>Costo Acumulado</th>
                <th>Trazabilidad SAP / Canibalización</th>
              </tr>
            </thead>
            <tbody>
              {kpi.sparePartsConsumption.map((p, idx) => {
                const isZero = p.totalCost === 0;
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: '#1A1C1E' }}>{p.name} ({p.code})</td>
                    <td style={{ fontWeight: '600', color: '#515254' }}>{p.usedQuantity} unidades consumidas</td>
                    <td style={{ fontWeight: '800', fontSize: '15px', color: isZero ? '#05B169' : '#1A1C1E' }}>
                      ${p.totalCost.toFixed(2)} USD
                    </td>
                    <td>
                      {isZero ? (
                        <span className="badge badge-success">♻️ Canibalización / Hallazgo ($0 USD)</span>
                      ) : (
                        <span className="badge badge-info">📦 Compra Oficial SAP</span>
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
