import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { CalendarClock, Edit3, RefreshCw, Search, CalendarDays, Table as TableIcon, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';

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

export default function Schedule({ currentUser }) {
  const [schedule, setSchedule] = useState(cachedScheduleList || []);
  const [loading, setLoading] = useState(!cachedScheduleList);
  const [selectedItem, setSelectedItem] = useState(null);
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

  const canReprogram = currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor' || currentUser?.role === 'Supervisor de Planta';

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

  const openReprogramModal = (item) => {
    setSelectedItem(item);
    setNewDate(item.nextDueDate);
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
                      className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors ${
                        cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/60 text-slate-400'
                      }`}
                    >
                      {/* Número del Día */}
                      <div className="flex items-center justify-between mb-1.5">
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
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
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
                            ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                            : isProximo
                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100';

                          const dotColor = isVencido
                            ? 'bg-red-500'
                            : isProximo
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';

                          return (
                            <button
                              key={evt.id}
                              type="button"
                              onClick={() => openReprogramModal(evt)}
                              className={`w-full text-left p-1 rounded-md border text-[10px] font-semibold truncate block transition-all shadow-2xs cursor-pointer ${pillStyle}`}
                              title={`[${evt.assetCode}] ${evt.activityName} (${evt.frequencyType}) - Estado: ${evt.status}. Clic para reprogramar`}
                            >
                              <div className="flex items-center gap-1 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                                <span className="font-bold font-mono">[{evt.assetCode}]</span>
                                <span className="truncate">{evt.activityName}</span>
                              </div>
                            </button>
                          );
                        })}

                        {/* Botón "+X más" si hay más de 2 actividades */}
                        {events.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setActiveDayModal({ dateKey: cell.dateKey, events })}
                            className="w-full text-center text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
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
                          {canReprogram ? (
                            <button 
                              className="btn btn-secondary text-xs py-1 px-2.5 cursor-pointer"
                              onClick={() => openReprogramModal(s)}
                            >
                              <Edit3 size={12} /> Reprogramar
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Solo Supervisores
                            </span>
                          )}
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

                  {canReprogram && (
                    <button
                      type="button"
                      onClick={() => openReprogramModal(evt)}
                      className="btn btn-secondary text-xs py-1 px-2.5 flex-shrink-0 cursor-pointer"
                    >
                      <Edit3 size={12} /> Reprogramar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reprogramación */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Reprogramación de Preventivo</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 sm:p-3.5 rounded-xl mb-4 text-xs text-blue-800 leading-relaxed">
              Estás modificando la fecha programada de <strong>"{selectedItem.activityName}"</strong> en el activo <strong>[{selectedItem.assetCode}] {selectedItem.assetName}</strong>. La reprogramación quedará registrada con justificación para la auditoría de CECO.
            </div>

            <form onSubmit={handleReprogram} className="space-y-3">
              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Actualmente Programada</label>
                <input className="form-input text-xs bg-slate-50 text-slate-500 font-mono" disabled value={formatDisplayDate(selectedItem.nextDueDate)} />
              </div>

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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center cursor-pointer" onClick={() => setSelectedItem(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center cursor-pointer">Guardar Fecha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
