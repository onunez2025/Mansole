import React, { useEffect, useState, useMemo } from 'react';
import { api, API_BASE } from '../services/api';
import { Hammer, Plus, Download, Bot, Users, FileText, Search, Play, CheckCircle2, AlertTriangle, Filter, CheckCircle, Clock, HelpCircle, Timer, Trash2, PlusCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { OrderCardSkeleton } from '../components/UI';
import HelpModal from '../components/HelpModal';

// Caché en cliente para que al volver a OTs cargue de inmediato (0ms)
let cachedWorkOrdersList = null;

export default function WorkOrders({ currentUser }) {
  const [workOrders, setWorkOrders] = useState(cachedWorkOrdersList || []);
  const [loading, setLoading] = useState(!cachedWorkOrdersList);
  const [selectedOT, setSelectedOT] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [catalogActivities, setCatalogActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [taskComments, setTaskComments] = useState('');
  const [otTasks, setOtTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

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

  const loadCatalogActivities = () => {
    api.getActivities().then(data => {
      if (Array.isArray(data)) {
        setCatalogActivities(data);
        if (data.length > 0) setSelectedActivityId(data[0].Id || data[0].id);
      }
    }).catch(() => {});
  };

  const loadOtTasks = async (orderId) => {
    setTasksLoading(true);
    try {
      const tasks = await api.getOrderTasks(orderId);
      setOtTasks(Array.isArray(tasks) ? tasks : []);
    } catch (e) {
      setOtTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleAddTaskToOT = async (e) => {
    e.preventDefault();
    if (!selectedOT || !selectedActivityId) return;
    try {
      await api.addOrderTask(selectedOT.id || selectedOT.Id, {
        activityId: selectedActivityId,
        technicianName: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Técnico de Planta',
        comments: taskComments
      });
      toast.success('Actividad asignada a la OT con éxito');
      setTaskComments('');
      loadOtTasks(selectedOT.id || selectedOT.Id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar tarea');
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      const techName = currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Técnico de Planta';
      await api.startOrderTask(taskId, techName);
      toast.success('⏱️ Tarea iniciada. Cronómetro en marcha.');
      if (selectedOT) loadOtTasks(selectedOT.id || selectedOT.Id);
    } catch (err) {
      toast.error('Error al iniciar tarea');
    }
  };

  const handleFinishTask = async (taskId) => {
    try {
      await api.finishOrderTask(taskId, 'Trabajo completado según procedimiento estándar.');
      toast.success('✅ Tarea finalizada. Tiempo registrado en Azure SQL.');
      if (selectedOT) loadOtTasks(selectedOT.id || selectedOT.Id);
    } catch (err) {
      toast.error('Error al finalizar tarea');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea de la OT?')) return;
    try {
      await api.deleteOrderTask(taskId);
      toast.success('Tarea removida de la OT');
      if (selectedOT) loadOtTasks(selectedOT.id || selectedOT.Id);
    } catch (err) {
      toast.error('Error al eliminar tarea');
    }
  };

  useEffect(() => {
    loadOrders();
    loadCatalogActivities();
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
    <div className="space-y-6">
      {/* Cabecera y botón de acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Órdenes de Trabajo (OT)</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Flujo de mantenimiento: Solicitud → En Planta → Finalizada → Cierre Contable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <HelpCircle size={15} className="text-blue-600" />
            <span>Guía LOTO & Proceso OT</span>
          </button>
          <button className="btn btn-primary text-xs" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} /> Emitir Nueva OT
          </button>
        </div>
      </div>

      {/* Barra de Pipeline Operativo y Buscador */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xs">
        {/* Pestañas de Proceso */}
        <div className="pipeline-container">
          <button 
            className={`pipeline-tab text-xs ${activeStage === 'Todas' ? 'active' : ''}`}
            onClick={() => setActiveStage('Todas')}
          >
            Todas <span className="pipeline-count">{stageCounts.Todas}</span>
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeStage === 'Pendiente' ? 'active' : ''}`}
            onClick={() => setActiveStage('Pendiente')}
          >
            🟡 Solicitadas <span className="pipeline-count">{stageCounts.Pendiente}</span>
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeStage === 'En Progreso' ? 'active' : ''}`}
            onClick={() => setActiveStage('En Progreso')}
          >
            ⚙️ En Planta <span className="pipeline-count">{stageCounts['En Progreso']}</span>
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeStage === 'Finalizada' ? 'active' : ''}`}
            onClick={() => setActiveStage('Finalizada')}
          >
            ✅ Finalizadas <span className="pipeline-count">{stageCounts.Finalizada}</span>
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeStage === 'Cerrada' ? 'active' : ''}`}
            onClick={() => setActiveStage('Cerrada')}
          >
            🔒 Cerradas <span className="pipeline-count">{stageCounts.Cerrada}</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por OT, máquina o técnico..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
      </div>

      {/* Skeletons durante carga inicial */}
      {loading && !workOrders.length ? (
        <OrderCardSkeleton count={4} />
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl text-center py-12 px-6 shadow-xs">
          <div className="text-3xl mb-2">🔍</div>
          <h4 className="text-base font-bold text-slate-900 mb-1">No se encontraron Órdenes de Trabajo</h4>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No hay resultados para "${searchQuery}" en la etapa "${activeStage}".` : `No hay órdenes en la etapa "${activeStage}".`}
          </p>
        </div>
      ) : (
        /* Listado de OTs */
        <div className="space-y-3">
          {filteredOrders.map((ot) => {
            const isPending = ot.status === 'Iniciada' || ot.status === 'Pendiente';
            const isInProgress = ot.status === 'En Progreso' || ot.status === 'En Proceso' || ot.status === 'Iniciado en Planta';
            const isFinished = ot.status === 'Finalizada';
            const isClosed = ot.status === 'Cerrada';

            return (
              <div key={ot.id} className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4 transition-all hover:border-slate-300 ${
                isInProgress ? 'border-l-4 border-l-blue-500' : isFinished ? 'border-l-4 border-l-emerald-500' : isClosed ? 'border-l-4 border-l-slate-400' : 'border-l-4 border-l-amber-500'
              }`}>
                {/* Datos Principales */}
                <div className="max-w-xl flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">{ot.code}</span>
                    <span className={`badge ${ot.type === 'Preventivo' ? 'badge-info' : 'badge-danger'} text-[11px]`}>{ot.type}</span>
                    <span className={`badge ${isFinished ? 'badge-success' : isInProgress ? 'badge-info' : isClosed ? 'badge-mono' : 'badge-warning'} text-[11px]`}>
                      {ot.status}
                    </span>
                    <span className={`text-[11px] font-bold font-mono ${ot.priority === 'Urgente' ? 'text-red-600' : ot.priority === 'Alta' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ● {ot.priority}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1 leading-tight">
                    [{ot.assetCode}] {ot.assetName}
                  </h4>
                  <p className="text-xs text-slate-500 mb-1.5">
                    <strong className="text-slate-700">CECO:</strong> {ot.costCenterCode} • <span className="text-slate-700">{ot.areaName}</span>
                  </p>
                  <p className="text-xs text-slate-600 italic line-clamp-1">
                    "{ot.description}"
                  </p>
                </div>

                {/* Múltiples técnicos y costos */}
                <div className="flex flex-col gap-1.5 min-w-[220px] bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs">
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Users size={13} className="text-slate-500" /> 
                    <span>Técnicos ({ot.technicians ? ot.technicians.length : 0}):</span>
                  </div>
                  {ot.technicians && ot.technicians.map((t, idx) => (
                    <div key={idx} className="text-slate-700 pl-4 font-medium">
                      • {t.name} (<strong className="text-slate-900">{t.hours}h</strong>)
                    </div>
                  ))}
                  <div className="mt-1 pt-1.5 border-t border-slate-200 text-xs font-bold flex justify-between font-mono">
                    <span className="text-slate-500">COSTO TOTAL:</span>
                    <span className="text-emerald-700">${ot.totalCost ? ot.totalCost.toFixed(2) : '0.00'} USD</span>
                  </div>
                </div>

                {/* Acciones Rápidas del Proceso */}
                <div className="flex gap-2 items-center flex-wrap">
                  {/* Botón rápido para Iniciar OT si está pendiente */}
                  {isPending && (
                    <button
                      className="btn text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold py-1.5 px-3"
                      onClick={() => handleQuickStatusChange(ot.id, 'En Progreso')}
                      title="Pasar OT a En Proceso"
                    >
                      <Play size={12} /> INICIAR
                    </button>
                  )}

                  {/* Botón rápido para Finalizar OT si está en proceso */}
                  {isInProgress && (
                    <button
                      className="btn text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold py-1.5 px-3"
                      onClick={() => handleQuickStatusChange(ot.id, 'Finalizada')}
                      title="Marcar OT como Finalizada"
                    >
                      <CheckCircle size={12} /> FINALIZAR
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary text-xs py-1.5 px-3"
                    onClick={() => {
                      setSelectedOT(ot);
                      setAiDiagnosis(ot.aiDiagnosis || null);
                      loadOtTasks(ot.id);
                    }}
                  >
                    <FileText size={14} /> Detalle & Checklist
                  </button>

                  <button 
                    className="btn btn-secondary text-xs py-1.5 px-2.5 text-slate-700"
                    onClick={() => downloadPDF(ot.id)}
                    title="Descargar Acta Formal en PDF"
                  >
                    <Download size={13} /> PDF
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
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 mb-5 shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">Asistente IA para Diagnóstico en Planta</h4>
                    <span className="text-xs text-slate-500 font-medium">Recomendaciones predictivas y heurística de averías</span>
                  </div>
                </div>
                {!aiDiagnosis && (
                  <button 
                    className="btn btn-primary text-xs py-1.5 px-3" 
                    disabled={aiLoading}
                    onClick={() => triggerAiHelp(selectedOT.assetName, selectedOT.description, selectedOT.assetCode)}
                  >
                    {aiLoading ? 'Consultando IA...' : '✨ Diagnóstico IA'}
                  </button>
                )}
              </div>

              {aiDiagnosis ? (
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs space-y-3 leading-relaxed">
                  <div>
                    <strong className="text-red-700 block mb-1 font-semibold">⚠️ Posibles Causas Raíz:</strong>
                    <ul className="list-disc pl-5 text-slate-600 space-y-1">
                      {aiDiagnosis.possibleCauses && aiDiagnosis.possibleCauses.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-emerald-700 block mb-1 font-semibold">🔧 Pasos Recomendados:</strong>
                    <ol className="list-decimal pl-5 text-slate-700 space-y-1 font-medium">
                      {aiDiagnosis.recommendedSteps && aiDiagnosis.recommendedSteps.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800 font-medium">
                    {aiDiagnosis.safetyWarning || "🚨 Aplicar protocolo de bloqueo y etiquetado LOTO antes de intervenir."}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 m-0">
                  Presiona el botón para que el asistente analice la avería y proponga causas probables y solución paso a paso.
                </p>
              )}
            </div>

            {/* Control de Tareas con Catálogo de Actividades y Tiempos de Inicio/Fin */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Timer className="text-blue-600" size={18} />
                    <span>Control Cronometrado de Tareas por Actividad</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    El técnico selecciona cada actividad del catálogo, la inicia al momento de intervenir y la finaliza al concluir.
                  </p>
                </div>

                {/* Formulario para Asignar Actividad a la OT */}
                <form onSubmit={handleAddTaskToOT} className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedActivityId}
                    onChange={e => setSelectedActivityId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 max-w-xs"
                  >
                    {catalogActivities.map(act => (
                      <option key={act.Id || act.id} value={act.Id || act.id}>
                        [{act.Type || 'Mecánico'}] {act.Name || act.name} ({act.EstimatedMinutes || 30}m)
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <PlusCircle size={14} />
                    <span>Asignar Tarea</span>
                  </button>
                </form>
              </div>

              {/* Lista de Tareas con Tiempos y Estado */}
              {tasksLoading ? (
                <div className="py-6 text-center text-slate-400 text-xs">Cargando tareas de la OT...</div>
              ) : otTasks.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Aún no hay tareas asignadas a esta orden.</p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Selecciona una actividad del catálogo superior y pulsa "Asignar Tarea".</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {otTasks.map(task => {
                    const isPending = !task.StartedAt && !task.IsCompleted;
                    const isRunning = task.StartedAt && !task.IsCompleted;
                    const isDone = task.IsCompleted;

                    return (
                      <div 
                        key={task.Id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isRunning 
                            ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' 
                            : (isDone ? 'bg-slate-50/40 border-slate-200' : 'bg-white border-slate-200')
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {task.ActivityName || 'Actividad Industrial'}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isRunning 
                                ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                                : (isDone 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-200')
                            }`}>
                              {isRunning ? '⏳ En Ejecución' : (isDone ? '✅ Completada' : '🟡 Por Iniciar')}
                            </span>
                            {task.ActivityType && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                ({task.ActivityType})
                              </span>
                            )}
                          </div>

                          {/* Tiempos de Inicio y Fin */}
                          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                            <span>
                              <strong>Inicio:</strong> {task.StartedAt ? new Date(task.StartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                            </span>
                            <span>
                              <strong>Fin:</strong> {task.CompletedAt ? new Date(task.CompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                            </span>
                            {task.DurationMinutes !== null && task.DurationMinutes !== undefined && (
                              <span className="font-bold text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                                ⏱️ Duración: {task.DurationMinutes} mins
                              </span>
                            )}
                            {task.TechnicianName && (
                              <span className="text-slate-600">
                                👤 {task.TechnicianName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de Acción para el Técnico */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleStartTask(task.Id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              <Play size={13} />
                              <span>INICIAR TAREA</span>
                            </button>
                          )}

                          {isRunning && (
                            <button
                              type="button"
                              onClick={() => handleFinishTask(task.Id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              <Check size={13} />
                              <span>FINALIZAR TAREA</span>
                            </button>
                          )}

                          {isDone && (
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={15} /> Registrado
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.Id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar tarea"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Repuestos Consumidos del Almacén */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-5">
              <strong className="text-slate-900 block mb-2.5 font-bold uppercase tracking-wider text-[11px]">
                Repuestos Consumidos del Almacén
              </strong>
              <div className="space-y-2">
                {(selectedOT.spareParts && selectedOT.spareParts.length > 0 ? selectedOT.spareParts : [
                  { name: 'REP-VLM-001 Válvula Proporcional Hidráulica', quantity: 1, cost: 350.00 }
                ]).map((p, idx) => (
                  <div key={idx} className="pb-2 border-b border-slate-100 last:border-0 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">Cantidad: {p.quantity}</div>
                    </div>
                    <div className={`font-mono font-bold text-xs ${p.cost === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      ${p.cost ? p.cost.toFixed(2) : '0.00'} USD
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button className="btn btn-secondary text-xs" onClick={() => downloadPDF(selectedOT.id)}>
                <Download size={14} /> Acta PDF
              </button>
              <button className="btn btn-primary text-xs" onClick={async () => {
                try {
                  await api.updateWorkOrderStatus(selectedOT.id || selectedOT.Id, { 
                    status: selectedOT.status || 'En Progreso', 
                    downtimeMinutes: selectedOT.downtimeMinutes 
                  });
                  setSelectedOT(null);
                  toast.success("OT actualizada exitosamente");
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
          <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Emisión de Orden de Trabajo</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
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

      {/* Modal de Ayuda Contextual y Procedimiento LOTO */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} initialModule="workOrders" />
    </div>
  );
}
