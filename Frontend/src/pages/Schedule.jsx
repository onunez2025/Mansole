import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { CalendarClock, Edit3, RefreshCw, Search, CalendarDays, Table as TableIcon, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle2, X, Plus, Trash2, Play, Eye, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';
import ModalPortal from '../components/UI/ModalPortal';

// Caché en cliente para transiciones instantáneas (0ms)
let cachedScheduleList = null;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Formato de fecha legible (DD MMM YYYY)
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  const clean = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[monthIndex] || ''} ${year}`;
  }
  return clean;
};

export default function Schedule({ currentUser, onNavigateToWorkOrders }) {
  const [schedule, setSchedule] = useState(cachedScheduleList || []);
  const [loading, setLoading] = useState(!cachedScheduleList);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReprogramForm, setShowReprogramForm] = useState(false);
  const [isStartingOT, setIsStartingOT] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [reprogramReason, setReprogramReason] = useState('Parada de producción aplazada o espera de ventana operativa en línea');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modo de visualización: 'calendar' o 'table'
  const [viewMode, setViewMode] = useState('calendar');

  // Mes seleccionado para el calendario (inicia en Agosto 2026 o mes actual)
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 7, 1)); // Agosto 2026

  // Modal para ver todas las actividades de un día específico
  const [activeDayModal, setActiveDayModal] = useState(null);

  // Estados para Programar Nuevo Mantenimiento Preventivo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [createFormData, setCreateFormData] = useState({
    assetId: '',
    activityId: '',
    frequencyType: 'Mensual',
    frequencyValue: 1,
    nextDueDate: ''
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const loadSchedule = (silent = false) => {
    if (!silent && !cachedScheduleList) setLoading(true);
    api.getSchedule().then(data => {
      if (Array.isArray(data)) {
        const clean = data.map((s, idx) => {
          const rawDate = s.nextDueDate || s.NextDueDate || '2026-08-15';
          const cleanDate = typeof rawDate === 'string' ? rawDate.split('T')[0] : '2026-08-15';
          return {
            id: s.id || s.Id || idx + 1,
            assetCode: s.assetCode || s.AssetCode || `EQ-${idx + 1}`,
            assetName: s.assetName || s.AssetName || 'Maquinaria de Planta',
            areaName: s.areaName || s.AreaName || 'Área General',
            costCenterCode: s.costCenterCode || s.CostCenterCode || 'CECO-SOL-101',
            activityName: s.activityName || s.ActivityName || 'Inspección Preventiva',
            frequencyType: s.frequencyType || s.FrequencyType || 'Mensual',
            nextDueDate: cleanDate,
            rawDueDate: rawDate,
            status: s.status || s.Status || 'Programado'
          };
        });
        cachedScheduleList = clean;
        setSchedule(clean);
      } else {
        setSchedule([]);
      }
      setLoading(false);
    }).catch(() => {
      if (!cachedScheduleList) setSchedule([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleReprogram = async (e) => {
    if (e) e.preventDefault();
    if (!selectedItem || !newDate) return;

    try {
      await api.reprogramSchedule(selectedItem.id, newDate, reprogramReason);
      const updatedDate = newDate;
      setSelectedItem(null);
      setActiveDayModal(null);
      toast.success(`Fecha reprogramada exitosamente al ${updatedDate}`);
      
      const updated = schedule.map(s => s.id === selectedItem.id ? { ...s, nextDueDate: updatedDate } : s);
      cachedScheduleList = updated;
      setSchedule(updated);
      loadSchedule(true);
    } catch (err) {
      toast.error(`Error al reprogramar actividad: ${err.message}`);
    }
  };

  const openCreateModal = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    try {
      let loadedAssets = availableAssets;
      if (loadedAssets.length === 0) {
        const assetsData = await api.getAssets();
        if (Array.isArray(assetsData)) {
          loadedAssets = assetsData;
          setAvailableAssets(assetsData);
        }
      }

      let loadedActs = availableActivities;
      if (loadedActs.length === 0) {
        const actsData = await api.getActivities();
        if (Array.isArray(actsData)) {
          loadedActs = actsData;
          setAvailableActivities(actsData);
        }
      }

      setCreateFormData({
        assetId: loadedAssets.length > 0 ? (loadedAssets[0].id || loadedAssets[0].Id) : '',
        activityId: loadedActs.length > 0 ? (loadedActs[0].id || loadedActs[0].Id) : '',
        frequencyType: 'Mensual',
        frequencyValue: 1,
        nextDueDate: defaultDate
      });
      setShowCreateModal(true);
    } catch (err) {
      toast.error('Error al cargar activos o actividades: ' + (err.message || err));
      setShowCreateModal(true);
    }
  };

  const handleCreateSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!createFormData.assetId || !createFormData.activityId || !createFormData.nextDueDate) {
      toast.error('Por favor selecciona el activo, la actividad y la fecha programada.');
      return;
    }

    try {
      setIsSubmittingCreate(true);
      const selAsset = availableAssets.find(a => String(a.id || a.Id) === String(createFormData.assetId));
      await api.createScheduleEntry({
        assetId: parseInt(createFormData.assetId, 10),
        areaId: selAsset?.areaId || selAsset?.AreaId || null,
        activityId: parseInt(createFormData.activityId, 10),
        frequencyType: createFormData.frequencyType,
        frequencyValue: parseInt(createFormData.frequencyValue, 10) || 1,
        nextDueDate: createFormData.nextDueDate
      });

      toast.success('Mantenimiento preventivo programado exitosamente');
      setShowCreateModal(false);
      loadSchedule(false);
    } catch (err) {
      toast.error(`Error al programar mantenimiento: ${err.message || err}`);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteScheduleEntry = async (id, title) => {
    if (!window.confirm(`¿Estás seguro de eliminar la programación "${title}" del cronograma?`)) return;
    try {
      await api.deleteScheduleEntry(id);
      toast.success('Programación preventiva eliminada de Azure SQL');
      const updated = schedule.filter(s => s.id !== id);
      cachedScheduleList = updated;
      setSchedule(updated);
      if (activeDayModal) {
        setActiveDayModal(prev => prev ? ({
          ...prev,
          events: prev.events.filter(e => e.id !== id)
        }) : null);
      }
    } catch (err) {
      toast.error(`Error al eliminar: ${err.message || err}`);
    }
  };

  const canReprogram = useMemo(() => {
    const role = currentUser?.role || '';
    const permissions = currentUser?.permissions || [];
    return (
      role === 'Administrador' ||
      role === 'Supervisor' ||
      role === 'Supervisor de Planta' ||
      permissions.includes('mansole.schedule.reprogram') ||
      permissions.includes('*')
    );
  }, [currentUser]);

  // Filtrado por estado y texto de búsqueda
  const filteredSchedule = useMemo(() => {
    return schedule.filter(s => {
      if (activeFilter === 'Vencido' && s.status !== 'Vencido') return false;
      if (activeFilter === 'Próximo' && s.status !== 'Próximo a Vencer') return false;
      if (activeFilter === 'Programado' && s.status !== 'Programado') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAsset = (s.assetName || '').toLowerCase().includes(q) || (s.assetCode || '').toLowerCase().includes(q);
        const matchesActivity = (s.activityName || '').toLowerCase().includes(q);
        const matchesArea = (s.areaName || '').toLowerCase().includes(q) || (s.costCenterCode || '').toLowerCase().includes(q);
        return matchesAsset || matchesActivity || matchesArea;
      }
      return true;
    });
  }, [schedule, activeFilter, searchQuery]);

  // Mapa de eventos agrupados por fecha YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredSchedule.forEach(item => {
      const dateKey = item.nextDueDate;
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });
    return map;
  }, [filteredSchedule]);

  // Construcción de la matriz de días para el mes seleccionado
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay() - 1; // 0 = Lunes, 6 = Domingo
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Días del mes previo
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        date: prevDate
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // Días del mes siguiente para completar la cuadrícula de 7 columnas
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: false,
        date: nextDate
      });
    }

    return days;
  }, [calendarDate]);

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCalendarDate(new Date(2026, 8, 1)); // Septiembre 2026
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setNewDate(item.nextDueDate);
    setShowReprogramForm(false);
  };

  const openReprogramModal = (item) => {
    setSelectedItem(item);
    setNewDate(item.nextDueDate);
    setShowReprogramForm(true);
  };

  const handleStartMaintenance = async () => {
    if (!selectedItem) return;
    setIsStartingOT(true);
    try {
      const payload = {
        type: 'Preventivo',
        priority: selectedItem.status === 'Vencido' ? 'Alta' : 'Media',
        assetId: selectedItem.assetId || null,
        assetCode: selectedItem.assetCode,
        assetName: selectedItem.assetName,
        areaName: selectedItem.areaName,
        costCenterCode: selectedItem.costCenterCode,
        scheduledDate: selectedItem.nextDueDate,
        description: `Mantenimiento Preventivo Programado: ${selectedItem.activityName} (${selectedItem.frequencyType})`,
        technicians: currentUser ? [{ name: currentUser.name || currentUser.fullName || 'Técnico Asignado', hours: 1 }] : []
      };

      const res = await api.createWorkOrder(payload);
      toast.success(`Orden de Trabajo Preventiva iniciada exitosamente (Código: ${res.code || 'OT-PREV'})`);
      setSelectedItem(null);
      if (onNavigateToWorkOrders) {
        onNavigateToWorkOrders();
      }
    } catch (err) {
      toast.error(`Error al iniciar mantenimiento: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsStartingOT(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="text-blue-600" size={22} />
            <span>Cronograma Preventivo</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cálculo por horómetro/frecuencia con reprogramación trazable para supervisores
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Selector de Modo: Tabla / Calendario */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Calendario Mensual"
            >
              <CalendarDays size={14} className={viewMode === 'calendar' ? 'text-blue-600' : ''} />
              <span>Calendario</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Tabla Detallada"
            >
              <TableIcon size={14} className={viewMode === 'table' ? 'text-blue-600' : ''} />
              <span>Tabla</span>
            </button>
          </div>

          <button 
            className="btn btn-secondary text-xs py-1.5 px-3 shadow-2xs cursor-pointer" 
            onClick={() => loadSchedule(false)} 
            title="Sincronizar Cronograma con Azure SQL"
          >
            <RefreshCw size={14} /> <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {canReprogram && (
            <button 
              className="btn btn-primary text-xs py-1.5 px-3 shadow-xs cursor-pointer flex items-center gap-1.5" 
              onClick={openCreateModal} 
              title="Programar Nuevo Mantenimiento Preventivo"
            >
              <Plus size={14} /> <span>Programar Mantenimiento</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4 shadow-xs">
        <div className="pipeline-container">
          <button 
            className={`pipeline-tab text-xs cursor-pointer ${activeFilter === 'Todos' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Todos')}
          >
            Todos ({schedule.length})
          </button>
          <button 
            className={`pipeline-tab text-xs cursor-pointer ${activeFilter === 'Vencido' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Vencido')}
          >
            🔴 Vencidos ({schedule.filter(s => s.status === 'Vencido').length})
          </button>
          <button 
            className={`pipeline-tab text-xs cursor-pointer ${activeFilter === 'Próximo' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Próximo')}
          >
            🟡 Próximos ({schedule.filter(s => s.status === 'Próximo a Vencer').length})
          </button>
          <button 
            className={`pipeline-tab text-xs cursor-pointer ${activeFilter === 'Programado' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Programado')}
          >
            🟢 Programados ({schedule.filter(s => s.status === 'Programado').length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por activo, actividad o CECO..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
      </div>

      {/* Contenido Principal: Calendario o Tabla */}
      {loading && !schedule.length ? (
        <TableSkeleton rows={6} cols={6} />
      ) : viewMode === 'calendar' ? (
        /* ========================================================================= */
        /* VISTA DE CALENDARIO INTERACTIVO */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          {/* Barra de Navegación del Mes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Mes Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="Ir a Hoy"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Mes Siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Leyenda de Estados */}
            <div className="flex items-center gap-2.5 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Vencido
              </span>
              <span className="flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Próximo
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Programado
              </span>
            </div>
          </div>

          {/* Cuadrícula de Calendario */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Encabezados de Días de la Semana */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-t-xl overflow-hidden border border-slate-200">
                {WEEKDAY_NAMES.map((name, i) => (
                  <div key={i} className="bg-slate-50 py-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {name}
                  </div>
                ))}
              </div>

              {/* Celdas del Mes */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                {calendarDays.map((cell, idx) => {
                  const events = eventsByDate[cell.dateKey] || [];
                  const isToday = cell.dateKey === '2026-09-08'; // Fecha local simulada / actual

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (events.length > 0) {
                          setActiveDayModal({ dateKey: cell.dateKey, events });
                        }
                      }}
                      className={`min-h-[120px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                        events.length > 0 ? 'cursor-pointer hover:bg-slate-50/80 ' : ''
                      }${
                        cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                      }`}
                    >
                      {/* Número del Día */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-xs'
                              : cell.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {events.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200">
                            {events.length} {events.length === 1 ? 'act' : 'acts'}
                          </span>
                        )}
                      </div>

                      {/* Lista de Actividades del Día */}
                      <div className="space-y-1 flex-1 overflow-hidden">
                        {events.slice(0, 2).map((evt) => {
                          const isVencido = evt.status === 'Vencido';
                          const isProximo = evt.status === 'Próximo a Vencer';

                          const pillStyle = isVencido
                            ? 'bg-red-50/90 text-red-900 border-red-200 hover:bg-red-100 hover:border-red-300'
                            : isProximo
                            ? 'bg-amber-50/90 text-amber-950 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                            : 'bg-emerald-50/90 text-emerald-950 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';

                          const dotColor = isVencido
                            ? 'bg-red-500'
                            : isProximo
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';

                          return (
                            <button
                              key={evt.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(evt);
                              }}
                              className={`w-full text-left p-1 rounded-md sm:rounded-lg border text-[10px] sm:text-[10.5px] block transition-all shadow-2xs cursor-pointer hover:shadow-xs hover:scale-[1.01] ${pillStyle}`}
                              title={`Máquina: [${evt.assetCode}] ${evt.assetName}\nLabor: ${evt.activityName}\nFrecuencia: ${evt.frequencyType}\nEstado: ${evt.status}\nÁrea: ${evt.areaName} (${evt.costCenterCode})\n\n👉 Clic para ver detalle completo o iniciar mantenimiento`}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                                <span className="font-extrabold font-mono text-[9.5px] sm:text-[10px] text-slate-900 shrink-0">
                                  [{evt.assetCode}]
                                </span>
                                <span className="font-bold text-[10px] sm:text-[10.5px] text-slate-800 truncate">
                                  {evt.assetName}
                                </span>
                              </div>
                              <div className="text-[9px] sm:text-[9.5px] text-slate-600 truncate pl-2 flex items-center gap-1 font-normal">
                                <span className="text-slate-400 font-bold shrink-0">•</span>
                                <span className="truncate">{evt.activityName}</span>
                              </div>
                            </button>
                          );
                        })}

                        {/* Botón "+X más" si hay más de 2 actividades */}
                        {events.length > 2 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDayModal({ dateKey: cell.dateKey, events });
                            }}
                            className="w-full text-center text-[9.5px] sm:text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                          >
                            +{events.length - 2} más...
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISTA DE TABLA TRADICIONAL */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Activo / CECO</th>
                  <th>Actividad Mantenimiento</th>
                  <th>Frecuencia</th>
                  <th>Próxima Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No se encontraron actividades preventivas para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredSchedule.map((s, idx) => {
                    let badgeClass = 'badge-success';
                    if (s.status === 'Vencido') badgeClass = 'badge-danger';
                    if (s.status === 'Próximo a Vencer') badgeClass = 'badge-warning';

                    return (
                      <tr key={s.id || idx}>
                        <td>
                          <div className="font-bold text-slate-900 text-xs font-mono">[{s.assetCode}] {s.assetName}</div>
                          <div className="text-xs text-slate-500 font-mono">{s.areaName} ({s.costCenterCode})</div>
                        </td>
                        <td className="font-medium text-slate-800 text-xs">{s.activityName}</td>
                        <td><span className="badge badge-mono text-[11px]">{s.frequencyType}</span></td>
                        <td className="font-bold text-xs text-slate-900 font-mono">
                          📅 {formatDisplayDate(s.nextDueDate)}
                        </td>
                        <td><span className={`badge ${badgeClass} text-[11px]`}>{s.status}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button 
                              type="button"
                              className="btn btn-secondary text-xs py-1 px-2.5 cursor-pointer flex items-center gap-1"
                              onClick={() => openDetailModal(s)}
                              title="Ver detalle de mantenimiento y ejecutar labor"
                            >
                              <Eye size={12} className="text-blue-600" />
                              <span>Detalle / Iniciar</span>
                            </button>

                            {canReprogram && (
                              <button 
                                type="button"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                onClick={() => openReprogramModal(s)}
                                title="Reprogramar fecha"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}

                            {canReprogram && (
                              <button
                                type="button"
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                onClick={() => handleDeleteScheduleEntry(s.id, s.activityName)}
                                title="Eliminar del cronograma"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Ver Todas las Actividades de un Día */}
      {activeDayModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setActiveDayModal(null)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Actividades Programadas: {formatDisplayDate(activeDayModal.dateKey)}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {activeDayModal.events.length} mantenimientos registrados para esta fecha
                  </span>
                </div>
                <button onClick={() => setActiveDayModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {activeDayModal.events.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono font-bold text-xs text-slate-900">[{evt.assetCode}]</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          evt.status === 'Vencido' 
                            ? 'bg-red-100 text-red-800 border-red-200' 
                            : evt.status === 'Próximo a Vencer' 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {evt.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">{evt.activityName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{evt.assetName} • {evt.frequencyType}</div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDayModal(null);
                          openDetailModal(evt);
                        }}
                        className="btn btn-secondary text-xs py-1 px-2.5 cursor-pointer flex items-center gap-1 font-semibold text-blue-700 hover:bg-blue-50"
                        title="Ver detalle del mantenimiento e iniciar"
                      >
                        <Eye size={12} className="text-blue-600" />
                        <span>Detalle / Iniciar</span>
                      </button>

                      {canReprogram && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDayModal(null);
                            openReprogramModal(evt);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Reprogramar fecha"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}

                      {canReprogram && (
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduleEntry(evt.id, evt.activityName)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar actividad"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Detalle de Mantenimiento Programado & Ejecución / Reprogramación */}
      {selectedItem && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              {/* Cabecera del Modal */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-200 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-black text-blue-700 font-mono tracking-tight">
                      PLAN PREVENTIVO #{selectedItem.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedItem.status === 'Vencido' 
                        ? 'bg-red-100 text-red-800 border-red-300' 
                        : selectedItem.status === 'Próximo a Vencer' 
                          ? 'bg-amber-100 text-amber-800 border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {selectedItem.status === 'Vencido' ? '🔴 Vencido' :
                       selectedItem.status === 'Próximo a Vencer' ? '🟡 Próximo' : '🟢 Programado'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Detalle de Mantenimiento Programado
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Información operativa del plan preventivo y ejecución en planta
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)} 
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Ficha Completa del Activo y CECO */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 mb-3 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Activo / Maquinaria a Intervenir
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-xs">
                      [{selectedItem.assetCode}]
                    </span>
                    <span>{selectedItem.assetName}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Área: <strong>{selectedItem.areaName}</strong></span>
                    <span>•</span>
                    <span>CECO: <strong className="font-mono text-indigo-700">{selectedItem.costCenterCode}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">ACTIVIDAD / LABOR</span>
                    <span className="font-bold text-slate-800">{selectedItem.activityName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">FRECUENCIA / PERÍODO</span>
                    <span className="font-bold text-slate-800">{selectedItem.frequencyType}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Fecha Programada:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    📅 {formatDisplayDate(selectedItem.nextDueDate)}
                  </span>
                </div>
              </div>

              {/* Botón Principal: Iniciar Mantenimiento / Crear OT */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mb-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Play size={14} className="text-blue-600" />
                    <span>Ejecución Inmediata en Planta</span>
                  </div>
                  <div className="text-[11px] text-blue-800 mt-0.5">
                    Genera la Orden de Trabajo (OT) preventiva con esta máquina y actividad asignada.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartMaintenance}
                  disabled={isStartingOT}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all hover:shadow"
                >
                  {isStartingOT ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Iniciando...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Iniciar Mantenimiento</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sección de Reprogramación: Condicionada por Permisos */}
              {canReprogram ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setShowReprogramForm(!showReprogramForm)}
                    className="w-full p-2.5 bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      <Edit3 size={13} className="text-slate-600" />
                      <span>Reprogramar Fecha de Preventivo</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {showReprogramForm ? 'Ocultar campos ▲' : 'Modificar fecha ▼'}
                    </span>
                  </button>

                  {showReprogramForm && (
                    <form onSubmit={handleReprogram} className="p-3 space-y-3 bg-white border-t border-slate-200">
                      <div className="form-group mb-0">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Fecha Propuesta *</label>
                        <input 
                          type="date" 
                          className="form-input text-xs font-mono" 
                          required 
                          value={newDate} 
                          onChange={e => setNewDate(e.target.value)} 
                        />
                      </div>

                      <div className="form-group mb-0">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de Reprogramación *</label>
                        <textarea 
                          className="form-textarea text-xs" 
                          rows="2" 
                          required
                          value={reprogramReason} 
                          onChange={e => setReprogramReason(e.target.value)} 
                          placeholder="Explique el motivo: espera de repuestos, ventana operativa de planta, etc."
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button 
                          type="button" 
                          className="btn btn-secondary text-xs py-1 px-3 cursor-pointer" 
                          onClick={() => setShowReprogramForm(false)}
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary text-xs py-1 px-3 cursor-pointer"
                        >
                          Guardar Reprogramación
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Usuario sin permiso de reprogramación */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Reprogramación de Fechas Restringida</span>
                    <span>
                      Solo la Jefatura o Supervisores autorizados pueden alterar las fechas programadas del plan. Como técnico, puedes ejecutar esta labor haciendo clic en <strong>"Iniciar Mantenimiento"</strong>.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-3 border-t border-slate-200 mt-3">
                <button 
                  type="button" 
                  className="btn btn-secondary text-xs py-1.5 px-4 cursor-pointer" 
                  onClick={() => setSelectedItem(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Programar Nuevo Mantenimiento Preventivo */}
      {showCreateModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Programar Mantenimiento Preventivo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Asigna una rutina periódica a un equipo o activo de planta
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                {/* Selector de Activo */}
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activo / Maquinaria *
                  </label>
                  <select
                    className="form-select text-xs font-mono"
                    required
                    value={createFormData.assetId}
                    onChange={e => setCreateFormData({ ...createFormData, assetId: e.target.value })}
                  >
                    <option value="">-- Seleccione un Activo --</option>
                    {availableAssets.map(a => (
                      <option key={a.id || a.Id} value={a.id || a.Id}>
                        [{a.code || a.Code}] {a.name || a.Name} — {a.areaName || a.AreaName || 'Planta Callao'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Actividad Maestro */}
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actividad / Rutina Preventiva *
                  </label>
                  <select
                    className="form-select text-xs"
                    required
                    value={createFormData.activityId}
                    onChange={e => setCreateFormData({ ...createFormData, activityId: e.target.value })}
                  >
                    <option value="">-- Seleccione una Actividad del Catálogo --</option>
                    {availableActivities.map(act => (
                      <option key={act.id || act.Id} value={act.id || act.Id}>
                        {act.name || act.Name} ({act.type || act.Type || 'Mecánico'} - {act.estimatedMinutes || act.EstimatedMinutes || 60} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frecuencia: Tipo y Valor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Frecuencia / Intervalo *
                    </label>
                    <select
                      className="form-select text-xs"
                      value={createFormData.frequencyType}
                      onChange={e => setCreateFormData({ ...createFormData, frequencyType: e.target.value })}
                    >
                      <option value="Semanal">Semanal</option>
                      <option value="Quincenal">Quincenal</option>
                      <option value="Mensual">Mensual</option>
                      <option value="Bimestral">Bimestral</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                      <option value="Por Horómetro">Por Horómetro / Hs</option>
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Intervalo (Cada N ciclos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input text-xs"
                      value={createFormData.frequencyValue}
                      onChange={e => setCreateFormData({ ...createFormData, frequencyValue: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    />
                  </div>
                </div>

                {/* Próxima Fecha de Ejecución */}
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Próxima Fecha de Ejecución Programada *
                  </label>
                  <input
                    type="date"
                    className="form-input text-xs font-mono"
                    required
                    value={createFormData.nextDueDate}
                    onChange={e => setCreateFormData({ ...createFormData, nextDueDate: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Fecha en la que el sistema marcará la tarea para emisión o ejecución automática en planta.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button 
                    type="button" 
                    className="btn btn-secondary text-xs py-1.5 px-3 cursor-pointer" 
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmittingCreate}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary text-xs py-1.5 px-4 cursor-pointer flex items-center gap-1.5"
                    disabled={isSubmittingCreate}
                  >
                    {isSubmittingCreate ? (
                      <span>Guardando en Azure SQL...</span>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Guardar Programación</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
