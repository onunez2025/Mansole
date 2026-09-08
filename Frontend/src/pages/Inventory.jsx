import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Boxes, AlertCircle, Plus, RefreshCw, CheckCircle2, Edit3, Trash2, 
  Search, HelpCircle, ArrowDownLeft, ArrowUpRight, History, PackagePlus, 
  FileText, Calendar, DollarSign, UserCheck, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/UI';
import HelpModal from '../components/HelpModal';
import ModalPortal from '../components/UI/ModalPortal';

// Caché en cliente para transiciones instantáneas
let cachedInventoryList = null;
let cachedTransactionsList = null;

export default function Inventory({ currentUser }) {
  // Pestaña activa: 'catalogo' | 'entradas' | 'salidas' | 'kardex'
  const [activeTab, setActiveTab] = useState('catalogo');

  // Datos
  const [inventory, setInventory] = useState(cachedInventoryList || []);
  const [transactions, setTransactions] = useState(cachedTransactionsList || []);
  const [loading, setLoading] = useState(!cachedInventoryList);

  // Búsquedas y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConditionFilter, setActiveConditionFilter] = useState('Todos');

  // Modales
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Formularios
  const [catalogFormData, setCatalogFormData] = useState({
    code: '', name: '', description: '', unitOfMeasure: 'Pieza', minStock: 2, location: 'Almacén Central', condition: 'Nuevo'
  });

  const [entryFormData, setEntryFormData] = useState({
    mode: 'existing', // 'existing' o 'new'
    sparePartId: '',
    code: '',
    name: '',
    description: '',
    unitOfMeasure: 'Pieza',
    location: 'Almacén Central',
    minStock: 2,
    reason: 'Compra SAP',
    reference: '',
    quantity: 1,
    unitCost: 10
  });

  const [exitFormData, setExitFormData] = useState({
    sparePartId: '',
    reason: 'Consumo Taller / Emergencia',
    reference: '',
    quantity: 1
  });

  // Carga simultánea de catálogo y transacciones
  const loadData = async (silent = false) => {
    if (!silent && !cachedInventoryList) setLoading(true);
    try {
      const [invData, txData] = await Promise.all([
        api.getInventory(),
        api.getInventoryTransactions()
      ]);

      if (Array.isArray(invData)) {
        const cleanInv = invData.map((item, i) => {
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
        cachedInventoryList = cleanInv;
        setInventory(cleanInv);
      }

      if (Array.isArray(txData)) {
        cachedTransactionsList = txData;
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
      toast.error('No se pudo sincronizar el almacén con Azure SQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Métricas calculadas
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length;
  const entriesList = useMemo(() => transactions.filter(t => t.transactionType === 'IN'), [transactions]);
  const exitsList = useMemo(() => transactions.filter(t => t.transactionType === 'OUT'), [transactions]);

  // Filtros del Catálogo
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

  // Filtros de Entradas
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entriesList;
    const q = searchQuery.toLowerCase();
    return entriesList.filter(e => 
      (e.sparePartName || '').toLowerCase().includes(q) ||
      (e.sparePartCode || '').toLowerCase().includes(q) ||
      (e.reference || '').toLowerCase().includes(q) ||
      (e.reason || '').toLowerCase().includes(q)
    );
  }, [entriesList, searchQuery]);

  // Filtros de Salidas
  const filteredExits = useMemo(() => {
    if (!searchQuery.trim()) return exitsList;
    const q = searchQuery.toLowerCase();
    return exitsList.filter(e => 
      (e.sparePartName || '').toLowerCase().includes(q) ||
      (e.sparePartCode || '').toLowerCase().includes(q) ||
      (e.reference || '').toLowerCase().includes(q) ||
      (e.reason || '').toLowerCase().includes(q)
    );
  }, [exitsList, searchQuery]);

  // Filtros de Kardex Completo
  const filteredKardex = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => 
      (t.sparePartName || '').toLowerCase().includes(q) ||
      (t.sparePartCode || '').toLowerCase().includes(q) ||
      (t.reference || '').toLowerCase().includes(q) ||
      (t.reason || '').toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  // Acciones Catálogo
  const openCreateCatalog = () => {
    setEditingItem(null);
    setCatalogFormData({
      code: `REP-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      unitOfMeasure: 'Pieza',
      minStock: 2,
      location: 'Almacén Central',
      condition: 'Nuevo'
    });
    setShowCatalogModal(true);
  };

  const openEditCatalog = (item) => {
    setEditingItem(item);
    setCatalogFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      unitOfMeasure: item.unitOfMeasure || 'Pieza',
      minStock: item.minStock,
      location: item.location || 'Almacén Central',
      condition: item.condition || 'Nuevo'
    });
    setShowCatalogModal(true);
  };

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, {
          ...editingItem,
          ...catalogFormData
        });
        toast.success(`Repuesto [${catalogFormData.code}] actualizado exitosamente`);
      } else {
        await api.createInventoryItem({
          ...catalogFormData,
          currentStock: 0,
          unitCost: 0
        });
        toast.success(`Nuevo repuesto [${catalogFormData.code}] agregado al catálogo`);
      }
      setShowCatalogModal(false);
      loadData(true);
    } catch (err) {
      toast.error(`Error al guardar en catálogo: ${err.message}`);
    }
  };

  const handleDeleteCatalog = async (item) => {
    if (!window.confirm(`¿Eliminar definitivamente el repuesto [${item.code}] ${item.name} del catálogo?`)) return;
    try {
      await api.deleteInventoryItem(item.id);
      toast.success(`Repuesto [${item.code}] eliminado del catálogo`);
      loadData(true);
    } catch (err) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  // Acciones de Entradas (Ingresos)
  const openRegisterEntry = (preselectedItem = null) => {
    setEntryFormData({
      mode: preselectedItem ? 'existing' : 'existing',
      sparePartId: preselectedItem ? preselectedItem.id : (inventory[0]?.id || ''),
      code: `REP-SAP-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      unitOfMeasure: 'Pieza',
      location: 'Almacén Central',
      minStock: 2,
      reason: 'Compra SAP',
      reference: '',
      quantity: 5,
      unitCost: preselectedItem ? preselectedItem.unitCost : 25
    });
    setShowEntryModal(true);
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    const qty = parseFloat(entryFormData.quantity);
    if (!qty || qty <= 0) {
      toast.error('La cantidad de entrada debe ser mayor a 0');
      return;
    }

    const isCannibal = entryFormData.reason === 'Canibalización' || entryFormData.reason === 'Hallazgo';
    const cost = isCannibal ? 0.00 : parseFloat(entryFormData.unitCost || 0);

    const payload = {
      transactionType: 'IN',
      quantity: qty,
      unitCost: cost,
      reason: entryFormData.reason,
      reference: entryFormData.reference || (isCannibal ? 'Acta Canibalización' : 'Guía / OC SAP')
    };

    if (entryFormData.mode === 'existing') {
      if (!entryFormData.sparePartId) {
        toast.error('Selecciona un repuesto del catálogo');
        return;
      }
      payload.sparePartId = entryFormData.sparePartId;
    } else {
      if (!entryFormData.name) {
        toast.error('Indica el nombre del nuevo repuesto');
        return;
      }
      payload.newPart = {
        code: entryFormData.code || `REP-NEW-${Date.now().toString().slice(-4)}`,
        name: entryFormData.name,
        description: entryFormData.description,
        unitOfMeasure: entryFormData.unitOfMeasure,
        location: entryFormData.location,
        minStock: parseFloat(entryFormData.minStock || 0)
      };
    }

    try {
      await api.createInventoryTransaction(payload);
      toast.success(`Entrada de ${qty} unidades registrada e ingresada al stock`);
      setShowEntryModal(false);
      loadData(true);
    } catch (err) {
      toast.error(`Error al registrar entrada: ${err.message}`);
    }
  };

  // Acciones de Salidas Manuales
  const openRegisterExit = () => {
    setExitFormData({
      sparePartId: inventory[0]?.id || '',
      reason: 'Consumo Taller / Reparación',
      reference: 'Vale de Salida #001',
      quantity: 1
    });
    setShowExitModal(true);
  };

  const handleSaveExit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(exitFormData.quantity);
    if (!qty || qty <= 0) {
      toast.error('La cantidad de salida debe ser mayor a 0');
      return;
    }
    const selectedPart = inventory.find(i => String(i.id) === String(exitFormData.sparePartId));
    if (selectedPart && selectedPart.currentStock < qty) {
      if (!window.confirm(`Atención: El stock actual es ${selectedPart.currentStock}, y vas a retirar ${qty}. ¿Deseas proceder de todos modos?`)) {
        return;
      }
    }

    try {
      await api.createInventoryTransaction({
        sparePartId: exitFormData.sparePartId,
        transactionType: 'OUT',
        quantity: qty,
        unitCost: selectedPart?.unitCost || 0,
        reason: exitFormData.reason,
        reference: exitFormData.reference || 'Salida Manual'
      });
      toast.success(`Salida de ${qty} unidades descontada del stock`);
      setShowExitModal(false);
      loadData(true);
    } catch (err) {
      toast.error(`Error al registrar salida: ${err.message}`);
    }
  };

  const canManage = currentUser?.role !== 'Operario de Máquina';

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="text-blue-600" size={24} />
            Almacén, Catálogo & Kardex
          </h3>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">
            Gestión de catálogo de repuestos, registro de <strong>entradas (compras SAP / canibalización $0)</strong>, salidas por mantenimiento y kardex valorizado.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
            title="Guía Canibalización $0"
          >
            <HelpCircle size={15} className="text-emerald-600 flex-shrink-0" />
            <span className="hidden sm:inline">Guía Canibalización $0</span>
            <span className="sm:hidden">Guía $0</span>
          </button>
          <button className="btn btn-secondary text-xs px-2.5 sm:px-3 py-1.5 justify-center flex-shrink-0" onClick={() => loadData()} title="Sincronizar Almacén">
            <RefreshCw size={14} /> 
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {canManage && (
            <>
              <button 
                className="btn btn-secondary text-xs py-1.5 px-3 justify-center gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50" 
                onClick={openCreateCatalog}
                title="Crear código en catálogo sin stock inicial"
              >
                <PackagePlus size={15} className="text-blue-600" />
                <span className="hidden sm:inline">+ Catálogo</span>
                <span className="sm:hidden">+ Código</span>
              </button>
              <button 
                className="btn btn-primary text-xs py-1.5 px-3.5 justify-center gap-1.5 shadow-sm" 
                onClick={() => openRegisterEntry()}
                title="Registrar nueva entrada de repuestos que suma al stock"
              >
                <ArrowDownLeft size={16} /> 
                <span>+ Registrar Entrada</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card border-l-4 border-l-blue-500 flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 flex-shrink-0">
            <Boxes size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Catálogo Maestro</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{totalItems} códigos</div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500 flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Alerta Stock Mínimo</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{lowStockCount} por reponer</div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-emerald-500 flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0">
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Entradas / Ingresos</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{entriesList.length} lotes</div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500 flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 flex-shrink-0">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">Salidas por OTs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{exitsList.length} consumos</div>
          </div>
        </div>
      </div>

      {/* Pestañas Principales */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial justify-center whitespace-nowrap ${
            activeTab === 'catalogo'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Boxes size={15} />
          <span>Catálogo & Stock Actual</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
            {inventory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('entradas')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial justify-center whitespace-nowrap ${
            activeTab === 'entradas'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ArrowDownLeft size={15} className="text-emerald-600" />
          <span>Entradas de Almacén</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
            {entriesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('salidas')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial justify-center whitespace-nowrap ${
            activeTab === 'salidas'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ArrowUpRight size={15} className="text-purple-600" />
          <span>Salidas por Mantenimiento</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
            {exitsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial justify-center whitespace-nowrap ${
            activeTab === 'kardex'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <History size={15} className="text-blue-600" />
          <span>Kardex Consolidado</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
            {transactions.length}
          </span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xs">
        {activeTab === 'catalogo' ? (
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
              📦 Compras SAP ({inventory.filter(i => i.condition === 'Nuevo').length})
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
        ) : (
          <div className="text-xs text-slate-500 font-medium">
            {activeTab === 'entradas' && '📥 Registro de recepciones, órdenes de compra y repuestos ingresados al stock'}
            {activeTab === 'salidas' && '📤 Registro de repuestos retirados y consumidos en intervenciones de mantenimiento'}
            {activeTab === 'kardex' && '🔄 Historial cronológico de entradas (+) y salidas (-) valorizadas'}
          </div>
        )}

        <div className="flex items-center gap-2">
          {activeTab === 'salidas' && canManage && (
            <button 
              onClick={openRegisterExit}
              className="btn btn-secondary text-xs py-1.5 px-3 gap-1 text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100/50"
              title="Registrar salida manual fuera de OT"
            >
              <ArrowUpRight size={14} className="text-purple-600" />
              <span>Salida Manual</span>
            </button>
          )}

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar código, repuesto, guía..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Contenido según Pestaña */}
      {loading && !inventory.length ? (
        <TableSkeleton rows={5} cols={8} />
      ) : (
        <>
          {/* TAB 1: CATÁLOGO & STOCK */}
          {activeTab === 'catalogo' && (
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
                          No se encontraron repuestos en el catálogo para el criterio seleccionado.
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
                            <td className="font-bold text-xs text-slate-900 font-mono">
                              <span className={isAlert ? 'text-red-600 font-bold' : 'text-slate-900'}>
                                {stock} {item.unitOfMeasure || 'Pieza'}s
                              </span>
                            </td>
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
                              <div className="flex justify-center items-center gap-1.5">
                                <button 
                                  className="btn btn-secondary text-xs px-2 py-1 gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                                  onClick={() => openRegisterEntry(item)}
                                  title="Ingresar Entrada de Stock"
                                >
                                  <ArrowDownLeft size={13} className="text-emerald-600" />
                                  <span className="text-[11px] font-semibold">+ Entrada</span>
                                </button>
                                <button className="btn btn-secondary text-xs p-1" onClick={() => openEditCatalog(item)} title="Editar en Catálogo">
                                  <Edit3 size={13} />
                                </button>
                                <button className="btn btn-secondary text-xs p-1 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDeleteCatalog(item)} title="Eliminar del Catálogo">
                                  <Trash2 size={13} />
                                </button>
                              </div>
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

          {/* TAB 2: ENTRADAS DE ALMACÉN */}
          {activeTab === 'entradas' && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha & Hora</th>
                      <th>Documento / Referencia</th>
                      <th>Repuesto</th>
                      <th>Tipo / Origen</th>
                      <th className="text-right">Cantidad Ingresada</th>
                      <th className="text-right">Costo Unit. USD</th>
                      <th className="text-right">Total Valorizado</th>
                      <th>Usuario Receptor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                          No se registran entradas de repuestos en el historial. Pulsa en "+ Registrar Entrada" para ingresar stock.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry, idx) => {
                        const qty = Number(entry.quantity || 0);
                        const cost = Number(entry.unitCost || 0);
                        const isCannib = entry.reason?.includes('Canibal') || cost === 0;
                        const dateStr = entry.date ? new Date(entry.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

                        return (
                          <tr key={entry.id || idx}>
                            <td className="text-xs text-slate-500 font-mono whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td>
                              <span className="font-semibold text-xs text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {entry.reference || 'Sin Ref'}
                              </span>
                            </td>
                            <td>
                              <div className="font-bold text-slate-900 text-xs font-mono">
                                [{entry.sparePartCode}] {entry.sparePartName}
                              </div>
                              <div className="text-[11px] text-slate-500">Ubicación: {entry.location || 'Almacén Central'}</div>
                            </td>
                            <td>
                              {isCannib ? (
                                <span className="badge badge-success text-[11px]">♻️ {entry.reason || 'Canibalizado $0'}</span>
                              ) : (
                                <span className="badge badge-info text-[11px]">📦 {entry.reason || 'Compra SAP'}</span>
                              )}
                            </td>
                            <td className="text-right font-bold text-xs text-emerald-700 font-mono">
                              +{qty} {entry.unitOfMeasure || 'Und'}
                            </td>
                            <td className="text-right text-xs font-mono text-slate-700">
                              ${cost.toFixed(2)}
                            </td>
                            <td className="text-right font-bold text-xs font-mono text-slate-900">
                              {isCannib ? '$0.00 USD' : `$${(qty * cost).toFixed(2)} USD`}
                            </td>
                            <td className="text-xs text-slate-600">
                              {entry.userName || 'Almacén / Sistema'}
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

          {/* TAB 3: SALIDAS POR MANTENIMIENTO */}
          {activeTab === 'salidas' && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha & Hora</th>
                      <th>OT / Referencia</th>
                      <th>Repuesto</th>
                      <th>Motivo de Salida</th>
                      <th className="text-right">Cantidad Retirada</th>
                      <th className="text-right">Costo Unit.</th>
                      <th className="text-right">Total Salida</th>
                      <th>Técnico / Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                          No se registran salidas de mantenimiento aún. Se crearán automáticamente cuando las OTs consuman repuestos.
                        </td>
                      </tr>
                    ) : (
                      filteredExits.map((exit, idx) => {
                        const qty = Number(exit.quantity || 0);
                        const cost = Number(exit.unitCost || 0);
                        const dateStr = exit.date ? new Date(exit.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

                        return (
                          <tr key={exit.id || idx}>
                            <td className="text-xs text-slate-500 font-mono whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td>
                              <span className="font-semibold text-xs text-purple-900 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                {exit.reference || 'OT Mantenimiento'}
                              </span>
                            </td>
                            <td>
                              <div className="font-bold text-slate-900 text-xs font-mono">
                                [{exit.sparePartCode}] {exit.sparePartName}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-warning text-[11px]">
                                {exit.reason || 'Consumo OT'}
                              </span>
                            </td>
                            <td className="text-right font-bold text-xs text-red-600 font-mono">
                              -{qty} {exit.unitOfMeasure || 'Und'}
                            </td>
                            <td className="text-right text-xs font-mono text-slate-700">
                              ${cost.toFixed(2)}
                            </td>
                            <td className="text-right font-bold text-xs font-mono text-slate-900">
                              $${(qty * cost).toFixed(2)} USD
                            </td>
                            <td className="text-xs text-slate-600">
                              {exit.userName || 'Técnico de Planta'}
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

          {/* TAB 4: KARDEX CONSOLIDADO */}
          {activeTab === 'kardex' && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha & Hora</th>
                      <th>Tipo Movimiento</th>
                      <th>Documento / OT</th>
                      <th>Repuesto</th>
                      <th>Motivo</th>
                      <th className="text-right">Movimiento</th>
                      <th className="text-right">Costo Unit.</th>
                      <th className="text-right">Impacto ($ USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKardex.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                          No hay transacciones de inventario registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredKardex.map((tx, idx) => {
                        const isEntry = tx.transactionType === 'IN';
                        const qty = Number(tx.quantity || 0);
                        const cost = Number(tx.unitCost || 0);
                        const dateStr = tx.date ? new Date(tx.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

                        return (
                          <tr key={tx.id || idx}>
                            <td className="text-xs text-slate-500 font-mono whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td>
                              {isEntry ? (
                                <span className="badge badge-success text-[11px] font-bold">
                                  <ArrowDownLeft size={11} /> ENTRADA (+)
                                </span>
                              ) : (
                                <span className="badge badge-danger text-[11px] font-bold text-red-700 bg-red-50 border-red-200">
                                  <ArrowUpRight size={11} /> SALIDA (-)
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="font-semibold text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {tx.reference || 'Movimiento'}
                              </span>
                            </td>
                            <td>
                              <div className="font-bold text-slate-900 text-xs font-mono">
                                [{tx.sparePartCode}] {tx.sparePartName}
                              </div>
                            </td>
                            <td className="text-xs text-slate-600">
                              {tx.reason}
                            </td>
                            <td className={`text-right font-bold text-xs font-mono ${isEntry ? 'text-emerald-700' : 'text-red-600'}`}>
                              {isEntry ? `+${qty}` : `-${qty}`} {tx.unitOfMeasure || 'Und'}
                            </td>
                            <td className="text-right text-xs font-mono text-slate-700">
                              ${cost.toFixed(2)}
                            </td>
                            <td className="text-right font-bold text-xs font-mono text-slate-900">
                              $${(qty * cost).toFixed(2)}
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
        </>
      )}

      {/* MODAL 1: REGISTRAR ENTRADA DE ALMACÉN (INGRESOS) */}
      {showEntryModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowEntryModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ArrowDownLeft className="text-emerald-600" size={20} />
                    Registrar Entrada de Repuesto (Ingreso)
                  </h3>
                  <p className="text-xs text-slate-500">Añade stock al almacén y registra el movimiento de Kardex</p>
                </div>
                <button onClick={() => setShowEntryModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-3">
                {/* Selector: Repuesto existente vs Nuevo */}
                <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 mb-2">
                  <button
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                      entryFormData.mode === 'existing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setEntryFormData({ ...entryFormData, mode: 'existing' })}
                  >
                    📦 Repuesto Existente en Catálogo
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                      entryFormData.mode === 'new' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setEntryFormData({ ...entryFormData, mode: 'new' })}
                  >
                    ✨ Nueva Referencia / Código
                  </button>
                </div>

                {entryFormData.mode === 'existing' ? (
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Repuesto del Catálogo *</label>
                    <select
                      className="form-select text-xs font-mono"
                      value={entryFormData.sparePartId}
                      onChange={e => {
                        const id = e.target.value;
                        const part = inventory.find(p => String(p.id) === String(id));
                        setEntryFormData({
                          ...entryFormData,
                          sparePartId: id,
                          unitCost: part ? part.unitCost : entryFormData.unitCost
                        });
                      }}
                      required
                    >
                      <option value="">-- Elige un repuesto del catálogo --</option>
                      {inventory.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name} (Stock actual: {p.currentStock} {p.unitOfMeasure}s - Costo: ${p.unitCost})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="form-group mb-0">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Código Nuevo *</label>
                        <input 
                          className="form-input text-xs font-mono" 
                          required 
                          placeholder="REP-VAL-01" 
                          value={entryFormData.code} 
                          onChange={e => setEntryFormData({ ...entryFormData, code: e.target.value })} 
                        />
                      </div>
                      <div className="form-group mb-0 sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Técnico del Repuesto *</label>
                        <input 
                          className="form-input text-xs" 
                          required 
                          placeholder="Válvula Direccional 24V DC" 
                          value={entryFormData.name} 
                          onChange={e => setEntryFormData({ ...entryFormData, name: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-group mb-0">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad de Medida</label>
                        <input 
                          className="form-input text-xs" 
                          placeholder="Pieza, Galón, Juego" 
                          value={entryFormData.unitOfMeasure} 
                          onChange={e => setEntryFormData({ ...entryFormData, unitOfMeasure: e.target.value })} 
                        />
                      </div>
                      <div className="form-group mb-0">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ubicación</label>
                        <input 
                          className="form-input text-xs" 
                          placeholder="EST-A-01" 
                          value={entryFormData.location} 
                          onChange={e => setEntryFormData({ ...entryFormData, location: e.target.value })} 
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Motivo & Referencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Tipo de Entrada</label>
                    <select 
                      className="form-select text-xs" 
                      value={entryFormData.reason} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const isCannib = val === 'Canibalización' || val === 'Hallazgo';
                        setEntryFormData({ 
                          ...entryFormData, 
                          reason: val, 
                          unitCost: isCannib ? 0 : (entryFormData.unitCost === 0 ? 15 : entryFormData.unitCost)
                        });
                      }}
                    >
                      <option value="Compra SAP">📦 Compra SAP (Recepción oficial)</option>
                      <option value="Canibalización">♻️ Canibalización en Planta ($0.00 USD)</option>
                      <option value="Ingreso Inicial">📥 Ingreso Inicial de Inventario</option>
                      <option value="Ajuste">⚙️ Ajuste Positivo de Almacén</option>
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° Guía / Factura / OC SAP *</label>
                    <input 
                      className="form-input text-xs" 
                      required 
                      placeholder="OC SAP #450098 o GR-001" 
                      value={entryFormData.reference} 
                      onChange={e => setEntryFormData({ ...entryFormData, reference: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Cantidad & Costo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad a Ingresar *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      className="form-input text-xs font-bold font-mono" 
                      required 
                      value={entryFormData.quantity} 
                      onChange={e => setEntryFormData({ ...entryFormData, quantity: e.target.value })} 
                    />
                  </div>

                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Unitario (USD)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      disabled={entryFormData.reason === 'Canibalización' || entryFormData.reason === 'Hallazgo'}
                      className="form-input text-xs font-mono" 
                      value={entryFormData.unitCost} 
                      onChange={e => setEntryFormData({ ...entryFormData, unitCost: e.target.value })} 
                    />
                    {entryFormData.reason === 'Canibalización' && (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Fijado en $0 USD por norma contable</span>
                    )}
                  </div>
                </div>

                {/* Resumen Total */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Total Valorizado de la Entrada:</span>
                    <span className="text-xs font-bold text-slate-700">
                      {entryFormData.quantity} {entryFormData.unitOfMeasure}s x ${Number(entryFormData.unitCost || 0).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 font-mono">
                      $${(Number(entryFormData.quantity || 0) * Number(entryFormData.unitCost || 0)).toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" className="btn btn-secondary text-xs py-1.5 px-3" onClick={() => setShowEntryModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 font-bold">
                    Confirmar e Ingresar al Inventario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 2: CATÁLOGO MAESTRO (CREAR/EDITAR) */}
      {showCatalogModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowCatalogModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingItem ? `Editar Código de Catálogo: ${editingItem.code}` : 'Nuevo Repuesto en Catálogo Maestro'}
                </h3>
                <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
              </div>

              <form onSubmit={handleSaveCatalog} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código *</label>
                    <input 
                      className="form-input text-xs font-mono" 
                      required 
                      value={catalogFormData.code} 
                      onChange={e => setCatalogFormData({ ...catalogFormData, code: e.target.value })} 
                    />
                  </div>
                  <div className="form-group mb-0 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Técnico *</label>
                    <input 
                      className="form-input text-xs" 
                      required 
                      value={catalogFormData.name} 
                      onChange={e => setCatalogFormData({ ...catalogFormData, name: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción / Especificación Técnica</label>
                  <textarea 
                    rows={2} 
                    className="form-input text-xs" 
                    value={catalogFormData.description} 
                    onChange={e => setCatalogFormData({ ...catalogFormData, description: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad de Medida</label>
                    <input 
                      className="form-input text-xs" 
                      value={catalogFormData.unitOfMeasure} 
                      onChange={e => setCatalogFormData({ ...catalogFormData, unitOfMeasure: e.target.value })} 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-input text-xs" 
                      value={catalogFormData.minStock} 
                      onChange={e => setCatalogFormData({ ...catalogFormData, minStock: e.target.value })} 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ubicación</label>
                    <input 
                      className="form-input text-xs" 
                      value={catalogFormData.location} 
                      onChange={e => setCatalogFormData({ ...catalogFormData, location: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" className="btn btn-secondary text-xs py-1.5 px-3" onClick={() => setShowCatalogModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 font-bold">
                    {editingItem ? 'Actualizar Catálogo' : 'Guardar en Catálogo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 3: SALIDA MANUAL DE ALMACÉN */}
      {showExitModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowExitModal(false)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="text-purple-600" size={20} />
                  Registrar Salida Manual
                </h3>
                <button onClick={() => setShowExitModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
              </div>

              <form onSubmit={handleSaveExit} className="space-y-3">
                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Repuesto a Retirar *</label>
                  <select 
                    className="form-select text-xs font-mono"
                    value={exitFormData.sparePartId}
                    onChange={e => setExitFormData({ ...exitFormData, sparePartId: e.target.value })}
                    required
                  >
                    <option value="">-- Elige un repuesto --</option>
                    {inventory.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad a Retirar *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      className="form-input text-xs font-mono font-bold" 
                      value={exitFormData.quantity} 
                      onChange={e => setExitFormData({ ...exitFormData, quantity: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo</label>
                    <input 
                      className="form-input text-xs" 
                      value={exitFormData.reason} 
                      onChange={e => setExitFormData({ ...exitFormData, reason: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vale / N° Documento</label>
                  <input 
                    className="form-input text-xs" 
                    value={exitFormData.reference} 
                    onChange={e => setExitFormData({ ...exitFormData, reference: e.target.value })} 
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" className="btn btn-secondary text-xs py-1.5 px-3" onClick={() => setShowExitModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 font-bold bg-purple-600 hover:bg-purple-700 border-purple-600">
                    Confirmar Salida
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Ayuda & SOP */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} initialModule="inventory" />
    </div>
  );
}
