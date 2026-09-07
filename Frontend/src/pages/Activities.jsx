import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClipboardList, Plus, Filter, Trash2 } from 'lucide-react';

export default function Activities({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({ name: '', type: 'Mecánico', estimatedMinutes: 60, resources: '' });

  const loadActivities = () => {
    setLoading(true);
    api.getActivities().then(data => {
      if (Array.isArray(data)) {
        const clean = data.map((a, idx) => ({
          id: a.id || a.Id || idx + 1,
          type: a.type || a.Type || 'Mecánico',
          name: a.name || a.Name || 'Actividad de Mantenimiento',
          estimatedMinutes: Number(a.estimatedMinutes !== undefined ? a.estimatedMinutes : (a.EstimatedMinutes !== undefined ? a.EstimatedMinutes : 60)),
          resources: a.resources || a.Resources || 'Herramientas estándar de taller'
        }));
        setActivities(clean);
      } else {
        setActivities([]);
      }
      setLoading(false);
    }).catch(() => {
      setActivities([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleDeleteActivity = async (a) => {
    if (!window.confirm(`¿Eliminar la actividad "${a.name}" del catálogo maestro?`)) return;
    try {
      await api.deleteActivity(a.id);
      alert(`✅ Actividad eliminada de Azure SQL.`);
      loadActivities();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#8A919E', fontWeight: '600' }}>⏳ Cargando catálogo maestro de tareas desde Azure SQL...</div>;
  }

  const filtered = filterType === 'ALL' ? activities : activities.filter(a => (a.type || '').toUpperCase() === filterType);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="cyber-badge" style={{ fontSize: '10px' }}>INGENIERÍA DE MANTENIMIENTO</span>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>// PROCEDIMIENTOS ESTÁNDAR MAESTROS</span>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>Catálogo Maestro de Actividades</h3>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>Tareas normalizadas aplicables a Categorías de Máquinas o imputables a Áreas / CECOs</p>
        </div>
        <button className="btn-cyber" onClick={() => {
          setEditingActivity(null);
          setNewActivity({ name: '', type: 'Mecánico', estimatedMinutes: 60, resources: '' });
          setShowModal(true);
        }}>
          <Plus size={16} /> Nueva Actividad
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto' }}>
        {['ALL', 'MECÁNICO', 'ELÉCTRICO', 'INSTRUMENTACIÓN', 'INFRAESTRUCTURA'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className="pipeline-tab"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: filterType === type ? '800' : '600'
            }}
          >
            <Filter size={13} />
            {type === 'ALL' ? 'Todas las Actividades' : `${type.charAt(0) + type.slice(1).toLowerCase()}`}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filtered.map((a, idx) => (
          <div key={a.id || idx} className="siatc-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge ${a.type === 'Mecánico' ? 'badge-info' : a.type === 'Eléctrico' ? 'badge-warning' : 'badge-success'}`}>
                {a.type || 'General'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#38BDF8', fontFamily: 'monospace' }}>
                ⏱️ Est: {a.estimatedMinutes || 60} mins
              </span>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.4', margin: '2px 0' }}>
              {a.name}
            </h4>

            <div style={{ fontSize: '12px', color: '#CBD5E1', background: 'rgba(11, 17, 32, 0.8)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', lineHeight: '1.5' }}>
              <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '4px', fontWeight: '800', fontFamily: 'monospace', fontSize: '11px' }}>🛠️ HERRAMIENTAS & RECURSOS:</strong>
              {a.resources}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>CECO & MÁQUINAS</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => {
                  setEditingActivity(a);
                  setNewActivity({ name: a.name, type: a.type, estimatedMinutes: a.estimatedMinutes, resources: a.resources });
                  setShowModal(true);
                }}>
                  Editar
                </button>
                <button className="btn btn-secondary" style={{ padding: '6px 9px', color: '#EF4444' }} onClick={() => handleDeleteActivity(a)} title="Eliminar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                {editingActivity ? 'Editar Actividad Maestra' : 'Crear Actividad Maestra'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingActivity) {
                  await api.updateActivity(editingActivity.id, newActivity);
                  alert("✅ Actividad actualizada exitosamente en Azure SQL");
                } else {
                  await api.createActivity(newActivity);
                  alert("✅ Actividad creada exitosamente en Azure SQL");
                }
                setShowModal(false);
                loadActivities();
              } catch (err) {
                alert("❌ Error al procesar actividad: " + err.message);
              }
            }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Nombre de la Actividad *</label>
                <input className="form-input" required value={newActivity.name} onChange={e => setNewActivity({...newActivity, name: e.target.value})} placeholder="Ej. Cambio de Aceite" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Tipo *</label>
                  <select className="form-select" value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value})}>
                    <option value="Mecánico">Mecánico</option>
                    <option value="Eléctrico">Eléctrico</option>
                    <option value="Instrumentación">Instrumentación</option>
                    <option value="Infraestructura">Infraestructura</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tiempo Estimado (Minutos) *</label>
                  <input type="number" required className="form-input" value={newActivity.estimatedMinutes} onChange={e => setNewActivity({...newActivity, estimatedMinutes: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Recursos y Herramientas Requeridos</label>
                <textarea className="form-textarea" rows="2" value={newActivity.resources} onChange={e => setNewActivity({...newActivity, resources: e.target.value})} placeholder="Ej. EPP, Llave inglesa 10mm" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar en Base de Datos</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
