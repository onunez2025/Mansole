import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CalendarClock, Edit3, RefreshCw } from 'lucide-react';

export default function Schedule({ currentUser }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [reprogramReason, setReprogramReason] = useState('Parada de producción aplazada o espera de ventana operativa en línea');

  const loadSchedule = () => {
    setLoading(true);
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
        setSchedule(clean);
      } else {
        setSchedule([]);
      }
      setLoading(false);
    }).catch(() => {
      setSchedule([]);
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
      alert(`✅ Fecha reprogramada exitosamente al ${newDate}. Justificación registrada en Azure SQL.`);
      loadSchedule();
    } catch (err) {
      alert(`❌ Error al reprogramar actividad: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#8A919E', fontWeight: '600' }}>⏳ Cargando cronograma preventivo desde Azure SQL...</div>;
  }

  const canReprogram = currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor de Planta';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Cronograma de Mantenimientos Preventivos</h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>
            Generación automática por frecuencia con <strong>permiso RBAC de reprogramación manual para supervisores</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadSchedule}>
          <RefreshCw size={16} /> Sincronizar Calendario
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <span className="badge badge-danger">🔴 Vencido (Urge OT)</span>
        <span className="badge badge-warning">🟡 Próximo a Vencer (3 días)</span>
        <span className="badge badge-success">🟢 Programado OK</span>
      </div>

      <div className="siatc-card" style={{ padding: '24px' }}>
        <div className="table-container" style={{ marginTop: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Activo o Área (CECO)</th>
                <th>Actividad Mantenimiento</th>
                <th>Frecuencia</th>
                <th>Próxima Fecha Programada</th>
                <th>Estado Cronograma</th>
                <th>Acción Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s, idx) => {
                let badgeClass = 'badge-success';
                if (s.status === 'Vencido') badgeClass = 'badge-danger';
                if (s.status === 'Próximo a Vencer') badgeClass = 'badge-warning';

                return (
                  <tr key={s.id || idx}>
                    <td>
                      <div style={{ fontWeight: '800', color: '#1A1C1E' }}>[{s.assetCode}] {s.assetName}</div>
                      <div style={{ fontSize: '12px', color: '#4C5F80', fontWeight: '700' }}>{s.areaName} ({s.costCenterCode})</div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#1A1C1E' }}>{s.activityName}</td>
                    <td><span className="badge badge-mono">{s.frequencyType}</span></td>
                    <td style={{ fontWeight: '800', fontSize: '15px', color: '#1A1C1E' }}>
                      📅 {s.nextDueDate}
                    </td>
                    <td><span className={`badge ${badgeClass}`}>{s.status}</span></td>
                    <td>
                      {canReprogram ? (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '7px 12px', fontSize: '13px' }}
                          onClick={() => {
                            setSelectedItem(s);
                            setNewDate(s.nextDueDate);
                          }}
                        >
                          <Edit3 size={14} /> Reprogramar Fecha
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#8A919E', fontStyle: 'italic' }}>
                          🔒 Solo Supervisores (RBAC)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
