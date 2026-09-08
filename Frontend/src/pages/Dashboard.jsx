import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  TrendingUp, Clock, Cpu, CheckCircle2, AlertTriangle, 
  DollarSign, Boxes, ArrowUpRight, Calendar, RotateCcw, Loader2 
} from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '../components/UI';

// Caché en cliente para que al volver a la pestaña Dashboard cargue en 0ms
let cachedKpiData = null;

export default function Dashboard({ currentUser }) {
  const [kpi, setKpi] = useState(cachedKpiData);
  const [loading, setLoading] = useState(!cachedKpiData);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filtros de fecha de período inicial y final
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [activePreset, setActivePreset] = useState('bimestre');

  const fetchData = (start, end) => {
    setIsFiltering(true);
    api.getKPIs({ startDate: start, endDate: end })
      .then(data => {
        cachedKpiData = data;
        setKpi(data);
        setIsFiltering(false);
      })
      .catch(() => {
        setIsFiltering(false);
      });
  };

  useEffect(() => {
    api.getKPIs({ startDate, endDate }).then(data => {
      cachedKpiData = data;
      setKpi(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const applyPreset = (preset) => {
    setActivePreset(preset);
    let start = '';
    let end = '';
    switch(preset) {
      case 'este_mes':
        start = '2026-08-01';
        end = '2026-08-31';
        break;
      case 'bimestre':
        start = '2026-07-01';
        end = '2026-08-31';
        break;
      case 'ultimos_30':
        start = '2026-08-09';
        end = '2026-09-08';
        break;
      case 'anio':
        start = '2026-01-01';
        end = '2026-12-31';
        break;
      default:
        break;
    }
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
      fetchData(start, end);
    }
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length < 3) return dStr;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  };

  if (loading && !kpi) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Resumen Operativo de Planta</h3>
          <p className="text-sm text-slate-500">Sincronizando telemetría desde Azure SQL...</p>
        </div>
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton rows={3} cols={3} />
          <TableSkeleton rows={3} cols={3} />
        </div>
      </div>
    );
  }

  const cards = [
    { 
      title: 'Disponibilidad de Planta', 
      value: `${kpi.overallAvailability}%`, 
      desc: 'Meta mensual > 95%', 
      icon: <TrendingUp size={20} />, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' 
    },
    { 
      title: 'MTTR (T. Med. Reparación)', 
      value: `${kpi.mttrHours} hrs`, 
      desc: 'Promedio resolución correctivos', 
      icon: <Clock size={20} />, 
      color: 'text-blue-600 bg-blue-50 border-blue-200' 
    },
    { 
      title: 'MTBF (T. Entre Fallas)', 
      value: `${kpi.mtbfHours} hrs`, 
      desc: 'Confiabilidad operativa en planta', 
      icon: <Cpu size={20} />, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200' 
    },
    { 
      title: 'Cumplimiento Preventivo', 
      value: `${kpi.preventiveCompliance}%`, 
      desc: `${kpi.closedOrdersCount} OTs finalizadas`, 
      icon: <CheckCircle2 size={20} />, 
      color: 'text-purple-600 bg-purple-50 border-purple-200' 
    },
  ];

  return (
    <div className="space-y-5">
      {/* Encabezado y Selector Interactivo de Rango de Fechas */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Indicadores de Desempeño (KPIs)</span>
            {isFiltering && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoreo en tiempo real de disponibilidad, confiabilidad y costos en planta
          </p>
        </div>

        {/* Filtros de Período Inicial y Final */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
          {/* Presets Rápidos */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => applyPreset('este_mes')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activePreset === 'este_mes' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agosto 2026
            </button>
            <button
              type="button"
              onClick={() => applyPreset('bimestre')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activePreset === 'bimestre' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Julio - Agosto
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ultimos_30')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activePreset === 'ultimos_30' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Últimos 30d
            </button>
            <button
              type="button"
              onClick={() => applyPreset('anio')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activePreset === 'anio' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Año 2026
            </button>
          </div>

          {/* Selector Manual de Fecha Inicio y Fin */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 px-2.5 text-xs">
            <Calendar size={14} className="text-blue-600 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Desde:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    setActivePreset('custom');
                    if (val && endDate) fetchData(val, endDate);
                  }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Hasta:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndDate(val);
                    setActivePreset('custom');
                    if (startDate && val) fetchData(startDate, val);
                  }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                />
              </div>
            </div>
            {(startDate !== '2026-07-01' || endDate !== '2026-08-31') && (
              <button
                type="button"
                onClick={() => applyPreset('bimestre')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                title="Restablecer período por defecto"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumen del Período Evaluado */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-blue-600 shrink-0" />
          <span>Período evaluado: <strong className="text-slate-800">{formatDisplayDate(startDate)}</strong> al <strong className="text-slate-800">{formatDisplayDate(endDate)}</strong></span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
          {kpi?.period?.days ? `${kpi.period.days} días analizados` : 'Filtro activo'}
        </span>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.title}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${c.color}`}>
                {c.icon}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">{c.value}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>{c.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Tablas: Top Fallas y Gastos por CECO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Ranking Máquinas con más fallas */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200 flex-shrink-0">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Activos con Mayor Incidencia</h4>
              <p className="text-xs text-slate-500 hidden sm:block">Equipos prioritarios para mantenimiento preventivo</p>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código / Activo</th>
                  <th>CECO</th>
                  <th>Fallas</th>
                  <th>Downtime</th>
                </tr>
              </thead>
              <tbody>
                {kpi.topFailingAssets.map((a, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-semibold text-slate-900 text-xs font-mono">[{a.code}]</div>
                      <div className="text-xs text-slate-600">{a.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-warning text-[11px]">{a.ceco}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-red-600 text-xs">{a.failuresCount} fallas</span>
                    </td>
                    <td>
                      <span className="font-medium text-slate-700 text-xs font-mono">{a.downtimeMinutes} min</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gasto por Centro de Costo (CECO) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0">
                <DollarSign size={17} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Imputación de Gastos por CECO</h4>
                <p className="text-xs text-slate-500 hidden sm:block">Distribución de costos de mantenimiento</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
              Total: ${kpi.totalMaintenanceCost.toLocaleString()} USD
            </span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Centro de Costo</th>
                  <th>Área / Línea</th>
                  <th>Gasto USD</th>
                  <th>% Total</th>
                </tr>
              </thead>
              <tbody>
                {kpi.expensesByCostCenter.map((exp, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-info text-[11px]">{exp.ceco}</span>
                    </td>
                    <td className="font-medium text-slate-800 text-xs">{exp.areaName}</td>
                    <td className="font-semibold text-slate-900 text-xs font-mono">${exp.amount.toFixed(2)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-900 rounded-full" 
                            style={{ width: `${exp.percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 font-mono">{exp.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trazabilidad Almacén y Canibalización */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 flex-shrink-0">
            <Boxes size={17} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Consumo de Repuestos en Almacén & Canibalización
            </h4>
            <p className="text-xs text-slate-500 hidden sm:block">Trazabilidad de piezas estándar vs componentes reutilizados con valorización $0 USD</p>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Repuesto / Código</th>
                <th>Consumo OTs</th>
                <th>Costo Acumulado</th>
                <th>Trazabilidad / Origen</th>
              </tr>
            </thead>
            <tbody>
              {kpi.sparePartsConsumption.map((p, idx) => {
                const isZero = p.totalCost === 0;
                return (
                  <tr key={idx}>
                    <td>
                      <span className="font-semibold text-slate-900 text-xs">{p.name}</span>{' '}
                      <span className="text-slate-400 font-mono text-[11px]">({p.code})</span>
                    </td>
                    <td className="text-slate-600 text-xs">{p.usedQuantity} unidades</td>
                    <td className={`font-semibold text-xs font-mono ${isZero ? 'text-emerald-600' : 'text-slate-900'}`}>
                      ${p.totalCost.toFixed(2)} USD
                    </td>
                    <td>
                      {isZero ? (
                        <span className="badge badge-success text-[11px]">
                          Reutilizado / Canibalizado ($0)
                        </span>
                      ) : (
                        <span className="badge badge-mono text-[11px]">
                          Compra SAP
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
