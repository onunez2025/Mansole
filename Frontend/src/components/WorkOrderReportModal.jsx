import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Printer, X, Download, Clock, Wrench, ShieldAlert, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import ModalPortal from './UI/ModalPortal';
import { toast } from 'sonner';

export default function WorkOrderReportModal({ isOpen, onClose, orderId, orderCode }) {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      api.getWorkOrderReport(orderId)
        .then(res => {
          setOrderData(res.order);
          setLoading(false);
        })
        .catch(err => {
          toast.error(`Error al cargar reporte de la OT: ${err.message}`);
          setLoading(false);
        });
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn">
          
          {/* Barra de Acciones Superior (No imprimible) */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Ficha Técnica & Acta de Servicio: {orderCode || orderData?.Code || 'OT'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Documento formal para archivo técnico, liquidación contable y firmas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Imprimir o Guardar como PDF"
              >
                <Printer size={15} />
                <span>Imprimir / Guardar PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Cuerpo del Documento (Imprimible) */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white print:p-0 print:overflow-visible">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Generando Ficha Técnica de OT desde Azure SQL...</p>
              </div>
            ) : !orderData ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No se encontró la información de la orden de trabajo seleccionada.
              </div>
            ) : (
              <div id="printable-work-order" className="max-w-3xl mx-auto space-y-6 text-slate-800 text-xs font-sans">
                
                {/* 1. ENCABEZADO CORPORATIVO GRUPO SOLE */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white font-extrabold text-2xl tracking-tighter">
                      S
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none">
                        GRUPO SOLE
                      </h1>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                        División Rinnai Perú • Gestión de Mantenimiento Industrial
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Planta Callao / Planta Metusa • Sistema CMMS MANSOLE
                      </p>
                    </div>
                  </div>

                  <div className="text-right border border-slate-300 rounded-xl p-2.5 bg-slate-50/70 min-w-[200px]">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Orden de Trabajo N°</div>
                    <div className="text-base font-black text-blue-700 tracking-tight font-mono">{orderData.Code}</div>
                    <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                      Tipo: <span className="font-bold text-slate-900">{orderData.Type}</span> | Prioridad: <span className="font-bold text-slate-900">{orderData.Priority}</span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Estado: <span className="font-bold text-slate-800 uppercase">{orderData.Status}</span>
                    </div>
                  </div>
                </div>

                {/* 2. DATOS GENERALES DEL ACTIVO Y CECO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Identificación de la Máquina
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      [{orderData.AssetCode}] {orderData.AssetName}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Marca/Modelo:</strong> {orderData.Brand || 'N/A'} {orderData.Model || ''}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>N° Serie:</strong> {orderData.SerialNumber || 'S/N'}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3.5 pt-2 sm:pt-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ubicación & Centro de Costo (CECO)
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Área de Planta:</strong> {orderData.AreaName || 'General'}
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Centro de Costo:</strong> <span className="font-mono font-bold text-indigo-700">{orderData.CostCenterCode || 'CECO-GEN'}</span> ({orderData.CeCosteDescripcion || 'Planta Operativa'})
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Tiempos de Parada (Downtime):</strong> <span className="font-bold text-rose-700">{orderData.totalRealDowntime || orderData.DowntimeMinutes || 0} min</span> ({orderData.totalDowntimeFormatted || '0:00'} hrs)
                    </div>
                  </div>
                </div>

                {/* 3. DESCRIPCIÓN DEL TRABAJO / SÍNTOMA REPORTADO */}
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Descripción del Trabajo / Incidencia Reportada
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-normal">
                    {orderData.Description || 'Sin descripción detallada registrada.'}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                    <span>Solicitado por: <strong>{orderData.CreatedByName || 'Supervisor de Turno'}</strong> ({orderData.CreatedByEmail || 'Planta'})</span>
                    <span>Programado para: <strong>{orderData.ScheduledDate ? new Date(orderData.ScheduledDate).toLocaleDateString('es-PE') : 'Inmediato'}</strong></span>
                  </div>
                </div>

                {/* 4. REPORTE DE TAREAS EJECUTADAS POR LOS TÉCNICOS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Clock size={14} className="text-blue-600" />
                      <span>Labores Técnicas Ejecutadas & Tiempos de Mano de Obra</span>
                    </h3>
                    <span className="text-[11px] font-bold text-blue-700">
                      Total Horas: {orderData.totalTaskHoursFormatted || '0:00'} h
                    </span>
                  </div>

                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <thead className="bg-slate-100 text-slate-800 text-left">
                      <tr>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold">Actividad / Tarea</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold">Técnico Ejecutor</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold text-center">Duración</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold">Detalles & Observaciones</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orderData.tasks && orderData.tasks.length > 0 ? (
                        orderData.tasks.map((t, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-900">
                              {t.ActivityName || 'Labor Mecánica/Eléctrica'}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-slate-700">
                              {t.TechnicianName || 'Técnico Asignado'}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-center font-mono font-bold text-slate-900">
                              {t.durationFormatted || '0:00'} h ({t.DurationMinutes || 0}m)
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-slate-700 text-[10.5px]">
                              {t.Comments || 'Actividad completada sin observaciones de campo.'}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-center">
                              <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800">
                                {t.IsCompleted ? 'Completado' : (t.Status || 'Finalizado')}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="border border-slate-200 px-3 py-2 text-center text-slate-400 italic">
                            Labor ejecutada según orden general sin desglose de subtareas individuales.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. MATERIALES Y REPUESTOS CONSUMIDOS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Wrench size={14} className="text-indigo-600" />
                      <span>Repuestos y Materiales Consumidos de Almacén</span>
                    </h3>
                    <span className="text-[11px] font-bold text-indigo-700">
                      Subtotal Repuestos: ${Number(orderData.totalPartsCost || 0).toFixed(2)} USD
                    </span>
                  </div>

                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <thead className="bg-slate-100 text-slate-800 text-left">
                      <tr>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold">Código</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold">Descripción del Repuesto</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold text-center">Cant.</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold text-center">U.M.</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold text-right">Costo Unit.</th>
                        <th className="border border-slate-200 px-2.5 py-1.5 font-bold text-right">Total USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orderData.spareParts && orderData.spareParts.length > 0 ? (
                        orderData.spareParts.map((sp, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="border border-slate-200 px-2.5 py-1.5 font-mono font-bold text-slate-900">
                              {sp.SparePartCode || sp.Code}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-slate-800 font-medium">
                              {sp.SparePartName || sp.Name}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-center font-bold text-slate-900">
                              {sp.Quantity}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-center text-slate-600">
                              {sp.UnitOfMeasure || 'Und'}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-right font-mono text-slate-700">
                              ${Number(sp.UnitCost || 0).toFixed(2)}
                            </td>
                            <td className="border border-slate-200 px-2.5 py-1.5 text-right font-mono font-bold text-slate-900">
                              ${Number(sp.TotalCost || (sp.Quantity * sp.UnitCost) || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="border border-slate-200 px-3 py-2 text-center text-slate-400 italic">
                            No se registraron salidas de repuestos para esta orden de trabajo (solo mano de obra o ajuste menor).
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 6. RESUMEN ECONÓMICO LIQUIDABLE */}
                <div className="flex justify-end">
                  <div className="w-72 border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-1.5">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Costo Mano de Obra:</span>
                      <span className="font-mono font-semibold">${Number(orderData.laborCost || orderData.LaborCost || 0).toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Costo Materiales / Repuestos:</span>
                      <span className="font-mono font-semibold">${Number(orderData.totalPartsCost || 0).toFixed(2)} USD</span>
                    </div>
                    <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-xs text-slate-900">
                      <span>COSTO TOTAL LIQUIDADO:</span>
                      <span className="font-mono text-blue-700 text-sm">${Number(orderData.totalCost || orderData.TotalCost || 0).toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* 7. FIRMAS DE CONFORMIDAD Y ENTREGA OPERATIVA */}
                <div className="pt-6 pb-2 border-t border-slate-300 space-y-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                    Validación y Firmas de Conformidad de Mantenimiento
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="space-y-1">
                      <div className="border-b border-slate-900 pb-12" />
                      <div className="font-bold text-[11px] text-slate-900">Técnico Ejecutor</div>
                      <div className="text-[9px] text-slate-500">Mecánico / Electricista Planta</div>
                    </div>

                    <div className="space-y-1">
                      <div className="border-b border-slate-900 pb-12" />
                      <div className="font-bold text-[11px] text-slate-900">Supervisor de Mantenimiento</div>
                      <div className="text-[9px] text-slate-500">Gestión de Activos & Confiabilidad</div>
                    </div>

                    <div className="space-y-1">
                      <div className="border-b border-slate-900 pb-12" />
                      <div className="font-bold text-[11px] text-slate-900">Jefe / Supervisor de Producción</div>
                      <div className="text-[9px] text-slate-500">Conformidad de Entrega Operativa</div>
                    </div>
                  </div>
                </div>

                {/* Pie de página */}
                <div className="text-[9px] text-slate-400 text-center pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Documento oficial de control operacional - GRUPO SOLE</span>
                  <span>Generado por MANSOLE CMMS el {new Date().toLocaleString('es-PE')}</span>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
