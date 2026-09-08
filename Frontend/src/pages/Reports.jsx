import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  Wrench, 
  Clock, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Search,
  ChevronDown,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

export default function Reports({ currentUser }) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filtros del reporte
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedAsset, setSelectedAsset] = useState('Todos');
  const [selectedArea, setSelectedArea] = useState('Todos');

  // Catálogos para filtros
  const [assets, setAssets] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    // Cargar listas para combos de filtro
    api.getAssets().then(data => setAssets(Array.isArray(data) ? data : [])).catch(() => {});
    api.getAreas().then(data => setAreas(Array.isArray(data) ? data : [])).catch(() => {});
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        type: selectedType,
        assetId: selectedAsset,
        areaId: selectedArea
      };
      const res = await api.getMaintenanceHistoryReport(params);
      setReportData(res);
      setLoading(false);
    } catch (err) {
      toast.error(`Error al generar reporte: ${err.message}`);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.assets || reportData.assets.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Activo_Codigo,Activo_Nombre,Layout,OT_Codigo,OT_Tipo,Fecha_Emision,Fecha_Ejecucion,Parte_Componente,Tarea_Actividad,Duracion_Horas,Detalles_Tarea,Observaciones\n';

    reportData.assets.forEach(asset => {
      asset.orders.forEach(order => {
        order.tasks.forEach(task => {
          const row = [
            `"${asset.assetCode}"`,
            `"${asset.assetName}"`,
            `"${asset.layout}"`,
            `"${order.orderCode}"`,
            `"${order.orderType}"`,
            `"${order.scheduledDate || ''}"`,
            `"${order.executionDate || ''}"`,
            `"${task.component || 'SISTEMA'}"`,
            `"${task.activityName || ''}"`,
            `"${task.durationFormatted || ''}"`,
            `"${(task.comments || '').replace(/"/g, '""')}"`,
            `"${(order.observations || '').replace(/"/g, '""')}"`
          ].join(',');
          csvContent += row + '\n';
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historial_Mantenimiento_SOLE_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV descargado exitosamente.');
  };

  // Formato DD/MM/YYYY para fechas
  const formatReportDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  return (
    <div className="space-y-6">
      {/* 1. Barra de Controles y Filtros (No imprimible en papel) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-blue-600" size={22} />
              <span>Reporte General: Historial de Hs de Mantenimiento</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Formato consolidado por activo, labores de técnicos y horas acumuladas (Estilo ConsuMan)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Imprimir o Exportar en formato PDF A4"
            >
              <Printer size={15} />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading || !reportData}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              title="Exportar archivo CSV para Excel"
            >
              <Download size={15} />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Panel de Filtros por Rango de Fechas, Tipo y Máquina */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          {/* Desde */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Tipo de Mantenimiento */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tipo de Trabajo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Mejora">Mejora</option>
            </select>
          </div>

          {/* Máquina / Activo */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Activo / Equipo
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-500 truncate"
            >
              <option value="Todos">Todos los activos (Planta)</option>
              {assets.map(a => (
                <option key={a.id || a.Id} value={a.id || a.Id}>
                  [{a.code || a.Code}] {a.name || a.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Aplicar Filtro */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={generateReport}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar Reporte</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. HOJA DEL REPORTE (DOCUMENTO OFICIAL CONSUMAN • IMPRIMIBLE A4) */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Consultando órdenes y agrupando horas de mantenimiento...</p>
        </div>
      ) : !reportData || !reportData.assets || reportData.assets.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Wrench size={32} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No se encontraron órdenes en el rango de fechas seleccionado.</p>
          <p className="text-xs text-slate-400">Prueba ajustando las fechas 'Desde' y 'Hasta' para visualizar el historial.</p>
        </div>
      ) : (
        <div 
          id="printable-consuman-report" 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:rounded-none max-w-5xl mx-auto"
        >
          {/* CABECERA OFICIAL FORMATO CONSUMAN */}
          <div className="border border-slate-900 p-3 sm:p-4 grid grid-cols-12 items-center gap-3">
            {/* Logo Sole */}
            <div className="col-span-3 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full border-2 border-blue-700 flex items-center justify-center text-blue-700 font-black text-xl">
                  ⚙️
                </div>
                <div className="font-black text-2xl text-blue-900 tracking-tighter leading-none">
                  sole
                </div>
              </div>
            </div>

            {/* Título y Rango de Fechas */}
            <div className="col-span-6 text-center space-y-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                Historial de Hs de Mantenimiento
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Desde: <span className="font-extrabold text-black">{formatReportDate(startDate)}</span> Hasta: <span className="font-extrabold text-black">{formatReportDate(endDate)}</span>
              </p>
            </div>

            {/* Metadata y Fecha de Generación */}
            <div className="col-span-3 text-right text-[10px] sm:text-[11px] text-slate-700 space-y-0.5">
              <div>{new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              <div className="font-bold">Total Equipos: {reportData.totalAssetsCount}</div>
            </div>
          </div>

          {/* BLOQUES DE ACTIVOS (Agrupado por Activo estilo ConsuMan) */}
          <div className="space-y-6">
            {reportData.assets.map((asset, aIdx) => (
              <div key={aIdx} className="border border-slate-900 divide-y divide-slate-900 page-break-inside-avoid">
                {/* Cabecera del Activo */}
                <div className="bg-slate-50 p-2.5 sm:px-3 sm:py-2 text-xs space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-600">Activo:</span>{' '}
                      <span className="font-extrabold text-slate-950 font-mono text-sm">
                        {asset.assetCode} {asset.assetName?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-700">
                    <span className="font-bold text-slate-600">Layout:</span>{' '}
                    <span>{asset.layout}</span>
                  </div>
                </div>

                {/* Encabezado de Columnas */}
                <div className="grid grid-cols-12 bg-slate-100 text-[11px] font-bold text-slate-900 px-3 py-1.5 border-b border-slate-900">
                  <div className="col-span-2">Fecha</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-3">Parte</div>
                  <div className="col-span-4">Tarea</div>
                  <div className="col-span-1 text-right">Horas</div>
                </div>

                {/* Lista de Órdenes y Tareas del Activo */}
                <div className="divide-y divide-slate-300">
                  {asset.orders.map((order, oIdx) => (
                    <div key={oIdx} className="p-3 text-xs space-y-1.5">
                      {/* Subencabezado de la OT */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 border-b border-slate-200 pb-1">
                        <div>
                          Orden de Trabajo: <span className="font-mono text-blue-800">{order.orderCode}</span>
                        </div>
                        <div>
                          Fecha Emisión: {order.scheduledDate ? formatReportDate(order.scheduledDate) : 'S/F'}
                        </div>
                        <div>
                          Tipo: <span className="font-semibold">{order.orderType}</span>
                        </div>
                      </div>

                      {/* Filas de Tareas */}
                      {order.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="space-y-1 pt-1">
                          <div className="grid grid-cols-12 text-[11px] text-slate-800 font-medium">
                            <div className="col-span-2 font-mono">
                              {order.executionDate ? formatReportDate(order.executionDate) : (order.scheduledDate ? formatReportDate(order.scheduledDate) : '2026-08')}
                            </div>
                            <div className="col-span-2 text-slate-700">
                              {order.orderType === 'Preventivo' ? 'A Fecha' : 'Solicitud'}
                            </div>
                            <div className="col-span-3 font-semibold uppercase text-slate-900">
                              {task.component || 'SISTEMA'}
                            </div>
                            <div className="col-span-4 uppercase font-semibold text-slate-950">
                              {task.activityName}
                            </div>
                            <div className="col-span-1 text-right font-mono font-bold text-slate-950">
                              {task.durationFormatted}
                            </div>
                          </div>

                          {/* Detalles de Tarea */}
                          <div className="text-[10.5px] text-slate-700 pl-2">
                            <span className="font-bold italic">Detalles de Tarea:</span>{' '}
                            <span>{task.comments || 'Labor técnica ejecutada según plan de mantenimiento.'}</span>
                          </div>
                        </div>
                      ))}

                      {/* Observaciones Generales de la Orden */}
                      <div className="text-[10.5px] text-slate-700 pl-2 pt-0.5 border-t border-dotted border-slate-200">
                        <span className="font-bold italic">Observaciones:</span>{' '}
                        <span>{order.observations}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal de Horas por Activo (ConsuMan) */}
                <div className="bg-slate-50 px-3 py-1.5 text-right font-bold text-xs text-slate-950 flex items-center justify-end gap-3 border-t border-slate-900">
                  <span>Cantidad de Horas por Activo:</span>
                  <span className="font-mono text-sm font-black text-blue-900">
                    {asset.totalHoursFormatted}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL GENERAL DE LA PLANTA (Última fila ConsuMan) */}
          <div className="border-2 border-slate-900 bg-slate-950 text-white p-3.5 flex items-center justify-between font-black text-sm sm:text-base rounded-lg">
            <span>Cantidad Total de Horas:</span>
            <span className="font-mono text-lg text-emerald-400">
              {reportData.totalHoursPlantFormatted}
            </span>
          </div>

          {/* Pie de Página de ConsuMan / MANSOLE */}
          <div className="pt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200">
            <span>Sistema MANSOLE CMMS (Reemplazo Oficial de ConsuMan) • Planta Grupo SOLE</span>
            <span className="font-bold text-slate-700 font-mono">CONSU MAN® COMPATIBLE</span>
          </div>
        </div>
      )}
    </div>
  );
}
