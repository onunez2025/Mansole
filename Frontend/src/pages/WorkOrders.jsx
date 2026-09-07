import React, { useEffect, useState, useMemo } from 'react';
import { api, API_BASE } from '../services/api';
import { Hammer, Plus, Download, Bot, Users, FileText, Search, Play, CheckCircle2, AlertTriangle, Filter, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { OrderCardSkeleton } from '../components/UI';

// Caché en cliente para que al volver a OTs cargue de inmediato (0ms)
let cachedWorkOrdersList = null;

export default function WorkOrders({ currentUser }) {
  const [workOrders, setWorkOrders] = useState(cachedWorkOrdersList || []);
  const [loading, setLoading] = useState(!cachedWorkOrdersList);
  const [selectedOT, setSelectedOT] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);

  // Filtros de Proceso y Búsqueda
  const [activeStage, setActiveStage] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

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

  const loadOrders = (silent = false) => {
    if (!silent && !cachedWorkOrdersList) setLoading(true);
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
            downtimeMinutes: o.downtimeMinutes || o.DowntimeMinutes || 0,
            technicians: o.technicians || o.Technicians || [{ name: 'Juan Pérez (Técnico 1)', hours: 2 }],
            aiDiagnosis: o.aiDiagnosis || null
          };
        });
        cachedWorkOrdersList = clean;
        setWorkOrders(clean);
      } else {
        setWorkOrders([]);
      }
      setLoading(false);
    }).catch(() => {
      if (!cachedWorkOrdersList) setWorkOrders([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
    // Cargar activos disponibles para el formulario de nueva OT
    api.getAssets().then(data => {
      if (Array.isArray(data)) setAvailableAssets(data);
    }).catch(() => {});
  }, []);

  const triggerAiHelp = async (assetName, description, code) => {
    setAiLoading(true);
    const result = await api.diagnoseWithAI(assetName, description, code);
    setAiDiagnosis(result);
    setAiLoading(false);
  };

  // Cambio rápido de estado con 1 clic desde la tarjeta
  const handleQuickStatusChange = async (otId, newStatus) => {
    try {
      await api.updateWorkOrderStatus(otId, { status: newStatus });
      toast.success(`OT actualizada a estado: ${newStatus}`);
      // Actualizar localmente de inmediato para feedback instantáneo
      const updated = workOrders.map(o => o.id === otId ? { ...o, status: newStatus } : o);
      cachedWorkOrdersList = updated;
      setWorkOrders(updated);
      loadOrders(true); // Sincronización silenciosa en segundo plano
    } catch (err) {
      toast.error(`Error actualizando estado: ${err.message}`);
    }
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
      toast.success(`${response.message || 'OT emitida exitosamente'} (Código: ${response.code})`);
      loadOrders(); // Recargar de BD real
    } catch (error) {
      toast.error(`Error al crear OT: ${error.response?.data?.error || error.message}`);
    }
  };

  const downloadPDF = (id) => {
    window.open(`${API_BASE}/workorders/${id}/pdf`, '_blank');
  };

  // Conteos por etapa de proceso para la barra de Pipeline
  const stageCounts = useMemo(() => {
    const counts = { Todas: workOrders.length, Pendiente: 0, 'En Progreso': 0, Finalizada: 0, Cerrada: 0 };
    workOrders.forEach(o => {
      const st = o.status;
      if (st === 'Iniciada' || st === 'Pendiente') counts.Pendiente++;
      else if (st === 'En Progreso' || st === 'En Proceso' || st === 'Iniciado en Planta') counts['En Progreso']++;
      else if (st === 'Finalizada') counts.Finalizada++;
      else if (st === 'Cerrada') counts.Cerrada++;
    });
    return counts;
  }, [workOrders]);

  // Filtrar OTs por Pipeline y Búsqueda
  const filteredOrders = useMemo(() => {
    return workOrders.filter(ot => {
      // Filtro por etapa
      if (activeStage === 'Pendiente') {
        if (ot.status !== 'Iniciada' && ot.status !== 'Pendiente') return false;
      } else if (activeStage === 'En Progreso') {
        if (ot.status !== 'En Progreso' && ot.status !== 'En Proceso' && ot.status !== 'Iniciado en Planta') return false;
      } else if (activeStage === 'Finalizada') {
        if (ot.status !== 'Finalizada') return false;
      } else if (activeStage === 'Cerrada') {
        if (ot.status !== 'Cerrada') return false;
      }

      // Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = (ot.code || '').toLowerCase().includes(q);
        const matchesAsset = (ot.assetName || '').toLowerCase().includes(q) || (ot.assetCode || '').toLowerCase().includes(q);
        const matchesCeco = (ot.costCenterCode || '').toLowerCase().includes(q) || (ot.areaName || '').toLowerCase().includes(q);
        const matchesDesc = (ot.description || '').toLowerCase().includes(q);
        const matchesTech = (ot.technicians || []).some(t => (t.name || '').toLowerCase().includes(q));
        return matchesCode || matchesAsset || matchesCeco || matchesDesc || matchesTech;
      }

      return true;
    });
  }, [workOrders, activeStage, searchQuery]);

  return (
    <div>
      {/* Cabecera y botón de acción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E', margin: 0 }}>Gestión de Órdenes de Trabajo (OT)</h3>
          <p style={{ fontSize: '13px', color: '#515254', margin: '4px 0 0 0' }}>
            Flujo de mantenimiento en planta: <strong>Solicitud ➔ En Proceso ➔ Finalización ➔ Cierre Contable</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ boxShadow: '0 2px 6px rgba(76, 95, 128, 0.2)' }}>
          <Plus size={18} /> Emitir Nueva OT
        </button>
      </div>

      {/* Barra de Pipeline Operativo (Etapas del Proceso) y Buscador */}
      <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E4E9', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        {/* Pestañas de Proceso */}
        <div className="pipeline-container">
          <button 
            className={`pipeline-tab ${activeStage === 'Todas' ? 'active' : ''}`}
            onClick={() => setActiveStage('Todas')}
          >
            Todas <span className="pipeline-count">{stageCounts.Todas}</span>
          </button>
          <button 
            className={`pipeline-tab ${activeStage === 'Pendiente' ? 'active' : ''}`}
            onClick={() => setActiveStage('Pendiente')}
          >
            🟡 Solicitadas / Pendientes <span className="pipeline-count">{stageCounts.Pendiente}</span>
          </button>
          <button 
            className={`pipeline-tab ${activeStage === 'En Progreso' ? 'active' : ''}`}
            onClick={() => setActiveStage('En Progreso')}
          >
            ⚙️ En Planta / En Proceso <span className="pipeline-count">{stageCounts['En Progreso']}</span>
          </button>
          <button 
            className={`pipeline-tab ${activeStage === 'Finalizada' ? 'active' : ''}`}
            onClick={() => setActiveStage('Finalizada')}
          >
            ✅ Finalizadas <span className="pipeline-count">{stageCounts.Finalizada}</span>
          </button>
          <button 
            className={`pipeline-tab ${activeStage === 'Cerrada' ? 'active' : ''}`}
            onClick={() => setActiveStage('Cerrada')}
          >
            🔒 Cerradas <span className="pipeline-count">{stageCounts.Cerrada}</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#8A919E" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por OT, máquina o técnico..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #D8DCE5',
              fontSize: '13px',
              background: '#F9FAFB',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Skeletons durante carga inicial */}
      {loading && !workOrders.length ? (
        <OrderCardSkeleton count={4} />
      ) : filteredOrders.length === 0 ? (
        <div className="siatc-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#515254' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#1A1C1E', marginBottom: '4px' }}>No se encontraron Órdenes de Trabajo</h4>
          <p style={{ fontSize: '13px', color: '#8A919E', margin: 0 }}>
            {searchQuery ? `No hay resultados para "${searchQuery}" en la etapa "${activeStage}".` : `No hay órdenes en la etapa "${activeStage}".`}
          </p>
        </div>
      ) : (
        /* Listado de OTs */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((ot) => {
            const isPending = ot.status === 'Iniciada' || ot.status === 'Pendiente';
            const isInProgress = ot.status === 'En Progreso' || ot.status === 'En Proceso' || ot.status === 'Iniciado en Planta';
            const isFinished = ot.status === 'Finalizada';
            const isClosed = ot.status === 'Cerrada';

            return (
              <div key={ot.id} className="siatc-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', flexWrap: 'wrap', gap: '18px', borderLeft: isInProgress ? '4px solid #3B72D4' : isFinished ? '4px solid #05B169' : isClosed ? '4px solid #4C5F80' : '4px solid #E58D14' }}>
                {/* Datos Principales */}
                <div style={{ maxWidth: '500px', flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#4C5F80' }}>{ot.code}</span>
                    <span className={`badge ${ot.type === 'Preventivo' ? 'badge-info' : 'badge-danger'}`}>{ot.type}</span>
                    <span className={`badge ${isFinished ? 'badge-success' : isInProgress ? 'badge-info' : isClosed ? 'badge-success' : 'badge-warning'}`}>
                      {ot.status}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: ot.priority === 'Urgente' ? '#DF2935' : ot.priority === 'Alta' ? '#E58D14' : '#05B169' }}>
                      ● {ot.priority}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E', margin: '4px 0' }}>
                    [{ot.assetCode}] {ot.assetName}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#515254', margin: '2px 0 6px 0' }}>
                    <strong>CECO:</strong> {ot.costCenterCode} ({ot.areaName})
                  </p>
                  <p style={{ fontSize: '13px', color: '#8A919E', margin: 0, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{ot.description}"
                  </p>
                </div>

                {/* Múltiples técnicos y costos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', background: '#F8F9FC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E4E9' }}>
                  <div style={{ fontSize: '12px', color: '#1A1C1E', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                    <Users size={14} color="#4C5F80" /> 
                    <span>Técnicos Asignados ({ot.technicians ? ot.technicians.length : 0}):</span>
                  </div>
                  {ot.technicians && ot.technicians.map((t, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#515254', paddingLeft: '20px', fontWeight: '500' }}>
                      • {t.name} (<strong>{t.hours}h</strong>)
                    </div>
                  ))}
                  <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #D8DCE5', fontSize: '12px', fontWeight: '800', color: '#05B169', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Costo:</span>
                    <span>${ot.totalCost ? ot.totalCost.toFixed(2) : '0.00'} USD</span>
                  </div>
                </div>

                {/* Acciones Rápidas del Proceso */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Botón rápido para Iniciar OT si está pendiente */}
                  {isPending && (
                    <button
                      className="btn"
                      style={{ background: '#EAF0FB', border: '1px solid #C5D6F5', color: '#3B72D4', fontSize: '12px', padding: '8px 12px' }}
                      onClick={() => handleQuickStatusChange(ot.id, 'En Progreso')}
                      title="Pasar OT a En Proceso"
                    >
                      <Play size={14} /> Iniciar
                    </button>
                  )}

                  {/* Botón rápido para Finalizar OT si está en proceso */}
                  {isInProgress && (
                    <button
                      className="btn"
                      style={{ background: '#E7F9F0', border: '1px solid #B8EBD1', color: '#05B169', fontSize: '12px', padding: '8px 12px' }}
                      onClick={() => handleQuickStatusChange(ot.id, 'Finalizada')}
                      title="Marcar OT como Finalizada"
                    >
                      <CheckCircle size={14} /> Finalizar
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                    onClick={() => {
                      setSelectedOT(ot);
                      setAiDiagnosis(ot.aiDiagnosis || null);
                    }}
                  >
                    <FileText size={15} /> Detalle & Checklist
                  </button>

                  <button 
                    className="btn btn-primary" 
                    style={{ background: '#E8EEF8', border: '1px solid #C4D2E8', color: '#4C5F80', boxShadow: 'none', fontWeight: '700', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => downloadPDF(ot.id)}
                    title="Descargar Acta Formal con firmas PDF"
                  >
                    <Download size={15} /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: '#4C5F80', fontSize: '13px', textTransform: 'uppercase' }}>📝 Descripción de Trabajo en Planta:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#515254' }}>Estado OT:</label>
                  <select 
                    className="form-select"
                    style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700', width: 'auto' }}
                    value={selectedOT.status || 'Iniciado en Planta'}
                    onChange={e => setSelectedOT({ ...selectedOT, status: e.target.value })}
                  >
                    <option value="Pendiente">🟡 Pendiente</option>
                    <option value="En Progreso">🔵 En Progreso</option>
                    <option value="Iniciado en Planta">⚙️ Iniciado en Planta</option>
                    <option value="Finalizada">✅ Finalizada</option>
                    <option value="Cerrada">🔒 Cerrada</option>
                  </select>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#1A1C1E', lineHeight: '1.5', margin: 0 }}>{selectedOT.description}</p>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#DF2935', fontWeight: '700' }}>
                <span>⏱️ Tiempo de parada de máquina (Downtime KPI):</span>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '90px', padding: '4px 8px', fontSize: '13px', fontWeight: '700' }}
                  value={selectedOT.downtimeMinutes || 0} 
                  onChange={e => setSelectedOT({ ...selectedOT, downtimeMinutes: parseInt(e.target.value) || 0 })}
                />
                <span>mins</span>
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
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E', margin: 0 }}>Asistente Inteligencia Artificial (IA) en Planta</h4>
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
                    <ul style={{ paddingLeft: '20px', color: '#515254', margin: 0 }}>
                      {aiDiagnosis.possibleCauses && aiDiagnosis.possibleCauses.map((c, i) => (
                        <li key={i} style={{ marginBottom: '4px', fontWeight: '600' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ color: '#05B169', display: 'block', marginBottom: '4px', fontSize: '14px' }}>🔧 Pasos Recomendados para Reparación / Diagnóstico:</strong>
                    <ol style={{ paddingLeft: '20px', color: '#1A1C1E', margin: 0 }}>
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

            {/* Checklist en Planta y Repuestos Consumidos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9' }}>
                <strong style={{ fontSize: '14px', color: '#1A1C1E', display: 'block', marginBottom: '10px' }}>✅ Checklist de Tareas en Planta:</strong>
                {(selectedOT.tasks && selectedOT.tasks.length > 0 ? selectedOT.tasks : [
                  { name: '1. Inspeccionar conexiones y cableado eléctrico', completed: true },
                  { name: '2. Verificar lubricación y niveles de fluido', completed: false },
                  { name: '3. Realizar prueba de funcionamiento en vacío', completed: false }
                ]).map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" defaultChecked={t.completed} style={{ width: '16px', height: '16px', accentColor: '#05B169' }} />
                    <span style={{ color: t.completed ? '#05B169' : '#1A1C1E', textDecoration: t.completed ? 'line-through' : 'none' }}>
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9' }}>
                <strong style={{ fontSize: '14px', color: '#1A1C1E', display: 'block', marginBottom: '10px' }}>📦 Repuestos Consumidos del Almacén:</strong>
                {(selectedOT.spareParts && selectedOT.spareParts.length > 0 ? selectedOT.spareParts : [
                  { name: 'REP-VLM-001 Válvula Proporcional Hidráulica', quantity: 1, cost: 350.00 }
                ]).map((p, idx) => (
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
                  await api.updateWorkOrderStatus(selectedOT.id || selectedOT.Id, { 
                    status: selectedOT.status || 'En Progreso', 
                    downtimeMinutes: selectedOT.downtimeMinutes 
                  });
                  setSelectedOT(null);
                  toast.success("OT actualizada exitosamente en Azure SQL Server");
                  loadOrders();
                } catch(e) {
                  toast.error("Error al actualizar OT: " + (e.response?.data?.error || e.message));
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
                  <label>Seleccionar Activo / Máquina *</label>
                  {availableAssets.length > 0 ? (
                    <select 
                      className="form-select"
                      value={newOT.assetCode}
                      onChange={e => {
                        const selected = availableAssets.find(a => (a.code || a.Code) === e.target.value);
                        if (selected) {
                          setNewOT({
                            ...newOT,
                            assetCode: selected.code || selected.Code,
                            assetName: selected.name || selected.Name,
                            areaName: selected.areaName || selected.AreaName || 'Área General',
                            costCenterCode: selected.costCenterCode || selected.CostCenterCode || 'CECO-SOL-101'
                          });
                        }
                      }}
                    >
                      {availableAssets.map(a => (
                        <option key={a.id || a.Id} value={a.code || a.Code}>
                          [{a.code || a.Code}] {a.name || a.Name} ({a.areaName || a.AreaName || 'Planta'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-input" value={newOT.assetName} onChange={e => setNewOT({...newOT, assetName: e.target.value})} />
                  )}
                </div>
                <div className="form-group">
                  <label>CECO Imputable (Autocompletado)</label>
                  <input className="form-input" value={newOT.costCenterCode} readOnly style={{ background: '#F4F6F9', color: '#4C5F80', fontWeight: '700' }} />
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
