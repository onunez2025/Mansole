import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClipboardList, Plus, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ModalPortal from '../components/UI/ModalPortal';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Actividades</h3>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Procedimientos estandarizados y tareas rutinarias para órdenes de trabajo preventivas</p>
        </div>
        <button className="btn btn-primary text-xs py-1.5 px-3 self-start sm:self-auto" onClick={() => {
          setEditingActivity(null);
          setNewActivity({ name: '', type: 'Mecánico', estimatedMinutes: 60, resources: '' });
          setShowModal(true);
        }}>
          <Plus size={15} /> 
          <span className="hidden sm:inline">Nueva Actividad</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      <div className="pipeline-container">
        {['ALL', 'MECÁNICO', 'ELÉCTRICO', 'INSTRUMENTACIÓN', 'INFRAESTRUCTURA'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`pipeline-tab text-xs ${filterType === type ? 'active' : ''}`}
          >
            <Filter size={12} />
            {type === 'ALL' ? 'Todas las Actividades' : `${type.charAt(0) + type.slice(1).toLowerCase()}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((a, idx) => (
          <div key={a.id || idx} className="stat-card flex flex-col p-4 sm:p-5 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className={`badge ${a.type === 'Mecánico' ? 'badge-info' : a.type === 'Eléctrico' ? 'badge-warning' : 'badge-success'} text-[11px]`}>
                {a.type || 'General'}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                ⏱️ {a.estimatedMinutes || 60} min
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-tight">
              {a.name}
            </h4>

            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 mb-4 leading-relaxed">
              <strong className="text-slate-800 block mb-1 text-[11px] uppercase tracking-wider font-semibold">Herramientas & Recursos:</strong>
              {a.resources}
            </div>

            <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono truncate">CECO & MÁQUINAS</span>
              <div className="flex gap-1.5 flex-shrink-0">
                <button className="btn btn-secondary text-xs py-1 px-2.5" onClick={() => {
                  setEditingActivity(a);
                  setNewActivity({ name: a.name, type: a.type, estimatedMinutes: a.estimatedMinutes, resources: a.resources });
                  setShowModal(true);
                }}>
                  Editar
                </button>
                <button className="btn btn-secondary text-xs p-1 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDeleteActivity(a)} title="Eliminar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingActivity ? 'Editar Actividad Maestra' : 'Crear Actividad Maestra'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editingActivity) {
                    await api.updateActivity(editingActivity.id, newActivity);
                    toast.success("Actividad actualizada exitosamente");
                  } else {
                    await api.createActivity(newActivity);
                    toast.success("Actividad creada exitosamente");
                  }
                  setShowModal(false);
                  loadActivities();
                } catch (err) {
                  toast.error("Error al procesar actividad: " + err.message);
                }
              }}>
                <div className="form-group mb-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Actividad *</label>
                  <input className="form-input text-xs" required value={newActivity.name} onChange={e => setNewActivity({...newActivity, name: e.target.value})} placeholder="Ej. Inspección de Válvulas y Líneas" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo *</label>
                    <select className="form-select text-xs" value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value})}>
                      <option value="Mecánico">Mecánico</option>
                      <option value="Eléctrico">Eléctrico</option>
                      <option value="Neumático">Neumático</option>
                      <option value="Lubricación">Lubricación</option>
                      <option value="Calibración">Calibración</option>
                      <option value="Inspección">Inspección</option>
                      <option value="Seguridad">Seguridad</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duración Est. (min) *</label>
                    <input type="number" required className="form-input text-xs" value={newActivity.estimatedMinutes} onChange={e => setNewActivity({...newActivity, estimatedMinutes: e.target.value})} />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Herramientas y Recursos Necesarios</label>
                  <textarea 
                    className="form-textarea text-xs" 
                    rows="2" 
                    value={newActivity.resources} 
                    onChange={e => setNewActivity({...newActivity, resources: e.target.value})} 
                    placeholder="Ej. Llave dinamométrica, multímetro, grasa dieléctrica..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center">
                    {editingActivity ? 'Guardar' : 'Crear'}
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
