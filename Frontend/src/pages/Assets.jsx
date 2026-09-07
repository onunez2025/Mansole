import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Wrench, FileText, Plus, CheckCircle2, AlertOctagon, Layers, Edit3, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';

// Caché en cliente para carga instantánea
let cachedAssetsList = null;

export default function Assets({ currentUser }) {
  const [assets, setAssets] = useState(cachedAssetsList || []);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!cachedAssetsList);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAsset, setNewAsset] = useState({ code: '', name: '', brand: '', model: '', serialNumber: '', status: 'Operativo', areaId: '', categoryId: '' });

  const loadAssets = (silent = false) => {
    if (!silent && !cachedAssetsList) setLoading(true);
    Promise.all([
      api.getAssets(),
      api.getAreas(),
      api.getCategories()
    ]).then(([data, areasData, catsData]) => {
      if (Array.isArray(data)) {
        const clean = data.map((a, i) => ({
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
        }));
        cachedAssetsList = clean;
        setAssets(clean);
      }
      if (Array.isArray(areasData)) setAreas(areasData);
      if (Array.isArray(catsData)) setCategories(catsData);
      setLoading(false);
    }).catch(() => {
      if (!cachedAssetsList) setAssets([]);
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
        toast.success(`Activo "${newAsset.name}" actualizado exitosamente`);
      } else {
        await api.createAsset(newAsset);
        toast.success(`Activo "${newAsset.name}" registrado exitosamente`);
      }
      setShowCreateModal(false);
      loadAssets();
    } catch (err) {
      toast.error(`Error al guardar activo: ${err.message}`);
    }
  };

  const handleDeleteAsset = async (a) => {
    if (!window.confirm(`¿Eliminar definitivamente el activo [${a.code}] ${a.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteAsset(a.id);
      toast.success(`Activo "${a.name}" eliminado exitosamente`);
      loadAssets();
    } catch (err) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(a => 
      (a.name || '').toLowerCase().includes(q) ||
      (a.code || '').toLowerCase().includes(q) ||
      (a.areaName || '').toLowerCase().includes(q) ||
      (a.costCenterCode || '').toLowerCase().includes(q) ||
      (a.brand || '').toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Activos Industriales & CECOs</h3>
          <p className="text-sm text-slate-500 mt-0.5">Jerarquía de costos: Planta Industrial → Áreas de Producción → Equipos</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar máquina, código o CECO..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>
          <button className="btn btn-primary text-xs flex-shrink-0" onClick={openCreate}>
            <Plus size={15} /> Registrar Activo
          </button>
        </div>
      </div>

      {loading && !assets.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card h-72 flex flex-col gap-3 p-4">
              <div className="skeleton h-36 w-full rounded-lg" />
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-9 w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredAssets.map((a, idx) => (
          <div key={a.id || idx} className="stat-card flex flex-col p-0 overflow-hidden hover:border-slate-300 transition-all">
            <div className="h-44 w-full relative bg-slate-100 border-b border-slate-200">
              <img
                src={a.imageUrl || '/images/prensa.jpg'}
                alt={a.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display='none'; }}
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`badge ${a.status === 'Operativo' ? 'badge-success' : 'badge-danger'} shadow-xs`}>
                  {a.status === 'Operativo' ? <CheckCircle2 size={12} /> : <AlertOctagon size={12} />}
                  {a.status}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-800 border border-slate-200 font-mono shadow-xs">
                {a.costCenterCode}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">{a.categoryName}</span>
              <h4 className="text-base font-bold text-slate-900 mt-1 mb-2 leading-tight">
                [{a.code}] {a.name}
              </h4>
              <div className="text-xs text-slate-500 space-y-1 mb-4 leading-relaxed">
                <div><strong className="text-slate-700">Área:</strong> {a.areaName}</div>
                <div><strong className="text-slate-700">Marca / Modelo:</strong> {a.brand || '—'} {a.model || ''}</div>
                <div><strong className="text-slate-700">Num. Serie:</strong> <span className="font-mono">{a.serialNumber || '—'}</span></div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
                <button className="btn btn-secondary flex-1 text-xs py-1.5" onClick={() => setSelectedAsset(a)}>
                  <FileText size={14} /> Ficha Técnica
                </button>
                <button className="btn btn-secondary text-xs p-1.5" onClick={() => openEdit(a)} title="Editar activo">
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-secondary text-xs p-1.5 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDeleteAsset(a)} title="Eliminar activo">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal Ficha Técnica */}
      {selectedAsset && (
        <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Ficha Técnica y Hoja de Vida</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">[{selectedAsset.code}] {selectedAsset.name} • {selectedAsset.costCenterCode}</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 mb-4 text-xs leading-relaxed text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div><span className="text-slate-500">Marca:</span> <strong className="text-slate-900">{selectedAsset.brand || '—'}</strong></div>
                <div><span className="text-slate-500">Modelo:</span> <strong className="text-slate-900">{selectedAsset.model || '—'}</strong></div>
                <div><span className="text-slate-500">Num. Serie:</span> <strong className="text-slate-900 font-mono">{selectedAsset.serialNumber || '—'}</strong></div>
                <div><span className="text-slate-500">Adquisición:</span> <strong className="text-slate-900">{selectedAsset.acquisitionDate || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Área Planta:</span> <strong className="text-slate-900">{selectedAsset.areaName}</strong></div>
                <div><span className="text-slate-500">Estado Actual:</span> <span className="badge badge-success ml-1">{selectedAsset.status}</span></div>
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Layers size={15} className="text-slate-500" /> Archivos y Planos Adjuntos (Azure Blob Storage)
            </h4>
            <div className="space-y-2 mb-4">
              {[`Manual_Operacion_${selectedAsset.brand || 'Equipo'}.pdf`, `Plano_LOTO_${selectedAsset.code}.dwg`].map(f => (
                <div key={f} className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-slate-200 text-xs gap-2">
                  <span className="font-medium text-slate-800 truncate">📄 {f}</span>
                  <button className="btn btn-secondary text-xs py-1 px-2.5 flex-shrink-0">Descargar Blob</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <button className="btn btn-secondary text-xs justify-center" onClick={() => setSelectedAsset(null)}>Cerrar</button>
              <button className="btn btn-primary text-xs justify-center" onClick={() => { setSelectedAsset(null); openEdit(selectedAsset); }}>
                <Wrench size={14} /> Editar Activo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Activo */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingAsset ? `Editar Activo: ${editingAsset.code}` : 'Registrar Nuevo Activo'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código Activo *</label>
                  <input className="form-input text-xs" required value={newAsset.code} onChange={e => setNewAsset({...newAsset, code: e.target.value})} placeholder="Ej. PRENSA-03" />
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Equipo *</label>
                  <input className="form-input text-xs" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="Ej. Prensa Hidráulica 100T" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marca</label>
                  <input className="form-input text-xs" value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} placeholder="Ej. Rexroth" />
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
                  <input className="form-input text-xs" value={newAsset.model} onChange={e => setNewAsset({...newAsset, model: e.target.value})} placeholder="Ej. HV-200" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Área / CECO *</label>
                  <select className="form-select text-xs" required value={newAsset.areaId} onChange={e => setNewAsset({...newAsset, areaId: e.target.value})}>
                    <option value="">— Seleccionar Área —</option>
                    {areas.map(a => (
                      <option key={a.Id || a.id} value={a.Id || a.id}>
                        [{a.CostCenterCode || a.costCenterCode}] {a.Name || a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría *</label>
                  <select className="form-select text-xs" required value={newAsset.categoryId} onChange={e => setNewAsset({...newAsset, categoryId: e.target.value})}>
                    <option value="">— Seleccionar Categoría —</option>
                    {categories.map(c => (
                      <option key={c.Id || c.id} value={c.Id || c.id}>{c.Name || c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Serie</label>
                  <input className="form-input text-xs" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} placeholder="SN-XXXXXX" />
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select className="form-select text-xs" value={newAsset.status} onChange={e => setNewAsset({...newAsset, status: e.target.value})}>
                    <option value="Operativo">✅ Operativo</option>
                    <option value="En Mantenimiento">🔧 En Mantenimiento</option>
                    <option value="Fuera de Servicio">❌ Fuera de Servicio</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs justify-center" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs justify-center">
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
