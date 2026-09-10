import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Printer, X, Download, Clock, Wrench, ShieldAlert, CheckCircle2, FileText, AlertCircle, RotateCcw } from 'lucide-react';
import ModalPortal from './UI/ModalPortal';
import { toast } from 'sonner';

/**
 * Componente de Firma Digital en Canvas (Táctil y Mouse)
 */
function SignaturePad({ label, role, signerKey, orderId, defaultName }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState(() => {
    return localStorage.getItem(`mansole_sign_name_${orderId}_${signerKey}`) || defaultName || '';
  });

  const storageKey = `mansole_sign_img_${orderId}_${signerKey}`;

  // Cargar firma guardada al montar o cambiar de OT
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (saved) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasSignature(true);
        };
        img.src = saved;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  }, [orderId, signerKey, storageKey]);

  const handleNameChange = (val) => {
    setSignerName(val);
    localStorage.setItem(`mansole_sign_name_${orderId}_${signerKey}`, val);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        localStorage.setItem(storageKey, dataUrl);
      } catch (err) {
        console.error('Error saving signature:', err);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div className="flex flex-col items-center bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-center print:border-none print:bg-transparent print:p-0">
      {/* Canvas Pad */}
      <div className="relative w-full max-w-[220px] bg-white border border-dashed border-slate-300 rounded-lg overflow-hidden shadow-2xs print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:border-slate-800 print:rounded-none">
        <canvas
          ref={canvasRef}
          width={220}
          height={85}
          className="touch-none w-full h-[80px] cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-slate-400 font-medium select-none print:hidden">
            ✍️ Firma digital aquí
          </div>
        )}
      </div>

      {/* Acciones de Firma y Estado */}
      <div className="flex items-center justify-between w-full max-w-[220px] mt-1 print:hidden">
        <span className="text-[10px] font-medium">
          {hasSignature ? (
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">✓ Registrada</span>
          ) : (
            <span className="text-amber-600">Pendiente</span>
          )}
        </span>
        {hasSignature && (
          <button
            type="button"
            onClick={clearSignature}
            className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Borrar firma para volver a firmar"
          >
            <RotateCcw size={10} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Nombre y Cargo del Firmante */}
      <div className="w-full max-w-[220px] mt-2">
        <input
          type="text"
          value={signerName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Nombre del firmante"
          className="w-full text-center text-xs font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:border-blue-600 focus:outline-none py-0.5 print:border-none"
        />
        <div className="font-bold text-[11px] text-slate-800 mt-0.5">{label}</div>
        <div className="text-[9px] text-slate-500">{role}</div>
      </div>
    </div>
  );
}

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

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generando Acta PDF...', { id: 'pdf-modal-toast' });
      const res = await api.getWorkOrderPDF(orderId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Acta_${orderCode || orderData?.Code || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      toast.success('Acta PDF descargada con éxito', { id: 'pdf-modal-toast' });
    } catch (err) {
      toast.error('Error al generar PDF: ' + (err.response?.data?.error || err.message), { id: 'pdf-modal-toast' });
    }
  };

  return (
    <ModalPortal>
      {/* z-[100002] para garantizar que se abra ENCIMA del modal de detalle de OT */}
      <div className="fixed inset-0 z-[100002] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn">
          
          {/* Barra de Acciones Superior (No imprimible) */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight truncate">
                  Ficha Técnica & Acta de Servicio: {orderCode || orderData?.Code || 'OT'}
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  Documento formal para archivo técnico, liquidación contable y firmas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Descargar Acta Formal en PDF"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Imprimir o Guardar como PDF en navegador con firmas incluidas"
              >
                <Printer size={15} />
                <span>Imprimir / PDF con Firmas</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar y volver al detalle de OT"
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

                {/* 7. FIRMAS DIGITALES DE CONFORMIDAD Y ENTREGA OPERATIVA */}
                <div className="pt-6 pb-2 border-t border-slate-300 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Validación y Firmas Digitales de Conformidad
                      </h3>
                      <p className="text-[10px] text-slate-500 print:hidden">
                        Permite firmar directamente en pantalla táctil con el dedo o con el mouse.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full print:hidden">
                      Firma Digital Válida para Cierre y Auditoría
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <SignaturePad
                      signerKey="technician"
                      orderId={orderId}
                      label="Técnico Ejecutor"
                      role="Mecánico / Electricista Planta"
                      defaultName={orderData.tasks?.[0]?.TechnicianName || orderData.technicians?.[0]?.name || ''}
                    />

                    <SignaturePad
                      signerKey="supervisor"
                      orderId={orderId}
                      label="Supervisor de Mantenimiento"
                      role="Gestión de Activos & Confiabilidad"
                      defaultName={orderData.CreatedByName || ''}
                    />

                    <SignaturePad
                      signerKey="production"
                      orderId={orderId}
                      label="Jefe / Supervisor de Producción"
                      role="Conformidad de Entrega Operativa"
                      defaultName=""
                    />
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
