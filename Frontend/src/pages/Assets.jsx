import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { 
  Wrench, FileText, Plus, CheckCircle2, AlertOctagon, Layers, 
  Edit3, Trash2, Search, UploadCloud, Download, ExternalLink, 
  Paperclip, Loader2, Image as ImageIcon, QrCode, MapPin, Printer,
  Filter, X, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';
import ModalPortal from '../components/UI/ModalPortal';
import AssetQRModal from '../components/AssetQRModal';

// Caché en cliente para carga instantánea
let cachedAssetsList = null;

export default function Assets({ currentUser }) {
  const [assets, setAssets] = useState(cachedAssetsList || []);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(!cachedAssetsList);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [qrModalAsset, setQrModalAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    brand: 'ALL',
    costCenter: 'ALL',
    category: 'ALL',
    location: 'ALL'
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const [newAsset, setNewAsset] = useState({ 
    code: '', 
    name: '', 
    brand: '', 
    model: '', 
    serialNumber: '', 
    status: 'Operativo', 
    areaId: '', 
    categoryId: '',
    locationId: '',
    imageUrl: ''
  });

  // Estado de Archivos Adjuntos (Azure Blob Storage)
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);

  const loadAssets = (silent = false) => {
    if (!silent && !cachedAssetsList) setLoading(true);
    Promise.all([
      api.getAssets(),
      api.getAreas(),
      api.getCategories(),
      api.getLocations ? api.getLocations() : api.getCatalogLocations()
    ]).then(([data, areasData, catsData, locsData]) => {
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
          locationId: a.locationId || a.LocationId || '',
          locationName: a.locationName || a.LocationName || a.Location || 'Sin Ubicación asignada',
          acquisitionDate: a.acquisitionDate || a.AcquisitionDate || '',
          status: a.status || a.Status || 'Operativo',
          imageUrl: a.imageUrl || a.ImageUrl || ''
        }));
        cachedAssetsList = clean;
        setAssets(clean);
      }
      if (Array.isArray(areasData)) setAreas(areasData);
      if (Array.isArray(catsData)) setCategories(catsData);
      if (Array.isArray(locsData)) setLocations(locsData);
      setLoading(false);
    }).catch(() => {
      if (!cachedAssetsList) setAssets([]);
      setLoading(false);
    });
  };

  useEffect(() => { loadAssets(); }, []);

  // Consultar adjuntos reales de Azure Blob Storage al seleccionar un activo
  const loadAttachments = (assetId) => {
    setLoadingAttachments(true);
    api.getAttachments('Asset', assetId)
      .then(res => setAttachments(Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])))
      .catch(() => setAttachments([]))
      .finally(() => setLoadingAttachments(false));
  };

  useEffect(() => {
    if (selectedAsset?.id) {
      loadAttachments(selectedAsset.id);
    } else {
      setAttachments([]);
    }
  }, [selectedAsset]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAsset) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo excede los 50MB permitidos');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'Asset');
    formData.append('entityId', selectedAsset.id);

    setUploadingAttachment(true);
    const toastId = toast.loading(`Subiendo "${file.name}" a Azure Blob Storage...`);
    try {
      await api.uploadAttachment(formData);
      toast.success(`Archivo guardado exitosamente en Azure Blob Storage`, { id: toastId });
      loadAttachments(selectedAsset.id);
    } catch (err) {
      toast.error(`Error al subir a Azure: ${err.response?.data?.details || err.message}`, { id: toastId });
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAssetImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Seleccione un archivo de imagen válido (.png, .jpg, .jpeg, .webp)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 15MB');
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading('Subiendo fotografía a Azure Blob Storage...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'AssetImage');
      formData.append('entityId', editingAsset?.id || 0);

      const res = await api.uploadAttachment(formData);
      const url = res?.blobUrl || res?.data?.blobUrl;
      if (url) {
        setNewAsset(prev => ({ ...prev, imageUrl: url }));
        toast.success('Fotografía subida a Azure exitosamente', { id: toastId });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setNewAsset(prev => ({ ...prev, imageUrl: reader.result }));
          toast.success('Imagen cargada en el formulario', { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewAsset(prev => ({ ...prev, imageUrl: reader.result }));
        toast.success('Imagen cargada en el formulario', { id: toastId });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId, fileName) => {
    if (!window.confirm(`¿Deseas desvincular el archivo "${fileName}"?`)) return;
    try {
      await api.deleteAttachment(attachmentId);
      toast.success('Archivo desvinculado de la máquina');
      loadAttachments(selectedAsset.id);
    } catch (err) {
      toast.error('Error al desvincular archivo');
    }
  };

  const openCreate = () => {
    setEditingAsset(null);
    setNewAsset({ 
      code: '', 
      name: '', 
      brand: '', 
      model: '', 
      serialNumber: '', 
      status: 'Operativo', 
      areaId: areas[0]?.Id || areas[0]?.id || '', 
      categoryId: categories[0]?.Id || categories[0]?.id || '',
      locationId: locations[0]?.Id || locations[0]?.id || '',
      imageUrl: ''
    });
    setShowCreateModal(true);
  };

  const openEdit = (a) => {
    setEditingAsset(a);
    setNewAsset({ 
      code: a.code, 
      name: a.name, 
      brand: a.brand, 
      model: a.model, 
      serialNumber: a.serialNumber, 
      status: a.status, 
      areaId: a.areaId, 
      categoryId: a.categoryId,
      locationId: a.locationId || '',
      imageUrl: a.imageUrl || ''
    });
    setShowCreateModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, newAsset);
        toast.success(`Activo "${newAsset.name}" actualizado exitosamente`);
        setShowCreateModal(false);
      } else {
        const res = await api.createAsset(newAsset);
        const createdCode = res?.code || newAsset.code;
        toast.success(`Activo "${newAsset.name}" registrado exitosamente`);
        setShowCreateModal(false);
        // Abrir inmediatamente la ventana de impresión de QR que se pegará en la máquina
        const matchedArea = areas.find(a => String(a.Id || a.id) === String(newAsset.areaId));
        const matchedLoc = locations.find(l => String(l.Id || l.id) === String(newAsset.locationId));
        setQrModalAsset({
          ...newAsset,
          id: res?.id,
          code: createdCode,
          areaName: matchedArea?.Name || 'Planta',
          costCenterCode: matchedArea?.CostCenterCode || 'CECO',
          locationName: matchedLoc?.Name || 'Planta'
        });
      }
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

  // Opciones dinámicas con conteo de activos
  const filterOptions = useMemo(() => {
    const brandCounts = {};
    const cecoCounts = {};
    const categoryCounts = {};
    const locationCounts = {};

    assets.forEach(a => {
      // Marca
      if (a.brand && a.brand.trim()) {
        const b = a.brand.trim();
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
      // CECO
      if (a.costCenterCode && a.costCenterCode.trim()) {
        const c = a.costCenterCode.trim();
        cecoCounts[c] = (cecoCounts[c] || 0) + 1;
      }
      // Categoría
      const catKey = a.categoryId ? String(a.categoryId) : (a.categoryName || 'Sin Categoría');
      const catLabel = a.categoryName || 'Sin Categoría';
      if (!categoryCounts[catKey]) {
        categoryCounts[catKey] = { id: catKey, name: catLabel, count: 0 };
      }
      categoryCounts[catKey].count += 1;

      // Ubicación
      const locKey = a.locationId ? String(a.locationId) : 'UNASSIGNED';
      const locLabel = a.locationId ? (a.locationName || 'Ubicación asignada') : 'Sin Ubicación asignada';
      if (!locationCounts[locKey]) {
        locationCounts[locKey] = { id: locKey, name: locLabel, count: 0 };
      }
      locationCounts[locKey].count += 1;
    });

    return {
      brands: Object.entries(brandCounts)
        .map(([name, count]) => ({ id: name, name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      cecos: Object.entries(cecoCounts)
        .map(([code, count]) => ({ id: code, name: code, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      categories: Object.values(categoryCounts)
        .sort((a, b) => a.name.localeCompare(b.name)),
      locations: Object.values(locationCounts)
        .sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [assets]);

  const handleClearFilters = () => {
    setFilters({
      brand: 'ALL',
      costCenter: 'ALL',
      category: 'ALL',
      location: 'ALL'
    });
    setSearchQuery('');
  };

  const activeFiltersCount = (filters.brand !== 'ALL' ? 1 : 0) +
    (filters.costCenter !== 'ALL' ? 1 : 0) +
    (filters.category !== 'ALL' ? 1 : 0) +
    (filters.location !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      // Texto de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = (
          (a.name || '').toLowerCase().includes(q) ||
          (a.code || '').toLowerCase().includes(q) ||
          (a.areaName || '').toLowerCase().includes(q) ||
          (a.costCenterCode || '').toLowerCase().includes(q) ||
          (a.brand || '').toLowerCase().includes(q) ||
          (a.categoryName || '').toLowerCase().includes(q) ||
          (a.locationName || '').toLowerCase().includes(q)
        );
        if (!match) return false;
      }

      // Filtro Marca
      if (filters.brand !== 'ALL' && a.brand?.trim() !== filters.brand) {
        return false;
      }

      // Filtro CECO
      if (filters.costCenter !== 'ALL' && a.costCenterCode?.trim() !== filters.costCenter) {
        return false;
      }

      // Filtro Categoría
      if (filters.category !== 'ALL') {
        const catKey = a.categoryId ? String(a.categoryId) : (a.categoryName || 'Sin Categoría');
        if (catKey !== String(filters.category)) return false;
      }

      // Filtro Ubicación
      if (filters.location !== 'ALL') {
        const locKey = a.locationId ? String(a.locationId) : 'UNASSIGNED';
        if (locKey !== String(filters.location)) return false;
      }

      return true;
    });
  }, [assets, searchQuery, filters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Activos Industriales & CECOs</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Jerarquía de costos: Planta Industrial → Áreas de Producción → Equipos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar máquina, código o CECO..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>
          <button className="btn btn-primary text-xs flex-shrink-0" onClick={openCreate}>
            <Plus size={15} /> 
            <span className="hidden sm:inline">Registrar Activo</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Dinámicos (Opción 1: Marca, CECO, Categoría, Ubicación) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-1">
            <Filter size={13} className="text-slate-700 dark:text-slate-300" />
            <span>Filtros:</span>
          </span>

          {/* Filtro: Marca */}
          <div className="flex-1 min-w-[135px] sm:min-w-[145px]">
            <div className="relative">
              <select
                value={filters.brand}
                onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                className={`w-full pl-2.5 pr-7 py-1.5 text-xs rounded-lg font-medium border transition-colors cursor-pointer appearance-none truncate ${
                  filters.brand !== 'ALL' 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-semibold' 
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="ALL">🏷️ Marca: Todas ({filterOptions.brands.reduce((acc, b) => acc + b.count, 0)})</option>
                {filterOptions.brands.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Filtro: CECO */}
          <div className="flex-1 min-w-[135px] sm:min-w-[145px]">
            <div className="relative">
              <select
                value={filters.costCenter}
                onChange={(e) => setFilters(prev => ({ ...prev, costCenter: e.target.value }))}
                className={`w-full pl-2.5 pr-7 py-1.5 text-xs rounded-lg font-medium border transition-colors cursor-pointer appearance-none truncate ${
                  filters.costCenter !== 'ALL' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold' 
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="ALL">🏢 CECO: Todos ({filterOptions.cecos.reduce((acc, c) => acc + c.count, 0)})</option>
                {filterOptions.cecos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Filtro: Categoría */}
          <div className="flex-1 min-w-[135px] sm:min-w-[145px]">
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full pl-2.5 pr-7 py-1.5 text-xs rounded-lg font-medium border transition-colors cursor-pointer appearance-none truncate ${
                  filters.category !== 'ALL' 
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-semibold' 
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="ALL">⚙️ Categoría: Todas ({assets.length})</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Filtro: Ubicación */}
          <div className="flex-1 min-w-[135px] sm:min-w-[145px]">
            <div className="relative">
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className={`w-full pl-2.5 pr-7 py-1.5 text-xs rounded-lg font-medium border transition-colors cursor-pointer appearance-none truncate ${
                  filters.location !== 'ALL' 
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold' 
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <option value="ALL">📍 Ubicación: Todas ({assets.length})</option>
                {filterOptions.locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Botón rápido limpiar si hay filtros activos */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              title="Restablecer filtros"
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>

        {/* Fila de Chips Activos y Contador */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              Mostrando <strong className="text-slate-900 dark:text-slate-100">{filteredAssets.length}</strong> de {assets.length} activos
            </span>

            {/* Chip de Búsqueda de Texto */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                Texto: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5" title="Quitar búsqueda">
                  <X size={11} />
                </button>
              </span>
            )}

            {/* Chip de Marca */}
            {filters.brand !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800">
                Marca: {filters.brand}
                <button onClick={() => setFilters(p => ({ ...p, brand: 'ALL' }))} className="hover:text-blue-900 dark:hover:text-white cursor-pointer ml-0.5" title="Quitar filtro">
                  <X size={11} />
                </button>
              </span>
            )}

            {/* Chip de CECO */}
            {filters.costCenter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                CECO: {filters.costCenter}
                <button onClick={() => setFilters(p => ({ ...p, costCenter: 'ALL' }))} className="hover:text-emerald-900 dark:hover:text-white cursor-pointer ml-0.5" title="Quitar filtro">
                  <X size={11} />
                </button>
              </span>
            )}

            {/* Chip de Categoría */}
            {filters.category !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200 dark:border-purple-800">
                Categoría: {filterOptions.categories.find(c => String(c.id) === String(filters.category))?.name || filters.category}
                <button onClick={() => setFilters(p => ({ ...p, category: 'ALL' }))} className="hover:text-purple-900 dark:hover:text-white cursor-pointer ml-0.5" title="Quitar filtro">
                  <X size={11} />
                </button>
              </span>
            )}

            {/* Chip de Ubicación */}
            {filters.location !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-800">
                Ubicación: {filterOptions.locations.find(l => String(l.id) === String(filters.location))?.name || filters.location}
                <button onClick={() => setFilters(p => ({ ...p, location: 'ALL' }))} className="hover:text-amber-950 dark:hover:text-white cursor-pointer ml-0.5" title="Quitar filtro">
                  <X size={11} />
                </button>
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button 
              onClick={handleClearFilters}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Borrar todos los filtros
            </button>
          )}
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
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-lg mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3.5 text-slate-400">
            <Filter size={22} />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-1">No se encontraron activos</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            No hay ninguna máquina que coincida con los filtros seleccionados o el término de búsqueda.
          </p>
          <button 
            onClick={handleClearFilters}
            className="btn btn-secondary text-xs inline-flex items-center gap-1.5 px-3 py-1.5 mx-auto"
          >
            <RotateCcw size={13} />
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredAssets.map((a, idx) => (
          <div key={a.id || idx} className="stat-card flex flex-col p-0 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="h-44 w-full relative bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
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
              <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono shadow-xs">
                {a.costCenterCode}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">{a.categoryName}</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 mb-2 leading-tight">
                [{a.code}] {a.name}
              </h4>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4 leading-relaxed">
                <div><strong className="text-slate-700 dark:text-slate-300">Área:</strong> {a.areaName}</div>
                <div className="flex items-center gap-1">
                  <strong className="text-slate-700 dark:text-slate-300">Ubicación:</strong> 
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <MapPin size={11} className="text-amber-600 dark:text-amber-400" />
                    {a.locationName || 'Sin asignar'}
                  </span>
                </div>
                <div><strong className="text-slate-700 dark:text-slate-300">Marca / Modelo:</strong> {a.brand || '—'} {a.model || ''}</div>
                <div><strong className="text-slate-700 dark:text-slate-300">Num. Serie:</strong> <span className="font-mono">{a.serialNumber || '—'}</span></div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <button className="btn btn-secondary flex-1 text-xs py-1.5" onClick={() => setSelectedAsset(a)}>
                  <FileText size={14} /> 
                  <span className="hidden sm:inline">Ficha Técnica</span>
                  <span className="sm:hidden">Ficha</span>
                </button>
                <button 
                  className="btn btn-secondary text-xs p-1.5 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200" 
                  onClick={() => setQrModalAsset(a)} 
                  title="Generar / Imprimir Código QR para la máquina"
                >
                  <QrCode size={14} />
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
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Ficha Técnica y Hoja de Vida</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">[{selectedAsset.code}] {selectedAsset.name} • {selectedAsset.costCenterCode}</p>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
              </div>

              {/* Imagen del activo si está disponible */}
              {selectedAsset.imageUrl && (
                <div className="mb-3 h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img 
                    src={selectedAsset.imageUrl} 
                    alt={selectedAsset.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display='none'; }}
                  />
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div><span className="text-slate-500 dark:text-slate-400">Marca:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedAsset.brand || '—'}</strong></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Modelo:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedAsset.model || '—'}</strong></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Num. Serie:</span> <strong className="text-slate-900 dark:text-slate-100 font-mono">{selectedAsset.serialNumber || '—'}</strong></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Adquisición:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedAsset.acquisitionDate || 'N/A'}</strong></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Área Planta:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedAsset.areaName}</strong></div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Ubicación:</span>{' '}
                    <strong className="text-slate-900 dark:text-slate-100 inline-flex items-center gap-1">
                      <MapPin size={11} className="text-amber-600 dark:text-amber-400" />
                      {selectedAsset.locationName || 'Sin asignar'}
                    </strong>
                  </div>
                  <div><span className="text-slate-500 dark:text-slate-400">Estado Actual:</span> <span className="badge badge-success ml-1">{selectedAsset.status}</span></div>
                </div>
              </div>
              {/* Sección de Documentos y Planos en Azure Blob Storage */}
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>Planos & Manuales (Azure Blob Storage)</span>
                  {attachments.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ml-1">
                      {attachments.length}
                    </span>
                  )}
                </h4>

                <div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadingAttachment} 
                    className="btn btn-primary text-xs py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    {uploadingAttachment ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Subiendo a Azure...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={13} />
                        <span>Subir Archivo</span>
                      </>
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.webp" 
                  />
                </div>
              </div>

              {loadingAttachments ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                  <Loader2 size={16} className="animate-spin mx-auto mb-1 text-slate-400" />
                  <span>Consultando Azure Blob Storage...</span>
                </div>
              ) : attachments.length === 0 ? (
                <div className="p-4 text-center bg-slate-50/80 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 mb-4">
                  <Paperclip size={20} className="mx-auto mb-1.5 text-slate-400 opacity-60" />
                  <p className="font-semibold text-slate-700 mb-0.5">Sin archivos adjuntos aún</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-2">
                    Puedes adjuntar manuales de operación en PDF, planos mecánicos DWG o fotos de placa directamente a Azure Blob Storage.
                  </p>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()} 
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    + Adjuntar primer archivo a Azure
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
                  {attachments.map(att => {
                    const ext = att.fileName?.split('.').pop()?.toLowerCase() || '';
                    const isPdf = ext === 'pdf';
                    const isImg = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
                    const isCad = ['dwg', 'dxf'].includes(ext);

                    return (
                      <div key={att.id} className="flex items-center justify-between p-2 sm:p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-xs gap-2 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf ? 'bg-red-50 text-red-600' : (isImg ? 'bg-blue-50 text-blue-600' : (isCad ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'))
                          }`}>
                            {isPdf ? <FileText size={14} /> : (isImg ? <ImageIcon size={14} /> : (isCad ? <Layers size={14} /> : <Paperclip size={14} />))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-800 truncate block text-xs" title={att.fileName}>
                              {att.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {att.uploadedAt ? new Date(att.uploadedAt).toLocaleString('es-PE') : 'Azure Blob'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a 
                            href={att.blobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download={att.fileName}
                            className="btn btn-secondary text-[11px] py-1 px-2 flex items-center gap-1 hover:text-blue-700"
                            title="Descargar o abrir en pestaña nueva"
                          >
                            <ExternalLink size={12} />
                            <span className="hidden sm:inline">Ver / Bajar</span>
                          </a>
                          <button 
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id, att.fileName)} 
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Desvincular archivo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <button 
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-indigo-700 hover:bg-indigo-50" 
                  onClick={() => setQrModalAsset(selectedAsset)}
                >
                  <QrCode size={14} /> <span>Etiqueta QR</span>
                </button>
                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary text-xs py-1.5 px-3" onClick={() => setSelectedAsset(null)}>Cerrar</button>
                  <button className="btn btn-primary text-xs py-1.5 px-4" onClick={() => { const a = selectedAsset; setSelectedAsset(null); openEdit(a); }}>
                    <Wrench size={14} /> <span>Editar Activo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Crear / Editar Activo */}
      {showCreateModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingAsset ? `Editar Activo: ${editingAsset.code}` : 'Registrar Nuevo Activo'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-3">
              {/* Sección de Imagen del Activo */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Fotografía de la Máquina</label>
                  {newAsset.imageUrl && (
                    <button 
                      type="button" 
                      onClick={() => setNewAsset({ ...newAsset, imageUrl: '' })}
                      className="text-[11px] text-red-600 hover:underline font-medium"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                    {newAsset.imageUrl ? (
                      <img src={newAsset.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                      >
                        {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                        <span>{newAsset.imageUrl ? 'Cambiar Foto' : 'Subir Imagen'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        onChange={handleAssetImageUpload} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                      />
                      <span className="text-[10px] text-slate-400">JPG, PNG o WebP</span>
                    </div>

                    <input
                      type="url"
                      placeholder="O escribe/pega la URL de la imagen (https://...)"
                      value={newAsset.imageUrl}
                      onChange={e => setNewAsset({ ...newAsset, imageUrl: e.target.value })}
                      className="form-input text-xs py-1"
                    />
                  </div>
                </div>
              </div>

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ubicación Física (Planta)</label>
                  <select className="form-select text-xs" value={newAsset.locationId} onChange={e => setNewAsset({...newAsset, locationId: e.target.value})}>
                    <option value="">— Seleccionar Ubicación —</option>
                    {locations.map(l => (
                      <option key={l.Id || l.id} value={l.Id || l.id}>
                        {l.Name || l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Serie</label>
                  <input className="form-input text-xs" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} placeholder="SN-XXXXXX" />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado Operativo</label>
                <select className="form-select text-xs" value={newAsset.status} onChange={e => setNewAsset({...newAsset, status: e.target.value})}>
                  <option value="Operativo">✅ Operativo</option>
                  <option value="En Mantenimiento">🔧 En Mantenimiento</option>
                  <option value="Fuera de Servicio">❌ Fuera de Servicio</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center">
                  {editingAsset ? 'Guardar Cambios' : 'Registrar Activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Modal Generar / Imprimir Código QR */}
      {qrModalAsset && (
        <AssetQRModal 
          asset={qrModalAsset} 
          onClose={() => setQrModalAsset(null)} 
        />
      )}
    </div>
  );
}
