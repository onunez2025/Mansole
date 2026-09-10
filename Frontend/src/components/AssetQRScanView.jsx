import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  User, 
  ArrowRight, 
  X, 
  ShieldAlert, 
  PlusCircle, 
  Check, 
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function AssetQRScanView({ assetCode, currentUser, onSelectOrder, onCreateOrder, onClose, onGoToLogin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetCode) return;
    setLoading(true);
    setError(null);
    api.getAssetPublicQR(assetCode)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando QR:', err);
        setError(err.response?.data?.error || 'No se encontró la máquina o activo correspondiente a este código.');
        setLoading(false);
      });
  }, [assetCode]);

  const asset = data?.asset;
  const pendingWorkOrders = data?.pendingWorkOrders || [];

  const handleOpenOT = (ot) => {
    if (currentUser && onSelectOrder) {
      onSelectOrder(ot.Code || ot.code || ot.Id || ot.id);
    } else if (onGoToLogin) {
      onGoToLogin(ot.Code || ot.code);
    }
  };

  const handleCreateOT = () => {
    if (currentUser && onCreateOrder) {
      onCreateOrder(asset);
    } else if (onGoToLogin) {
      onGoToLogin(null, asset?.Code || asset?.code);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header Superior Corporativo */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              S
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-red-400">SOLE INDUSTRIAL</div>
              <div className="text-sm font-bold tracking-tight">Mansole CMMS Móvil</div>
            </div>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Cerrar vista"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Loader2 size={36} className="animate-spin text-slate-900 mx-auto" />
              <p className="text-xs font-semibold">Identificando maquinaria escaneada ({assetCode})...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-900">Activo no encontrado</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">{error}</p>
              <div className="pt-2">
                <button 
                  onClick={onClose}
                  className="btn btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          ) : asset ? (
            <div className="space-y-4">
              {/* Tarjeta de la Máquina */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="flex gap-3">
                  {asset.ImageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-white">
                      <img 
                        src={asset.ImageUrl} 
                        alt={asset.Name} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display='none'; }}
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        [{asset.Code}]
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        asset.Status === 'Operativo' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {asset.Status}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                      {asset.Name}
                    </h3>

                    <div className="text-[11px] text-slate-500 space-y-0.5 mt-1">
                      <div className="flex items-center gap-1 truncate">
                        <Building2 size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{asset.AreaName || 'Planta'} ({asset.CostCenterCode || 'CECO'})</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="text-amber-600 shrink-0" />
                        <span className="truncate"><strong>Ubicación:</strong> {asset.LocationName || 'Sin ubicación específica'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Órdenes de Trabajo Pendientes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench size={14} className="text-slate-700" />
                    <span>Órdenes de Trabajo Pendientes</span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {pendingWorkOrders.length}
                    </span>
                  </h4>
                </div>

                {pendingWorkOrders.length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center space-y-2">
                    <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                    <p className="text-xs font-semibold text-emerald-900">
                      Esta máquina no tiene averías ni OTs pendientes
                    </p>
                    <p className="text-[11px] text-emerald-700 max-w-xs mx-auto">
                      El equipo se encuentra en estado regular de operación. Si detectó una anomalía, puede generar una orden ahora.
                    </p>
                    <div className="pt-1">
                      <button 
                        type="button"
                        onClick={handleCreateOT}
                        className="btn btn-primary text-xs py-2 px-4 w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={14} />
                        <span>Reportar Avería / Iniciar OT para este Equipo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {pendingWorkOrders.map((ot) => (
                      <div 
                        key={ot.Id}
                        onClick={() => handleOpenOT(ot)}
                        className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {ot.Code}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              ot.MaintenanceType === 'Correctivo' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : (ot.MaintenanceType === 'Mejora' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200')
                            }`}>
                              {ot.MaintenanceType}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              ot.Priority === 'Critica' || ot.Priority === 'Crítica'
                                ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {ot.Priority}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-2 leading-relaxed">
                          {ot.Description || 'Mantenimiento registrado para esta máquina.'}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1 truncate">
                            <User size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{ot.AssignedTechnicianName || 'Técnico sin asignar'}</span>
                          </span>
                          <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                            <span>Ver OT</span>
                            <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-1">
                      <button 
                        type="button"
                        onClick={handleCreateOT}
                        className="btn btn-secondary text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5 hover:bg-slate-100 text-slate-700"
                      >
                        <PlusCircle size={14} />
                        <span>Crear Otra OT para este Equipo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón inferior para continuar */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {currentUser ? `Sesión: ${currentUser.name || currentUser.username}` : 'Modo Escaneo Rápido'}
                </span>
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="text-slate-700 hover:text-slate-900 font-semibold"
                  >
                    Cerrar ventana
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
