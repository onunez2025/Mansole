import React, { useEffect, useState } from 'react';
import { api, API_BASE } from '../services/api';
import { Hammer, Plus, Download, Bot, Users, FileText } from 'lucide-react';

export default function WorkOrders({ currentUser }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOT, setSelectedOT] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newOT, setNewOT] = useState({
    type: 'Correctivo',
    priority: 'Alta',
    assetCode: 'PRENSA-01',
    assetName: 'Prensa Hidráulica 200T #1',
    areaName: 'Área de Metalmecánica',
    costCenterCode: 'CECO-SOL-102',
    description: '',
    downtimeMinutes: 30,
    tech1: 'Juan Perez (Técnico 1)',
    tech1Hours: 2.5,
    tech2: 'Miguel Torres (Técnico 2)',
    tech2Hours: 2.5,
    sparePartName: 'REP-VLM-001 Válvula Proporcional',
    sparePartCost: 350.00
  });

  const loadOrders = () => {
    setLoading(true);
    api.getWorkOrders().then(data => {
      if (Array.isArray(data)) {
        const clean = data.map((o, idx) => {
          const cost = Number(o.totalCost !== undefined ? o.totalCost : (o.TotalCost !== undefined ? o.TotalCost : 0));
          return {
            id: o.id || o.Id || idx + 1,
            code: o.code || o.OrderCode || `OT-2026-${idx + 10}`,
            type: o.type || o.Type || 'Correctivo',
            status: o.status || o.Status || 'Iniciada',
            priority: o.priority || o.Priority || 'Media',
            assetCode: o.assetCode || o.AssetCode || 'PRENSA-01',
            assetName: o.assetName || o.AssetName || 'Maquinaria Principal',
            areaName: o.areaName || o.AreaName || 'Área General',
            costCenterCode: o.costCenterCode || o.CostCenterCode || 'CECO-SOL-101',
            description: o.description || o.Description || 'Labor programada de mantenimiento',
            totalCost: isNaN(cost) ? 0 : cost,
            technicians: o.technicians || o.Technicians || [{ name: 'Juan Pérez (Técnico 1)', hours: 2 }],
            aiDiagnosis: o.aiDiagnosis || null
          };
        });
        setWorkOrders(clean);
      } else {
        setWorkOrders([]);
      }
      setLoading(false);
    }).catch(() => {
      setWorkOrders([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const triggerAiHelp = async (assetName, description, code) => {
    setAiLoading(true);
    const result = await api.diagnoseWithAI(assetName, description, code);
    setAiDiagnosis(result);
    setAiLoading(false);
  };

  const handleCreateOT = async (e) => {
    e.preventDefault();
    const technicians = [
      { name: newOT.tech1, hours: parseFloat(newOT.tech1Hours) || 0 }
    ];
    if (newOT.tech2 && newOT.tech2.trim() !== '') {
      technicians.push({ name: newOT.tech2, hours: parseFloat(newOT.tech2Hours) || 0 });
    }

    try {
      const payload = {
        assetCode: newOT.assetCode,
        assetName: newOT.assetName,
        areaName: newOT.areaName,
        costCenterCode: newOT.costCenterCode,
        type: newOT.type,
        priority: newOT.priority,
        scheduledDate: new Date().toISOString(),
        downtimeMinutes: parseFloat(newOT.downtimeMinutes) || 0,
        description: newOT.description,
        technicians,
        spareParts: [{ code: 'REP-NEW', name: newOT.sparePartName, quantity: 1, cost: parseFloat(newOT.sparePartCost) }]
      };
      
      const response = await api.createWorkOrder(payload);
      setShowCreateModal(false);
      alert(`✅ ${response.message || 'OT creada con éxito'} (Código: ${response.code})`);
      loadOrders(); // Recargar de BD real
    } catch (error) {
      alert(`❌ Error al crear OT: ${error.response?.data?.error || error.message}`);
    }
  };

  const downloadPDF = (id) => {
    window.open(`${API_BASE}/workorders/${id}/pdf`, '_blank');
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#8A919E', fontWeight: '600' }}>⏳ Cargando Órdenes de Trabajo e Inteligencia Artificial...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Gestión de Órdenes de Trabajo (OT)</h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>
            Soporte nativo para OTs por Activo o Área, <strong>asignación de múltiples técnicos</strong> y exportación de Actas en PDF
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Emitir OT Rápida
        </button>
      </div>

      {/* Listado de OTs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {workOrders.map((ot) => (
          <div key={ot.id} className="siatc-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', flexWrap: 'wrap', gap: '18px' }}>
            {/* Datos Principales */}
            <div style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#4C5F80' }}>{ot.code}</span>
                <span className={`badge ${ot.type === 'Preventivo' ? 'badge-info' : 'badge-danger'}`}>{ot.type}</span>
                <span className={`badge ${ot.status === 'Finalizada' ? 'badge-success' : 'badge-warning'}`}>{ot.status}</span>
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E', margin: '4px 0' }}>
                [{ot.assetCode}] {ot.assetName}
              </h4>
              <p style={{ fontSize: '13px', color: '#515254' }}>
                <strong>CECO:</strong> {ot.costCenterCode} ({ot.areaName}) • <strong>Prioridad:</strong> {ot.priority}
              </p>
            </div>

            {/* Múltiples técnicos y costos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px', background: '#F8F9FC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E4E9' }}>
              <div style={{ fontSize: '12px', color: '#1A1C1E', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                <Users size={15} color="#4C5F80" /> 
                <span>Técnicos Asignados ({ot.technicians ? ot.technicians.length : 0}):</span>
              </div>
              {ot.technicians && ot.technicians.map((t, idx) => (
                <div key={idx} style={{ fontSize: '13px', color: '#515254', paddingLeft: '22px', fontWeight: '500' }}>
                  • {t.name} (<strong>{t.hours} hrs</strong>)
                </div>
              ))}
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #D8DCE5', fontSize: '13px', fontWeight: '800', color: '#05B169', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Imputable:</span>
                <span>${ot.totalCost ? ot.totalCost.toFixed(2) : '0.00'} USD</span>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSelectedOT(ot);
                  setAiDiagnosis(ot.aiDiagnosis || null);
                }}
              >
                <FileText size={16} /> Detalle & Checklist
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: '#E8EEF8', border: '1px solid #C4D2E8', color: '#4C5F80', boxShadow: 'none', fontWeight: '700' }}
                onClick={() => downloadPDF(ot.id)}
                title="Descargar Acta Formal con firmas PDF"
              >
                <Download size={16} /> Acta PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalle OT & Asistente IA */}
      {selectedOT && (
        <div className="modal-overlay" onClick={() => { setSelectedOT(null); setAiDiagnosis(null); }}>
          <div className="modal-content" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#4C5F80' }}>{selectedOT.code} • {selectedOT.type}</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E', marginTop: '2px' }}>{selectedOT.assetName}</h3>
                <p style={{ fontSize: '13px', color: '#515254', fontWeight: '600' }}>Área: {selectedOT.areaName} | CECO: {selectedOT.costCenterCode}</p>
              </div>
              <button onClick={() => { setSelectedOT(null); setAiDiagnosis(null); }} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9', marginBottom: '20px' }}>
              <strong style={{ color: '#4C5F80', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>📝 Descripción de Trabajo en Planta:</strong>
              <p style={{ fontSize: '14px', color: '#1A1C1E', lineHeight: '1.5' }}>{selectedOT.description}</p>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#DF2935', fontWeight: '700' }}>
                ⏱️ Tiempo de parada de máquina (Downtime para KPI): {selectedOT.downtimeMinutes} mins
              </div>
            </div>

            {/* ASISTENTE DE INTELIGENCIA ARTIFICIAL (Módulo 8) */}
            <div style={{ background: '#F2EEFE', border: '1px solid #D5C3FD', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#6A35E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                    <Bot size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E' }}>Asistente Inteligencia Artificial (IA) en Planta</h4>
                    <span style={{ fontSize: '12px', color: '#6A35E0', fontWeight: '700' }}>Diagnóstico Asistido & Guía de Soluciones para Técnicos</span>
                  </div>
                </div>
                {!aiDiagnosis && (
                  <button 
                    className="btn btn-ai" 
                    disabled={aiLoading}
                    onClick={() => triggerAiHelp(selectedOT.assetName, selectedOT.description, selectedOT.assetCode)}
                  >
                    {aiLoading ? '⏳ Consultando Motor IA...' : '✨ Consultar Soluciones IA'}
                  </button>
                )}
              </div>

              {aiDiagnosis ? (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #D5C3FD', fontSize: '13px', color: '#1A1C1E', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ color: '#DF2935', display: 'block', marginBottom: '4px', fontSize: '14px' }}>⚠️ Posibles Causas Raíz Detectadas por IA:</strong>
                    <ul style={{ paddingLeft: '20px', color: '#515254' }}>
                      {aiDiagnosis.possibleCauses && aiDiagnosis.possibleCauses.map((c, i) => (
                        <li key={i} style={{ marginBottom: '4px', fontWeight: '600' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ color: '#05B169', display: 'block', marginBottom: '4px', fontSize: '14px' }}>🔧 Pasos Recomendados para Reparación / Diagnóstico:</strong>
                    <ol style={{ paddingLeft: '20px', color: '#1A1C1E' }}>
                      {aiDiagnosis.recommendedSteps && aiDiagnosis.recommendedSteps.map((r, i) => (
                        <li key={i} style={{ marginBottom: '6px', fontWeight: '700' }}>{r}</li>
                      ))}
                    </ol>
                  </div>
                  <div style={{ background: '#FEF7EC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE3BA', fontSize: '13px', color: '#E58D14', fontWeight: '700' }}>
                    {aiDiagnosis.safetyWarning || "🚨 Aplicar bloqueo LOTO antes de manipular circuitos en el CECO."}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#515254', margin: 0 }}>
                  Pulsa el botón para que el modelo IA analice el síntoma (<em>"{selectedOT.description.slice(0, 45)}..."</em>) y devuelva las causas probables y guía de solución in-situ.
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9' }}>
                <strong style={{ fontSize: '14px', color: '#1A1C1E', display: 'block', marginBottom: '10px' }}>✅ Checklist en Planta:</strong>
                {selectedOT.tasks && selectedOT.tasks.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" defaultChecked={t.completed} style={{ width: '16px', height: '16px', accentColor: '#05B169' }} />
                    <span style={{ color: t.completed ? '#05B169' : '#1A1C1E', textDecoration: t.completed ? 'line-through' : 'none' }}>
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9' }}>
                <strong style={{ fontSize: '14px', color: '#1A1C1E', display: 'block', marginBottom: '10px' }}>📦 Repuestos Consumidos:</strong>
                {selectedOT.spareParts && selectedOT.spareParts.map((p, idx) => (
                  <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #F3F5F9' }}>
                    <div style={{ fontWeight: '700', color: '#1A1C1E' }}>{p.name} (Cant: {p.quantity})</div>
                    <div style={{ color: p.cost === 0 ? '#05B169' : '#515254', fontWeight: '600' }}>
                      Costo Imputado: ${p.cost ? p.cost.toFixed(2) : '0.00'} USD {p.cost === 0 ? '(Canibalizado)' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
              <button className="btn btn-secondary" onClick={() => downloadPDF(selectedOT.id)}>
                <Download size={16} /> Descargar Acta PDF
              </button>
              <button className="btn btn-primary" onClick={async () => {
                try {
                  await api.updateWorkOrderStatus(selectedOT.id || selectedOT.Id, { status: selectedOT.status || 'En Proceso', downtimeMinutes: selectedOT.downtimeMinutes });
                  setSelectedOT(null);
                  alert("✅ OT Guardada exitosamente en Azure SQL.");
                  loadOrders();
                } catch(e) {
                  alert("❌ Error al actualizar OT: " + e.message);
                }
              }}>
                Guardar Avance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear OT con Múltiples Técnicos */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Emisión Rápida de OT con Múltiples Técnicos</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateOT}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Tipo de Mantenimiento</label>
                  <select className="form-select" value={newOT.type} onChange={e => setNewOT({...newOT, type: e.target.value})}>
                    <option value="Correctivo">🚨 Correctivo (Reporte de Falla)</option>
                    <option value="Preventivo">📅 Preventivo (Rutinario)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridad Operativa</label>
                  <select className="form-select" value={newOT.priority} onChange={e => setNewOT({...newOT, priority: e.target.value})}>
                    <option value="Urgente">🔥 Urgente (Parada de línea)</option>
                    <option value="Alta">⚡ Alta</option>
                    <option value="Normal">🟢 Normal</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Activo / Máquina o Área</label>
                  <input className="form-input" value={newOT.assetName} onChange={e => setNewOT({...newOT, assetName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>CECO Imputable</label>
                  <input className="form-input" value={newOT.costCenterCode} onChange={e => setNewOT({...newOT, costCenterCode: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción de Incidencia / Síntoma *</label>
                <textarea className="form-textarea" required rows="3" value={newOT.description} onChange={e => setNewOT({...newOT, description: e.target.value})} placeholder="Ej. Pérdida de presión en circuito primario de prensa..." />
              </div>

              <div className="form-group">
                <label>Tiempo de Parada (Minutos para KPI Downtime)</label>
                <input type="number" className="form-input" value={newOT.downtimeMinutes} onChange={e => setNewOT({...newOT, downtimeMinutes: e.target.value})} />
              </div>

              <div style={{ background: '#F3F5F9', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9', marginBottom: '16px' }}>
                <strong style={{ fontSize: '13px', color: '#4C5F80', display: 'block', marginBottom: '12px', fontWeight: '800' }}>
                  👥 Asignación de Múltiples Técnicos (Req. 3):
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <input className="form-input" placeholder="Nombre Técnico 1" value={newOT.tech1} onChange={e => setNewOT({...newOT, tech1: e.target.value})} />
                  <input type="number" step="0.5" className="form-input" placeholder="Horas" value={newOT.tech1Hours} onChange={e => setNewOT({...newOT, tech1Hours: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <input className="form-input" placeholder="Nombre Técnico 2 (Opcional)" value={newOT.tech2} onChange={e => setNewOT({...newOT, tech2: e.target.value})} />
                  <input type="number" step="0.5" className="form-input" placeholder="Horas" value={newOT.tech2Hours} onChange={e => setNewOT({...newOT, tech2Hours: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Emitir Orden de Trabajo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
