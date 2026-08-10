import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Wrench, FileText, Plus, CheckCircle2, AlertOctagon, Layers, Edit3, Trash2 } from 'lucide-react';

export default function Assets({ currentUser }) {
  const [assets, setAssets] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({ code: '', name: '', brand: '', model: '', serialNumber: '', status: 'Operativo', areaId: '', categoryId: '' });

  const loadAssets = () => {
    setLoading(true);
    Promise.all([
      api.getAssets(),
      api.getAreas(),
      api.getCategories()
    ]).then(([data, areasData, catsData]) => {
      if (Array.isArray(data)) {
        setAssets(data.map((a, i) => ({
          id: a.id || a.Id || i + 1,
          code: a.code || a.Code || `EQ-${i + 10}`,
          name: a.name || a.Name || 'Maquinaria Industrial',
          categoryName: a.categoryName || a.CategoryName || 'Activo de Planta',
          categoryId: a.categoryId || a.CategoryId || '',
          brand: a.brand || a.Brand || '',
          model: a.model || a.Model || '',
          serialNumber: a.serialNumber || a.SerialNumber || '',
          areaName: a.areaName || a.AreaName || 'Área General',
          areaId: a.areaId || a.AreaId || '',
          costCenterCode: a.costCenterCode || a.CostCenterCode || 'CECO-SOL-101',
          acquisitionDate: a.acquisitionDate || a.AcquisitionDate || '',
          status: a.status || a.Status || 'Operativo',
          imageUrl: a.imageUrl || a.ImageUrl || ''
        })));
      }
      if (Array.isArray(areasData)) setAreas(areasData);
      if (Array.isArray(catsData)) setCategories(catsData);
      setLoading(false);
    }).catch(() => {
      setAssets([]);
      setLoading(false);
    });
  };

  useEffect(() => { loadAssets(); }, []);

  const openCreate = () => {
    setEditingAsset(null);
    setNewAsset({ code: '', name: '', brand: '', model: '', serialNumber: '', status: 'Operativo', areaId: areas[0]?.Id || '', categoryId: categories[0]?.Id || '' });
    setShowCreateModal(true);
  };

  const openEdit = (a) => {
    setEditingAsset(a);
    setNewAsset({ code: a.code, name: a.name, brand: a.brand, model: a.model, serialNumber: a.serialNumber, status: a.status, areaId: a.areaId, categoryId: a.categoryId });
    setShowCreateModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, newAsset);
        alert(`✅ Activo "${newAsset.name}" actualizado en Azure SQL.`);
      } else {
        await api.createAsset(newAsset);
        alert(`✅ Activo "${newAsset.name}" registrado en Azure SQL.`);
      }
      setShowCreateModal(false);
      loadAssets();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteAsset = async (a) => {
    if (!window.confirm(`¿Eliminar definitivamente el activo [${a.code}] ${a.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteAsset(a.id);
      alert(`✅ Activo "${a.name}" eliminado de Azure SQL.`);
      loadAssets();
    } catch (err) {
      alert(`❌ Error al eliminar: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#8A919E', fontWeight: '600' }}>⏳ Cargando inventario de maquinaria e infraestructura desde Azure SQL...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Catálogo de Activos Fijos & CECOs</h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>Organización jerárquica: Empresa {'>'} Área/CECO {'>'} Categorías {'>'} Máquina</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Registrar Nuevo Activo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {assets.map((a, idx) => (
          <div key={a.id || idx} className="siatc-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
            <div style={{ height: '160px', width: '100%', position: 'relative', background: '#F3F5F9', borderBottom: '1px solid #E2E4E9' }}>
              <img
                src={a.imageUrl || '/images/prensa.jpg'}
                alt={a.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display='none'; }}
              />
              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                <span className={`badge ${a.status === 'Operativo' ? 'badge-success' : 'badge-danger'}`}>
                  {a.status === 'Operativo' ? <CheckCircle2 size={13} /> : <AlertOctagon size={13} />}
                  {a.status}
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(26,28,30,0.85)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', color: '#FFF' }}>
                {a.costCenterCode}
              </div>
            </div>

            <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#4C5F80', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.categoryName}</span>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#1A1C1E', margin: '4px 0 8px', lineHeight: '1.3' }}>
                [{a.code}] {a.name}
              </h4>
              <p style={{ fontSize: '13px', color: '#515254', marginBottom: '14px', lineHeight: '1.5' }}>
                <strong>Área:</strong> {a.areaName}<br />
                <strong>Marca / Modelo:</strong> {a.brand || '—'} {a.model || ''}<br />
                <strong>Num. Serie:</strong> {a.serialNumber || '—'}
              </p>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px' }} onClick={() => setSelectedAsset(a)}>
                  <FileText size={14} /> Ficha Técnica
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 10px' }} onClick={() => openEdit(a)} title="Editar activo">
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', color: '#DF2935' }} onClick={() => handleDeleteAsset(a)} title="Eliminar activo">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ficha Técnica */}
      {selectedAsset && (
        <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Ficha Técnica y Hoja de Vida</h3>
                <p style={{ fontSize: '13px', color: '#4C5F80', fontWeight: '700' }}>[{selectedAsset.code}] {selectedAsset.name} • {selectedAsset.costCenterCode}</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #E2E4E9', marginBottom: '20px', fontSize: '14px', lineHeight: '1.6', color: '#1A1C1E' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong>Marca:</strong> {selectedAsset.brand || '—'}</div>
                <div><strong>Modelo:</strong> {selectedAsset.model || '—'}</div>
                <div><strong>Num. Serie:</strong> {selectedAsset.serialNumber || '—'}</div>
                <div><strong>Adquisición:</strong> {selectedAsset.acquisitionDate || 'N/A'}</div>
                <div><strong>Área Planta:</strong> {selectedAsset.areaName}</div>
                <div><strong>Estado Actual:</strong> <span className="badge badge-success">{selectedAsset.status}</span></div>
              </div>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1A1C1E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#4C5F80" /> Archivos y Planos Adjuntos (Azure Blob Storage)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[`Manual_Operacion_${selectedAsset.brand || 'Equipo'}.pdf`, `Plano_LOTO_${selectedAsset.code}.dwg`].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E4E9' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1C1E' }}>📄 {f}</span>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Descargar Azure Blob</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAsset(null)}>Cerrar Ficha</button>
              <button className="btn btn-primary" onClick={() => { setSelectedAsset(null); openEdit(selectedAsset); }}>
                <Wrench size={16} /> Editar Activo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Activo */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>
                {editingAsset ? `Editar Activo: ${editingAsset.code}` : 'Registrar Nuevo Activo'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveAsset}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Código Activo *</label>
                  <input className="form-input" required value={newAsset.code} onChange={e => setNewAsset({...newAsset, code: e.target.value})} placeholder="Ej. PRENSA-03" />
                </div>
                <div className="form-group">
                  <label>Nombre del Equipo *</label>
                  <input className="form-input" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="Ej. Prensa Hidráulica 100T" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Marca</label>
                  <input className="form-input" value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} placeholder="Ej. Rexroth" />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input className="form-input" value={newAsset.model} onChange={e => setNewAsset({...newAsset, model: e.target.value})} placeholder="Ej. HV-200" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Área / CECO *</label>
                  <select className="form-select" required value={newAsset.areaId} onChange={e => setNewAsset({...newAsset, areaId: e.target.value})}>
                    <option value="">— Seleccionar Área —</option>
                    {areas.map(a => (
                      <option key={a.Id || a.id} value={a.Id || a.id}>
                        [{a.CostCenterCode || a.costCenterCode}] {a.Name || a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoría *</label>
                  <select className="form-select" required value={newAsset.categoryId} onChange={e => setNewAsset({...newAsset, categoryId: e.target.value})}>
                    <option value="">— Seleccionar Categoría —</option>
                    {categories.map(c => (
                      <option key={c.Id || c.id} value={c.Id || c.id}>{c.Name || c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Número de Serie</label>
                  <input className="form-input" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} placeholder="SN-XXXXXX" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-select" value={newAsset.status} onChange={e => setNewAsset({...newAsset, status: e.target.value})}>
                    <option value="Operativo">✅ Operativo</option>
                    <option value="En Mantenimiento">🔧 En Mantenimiento</option>
                    <option value="Fuera de Servicio">❌ Fuera de Servicio</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingAsset ? 'Guardar Cambios' : 'Registrar en Azure SQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
