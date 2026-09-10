import React, { useRef } from 'react';
import { QrCode, Printer, Download, Copy, Check, X, MapPin, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import ModalPortal from './UI/ModalPortal';

export default function AssetQRModal({ asset, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const printableRef = useRef(null);

  if (!asset) return null;

  // URL a la que redirige el QR escaneado con la cámara del celular
  const scanUrl = `${window.location.origin}/?scanAsset=${encodeURIComponent(asset.code || asset.id)}`;
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(scanUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    toast.success('Enlace de escaneo copiado al portapapeles');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeImgUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${asset.code || 'ACTIVO'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Código QR descargado exitosamente');
    } catch {
      window.open(qrCodeImgUrl, '_blank');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permita las ventanas emergentes para imprimir');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta QR - [${asset.code}] ${asset.name}</title>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
            background: #fff;
          }
          .sticker-card {
            width: 320px;
            border: 2px solid #0f172a;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            box-sizing: border-box;
          }
          .brand {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #dc2626;
            margin-bottom: 2px;
          }
          .sub-brand {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
          }
          .qr-img {
            width: 200px;
            height: 200px;
            margin: 0 auto 10px;
            display: block;
          }
          .asset-code {
            font-family: monospace;
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .asset-name {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            line-height: 1.3;
          }
          .details {
            font-size: 10px;
            color: #475569;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px 8px;
            margin-bottom: 10px;
            text-align: left;
            line-height: 1.4;
          }
          .instruction {
            font-size: 9px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
        </style>
      </head>
      <body>
        <div class="sticker-card">
          <div class="brand">SOLE INDUSTRIAL</div>
          <div class="sub-brand">Sistema Mansole CMMS • Planta</div>
          <img src="${qrCodeImgUrl}" class="qr-img" onload="window.print(); window.close();" />
          <div class="asset-code">[${asset.code}]</div>
          <div class="asset-name">${asset.name}</div>
          <div class="details">
            <div><strong>Área:</strong> ${asset.areaName || 'Planta'} (${asset.costCenterCode || 'CECO'})</div>
            <div><strong>Ubicación:</strong> ${asset.locationName || asset.location || 'N/A'}</div>
            ${asset.serialNumber ? `<div><strong>S/N:</strong> ${asset.serialNumber}</div>` : ''}
          </div>
          <div class="instruction">
            Escanee con la cámara del celular para ver OTs pendientes o reportar averías
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <QrCode size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Código QR de Maquinaria
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  [{asset.code}] {asset.name}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Sticker Preview Container */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center mb-4">
            <div 
              ref={printableRef}
              className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-sm max-w-[280px] mx-auto text-center"
            >
              <div className="text-xs font-black tracking-wider text-red-600 uppercase">
                SOLE INDUSTRIAL
              </div>
              <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-2 pb-1 border-b border-slate-100">
                MANSOLE CMMS • IDENTIFICACIÓN
              </div>

              {/* QR Image */}
              <div className="p-1 bg-white inline-block rounded-lg border border-slate-200 mb-2">
                <img 
                  src={qrCodeImgUrl} 
                  alt={`QR ${asset.code}`}
                  className="w-44 h-44 mx-auto block object-contain"
                />
              </div>

              {/* Asset Identifiers */}
              <div className="font-mono text-base font-black text-slate-900 tracking-tight">
                [{asset.code}]
              </div>
              <div className="text-xs font-bold text-slate-800 line-clamp-1 mb-2">
                {asset.name}
              </div>

              {/* Badges / Location */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-left text-[10px] space-y-0.5 text-slate-600 mb-2 font-medium">
                <div className="flex items-center gap-1 truncate">
                  <Building2 size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate"><strong>Área:</strong> {asset.areaName || 'Planta'}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-amber-600 shrink-0" />
                  <span className="truncate"><strong>Ubicación:</strong> {asset.locationName || asset.location || 'Sin asignar'}</span>
                </div>
              </div>

              <div className="text-[8px] font-semibold uppercase text-slate-400 leading-tight">
                📱 Escanear con la cámara del celular para ver OTs pendientes
              </div>
            </div>
          </div>

          {/* Scanned URL indicator */}
          <div className="mb-4 p-2 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600 gap-2">
            <span className="font-mono text-[11px] truncate flex-1 select-all" title={scanUrl}>
              {scanUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 text-slate-500 hover:text-slate-800 shrink-0 rounded hover:bg-white transition-colors"
              title="Copiar enlace directo"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 flex-wrap">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center"
            >
              Cerrar
            </button>

            <button 
              type="button" 
              onClick={handleDownload} 
              className="btn btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Descargar PNG</span>
            </button>

            <button 
              type="button" 
              onClick={handlePrint} 
              className="btn btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial justify-center flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Printer size={13} />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
