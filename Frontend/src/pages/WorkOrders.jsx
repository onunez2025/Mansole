import React, { useEffect, useState, useMemo } from 'react';
import { api, API_BASE } from '../services/api';
import { Hammer, Plus, Download, Bot, Users, FileText, Search, Play, CheckCircle2, AlertTriangle, Filter, CheckCircle, Clock, HelpCircle, Timer, Trash2, PlusCircle, Check, X, Package, Boxes } from 'lucide-react';
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

  // Repuestos consumidos por tarea & Inventario
  const [catalogSpareParts, setCatalogSpareParts] = useState([]);
  const [otSpareParts, setOtSpareParts] = useState([]);
  const [sparePartsLoading, setSparePartsLoading] = useState(false);
  const [activeTaskPartForm, setActiveTaskPartForm] = useState(null);
  const [partFormState, setPartFormState] = useState({ sparePartId: '', quantity: 1 });

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
      if (selectedOT) {
        loadOtTasks(selectedOT.id || selectedOT.Id);
        loadOtSpareParts(selectedOT.id || selectedOT.Id);
      }
    } catch (err) {
      toast.error('Error al eliminar tarea');
    }
  };

  const loadCatalogSpareParts = () => {
    api.getInventory().then(data => {
      if (Array.isArray(data)) {
        setCatalogSpareParts(data);
        if (data.length > 0 && !partFormState.sparePartId) {
          setPartFormState(prev => ({ ...prev, sparePartId: data[0].Id || data[0].id }));
        }
      }
    }).catch(() => {});
  };

  const loadOtSpareParts = async (orderId) => {
    setSparePartsLoading(true);
    try {
      const parts = await api.getWorkOrderSpareParts(orderId);
      setOtSpareParts(Array.isArray(parts) ? parts : []);
    } catch (e) {
      setOtSpareParts([]);
    } finally {
      setSparePartsLoading(false);
    }
  };

  const handleAddSparePartToTask = async (taskId) => {
    if (!partFormState.sparePartId) {
      toast.error('Selecciona un repuesto del catálogo.');
      return;
    }
    const qty = parseFloat(partFormState.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Especifica una cantidad válida mayor a cero.');
      return;
    }
    try {
      const res = await api.addTaskSparePart(taskId, {
        sparePartId: partFormState.sparePartId,
        quantity: qty
      });
      toast.success(res.message || 'Repuesto consumido y asignado a la tarea');
      setActiveTaskPartForm(null);
      setPartFormState(prev => ({ ...prev, quantity: 1 }));
      if (selectedOT) {
        const currentOrderId = selectedOT.id || selectedOT.Id;
        loadOtSpareParts(currentOrderId);
        loadOrders(true);
      }
      loadCatalogSpareParts(); // refrescar stock actualizado
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al asignar repuesto');
    }
  };

  const handleDeleteSparePart = async (sparePartRecordId) => {
    if (!window.confirm('¿Deseas devolver este repuesto al inventario del almacén?')) return;
    try {
      const res = await api.deleteWorkOrderSparePart(sparePartRecordId);
      toast.success(res.message || 'Repuesto reintegrado al almacén');
      if (selectedOT) {
        const currentOrderId = selectedOT.id || selectedOT.Id;
        loadOtSpareParts(currentOrderId);
        loadOrders(true);
      }
      loadCatalogSpareParts(); // refrescar stock actualizado
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al devolver repuesto');
    }
  };

  useEffect(() => {
    loadOrders();
    loadCatalogActivities();
    loadCatalogSpareParts();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Órdenes de Trabajo</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
            Flujo de mantenimiento: Solicitud → En Planta → Finalizada → Cierre Contable
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
            title="Guía LOTO & Procedimientos"
          >
            <HelpCircle size={15} className="text-blue-600 flex-shrink-0" />
            <span className="hidden sm:inline">Guía LOTO</span>
            <span className="sm:hidden">Guía</span>
          </button>
          <button className="flex-1 sm:flex-initial btn btn-primary text-xs justify-center py-1.5 sm:py-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} /> 
            <span className="hidden sm:inline">Emitir Nueva OT</span>
            <span className="sm:hidden">Nueva OT</span>
          </button>
        </div>
      </div>

      {/* Barra de Pipeline Operativo y Buscador */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4 shadow-xs">
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
              <div key={ot.id} className={`bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 transition-all hover:border-slate-300 ${
                isInProgress ? 'border-l-4 border-l-blue-500' : isFinished ? 'border-l-4 border-l-emerald-500' : isClosed ? 'border-l-4 border-l-slate-400' : 'border-l-4 border-l-amber-500'
              }`}>
                {/* Datos Principales */}
                <div className="flex-1 min-w-0">
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
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1 leading-tight">
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
                <div className="w-full lg:w-64 flex flex-col gap-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Users size={13} className="text-slate-500" /> 
                    <span>Técnicos ({ot.technicians ? ot.technicians.length : 0}):</span>
                  </div>
                  {ot.technicians && ot.technicians.map((t, idx) => (
                    <div key={idx} className="text-slate-700 pl-3 font-medium truncate">
                      • {t.name} (<strong className="text-slate-900">{t.hours}h</strong>)
                    </div>
                  ))}
                  <div className="mt-1 pt-1.5 border-t border-slate-200 text-xs font-bold flex justify-between font-mono">
                    <span className="text-slate-500">COSTO TOTAL:</span>
                    <span className="text-emerald-700">${ot.totalCost ? ot.totalCost.toFixed(2) : '0.00'} USD</span>
                  </div>
                </div>

                {/* Acciones Rápidas del Proceso */}
                <div className="flex gap-2 items-center flex-wrap w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Botón rápido para Iniciar OT si está pendiente */}
                  {isPending && (
                    <button
                      className="btn text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold py-1.5 px-3 flex-1 sm:flex-initial"
                      onClick={() => handleQuickStatusChange(ot.id, 'En Progreso')}
                      title="Pasar OT a En Proceso"
                    >
                      <Play size={12} /> INICIAR
                    </button>
                  )}

                  {/* Botón rápido para Finalizar OT si está en proceso */}
                  {isInProgress && (
                    <button
                      className="btn text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold py-1.5 px-3 flex-1 sm:flex-initial"
                      onClick={() => handleQuickStatusChange(ot.id, 'Finalizada')}
                      title="Marcar OT como Finalizada"
                    >
                      <CheckCircle size={12} /> FINALIZAR
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center"
                    onClick={() => {
                      setSelectedOT(ot);
                      setAiDiagnosis(ot.aiDiagnosis || null);
                      loadOtTasks(ot.id);
                      loadOtSpareParts(ot.id);
                    }}
                  >
                    <FileText size={14} /> <span>Detalle</span>
                  </button>

                  <button 
                    className="btn btn-secondary text-xs py-1.5 px-2.5 text-slate-700 justify-center"
                    onClick={() => downloadPDF(ot.id)}
                    title="Descargar Acta Formal en PDF"
                  >
                    <Download size={13} /> <span className="hidden sm:inline">PDF</span>
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
            <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-slate-200 gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-extrabold text-slate-500 font-mono">{selectedOT.code} • {selectedOT.type}</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">{selectedOT.assetName}</h3>
                <p className="text-[11px] text-slate-500 truncate">Área: {selectedOT.areaName} • CECO: {selectedOT.costCenterCode}</p>
              </div>
              <button 
                onClick={() => { setSelectedOT(null); setAiDiagnosis(null); }} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 mb-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Descripción de Trabajo</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Estado:</span>
                  <select 
                    className="form-select py-1 px-2 text-xs font-bold w-auto bg-white border border-slate-300 rounded-lg"
                    value={selectedOT.status || 'Iniciado en Planta'}
                    onChange={e => setSelectedOT({ ...selectedOT, status: e.target.value })}
                  >
                    <option value="Pendiente">🟡 Pendiente</option>
                    <option value="En Progreso">🔵 En Progreso</option>
                    <option value="Iniciado en Planta">⚙️ En Planta</option>
                    <option value="Finalizada">✅ Finalizada</option>
                    <option value="Cerrada">🔒 Cerrada</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed m-0">{selectedOT.description}</p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">⏱️ Tiempo de parada:</span>
                <div className="inline-flex items-center gap-1">
                  <input 
                    type="number" 
                    className="form-input w-16 py-0.5 px-2 text-xs font-bold text-right"
                    value={selectedOT.downtimeMinutes || 0} 
                    onChange={e => setSelectedOT({ ...selectedOT, downtimeMinutes: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-slate-500 font-semibold text-[11px]">min</span>
                </div>
              </div>
            </div>

            {/* ASISTENTE DE INTELIGENCIA ARTIFICIAL (Módulo 8) */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 sm:p-4 mb-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Asistente IA Diagnóstico</h4>
                    <span className="text-[11px] text-slate-500 hidden sm:block">Recomendaciones predictivas de averías</span>
                  </div>
                </div>
                {!aiDiagnosis && (
                  <button 
                    className="btn btn-primary text-xs py-1 px-2.5 flex-shrink-0 flex items-center gap-1" 
                    disabled={aiLoading}
                    onClick={() => triggerAiHelp(selectedOT.assetName, selectedOT.description, selectedOT.assetCode)}
                  >
                    {aiLoading ? 'Analizando...' : <><Bot size={13} /><span>Consultar IA</span></>}
                  </button>
                )}
              </div>

              {aiDiagnosis ? (
                <div className="mt-2.5 pt-2.5 border-t border-indigo-100 text-xs space-y-2 leading-relaxed">
                  <div>
                    <strong className="text-red-700 block mb-0.5 font-semibold">⚠️ Posibles Causas Raíz:</strong>
                    <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                      {aiDiagnosis.possibleCauses && aiDiagnosis.possibleCauses.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-emerald-700 block mb-0.5 font-semibold">🔧 Pasos Recomendados:</strong>
                    <ol className="list-decimal pl-5 text-slate-700 space-y-0.5 font-medium">
                      {aiDiagnosis.recommendedSteps && aiDiagnosis.recommendedSteps.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-800 font-medium text-[11px]">
                    {aiDiagnosis.safetyWarning || "🚨 Aplicar protocolo de bloqueo y etiquetado LOTO antes de intervenir."}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5 hidden sm:block m-0">
                  Presiona el botón para analizar la avería y obtener causas probables y solución paso a paso.
                </p>
              )}
            </div>

            {/* Control de Tareas con Catálogo de Actividades y Tiempos de Inicio/Fin */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-100">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Timer className="text-blue-600 flex-shrink-0" size={16} />
                    <span>Control Cronometrado de Tareas</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Selecciona cada actividad del catálogo, iníciala al intervenir y finalízala al concluir.
                  </p>
                </div>

                {/* Formulario para Asignar Actividad a la OT */}
                <form onSubmit={handleAddTaskToOT} className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={selectedActivityId}
                    onChange={e => setSelectedActivityId(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 flex-1 sm:w-64 min-w-0"
                  >
                    {catalogActivities.map(act => (
                      <option key={act.Id || act.id} value={act.Id || act.id}>
                        [{act.Type ? act.Type.substring(0,3) : 'Mec'}] {act.Name || act.name} ({act.EstimatedMinutes || 30}m)
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs flex-shrink-0"
                    title="Asignar Actividad"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Asignar</span>
                  </button>
                </form>
              </div>

              {/* Lista de Tareas con Tiempos y Estado */}
              {tasksLoading ? (
                <div className="py-4 text-center text-slate-400 text-xs">Cargando tareas de la OT...</div>
              ) : otTasks.length === 0 ? (
                <div className="py-4 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 px-3">
                  <p className="text-xs text-slate-500 font-medium">Sin tareas asignadas aún.</p>
                  <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">Selecciona una actividad del catálogo superior y pulsa "Asignar".</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {otTasks.map(task => {
                    const isPending = !task.StartedAt && !task.IsCompleted;
                    const isRunning = task.StartedAt && !task.IsCompleted;
                    const isDone = task.IsCompleted;
                    const taskParts = otSpareParts.filter(p => p.taskId === task.Id);
                    const isAddingPart = activeTaskPartForm === task.Id;

                    return (
                      <div 
                        key={task.Id}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                          isRunning 
                            ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-100' 
                            : (isDone ? 'bg-slate-50/40 border-slate-200' : 'bg-white border-slate-200')
                        }`}
                      >
                        {/* Cabecera de la Tarea y Acciones */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
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
                                {isRunning ? '⏳ En Ejecución' : (isDone ? '✅ Lista' : '🟡 Pendiente')}
                              </span>
                              {taskParts.length > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  <Package size={11} className="text-amber-600" /> {taskParts.length} repuesto{taskParts.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            {/* Tiempos de Inicio y Fin */}
                            <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 flex-wrap">
                              <span>
                                <strong>Inic:</strong> {task.StartedAt ? new Date(task.StartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                              <span>
                                <strong>Fin:</strong> {task.CompletedAt ? new Date(task.CompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                              {task.DurationMinutes !== null && task.DurationMinutes !== undefined && (
                                <span className="font-bold text-slate-800 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                  ⏱️ {task.DurationMinutes}m
                                </span>
                              )}
                              {task.TechnicianName && (
                                <span className="text-slate-600 truncate text-[10px]">
                                  👤 {task.TechnicianName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botones de Acción para el Técnico */}
                          <div className="flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            {/* Botón para asignar repuesto a esta tarea (Solo si NO está lista y la OT no está cerrada) */}
                            {!isDone && selectedOT?.status !== 'Finalizada' && selectedOT?.status !== 'Cerrada' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAddingPart) {
                                    setActiveTaskPartForm(null);
                                  } else {
                                    setActiveTaskPartForm(task.Id);
                                    if (catalogSpareParts.length > 0 && !partFormState.sparePartId) {
                                      setPartFormState(prev => ({ ...prev, sparePartId: catalogSpareParts[0].Id || catalogSpareParts[0].id }));
                                    }
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                                  isAddingPart 
                                    ? 'bg-slate-800 text-white border-slate-800' 
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                                title="Consumir repuesto para esta tarea específica"
                              >
                                <Package size={12} className={isAddingPart ? 'text-amber-400' : 'text-slate-500'} />
                                <span className="text-[11px]">{isAddingPart ? 'Cerrar' : '+ Repuesto'}</span>
                              </button>
                            )}

                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleStartTask(task.Id)}
                                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
                              >
                                <Play size={12} />
                                <span>INICIAR</span>
                              </button>
                            )}

                            {isRunning && (
                              <button
                                type="button"
                                onClick={() => handleFinishTask(task.Id)}
                                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
                              >
                                <Check size={12} />
                                <span>FINALIZAR</span>
                              </button>
                            )}

                            {isDone && (
                              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={14} /> Hecho
                              </span>
                            )}

                            {!isDone && selectedOT?.status !== 'Finalizada' && selectedOT?.status !== 'Cerrada' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.Id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-0"
                                title="Eliminar tarea"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Formulario Inline para Asignar Repuesto a esta Tarea */}
                        {isAddingPart && (
                          <div className="bg-slate-100/90 border border-slate-300/80 rounded-lg p-2.5 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                <Package size={13} className="text-amber-600" /> Consumir Repuesto en "{task.ActivityName}"
                              </span>
                              <span className="text-[10px] text-slate-500">Se descuenta del stock en Almacén</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <select
                                className="form-select text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md flex-1 min-w-0"
                                value={partFormState.sparePartId}
                                onChange={e => setPartFormState({ ...partFormState, sparePartId: e.target.value })}
                              >
                                {catalogSpareParts.map(sp => {
                                  const spId = sp.Id || sp.id;
                                  const spCode = sp.Code || sp.code;
                                  const spName = sp.Name || sp.name;
                                  const spStock = sp.CurrentStock !== undefined ? sp.CurrentStock : (sp.currentStock || 0);
                                  const spCost = sp.Condition === 'Canibalizada' ? 0 : (Number(sp.UnitCost || sp.unitCost || 0));
                                  return (
                                    <option key={spId} value={spId} disabled={spStock <= 0}>
                                      [{spCode}] {spName} — Disp: {spStock} ({spCost === 0 ? 'Canibalizada $0' : `$${spCost.toFixed(2)}`})
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-slate-600 font-semibold">Cant:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    className="form-input text-xs py-1.5 px-2 w-16 bg-white border border-slate-300 rounded-md text-center font-bold"
                                    value={partFormState.quantity}
                                    onChange={e => setPartFormState({ ...partFormState, quantity: e.target.value })}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddSparePartToTask(task.Id)}
                                  className="btn btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                                >
                                  <Plus size={13} /> Consumir
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Repuestos ya consumidos en ESTA tarea */}
                        {taskParts.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Repuestos utilizados en esta tarea:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {taskParts.map(p => (
                                <div 
                                  key={p.id}
                                  className="bg-white border border-slate-200 rounded-md p-2 flex items-center justify-between gap-2 shadow-2xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-800 text-[11px] truncate" title={p.name}>
                                      [{p.code}] {p.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                      <span>Cant: <strong>{p.quantity} {p.unitOfMeasure || 'und'}</strong></span>
                                      <span>•</span>
                                      <span className="font-mono font-semibold text-emerald-700">
                                        ${p.totalCost ? p.totalCost.toFixed(2) : '0.00'} USD
                                      </span>
                                    </div>
                                  </div>
                                  {!isDone && selectedOT?.status !== 'Finalizada' && selectedOT?.status !== 'Cerrada' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSparePart(p.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Devolver repuesto al almacén"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Repuestos Consumidos del Almacén (Consolidado de la OT por Tarea) */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-3">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <strong className="text-slate-900 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Boxes size={14} className="text-slate-600" />
                  Repuestos Consumidos del Almacén (Total OT)
                </strong>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ${otSpareParts.reduce((acc, p) => acc + (Number(p.totalCost) || 0), 0).toFixed(2)} USD
                </span>
              </div>

              {sparePartsLoading ? (
                <div className="text-center py-3 text-xs text-slate-400">Cargando repuestos...</div>
              ) : otSpareParts.length === 0 ? (
                <div className="py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                  No se han asignado repuestos a las tareas de esta OT. Pulsa "+ Repuesto" en cada tarea para consumir repuestos del almacén.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {otSpareParts.map((p) => (
                    <div key={p.id} className="p-2 rounded-lg bg-slate-50/70 border border-slate-200/80 flex justify-between items-center text-xs gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-[11px] sm:text-xs truncate">
                          [{p.code}] {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                          <span>Cant: <strong>{p.quantity} {p.unitOfMeasure || 'und'}</strong></span>
                          <span>•</span>
                          <span className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                            📌 {p.activityName ? `Tarea: ${p.activityName}` : 'Tarea general'}
                          </span>
                          {p.technicianName && (
                            <span className="text-slate-600">👤 {p.technicianName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`font-mono font-bold text-xs ${p.cost === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          ${p.totalCost ? p.totalCost.toFixed(2) : '0.00'} USD
                        </div>
                        {selectedOT?.status !== 'Finalizada' && selectedOT?.status !== 'Cerrada' && !otTasks.find(t => t.Id === p.taskId)?.IsCompleted && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSparePart(p.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Devolver al almacén"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center" onClick={() => downloadPDF(selectedOT.id)} title="Descargar Acta PDF">
                <Download size={14} /> <span className="hidden sm:inline">Acta PDF</span><span className="sm:hidden">PDF</span>
              </button>
              <button className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center" onClick={async () => {
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
                <CheckCircle size={14} /> <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear OT con Múltiples Técnicos */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Emisión de Orden de Trabajo</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <form onSubmit={handleCreateOT} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Mantenimiento</label>
                  <select className="form-select text-xs" value={newOT.type} onChange={e => setNewOT({...newOT, type: e.target.value})}>
                    <option value="Correctivo">🚨 Correctivo (Falla)</option>
                    <option value="Preventivo">📅 Preventivo (Rutinario)</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad Operativa</label>
                  <select className="form-select text-xs" value={newOT.priority} onChange={e => setNewOT({...newOT, priority: e.target.value})}>
                    <option value="Urgente">🔥 Urgente (Parada)</option>
                    <option value="Alta">⚡ Alta</option>
                    <option value="Normal">🟢 Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Activo *</label>
                  {availableAssets.length > 0 ? (
                    <select 
                      className="form-select text-xs"
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
                          [{a.code || a.Code}] {a.name || a.Name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-input text-xs" value={newOT.assetName} onChange={e => setNewOT({...newOT, assetName: e.target.value})} />
                  )}
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CECO Imputable</label>
                  <input className="form-input text-xs bg-slate-50 text-slate-600 font-bold" value={newOT.costCenterCode} readOnly />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción de Incidencia *</label>
                <textarea className="form-textarea text-xs" required rows="2" value={newOT.description} onChange={e => setNewOT({...newOT, description: e.target.value})} placeholder="Ej. Pérdida de presión en circuito primario de prensa..." />
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiempo de Parada (Minutos KPI)</label>
                <input type="number" className="form-input text-xs" value={newOT.downtimeMinutes} onChange={e => setNewOT({...newOT, downtimeMinutes: e.target.value})} />
              </div>

              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                <strong className="text-xs text-slate-700 block mb-2 font-bold uppercase tracking-wider">
                  👥 Asignación de Múltiples Técnicos:
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input className="form-input text-xs sm:col-span-2" placeholder="Nombre Técnico 1" value={newOT.tech1} onChange={e => setNewOT({...newOT, tech1: e.target.value})} />
                  <input type="number" step="0.5" className="form-input text-xs" placeholder="Horas" value={newOT.tech1Hours} onChange={e => setNewOT({...newOT, tech1Hours: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className="form-input text-xs sm:col-span-2" placeholder="Nombre Técnico 2 (Opcional)" value={newOT.tech2} onChange={e => setNewOT({...newOT, tech2: e.target.value})} />
                  <input type="number" step="0.5" className="form-input text-xs" placeholder="Horas" value={newOT.tech2Hours} onChange={e => setNewOT({...newOT, tech2Hours: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center">Crear OT</button>
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
