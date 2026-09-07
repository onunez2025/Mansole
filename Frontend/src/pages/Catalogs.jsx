import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Layers, 
  FolderTree, 
  Coins, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  X,
  Building2,
  Tag,
  Factory
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import HelpModal from '../components/HelpModal';

export default function Catalogs({ currentUser }) {
  const [activeTab, setActiveTab] = useState('areas');
  const [showHelp, setShowHelp] = useState(false);
  
  // Datos
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [areaForm, setAreaForm] = useState({ name: '', costCenterCode: 'CECO-SOL-101', description: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [cecoForm, setCecoForm] = useState({ ceCoste: '', ceCosteDescripcion: '', gerencia: 'G. Producción', area: 'Producción', responsable: '', observaciones: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [areasRes, catsRes, cecoRes] = await Promise.all([
        api.getCatalogAreas(),
        api.getCatalogCategories(),
        api.getCatalogCostCenters()
      ]);
      setAreas(Array.isArray(areasRes) ? areasRes : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setCostCenters(Array.isArray(cecoRes) ? cecoRes : []);
    } catch (err) {
      toast.error('Error cargando catálogos de Azure SQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers Áreas ---
  const handleOpenAreaModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setAreaForm({ name: item.Name || '', costCenterCode: item.CostCenterCode || '', description: item.Description || '' });
    } else {
      setAreaForm({ name: '', costCenterCode: 'CECO-SOL-101', description: '' });
    }
    setShowModal(true);
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateCatalogArea(editingItem.Id, areaForm);
        toast.success('Área actualizada exitosamente');
      } else {
        await api.createCatalogArea(areaForm);
        toast.success('Área registrada exitosamente');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar área');
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta área?')) return;
    try {
      await api.deleteCatalogArea(id);
      toast.success('Área eliminada');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el área');
    }
  };

  // --- Handlers Categorías ---
  const handleOpenCatModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setCatForm({ name: item.Name || '', description: item.Description || '' });
    } else {
      setCatForm({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateCatalogCategory(editingItem.Id, catForm);
        toast.success('Categoría actualizada');
      } else {
        await api.createCatalogCategory(catForm);
        toast.success('Categoría registrada');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar categoría');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await api.deleteCatalogCategory(id);
      toast.success('Categoría eliminada');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar la categoría');
    }
  };

  // --- Handlers Centros de Costos ---
  const handleOpenCecoModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setCecoForm({
        ceCoste: item.CeCoste || '',
        ceCosteDescripcion: item.CeCosteDescripcion || '',
        gerencia: item.Gerencia || 'G. Producción',
        area: item.Area || 'Producción',
        responsable: item.Responsable || '',
        observaciones: item.Observaciones || ''
      });
    } else {
      setCecoForm({ ceCoste: '', ceCosteDescripcion: '', gerencia: 'G. Producción', area: 'Producción', responsable: '', observaciones: '' });
    }
    setShowModal(true);
  };

  const handleSaveCeco = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateCatalogCostCenter(editingItem.CeCoste, cecoForm);
        toast.success('Centro de costo actualizado');
      } else {
        await api.createCatalogCostCenter(cecoForm);
        toast.success('Centro de costo registrado');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar CECO');
    }
  };

  const handleDeleteCeco = async (code) => {
    if (!window.confirm(`¿Estás seguro de eliminar el CECO ${code}?`)) return;
    try {
      await api.deleteCatalogCostCenter(code);
      toast.success('Centro de costo eliminado');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el CECO');
    }
  };

  // Filtros
  const filteredAreas = areas.filter(a => 
    (a.Name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.CostCenterCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredCats = categories.filter(c => 
    (c.Name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.Description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredCecos = costCenters.filter(c => 
    (c.CeCoste || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.CeCosteDescripcion || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.Responsable || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header con botón de ayuda */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Administración Central
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-slate-900 flex-shrink-0" size={20} />
            <span>Configuración de Catálogos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 hidden sm:block">
            Gobierna las tablas base del CMMS en Azure SQL: Áreas de Planta, Familias de Maquinaria y Centros de Costos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setShowHelp(true)}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
            title="Guía SOP Catálogos"
          >
            <HelpCircle size={15} className="text-blue-600 flex-shrink-0" />
            <span className="hidden sm:inline">Guía SOP</span>
            <span className="sm:hidden">Guía</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'areas') handleOpenAreaModal();
              if (activeTab === 'categories') handleOpenCatModal();
              if (activeTab === 'cecos') handleOpenCecoModal();
            }}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">
              {activeTab === 'areas' && 'Nueva Área'}
              {activeTab === 'categories' && 'Nueva Categoría'}
              {activeTab === 'cecos' && 'Nuevo CECO'}
            </span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Tabs y Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => { setActiveTab('areas'); setSearch(''); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'areas' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Factory size={14} />
            <span>Áreas ({areas.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setSearch(''); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'categories' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag size={14} />
            <span>Categorías ({categories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('cecos'); setSearch(''); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'cecos' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={14} />
            <span>CECOs ({costCenters.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en el catálogo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>
      </div>

      {/* Contenido de la Tabla según Tab Activo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Cargando datos desde Azure SQL...
          </div>
        ) : (
          <>
            {/* TAB 1: ÁREAS */}
            {activeTab === 'areas' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="p-4">ID</th>
                      <th className="p-4">Nombre del Área</th>
                      <th className="p-4">Centro de Costo (CECO)</th>
                      <th className="p-4">Descripción de Planta</th>
                      <th className="p-4">Máquinas Asignadas</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAreas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No se encontraron áreas registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredAreas.map((area) => (
                        <tr key={area.Id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-400">#{area.Id}</td>
                          <td className="p-4 font-semibold text-slate-900">{area.Name}</td>
                          <td className="p-4">
                            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {area.CostCenterCode || 'Sin CECO'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 max-w-md truncate">{area.Description || '—'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {area.AssetCount || 0} equipos
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenAreaModal(area)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Editar Área"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteArea(area.Id)}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Eliminar Área"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: CATEGORÍAS */}
            {activeTab === 'categories' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="p-4">ID</th>
                      <th className="p-4">Familia / Categoría</th>
                      <th className="p-4">Descripción Técnica</th>
                      <th className="p-4">Activos Vinculados</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No se encontraron categorías registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredCats.map((cat) => (
                        <tr key={cat.Id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-400">#{cat.Id}</td>
                          <td className="p-4 font-semibold text-slate-900">{cat.Name}</td>
                          <td className="p-4 text-slate-500 max-w-md truncate">{cat.Description || '—'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {cat.AssetCount || 0} activos
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenCatModal(cat)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Editar Categoría"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.Id)}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Eliminar Categoría"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: CENTROS DE COSTO */}
            {activeTab === 'cecos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Código CECO</th>
                      <th className="p-4">Descripción del Centro</th>
                      <th className="p-4">Gerencia</th>
                      <th className="p-4">Área Operativa</th>
                      <th className="p-4">Responsable</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCecos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No se encontraron centros de costo.
                        </td>
                      </tr>
                    ) : (
                      filteredCecos.map((ceco) => (
                        <tr key={ceco.CeCoste} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {ceco.CeCoste}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{ceco.CeCosteDescripcion}</td>
                          <td className="p-4 text-slate-600">{ceco.Gerencia || '—'}</td>
                          <td className="p-4 text-slate-600">{ceco.Area || '—'}</td>
                          <td className="p-4 text-slate-700 font-medium">{ceco.Responsable || '—'}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenCecoModal(ceco)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Editar CECO"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCeco(ceco.CeCoste)}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Eliminar CECO"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Editar Registro' : 'Registrar Nuevo Elemento'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={17} />
              </button>
            </div>

            {/* Formulario Área */}
            {activeTab === 'areas' && (
              <form onSubmit={handleSaveArea} className="space-y-3 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre del Área</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Área de Ensamble y Calidad"
                    value={areaForm.name}
                    onChange={e => setAreaForm({ ...areaForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Código Centro de Costo (CECO)</label>
                  <select
                    value={areaForm.costCenterCode}
                    onChange={e => setAreaForm({ ...areaForm, costCenterCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  >
                    {costCenters.map(c => (
                      <option key={c.CeCoste} value={c.CeCoste}>
                        {c.CeCoste} — {c.CeCosteDescripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles de la ubicación o línea de producción..."
                    value={areaForm.description}
                    onChange={e => setAreaForm({ ...areaForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex-1 sm:flex-initial text-center">Cancelar</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex-1 sm:flex-initial text-center">Guardar</button>
                </div>
              </form>
            )}

            {/* Formulario Categoría */}
            {activeTab === 'categories' && (
              <form onSubmit={handleSaveCategory} className="space-y-3 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre de la Categoría</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hornos Eléctricos y a Gas"
                    value={catForm.name}
                    onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Descripción Técnica</label>
                  <textarea
                    rows={2}
                    placeholder="Equipos comprendidos y características..."
                    value={catForm.description}
                    onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex-1 sm:flex-initial text-center">Cancelar</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex-1 sm:flex-initial text-center">Guardar</button>
                </div>
              </form>
            )}

            {/* Formulario Centro de Costos */}
            {activeTab === 'cecos' && (
              <form onSubmit={handleSaveCeco} className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Código CECO</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingItem}
                      placeholder="Ej. MT010199"
                      value={cecoForm.ceCoste}
                      onChange={e => setCecoForm({ ...cecoForm, ceCoste: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Gerencia</label>
                    <input
                      type="text"
                      value={cecoForm.gerencia}
                      onChange={e => setCecoForm({ ...cecoForm, gerencia: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Descripción del Centro</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Línea Soldadura Automática Termos"
                    value={cecoForm.ceCosteDescripcion}
                    onChange={e => setCecoForm({ ...cecoForm, ceCosteDescripcion: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Responsable</label>
                  <input
                    type="text"
                    placeholder="Nombre del jefe de línea..."
                    value={cecoForm.responsable}
                    onChange={e => setCecoForm({ ...cecoForm, responsable: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex-1 sm:flex-initial text-center">Cancelar</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex-1 sm:flex-initial text-center">Guardar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ayuda Contextual */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} initialModule="catalogs" />
    </div>
  );
}
