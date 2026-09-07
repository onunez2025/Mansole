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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="cyber-badge" style={{ fontSize: '10px' }}>PLANIFICACIÓN PREVENTIVA</span>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>// ALGORITMO DE FRECUENCIAS AUTOMÁTICAS</span>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>Cronograma de Mantenimientos Preventivos</h3>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Cálculo por horómetro/frecuencia con <strong style={{ color: '#38BDF8' }}>reprogramación trazable para supervisores</strong>
          </p>
        </div>
        <button className="btn-secondary" onClick={() => loadSchedule(false)}>
          <RefreshCw size={15} /> Sincronizar
        </button>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="siatc-card" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="pipeline-container">
          <button 
            className={`pipeline-tab ${activeFilter === 'Todos' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Todos')}
          >
            Todos ({schedule.length})
          </button>
          <button 
            className={`pipeline-tab ${activeFilter === 'Vencido' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Vencido')}
          >
            🔴 Vencidos ({schedule.filter(s => s.status === 'Vencido').length})
          </button>
          <button 
            className={`pipeline-tab ${activeFilter === 'Próximo' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Próximo')}
          >
            🟡 Próximos ({schedule.filter(s => s.status === 'Próximo a Vencer').length})
          </button>
          <button 
            className={`pipeline-tab ${activeFilter === 'Programado' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Programado')}
          >
            🟢 Programados ({schedule.filter(s => s.status === 'Programado').length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por activo, actividad o CECO..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '12px',
              background: '#0B1120',
              color: '#F8FAFC',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <span className="badge badge-danger">🔴 Vencido (Urge OT)</span>
        <span className="badge badge-warning">🟡 Próximo a Vencer (3 días)</span>
        <span className="badge badge-success">🟢 Programado OK</span>
      </div>

      {loading && !schedule.length ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="siatc-card" style={{ padding: '24px' }}>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Activo o Área (CECO)</th>
                  <th>Actividad Mantenimiento</th>
                  <th>Frecuencia</th>
                  <th>Próxima Fecha</th>
                  <th>Estado</th>
                  <th>Acción Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
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
                          <div style={{ fontWeight: '800', color: '#FFFFFF', fontFamily: 'monospace' }}>[{s.assetCode}] {s.assetName}</div>
                          <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700', fontFamily: 'monospace' }}>{s.areaName} ({s.costCenterCode})</div>
                        </td>
                        <td style={{ fontWeight: '600', color: '#E2E8F0' }}>{s.activityName}</td>
                        <td><span className="badge badge-mono">{s.frequencyType}</span></td>
                        <td style={{ fontWeight: '800', fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace' }}>
                          📅 {s.nextDueDate}
                        </td>
                        <td><span className={`badge ${badgeClass}`}>{s.status}</span></td>
                        <td>
                          {canReprogram ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => {
                                setSelectedItem(s);
                                setNewDate(s.nextDueDate);
                              }}
                            >
                              <Edit3 size={13} /> Reprogramar
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', fontFamily: 'monospace' }}>
                              🔒 Solo Supervisores
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Reprogramación de Fecha Preventivo</h3>
              <button onClick={() => setSelectedItem(null)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#EAF0FB', border: '1px solid #C5D6F5', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#3B72D4', fontWeight: '600', lineHeight: '1.5' }}>
              ⚡ Estás editando la fecha programada de <strong>"{selectedItem.activityName}"</strong> en el activo <strong>[{selectedItem.assetCode}] {selectedItem.assetName}</strong>. La reprogramación requiere declarar una justificación para la auditoría contable del CECO.
            </div>

            <form onSubmit={handleReprogram}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Fecha Actualmente Programada</label>
                <input className="form-input" disabled value={selectedItem.nextDueDate} style={{ background: '#F3F5F9' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Nueva Fecha Propuesta *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Motivo de Reprogramación (Auditoría CECO) *</label>
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  required
                  value={reprogramReason} 
                  onChange={e => setReprogramReason(e.target.value)} 
                  placeholder="Explique el motivo: espera de repuestos, producción continua no permite parada, etc."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Nueva Fecha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
