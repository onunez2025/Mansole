import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Boxes, AlertCircle, Plus, RefreshCw, CheckCircle2, Edit3, Trash2, Search, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';
import HelpModal from '../components/HelpModal';

// Caché en cliente para transiciones instantáneas (0ms)
let cachedInventoryList = null;

export default function Inventory({ currentUser }) {
  const [inventory, setInventory] = useState(cachedInventoryList || []);
  const [loading, setLoading] = useState(!cachedInventoryList);
  const [showModal, setShowModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConditionFilter, setActiveConditionFilter] = useState('Todos');
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', currentStock: 1, minStock: 1, location: 'Almacén Central', unitCost: 0, reason: 'Canibalización'
  });

  const loadInventory = (silent = false) => {
    if (!silent && !cachedInventoryList) setLoading(true);
    api.getInventory().then(data => {
      if (Array.isArray(data)) {
        const cleanData = data.map((item, i) => {
          const cost = Number(item.unitCost !== undefined ? item.unitCost : (item.UnitCost !== undefined ? item.UnitCost : 0));
          return {
            id: item.id || item.Id || i + 1,
            code: item.code || item.Code || `REF-${i + 100}`,
            name: item.name || item.Name || 'Repuesto',
            description: item.description || item.Description || '',
            unitOfMeasure: item.unitOfMeasure || item.UnitOfMeasure || 'Pieza',
            currentStock: Number(item.currentStock !== undefined ? item.currentStock : (item.CurrentStock !== undefined ? item.CurrentStock : 0)),
            minStock: Number(item.minStock !== undefined ? item.minStock : (item.MinStock !== undefined ? item.MinStock : 0)),
            location: item.location || item.Location || 'Almacén Central',
            unitCost: isNaN(cost) ? 0 : cost,
            condition: item.condition || item.Condition || (cost === 0 ? 'Reusado' : 'Nuevo')
          };
        });
        cachedInventoryList = cleanData;
        setInventory(cleanData);
      } else {
        setInventory([]);
      }
      setLoading(false);
    }).catch(() => {
      if (!cachedInventoryList) setInventory([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ code: '', name: '', description: '', currentStock: 1, minStock: 1, location: 'Almacén Central', unitCost: 0, reason: 'Canibalización' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code, name: item.name, description: item.description || '',
      currentStock: item.currentStock, minStock: item.minStock,
      location: item.location, unitCost: item.unitCost,
      reason: item.condition === 'Reusado' ? 'Canibalización' : 'Compra SAP'
    });
    setShowModal(true);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`¿Eliminar el repuesto [${item.code}] ${item.name}?`)) return;
    try {
      await api.deleteInventoryItem(item.id);
      toast.success(`Repuesto [${item.code}] eliminado exitosamente`);
      loadInventory();
    } catch (err) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const isCannib = formData.reason === 'Canibalización' || formData.reason === 'Hallazgo';
    const cost = isCannib ? 0.00 : (parseFloat(formData.unitCost) || 0);
    const payload = {
      code: formData.code || `CANIB-${Math.floor(Math.random() * 1000)}`,
      name: formData.name || 'Repuesto',
      description: formData.description,
      unitOfMeasure: 'Pieza',
      currentStock: parseFloat(formData.currentStock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      location: formData.location,
      unitCost: cost,
      condition: isCannib ? 'Reusado' : 'Nuevo'
    };
    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, payload);
        toast.success(`Repuesto actualizado exitosamente`);
      } else {
        await api.createInventoryItem(payload);
        toast.success(`Repuesto registrado en inventario (Costo: $${Number(cost).toFixed(2)} USD)`);
      }
      setShowModal(false);
      loadInventory();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const canRegister = currentUser?.role !== 'Operario de Máquina';
  const totalItems = Array.isArray(inventory) ? inventory.length : 0;
  const lowStockCount = Array.isArray(inventory) ? inventory.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length : 0;

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      if (activeConditionFilter === 'Nuevo' && i.condition !== 'Nuevo') return false;
      if (activeConditionFilter === 'Reusado' && i.condition !== 'Reusado') return false;
      if (activeConditionFilter === 'BajoStock' && (i.currentStock || 0) > (i.minStock || 0)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (i.name || '').toLowerCase().includes(q);
        const matchesCode = (i.code || '').toLowerCase().includes(q);
        const matchesLoc = (i.location || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesLoc;
      }
      return true;
    });
  }, [inventory, activeConditionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Almacén & Kardex</h3>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Control de inventario estándar y componentes de <strong className="text-emerald-600 font-semibold">Canibalización</strong> ($0 USD contable)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
            title="Guía Canibalización $0"
          >
            <HelpCircle size={15} className="text-emerald-600 flex-shrink-0" />
            <span className="hidden sm:inline">Guía $0</span>
            <span className="sm:hidden">Guía</span>
          </button>
          <button className="btn btn-secondary text-xs px-2.5 sm:px-3 py-1.5 justify-center flex-shrink-0" onClick={loadInventory} title="Sincronizar Almacén">
            <RefreshCw size={14} /> 
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          {canRegister ? (
            <button className="flex-1 sm:flex-initial btn btn-primary text-xs py-1.5 px-3 justify-center" onClick={openCreate}>
              <Plus size={15} /> 
              <span className="hidden sm:inline">Ingresar Repuesto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          ) : (
            <button className="btn btn-secondary text-xs opacity-50 cursor-not-allowed" disabled title="Bloqueado por RBAC para Operarios">
              Restringido
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card border-l-4 border-l-emerald-500 flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0">
            <Boxes size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Catálogo Almacén</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono">{totalItems} referencias</div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-amber-500 flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Alerta Stock Mínimo</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono">{lowStockCount} bajo mínimo</div>
          </div>
        </div>
      </div>

      {/* Filtros de Tipo y Búsqueda */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xs">
        <div className="pipeline-container">
          <button 
            className={`pipeline-tab text-xs ${activeConditionFilter === 'Todos' ? 'active' : ''}`}
            onClick={() => setActiveConditionFilter('Todos')}
          >
            Todos ({inventory.length})
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeConditionFilter === 'Nuevo' ? 'active' : ''}`}
            onClick={() => setActiveConditionFilter('Nuevo')}
          >
            📦 Nuevos ({inventory.filter(i => i.condition === 'Nuevo').length})
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeConditionFilter === 'Reusado' ? 'active' : ''}`}
            onClick={() => setActiveConditionFilter('Reusado')}
          >
            ♻️ Canibalizados $0 ({inventory.filter(i => i.condition === 'Reusado').length})
          </button>
          <button 
            className={`pipeline-tab text-xs ${activeConditionFilter === 'BajoStock' ? 'active' : ''}`}
            onClick={() => setActiveConditionFilter('BajoStock')}
          >
            ⚠️ Bajo Mínimo ({lowStockCount})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar repuesto, código..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
      </div>

      {loading && !inventory.length ? (
        <TableSkeleton rows={5} cols={8} />
      ) : (
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código / Descripción</th>
                <th>Condición & Origen</th>
                <th>Stock Actual</th>
                <th>Mínimo</th>
                <th>Ubicación</th>
                <th>Costo Unit. USD</th>
                <th>Estado Stock</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    No se encontraron repuestos para el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, idx) => {
                const stock = Number(item.currentStock || 0);
                const min = Number(item.minStock || 0);
                const cost = Number(item.unitCost || 0);
                const isAlert = stock <= min;
                const isReused = item.condition === 'Reusado' || cost === 0;

                return (
                  <tr key={item.id || idx}>
                    <td>
                      <div className="font-bold text-slate-900 text-xs font-mono">[{item.code}] {item.name}</div>
                      <div className="text-xs text-slate-500">{item.description || 'Sin descripción'}</div>
                    </td>
                    <td>
                      {isReused ? (
                        <span className="badge badge-success text-[11px]" title="No altera costos contables">♻️ Canibalizado $0</span>
                      ) : (
                        <span className="badge badge-info text-[11px]">📦 Compra SAP</span>
                      )}
                    </td>
                    <td className="font-bold text-xs text-slate-900 font-mono">{stock} {item.unitOfMeasure || 'Pieza'}s</td>
                    <td className="text-xs text-slate-500 font-mono">{min}</td>
                    <td><span className="badge badge-mono text-[11px]">{item.location}</span></td>
                    <td className={`font-semibold text-xs font-mono ${isReused ? 'text-emerald-600' : 'text-slate-900'}`}>
                      ${Number(cost).toFixed(2)}
                      {isReused && <span className="block text-[10px] text-emerald-600 font-bold">CECO: $0</span>}
                    </td>
                    <td>
                      {isAlert ? (
                        <span className="badge badge-warning text-[11px]">⚠️ Comprar</span>
                      ) : (
                        <span className="badge badge-success text-[11px]"><CheckCircle2 size={11} /> Normal</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1.5">
                        <button className="btn btn-secondary text-xs p-1" onClick={() => openEdit(item)} title="Editar">
                          <Edit3 size={13} />
                        </button>
                        <button className="btn btn-secondary text-xs p-1 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDeleteItem(item)} title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingItem ? `Editar Repuesto: ${editingItem.code}` : 'Ingreso de Repuesto / Canibalización'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 text-xs text-emerald-800 leading-relaxed">
              ℹ️ Al seleccionar <strong>Canibalización</strong> o <strong>Hallazgo</strong>, el costo del repuesto se fijará automáticamente en <strong>$0.00 USD</strong> para preservar los balances contables en SAP.
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de Ingreso</label>
                <select 
                  className="form-select text-xs" 
                  value={formData.reason} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, reason: val, unitCost: (val === 'Canibalización' || val === 'Hallazgo') ? 0 : formData.unitCost });
                  }}
                >
                  <option value="Canibalización">♻️ Canibalización (Retirado de máquina) - $0 USD</option>
                  <option value="Hallazgo">🔍 Hallazgo en Taller / Residual - $0 USD</option>
                  <option value="Compra SAP">📦 Compra / Recepción Oficial SAP</option>
                  <option value="Ajuste">⚙️ Ajuste de Inventario positivo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código</label>
                  <input className="form-input text-xs" placeholder="REP-CANIB-99" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="form-group mb-0 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Repuesto *</label>
                  <input className="form-input text-xs" required placeholder="Motor Neumático Recondicionado" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción / Origen</label>
                <input className="form-input text-xs" placeholder="Retirado de cinta Línea 1" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad *</label>
                  <input type="number" min="1" className="form-input text-xs" required value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                  <input type="number" min="0" className="form-input text-xs" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Unit. USD</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input text-xs" 
                    disabled={formData.reason === 'Canibalización' || formData.reason === 'Hallazgo'} 
                    value={formData.unitCost} 
                    onChange={e => setFormData({...formData, unitCost: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ubicación</label>
                <input className="form-input text-xs" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center">
                  {editingItem ? 'Guardar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ayuda & SOP */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} initialModule="inventory" />
    </div>
  );
}
