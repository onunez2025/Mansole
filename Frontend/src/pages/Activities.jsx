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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Catálogo Maestro de Actividades de Mantenimiento</h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>Tareas estándar asociables a Categorías de Máquinas o de forma externa a un Área / CECO</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingActivity(null);
          setNewActivity({ name: '', type: 'Mecánico', estimatedMinutes: 60, resources: '' });
          setShowModal(true);
        }}>
          <Plus size={18} /> Nueva Actividad Maestro
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto' }}>
        {['ALL', 'MECÁNICO', 'ELÉCTRICO', 'INSTRUMENTACIÓN', 'INFRAESTRUCTURA'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: filterType === type ? '#4C5F80' : '#FFFFFF',
              borderColor: filterType === type ? '#4C5F80' : '#E2E4E9',
              color: filterType === type ? '#FFFFFF' : '#515254',
              fontWeight: filterType === type ? '700' : '600',
              boxShadow: '0 1px 2px rgba(5,15,26,0.04)'
            }}
          >
            <Filter size={14} />
            {type === 'ALL' ? 'Todas las Actividades' : `Tipo: ${type.charAt(0) + type.slice(1).toLowerCase()}`}
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
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#4C5F80' }}>
                ⏱️ Est: {a.estimatedMinutes || 60} mins
              </span>
            </div>

            <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E', lineHeight: '1.4', margin: '2px 0' }}>
              {a.name}
            </h4>

            <div style={{ fontSize: '13px', color: '#515254', background: '#F9FAFB', padding: '14px', borderRadius: '10px', border: '1px solid #E2E4E9', lineHeight: '1.5' }}>
              <strong style={{ color: '#1A1C1E', display: 'block', marginBottom: '4px', fontWeight: '700' }}>🛠️ Herramientas y Recursos de Planta:</strong>
              {a.resources}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #E2E4E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8A919E', fontWeight: '600' }}>Aplicable a: Máquinas y Áreas CECO</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => {
                  setEditingActivity(a);
                  setNewActivity({ name: a.name, type: a.type, estimatedMinutes: a.estimatedMinutes, resources: a.resources });
                  setShowModal(true);
                }}>
                  Editar Tarea
                </button>
                <button className="btn btn-secondary" style={{ padding: '6px 9px', color: '#DF2935' }} onClick={() => handleDeleteActivity(a)} title="Eliminar">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>
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
