import React, { useEffect, useState, useMemo } from 'react';
import { api, API_BASE } from '../services/api';
import { Hammer, Plus, Download, Bot, Users, FileText, Search, Play, CheckCircle2, AlertTriangle, Filter, CheckCircle, Clock, HelpCircle, Timer, Trash2, PlusCircle, Check, X, Package, Boxes, Lock, ChevronDown, ChevronUp, Printer, UserCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { OrderCardSkeleton } from '../components/UI';
import HelpModal from '../components/HelpModal';
import ModalPortal from '../components/UI/ModalPortal';
import WorkOrderReportModal from '../components/WorkOrderReportModal';

// Caché en cliente para que al volver a OTs cargue de inmediato (0ms)
let cachedWorkOrdersList = null;

export default function WorkOrders({ currentUser, onNavigateToReports }) {
  const [workOrders, setWorkOrders] = useState(cachedWorkOrdersList || []);
  const [loading, setLoading] = useState(!cachedWorkOrdersList);
  const [selectedOT, setSelectedOT] = useState(null);
  const [reportModalOT, setReportModalOT] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [openSections, setOpenSections] = useState({
    desc: true,     // 1. Descripción de trabajo y tiempos de parada
    ai: true,       // 2. Asistente IA Diagnóstico
    tasks: true,    // 3. Control cronometrado de tareas
    spares: true    // 4. Repuestos consumidos del almacén
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableCostCenters, setAvailableCostCenters] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
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

  // Permisos y Roles de Asignación Técnica
  const canAssignTechnicians = currentUser?.permissions?.includes('mansole.workorders.assign') || 
                               currentUser?.permissions?.includes('*') || 
                               currentUser?.role === 'Administrador' || 
                               currentUser?.role === 'Supervisor' || 
                               currentUser?.role === 'Supervisor de Planta' || 
                               currentUser?.role === 'Coordinador de Mantenimiento y Producción' || 
                               currentUser?.role === 'Analista de Planeamiento';

  const currentUserName = currentUser?.name || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim() || currentUser?.username || 'Técnico de Planta';

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
    downtimeMinutes: 0,
    tech1: '',
    tech1Hours: 2.0,
    tech2: '',
    tech2Hours: 2.0,
    sparePartName: '',
    sparePartCost: 0
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
            preDowntimeMinutes: o.preDowntimeMinutes !== undefined ? o.preDowntimeMinutes : (o.PreDowntimeMinutes || 0),
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
      // Si la OT figuraba como Finalizada, al sumar una nueva tarea pendiente vuelve a En Progreso
      setSelectedOT(prev => prev ? { 
        ...prev, 
        status: (prev.status === 'Finalizada' || prev.status === 'Pendiente') ? 'En Progreso' : prev.status 
      } : null);
      loadOtTasks(selectedOT.id || selectedOT.Id);
      loadOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar tarea');
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      const techName = currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Técnico de Planta';
      await api.startOrderTask(taskId, techName);
      toast.success('⏱️ Tarea iniciada. Cronómetro en marcha.');
      if (selectedOT) {
        setSelectedOT(prev => prev ? { ...prev, status: 'En Progreso' } : null);
        loadOtTasks(selectedOT.id || selectedOT.Id);
        loadOrders(true);
      }
    } catch (err) {
      toast.error('Error al iniciar tarea');
    }
  };

  const handleFinishTask = async (taskId) => {
    try {
      await api.finishOrderTask(taskId, 'Trabajo completado según procedimiento estándar.');
      toast.success('✅ Tarea finalizada. Tiempo registrado en Azure SQL.');
      if (selectedOT) {
        const orderId = selectedOT.id || selectedOT.Id;
        const currentTasks = await api.getOrderTasks(orderId);
        const tasksArr = Array.isArray(currentTasks) ? currentTasks : [];
        setOtTasks(tasksArr);
        const allCompleted = tasksArr.length > 0 && tasksArr.every(t => t.IsCompleted);
        if (allCompleted) {
          setSelectedOT(prev => prev ? { ...prev, status: 'Finalizada' } : null);
          toast.success('🎉 ¡Todas las tareas concluidas! La OT está lista para el Cierre.');
        }
        loadOrders(true);
      }
    } catch (err) {
      toast.error('Error al finalizar tarea');
    }
  };

  const handleCloseOT = async () => {
    if (!selectedOT) return;
    if (otTasks.length === 0) {
      toast.error('No se puede cerrar la OT: No tiene tareas registradas. Ingrese y ejecute al menos una tarea técnica.');
      return;
    }
    const pendingTasks = otTasks.filter(t => !t.IsCompleted);
    if (pendingTasks.length > 0) {
      toast.error(`No se puede cerrar la OT: Aún tiene ${pendingTasks.length} tarea(s) pendiente(s) o en ejecución.`);
      return;
    }

    const taskInterventionMinutes = otTasks.reduce((sum, t) => sum + (Number(t.DurationMinutes) || 0), 0);
    const preDowntime = parseInt(selectedOT.preDowntimeMinutes !== undefined ? selectedOT.preDowntimeMinutes : (selectedOT.PreDowntimeMinutes || 0)) || 0;
    const totalDowntime = preDowntime + taskInterventionMinutes;

    if (!window.confirm(`¿Confirmas el CIERRE Y LIQUIDACIÓN formal de la orden ${selectedOT.code}?\n\n• Tiempo Total de Parada: ${totalDowntime} min\n• Costo Total Liquidado: $${(selectedOT.totalCost || 0).toFixed(2)} USD\n• Estado: Se marcará como CERRADA definitivamente y no admitirá más cambios.`)) {
      return;
    }

    try {
      // Guardar ajuste previo si hubo
      await api.updateWorkOrderStatus(selectedOT.id || selectedOT.Id, {
        preDowntimeMinutes: preDowntime,
        downtimeMinutes: totalDowntime
      });
      // Ejecutar cierre definitivo
      const res = await api.closeWorkOrder(selectedOT.id || selectedOT.Id);
      toast.success(res.message || 'Orden de Trabajo cerrada y liquidada exitosamente');
      setSelectedOT(prev => prev ? { ...prev, status: 'Cerrada', downtimeMinutes: totalDowntime } : null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cerrar la Orden de Trabajo');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea de la OT?')) return;
    try {
      await api.deleteOrderTask(taskId);
      toast.success('Tarea removida de la OT');
      if (selectedOT) {
        const orderId = selectedOT.id || selectedOT.Id;
        const currentTasks = await api.getOrderTasks(orderId);
        const tasksArr = Array.isArray(currentTasks) ? currentTasks : [];
        setOtTasks(tasksArr);
        
        // Actualizar estado reactivo de la OT en frontend
        if (tasksArr.length === 0) {
          setSelectedOT(prev => prev ? { ...prev, status: 'Pendiente' } : null);
        } else if (tasksArr.every(t => t.IsCompleted)) {
          setSelectedOT(prev => prev ? { ...prev, status: 'Finalizada' } : null);
        } else {
          setSelectedOT(prev => prev ? { ...prev, status: 'En Progreso' } : null);
        }

        loadOtSpareParts(orderId);
        loadOrders(true);
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

    // Cargar catálogo de Centros de Costo (CECOs)
    api.getCatalogCostCenters().then(data => {
      if (Array.isArray(data)) setAvailableCostCenters(data);
    }).catch(() => {});

    // Cargar lista de técnicos y colaboradores de planta
    api.getUsers().then(data => {
      if (Array.isArray(data)) {
        const activeUsers = data.filter(u => u.isActive !== false);
        setAvailableTechnicians(activeUsers);
      }
    }).catch(() => {});
  }, []);

  const openCreateModalWithDefaults = () => {
    const firstAsset = availableAssets[0];
    const defaultAssetCode = firstAsset ? (firstAsset.code || firstAsset.Code) : 'PRENSA-01';
    const defaultAssetName = firstAsset ? (firstAsset.name || firstAsset.Name) : 'Prensa Hidráulica 200T #1';
    const defaultAreaName = firstAsset ? (firstAsset.areaName || firstAsset.AreaName) : 'Área General';
    const defaultCeco = firstAsset?.costCenterCode || firstAsset?.CostCenterCode || (availableCostCenters[0]?.CeCoste || 'CECO-SOL-101');

    const firstTech = availableTechnicians.length > 0 ? availableTechnicians[0].name : currentUserName;

    setNewOT({
      type: 'Correctivo',
      priority: 'Alta',
      assetCode: defaultAssetCode,
      assetName: defaultAssetName,
      areaName: defaultAreaName,
      costCenterCode: defaultCeco,
      description: '',
      downtimeMinutes: 0,
      tech1: firstTech,
      tech1Hours: 2.0,
      tech2: '',
      tech2Hours: 2.0,
      sparePartName: '',
      sparePartCost: 0
    });
    setShowCreateModal(true);
  };

  const triggerAiHelp = async (assetName, description, code) => {
    setAiLoading(true);
    setOpenSections(prev => ({ ...prev, ai: true }));
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

    let technicians = [];
    if (newOT.type === 'Correctivo') {
      // En correctivo el técnico que atiende y reporta la falla es el asignado directo
      technicians = [{ name: currentUserName, hours: 0 }];
    } else {
      // En Preventivo o Mejora
      if (canAssignTechnicians) {
        if (newOT.tech1 && newOT.tech1.trim() !== '') {
          technicians.push({ name: newOT.tech1.trim(), hours: parseFloat(newOT.tech1Hours) || 0 });
        }
        if (newOT.tech2 && newOT.tech2.trim() !== '') {
          technicians.push({ name: newOT.tech2.trim(), hours: parseFloat(newOT.tech2Hours) || 0 });
        }
      } else {
        // Técnico sin rol de asignador: se registra como responsable inicial
        technicians = [{ name: currentUserName, hours: 0 }];
      }
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
        downtimeMinutes: newOT.type === 'Correctivo' ? (parseFloat(newOT.downtimeMinutes) || 0) : 0,
        description: newOT.description,
        technicians,
        spareParts: []
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
          {onNavigateToReports && (
            <button
              onClick={onNavigateToReports}
              className="px-3 py-1.5 sm:py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs flex-shrink-0 cursor-pointer"
              title="Ver Historial de Mantenimiento por rango de fechas (ConsuMan)"
            >
              <FileText size={15} className="text-indigo-600 flex-shrink-0" />
              <span className="hidden sm:inline">Historial ConsuMan</span>
              <span className="sm:hidden">Reportes</span>
            </button>
          )}
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
            title="Guía LOTO & Procedimientos"
          >
            <HelpCircle size={15} className="text-blue-600 flex-shrink-0" />
            <span className="hidden sm:inline">Guía LOTO</span>
            <span className="sm:hidden">Guía</span>
          </button>
          <button className="flex-1 sm:flex-initial btn btn-primary text-xs justify-center py-1.5 sm:py-2 cursor-pointer" onClick={openCreateModalWithDefaults}>
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
            🔵 En Progreso <span className="pipeline-count">{stageCounts['En Progreso']}</span>
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeStage === 'Finalizada' ? 'active' : ''}`}
            onClick={() => setActiveStage('Finalizada')}
          >
            🟢 Finalizadas <span className="pipeline-count">{stageCounts.Finalizada}</span>
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
                    <span className={`badge ${ot.type === 'Preventivo' ? 'badge-info' : ot.type === 'Mejora' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'badge-danger'} text-[11px]`}>
                      {ot.type}
                    </span>
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
        <ModalPortal>
          <div className="modal-overlay" onClick={() => { setSelectedOT(null); setAiDiagnosis(null); }}>
            <div className="modal-content" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-slate-200 gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-extrabold text-slate-500 font-mono">{selectedOT.code} • {selectedOT.type}</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">{selectedOT.assetName}</h3>
                <p className="text-[11px] text-slate-500 truncate">Área: {selectedOT.areaName} • CECO: {selectedOT.costCenterCode}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setReportModalOT(selectedOT)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-900 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Ver Ficha Técnica con reporte de técnicos, repuestos consumidos y firmas"
                >
                  <Printer size={13} />
                  <span>Ficha Técnica (Firmas)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = Object.values(openSections).every(Boolean);
                    setOpenSections({
                      desc: !allOpen,
                      ai: !allOpen,
                      tasks: !allOpen,
                      spares: !allOpen
                    });
                  }}
                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                  title="Expandir o colapsar todas las secciones a la vez"
                >
                  {Object.values(openSections).every(Boolean) ? 'Colapsar todo' : 'Expandir todo'}
                </button>
                <button 
                  onClick={() => { setSelectedOT(null); setAiDiagnosis(null); }} 
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Cerrar ventana"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 1. SECCIÓN: DESCRIPCIÓN DE TRABAJO & TIEMPO DE PARADA */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 mb-3 overflow-hidden shadow-2xs transition-all">
              <div 
                className="p-2.5 sm:p-3 flex items-center justify-between gap-2 flex-wrap cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
                onClick={() => toggleSection('desc')}
                title={openSections.desc ? "Clic para colapsar descripción y parada" : "Clic para desplegar descripción y parada"}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-slate-200/80 text-slate-700 flex-shrink-0">
                    <FileText size={14} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    1. Descripción y Tiempo de Parada
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border inline-flex items-center gap-1 ${
                    selectedOT.status === 'Cerrada'
                      ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                      : selectedOT.status === 'Finalizada'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : selectedOT.status === 'En Progreso' || selectedOT.status === 'Iniciado en Planta'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {selectedOT.status === 'Cerrada' ? '🔒 Cerrada' :
                     selectedOT.status === 'Finalizada' ? '✅ Finalizada' :
                     selectedOT.status === 'En Progreso' || selectedOT.status === 'Iniciado en Planta' ? '🔵 En Progreso' :
                     '🟡 Pendiente'}
                  </span>

                  {!openSections.desc && (
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      ⏱️ {(() => {
                        const pDown = parseInt(selectedOT.preDowntimeMinutes !== undefined ? selectedOT.preDowntimeMinutes : (selectedOT.PreDowntimeMinutes || 0)) || 0;
                        const tMins = otTasks.reduce((sum, t) => sum + (Number(t.DurationMinutes) || 0), 0);
                        return pDown + tMins;
                      })()}m
                    </span>
                  )}

                  <button 
                    type="button" 
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-transform"
                    onClick={(e) => { e.stopPropagation(); toggleSection('desc'); }}
                  >
                    {openSections.desc ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {openSections.desc && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 space-y-2 border-t border-slate-200/80">
                  <p className="text-xs text-slate-800 leading-relaxed m-0">{selectedOT.description}</p>
                  {/* Control y Desglose Automático del Tiempo de Parada */}
                  {(() => {
                    const preDowntime = parseInt(selectedOT.preDowntimeMinutes !== undefined ? selectedOT.preDowntimeMinutes : (selectedOT.PreDowntimeMinutes || 0)) || 0;
                    const taskInterventionMinutes = otTasks.reduce((sum, t) => sum + (Number(t.DurationMinutes) || 0), 0);
                    const totalCalculatedDowntime = preDowntime + taskInterventionMinutes;
                    const isClosed = selectedOT.status === 'Finalizada' || selectedOT.status === 'Cerrada';

                    return (
                      <div className="pt-2 border-t border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-blue-600" />
                            Tiempo de Parada de Máquina
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ⚡ Calculado Automáticamente
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {/* 1. Espera previa a la intervención */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-slate-800 block mb-0.5">
                                1. Espera Previa
                              </span>
                              <span className="text-[10px] text-slate-400 block leading-tight mb-2">
                                Tiempo detenida antes de iniciar
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-auto">
                              {isClosed ? (
                                <span className="font-mono font-bold text-xs text-slate-800">{preDowntime} min</span>
                              ) : (
                                <>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    className="form-input w-20 py-1 px-2 text-xs font-bold text-right bg-slate-50 border border-slate-300 rounded"
                                    value={preDowntime} 
                                    onChange={e => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setSelectedOT({ 
                                        ...selectedOT, 
                                        preDowntimeMinutes: val,
                                        downtimeMinutes: val + taskInterventionMinutes 
                                      });
                                    }}
                                  />
                                  <span className="text-slate-500 font-semibold text-[11px]">min</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* 2. Tiempo de intervención técnica cronometrada */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-slate-800 block mb-0.5">
                                2. Intervención Técnica
                              </span>
                              <span className="text-[10px] text-slate-400 block leading-tight mb-2">
                                Sumatoria de tareas finalizadas
                              </span>
                            </div>
                            <div className="mt-auto">
                              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded inline-block">
                                ⏱️ {taskInterventionMinutes} min
                              </span>
                            </div>
                          </div>

                          {/* 3. Tiempo Total de Parada de Máquina (Calculado & Bloqueado) */}
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg flex flex-col justify-between shadow-xs">
                            <div>
                              <span className="text-[11px] font-bold text-slate-200 block mb-0.5">
                                Total Parada Real (KPI)
                              </span>
                              <span className="text-[10px] text-slate-400 block leading-tight mb-2">
                                {preDowntime}m espera + {taskInterventionMinutes}m tareas
                              </span>
                            </div>
                            <div className="mt-auto flex items-baseline gap-1">
                              <span className="font-mono font-extrabold text-base text-amber-400">
                                {totalCalculatedDowntime}
                              </span>
                              <span className="text-slate-300 font-semibold text-[11px]">minutos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 2. SECCIÓN: ASISTENTE DE INTELIGENCIA ARTIFICIAL */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl mb-3 overflow-hidden shadow-2xs transition-all">
              <div 
                className="p-2.5 sm:p-3 flex items-center justify-between gap-2 flex-wrap cursor-pointer select-none hover:bg-indigo-50/80 transition-colors"
                onClick={() => toggleSection('ai')}
                title={openSections.ai ? "Clic para colapsar diagnóstico IA" : "Clic para desplegar diagnóstico IA"}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Bot size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">2. Asistente IA Diagnóstico</h4>
                      {aiDiagnosis ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
                          Diagnóstico Listo
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                          Sin Consultar
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                      {aiDiagnosis 
                        ? (openSections.ai ? 'DeepSeek V4 Flash con Histórico de Azure SQL' : '💡 Diagnóstico generado. Haz clic para desplegarlo.')
                        : 'DeepSeek V4 Flash con Histórico de Azure SQL'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto flex-wrap" onClick={e => e.stopPropagation()}>
                  {!aiDiagnosis ? (
                    <button 
                      className="btn btn-primary text-xs py-1 px-2.5 flex-shrink-0 flex items-center gap-1" 
                      disabled={aiLoading}
                      onClick={() => triggerAiHelp(selectedOT.assetName, selectedOT.description, selectedOT.assetCode)}
                    >
                      {aiLoading ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                          Consultando DeepSeek...
                        </span>
                      ) : (
                        <><Bot size={13} /><span>Consultar IA</span></>
                      )}
                    </button>
                  ) : (
                    <>
                      <button 
                        className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
                        onClick={() => triggerAiHelp(selectedOT.assetName, selectedOT.description, selectedOT.assetCode)}
                        disabled={aiLoading}
                        title="Volver a consultar a la IA"
                      >
                        {aiLoading ? 'Analizando...' : '↻ Reconsultar'}
                      </button>

                      <button 
                        className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                        onClick={() => setAiDiagnosis(null)}
                        title="Descartar diagnóstico"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    type="button" 
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-transform"
                    onClick={() => toggleSection('ai')}
                  >
                    {openSections.ai ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {aiDiagnosis && openSections.ai && (
                <div className="px-3 pb-3 pt-1 border-t border-indigo-100 text-xs space-y-2.5 leading-relaxed max-h-80 overflow-y-auto pr-1">
                  {/* Análisis de Histórico RAG */}
                  <div className="bg-white border border-indigo-200 rounded-lg p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                        <span>📚</span> <span>Historial de Mantenimientos Previos</span>
                      </span>
                      {aiDiagnosis.aiModel && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {aiDiagnosis.aiModel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 m-0 leading-relaxed font-normal">
                      {aiDiagnosis.historicalAnalysis || "ℹ️ No se detectaron fallas similares previas para este equipo en el historial."}
                    </p>
                  </div>

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
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-800 font-medium text-[11px] flex items-start gap-1.5">
                    <span>🛡️</span>
                    <span>{aiDiagnosis.safetyWarning || "Aplicar protocolo de bloqueo y etiquetado LOTO antes de intervenir."}</span>
                  </div>
                </div>
              )}

              {!aiDiagnosis && openSections.ai && (
                <div className="px-3 pb-2.5 border-t border-indigo-100">
                  <p className="text-[11px] text-slate-500 mt-1.5 hidden sm:block m-0">
                    Presiona el botón para que DeepSeek analice el historial de fallas en Azure SQL y brinde diagnóstico predictivo y solución técnica.
                  </p>
                </div>
              )}
            </div>

            {/* 3. SECCIÓN: CONTROL CRONOMETRADO DE TAREAS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-3 overflow-hidden transition-all">
              <div 
                className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5 flex-wrap cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
                onClick={() => toggleSection('tasks')}
                title={openSections.tasks ? "Clic para colapsar tareas" : "Clic para desplegar tareas"}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Timer size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">3. Control Cronometrado de Tareas</h4>
                      {otTasks.length > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          {otTasks.filter(t => t.IsCompleted).length}/{otTasks.length} Listas
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          0 Tareas
                        </span>
                      )}
                      {otTasks.some(t => t.StartedAt && !t.IsCompleted) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          En Curso
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                      {openSections.tasks 
                        ? 'Selecciona cada actividad del catálogo, iníciala al intervenir y finalízala al concluir.'
                        : `Haz clic para desplegar y gestionar las tareas (${otTasks.length} registradas).`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button 
                    type="button" 
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-transform"
                    onClick={(e) => { e.stopPropagation(); toggleSection('tasks'); }}
                  >
                    {openSections.tasks ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {openSections.tasks && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 my-2.5 pb-2.5 border-b border-slate-100">
                    <div className="text-xs text-slate-600 font-medium">
                      Asignar actividades del catálogo:
                    </div>
                    {/* Formulario para Asignar Actividad a la OT */}
                    {selectedOT.status !== 'Cerrada' ? (
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
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        🔒 OT Cerrada (No admite nuevas tareas)
                      </span>
                    )}
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
              )}
            </div>

            {/* 4. SECCIÓN: REPUESTOS CONSUMIDOS DEL ALMACÉN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-3 overflow-hidden transition-all">
              <div 
                className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5 flex-wrap cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
                onClick={() => toggleSection('spares')}
                title={openSections.spares ? "Clic para colapsar repuestos" : "Clic para desplegar repuestos"}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Boxes size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">4. Repuestos Consumidos del Almacén</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {otSpareParts.length} {otSpareParts.length === 1 ? 'repuesto' : 'repuestos'}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                      {openSections.spares 
                        ? 'Consolidado de piezas y componentes consumidos por tarea desde el inventario.'
                        : 'Haz clic para desplegar y revisar el consumo de repuestos.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ${otSpareParts.reduce((acc, p) => acc + (Number(p.totalCost) || 0), 0).toFixed(2)} USD
                  </span>
                  <button 
                    type="button" 
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-transform"
                    onClick={() => toggleSection('spares')}
                  >
                    {openSections.spares ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {openSections.spares && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-100">
                  {sparePartsLoading ? (
                    <div className="text-center py-3 text-xs text-slate-400">Cargando repuestos...</div>
                  ) : otSpareParts.length === 0 ? (
                    <div className="py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 my-1">
                      No se han asignado repuestos a las tareas de esta OT. Pulsa "+ Repuesto" en cada tarea para consumir repuestos del almacén.
                    </div>
                  ) : (
                    <div className="space-y-1.5 my-1">
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
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button 
                  type="button"
                  className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" 
                  onClick={() => setReportModalOT(selectedOT)} 
                  title="Ver Ficha Técnica con labores de técnicos, repuestos y firmas"
                >
                  <Printer size={14} /> <span>Ficha Técnica (Firmas)</span>
                </button>
                <button className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1" onClick={() => downloadPDF(selectedOT.id)} title="Descargar Acta PDF rápida">
                  <Download size={14} /> <span>Acta Rápida</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap ml-auto">
                {selectedOT.status !== 'Cerrada' && (
                  <button 
                    className="btn btn-secondary text-xs py-1.5 px-3 text-slate-700 flex items-center gap-1"
                    onClick={async () => {
                      try {
                        const taskInterventionMinutes = otTasks.reduce((sum, t) => sum + (Number(t.DurationMinutes) || 0), 0);
                        const preDowntime = parseInt(selectedOT.preDowntimeMinutes !== undefined ? selectedOT.preDowntimeMinutes : (selectedOT.PreDowntimeMinutes || 0)) || 0;
                        const calculatedDowntime = preDowntime + taskInterventionMinutes;
                        await api.updateWorkOrderStatus(selectedOT.id || selectedOT.Id, { 
                          preDowntimeMinutes: preDowntime,
                          downtimeMinutes: calculatedDowntime 
                        });
                        toast.success("Espera previa guardada exitosamente.");
                        loadOrders(true);
                      } catch(e) {
                        toast.error("Error al guardar: " + (e.response?.data?.error || e.message));
                      }
                    }}
                    title="Guardar ajuste de tiempo previo sin cerrar la OT"
                  >
                    <Check size={13} /> <span>Guardar Espera</span>
                  </button>
                )}

                {selectedOT.status === 'Cerrada' ? (
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-300 text-xs font-bold flex items-center gap-1.5">
                    <Lock size={13} className="text-slate-500" />
                    <span>OT Cerrada y Liquidada</span>
                  </div>
                ) : (
                  <button 
                    className={`btn text-xs py-1.5 px-4 font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                      otTasks.length > 0 && otTasks.every(t => t.IsCompleted)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-200 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                    onClick={handleCloseOT}
                  >
                    <Lock size={13} />
                    <span>CERRAR Y LIQUIDAR OT</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Modal Crear OT con Múltiples Técnicos */}
      {showCreateModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Emisión de Orden de Trabajo</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <form onSubmit={handleCreateOT} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Mantenimiento *</label>
                  <select 
                    className="form-select text-xs" 
                    value={newOT.type} 
                    onChange={e => {
                      const selectedType = e.target.value;
                      setNewOT({
                        ...newOT, 
                        type: selectedType,
                        downtimeMinutes: selectedType === 'Correctivo' ? (newOT.downtimeMinutes || 30) : 0
                      });
                    }}
                  >
                    <option value="Correctivo">🚨 Correctivo (Falla)</option>
                    <option value="Preventivo">📅 Preventivo (Rutinario)</option>
                    <option value="Mejora">💡 Mejora (Adaptación / Optimización)</option>
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
                      className="form-select text-xs font-mono"
                      value={newOT.assetCode}
                      onChange={e => {
                        const selected = availableAssets.find(a => (a.code || a.Code) === e.target.value);
                        if (selected) {
                          setNewOT({
                            ...newOT,
                            assetCode: selected.code || selected.Code,
                            assetName: selected.name || selected.Name,
                            areaName: selected.areaName || selected.AreaName || 'Área General',
                            costCenterCode: selected.costCenterCode || selected.CostCenterCode || newOT.costCenterCode
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CECO Imputable (Catálogo) *</label>
                  {availableCostCenters.length > 0 ? (
                    <select
                      className="form-select text-xs font-mono"
                      value={newOT.costCenterCode}
                      onChange={e => setNewOT({ ...newOT, costCenterCode: e.target.value })}
                    >
                      {availableCostCenters.map(c => (
                        <option key={c.CeCoste} value={c.CeCoste}>
                          [{c.CeCoste}] {c.CeCosteDescripcion || c.Area || c.Gerencia}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-input text-xs bg-slate-50 text-slate-600 font-bold" value={newOT.costCenterCode} readOnly />
                  )}
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {newOT.type === 'Correctivo' ? 'Descripción de la Avería / Falla *' : newOT.type === 'Mejora' ? 'Descripción de la Mejora / Adaptación *' : 'Descripción de la Labor Preventiva *'}
                </label>
                <textarea 
                  className="form-textarea text-xs" 
                  required 
                  rows="2" 
                  value={newOT.description} 
                  onChange={e => setNewOT({...newOT, description: e.target.value})} 
                  placeholder={newOT.type === 'Correctivo' ? "Ej. Pérdida de presión en circuito primario de prensa..." : newOT.type === 'Mejora' ? "Ej. Instalación de protector acrílico de seguridad y canaleta en zona de alimentación..." : "Ej. Inspección rutinaria semanal de conexiones eléctricas y nivel de aceite..."} 
                />
              </div>

              {/* Tiempo de Parada: Solo para mantenimientos Correctivos donde la máquina se detuvo */}
              {newOT.type === 'Correctivo' && (
                <div className="form-group mb-0 bg-red-50/70 border border-red-200/90 p-3 rounded-xl">
                  <label className="block text-xs font-bold text-red-900 mb-1 flex items-center justify-between">
                    <span>Tiempo de Parada Previo (Minutos KPI)</span>
                    <span className="text-[10px] font-semibold text-red-700 font-mono">Downtime de Falla</span>
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input text-xs bg-white font-mono" 
                    value={newOT.downtimeMinutes} 
                    onChange={e => setNewOT({...newOT, downtimeMinutes: Math.max(0, parseInt(e.target.value, 10) || 0)})} 
                    placeholder="Minutos que la máquina estuvo detenida antes del inicio de la atención técnica"
                  />
                  <span className="text-[11px] text-red-700 mt-1 block">
                    Solo aplica en correctivos: representa el tiempo que la línea estuvo parada por la falla antes de iniciar la reparación.
                  </span>
                </div>
              )}

              {/* Asignación de Técnicos Inteligente según Tipo y Permisos */}
              {newOT.type === 'Correctivo' ? (
                /* En Correctivo: El técnico que reporta la falla queda asignado automáticamente */
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2.5 shadow-2xs">
                  <UserCheck size={20} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Técnico Asignado Automáticamente:</span>
                    <span className="text-slate-600">
                      <strong className="text-slate-900 font-semibold">{currentUserName}</strong> — Por ser atención de falla correctiva in-situ, la OT se auto-asigna a quien registra el incidente para iniciar la labor técnica de inmediato.
                    </span>
                  </div>
                </div>
              ) : canAssignTechnicians ? (
                /* En Preventivo o Mejora y el usuario TIENE permisos de asignación */
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <strong className="text-xs text-slate-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={14} className="text-blue-600" />
                      <span>Asignación de Cuadrilla Técnica ({newOT.type}):</span>
                    </strong>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Planificación Autorizada
                    </span>
                  </div>

                  {/* Técnico 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Técnico Principal Responsable *
                      </label>
                      {availableTechnicians.length > 0 ? (
                        <select 
                          className="form-select text-xs"
                          value={newOT.tech1} 
                          onChange={e => setNewOT({...newOT, tech1: e.target.value})}
                        >
                          {availableTechnicians.map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name} ({t.role || 'Técnico'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input className="form-input text-xs" placeholder="Nombre Técnico 1" value={newOT.tech1} onChange={e => setNewOT({...newOT, tech1: e.target.value})} />
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1" title="Horas Hombre estimadas para la labor">
                        Horas Planificadas (Hs)
                      </label>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        className="form-input text-xs" 
                        placeholder="Ej. 2.0" 
                        value={newOT.tech1Hours} 
                        onChange={e => setNewOT({...newOT, tech1Hours: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Técnico 2 (Opcional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Técnico de Apoyo (Opcional)
                      </label>
                      {availableTechnicians.length > 0 ? (
                        <select 
                          className="form-select text-xs"
                          value={newOT.tech2} 
                          onChange={e => setNewOT({...newOT, tech2: e.target.value})}
                        >
                          <option value="">-- Ninguno (Un solo técnico) --</option>
                          {availableTechnicians.map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name} ({t.role || 'Técnico'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input className="form-input text-xs" placeholder="Nombre Técnico 2 (Opcional)" value={newOT.tech2} onChange={e => setNewOT({...newOT, tech2: e.target.value})} />
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1" title="Horas Hombre estimadas para el técnico de apoyo">
                        Horas Planificadas (Hs)
                      </label>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        className="form-input text-xs" 
                        placeholder="Ej. 2.0" 
                        value={newOT.tech2Hours} 
                        onChange={e => setNewOT({...newOT, tech2Hours: e.target.value})} 
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 block italic">
                    * El segundo campo representa las horas hombre estimadas (ej. 2.0 = dos horas de labor) para valorizar el costo de mano de obra en planta.
                  </span>
                </div>
              ) : (
                /* En Preventivo o Mejora y el usuario NO TIENE permisos de asignación */
                <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center gap-2.5 shadow-2xs">
                  <Clock size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Asignación por Supervisión:</span>
                    <span className="text-slate-600">
                      Estás registrando una solicitud de <strong>{newOT.type.toLowerCase()}</strong>. La asignación formal de cuadrilla técnica y horas estimadas será realizada por la Jefatura o Planificador de Mantenimiento al aprobar la orden.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center cursor-pointer" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center cursor-pointer">Crear OT</button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Modal de Ayuda Contextual y Procedimiento LOTO */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} initialModule="workOrders" />

      {/* Modal de Reporte / Ficha Técnica de OT Individual con Firmas y Labores */}
      <WorkOrderReportModal
        isOpen={!!reportModalOT}
        onClose={() => setReportModalOT(null)}
        orderId={reportModalOT?.id || reportModalOT?.Id}
        orderCode={reportModalOT?.code || reportModalOT?.Code}
      />
    </div>
  );
}
