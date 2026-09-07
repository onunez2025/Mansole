import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { CalendarClock, Edit3, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';

// Caché en cliente para transiciones instantáneas (0ms)
let cachedScheduleList = null;

export default function Schedule({ currentUser }) {
  const [schedule, setSchedule] = useState(cachedScheduleList || []);
  const [loading, setLoading] = useState(!cachedScheduleList);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [reprogramReason, setReprogramReason] = useState('Parada de producción aplazada o espera de ventana operativa en línea');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSchedule = (silent = false) => {
    if (!silent && !cachedScheduleList) setLoading(true);
    api.getSchedule().then(data => {
      if (Array.isArray(data)) {
        const clean = data.map((s, idx) => ({
          id: s.id || s.Id || idx + 1,
          assetCode: s.assetCode || s.AssetCode || `EQ-${idx + 1}`,
          assetName: s.assetName || s.AssetName || 'Maquinaria de Planta',
          areaName: s.areaName || s.AreaName || 'Área General',
          costCenterCode: s.costCenterCode || s.CostCenterCode || 'CECO-SOL-101',
          activityName: s.activityName || s.ActivityName || 'Inspección Preventiva',
          frequencyType: s.frequencyType || s.FrequencyType || 'Mensual',
          nextDueDate: s.nextDueDate || s.NextDueDate || '2026-08-15',
          status: s.status || s.Status || 'Programado'
        }));
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
    e.preventDefault();
    if (!selectedItem || !newDate) return;

    try {
      await api.reprogramSchedule(selectedItem.id, newDate, reprogramReason);
      setSelectedItem(null);
      toast.success(`Fecha reprogramada exitosamente al ${newDate}`);
      // Actualizar localmente de inmediato
      const updated = schedule.map(s => s.id === selectedItem.id ? { ...s, nextDueDate: newDate } : s);
      cachedScheduleList = updated;
      setSchedule(updated);
      loadSchedule(true);
    } catch (err) {
      toast.error(`Error al reprogramar actividad: ${err.message}`);
    }
  };

  const canReprogram = currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor' || currentUser?.role === 'Supervisor de Planta';

  // Filtrado por estado y texto
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Cronograma de Mantenimientos Preventivos</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Cálculo por horómetro/frecuencia con reprogramación trazable para supervisores
          </p>
        </div>
        <button className="btn btn-secondary text-xs self-start sm:self-auto" onClick={() => loadSchedule(false)}>
          <RefreshCw size={14} /> Sincronizar
        </button>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4 shadow-xs">
        <div className="pipeline-container">
          <button 
            className={`pipeline-tab text-xs ${activeFilter === 'Todos' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Todos')}
          >
            Todos ({schedule.length})
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeFilter === 'Vencido' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Vencido')}
          >
            🔴 Vencidos ({schedule.filter(s => s.status === 'Vencido').length})
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeFilter === 'Próximo' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Próximo')}
          >
            🟡 Próximos ({schedule.filter(s => s.status === 'Próximo a Vencer').length})
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeFilter === 'Programado' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Programado')}
          >
            🟢 Programados ({schedule.filter(s => s.status === 'Programado').length})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por activo, actividad o CECO..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
      </div>

      {loading && !schedule.length ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs">
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
                          📅 {s.nextDueDate}
                        </td>
                        <td><span className={`badge ${badgeClass} text-[11px]`}>{s.status}</span></td>
                        <td>
                          {canReprogram ? (
                            <button 
                              className="btn btn-secondary text-xs py-1 px-2.5"
                              onClick={() => {
                                setSelectedItem(s);
                                setNewDate(s.nextDueDate);
                              }}
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

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Reprogramación de Preventivo</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 sm:p-3.5 rounded-xl mb-4 text-xs text-blue-800 leading-relaxed">
              Estás modificando la fecha programada de <strong>"{selectedItem.activityName}"</strong> en el activo <strong>[{selectedItem.assetCode}] {selectedItem.assetName}</strong>. La reprogramación quedará registrada con justificación para la auditoría de CECO.
            </div>

            <form onSubmit={handleReprogram} className="space-y-3">
              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Actualmente Programada</label>
                <input className="form-input text-xs bg-slate-50 text-slate-500 font-mono" disabled value={selectedItem.nextDueDate} />
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

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs justify-center" onClick={() => setSelectedItem(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs justify-center">Guardar Nueva Fecha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
