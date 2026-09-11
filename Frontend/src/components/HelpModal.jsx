import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  Hammer, 
  Boxes, 
  CalendarClock, 
  Wrench, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';

const GUIDES = {
  workOrders: {
    title: 'Procedimiento de Órdenes de Trabajo (OT) & Protocolo LOTO',
    icon: <Hammer size={20} className="text-blue-600" />,
    badge: 'Operación & Seguridad',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    summary: 'Guía oficial para la emisión de averías, ejecución segura y cierre formal de órdenes de trabajo en planta.',
    steps: [
      {
        title: '1. Emisión de Incidencia / Reporte de Falla',
        desc: 'El operador o supervisor pulsa "+ Emitir Orden de Trabajo". Selecciona el activo por código (ej. PRENSA-01), define la prioridad (Crítica, Alta, Media, Baja) y redacta el síntoma observado (fuga, ruido anómalo, bloqueo mecánico).'
      },
      {
        title: '2. Protocolo de Seguridad LOTO Obligatorio (Bloqueo y Etiquetado)',
        desc: 'Antes de que el técnico intervenga físicamente cualquier máquina, debe accionar el seccionador eléctrico, purgar presión hidráulica/neumática y colocar el candado y tarjeta personal de bloqueo LOTO. Ninguna OT se inicia sin confirmación LOTO.'
      },
      {
        title: '3. Asistencia con Inteligencia Artificial Industrial',
        desc: 'En el detalle de la OT, pulsa "Diagnóstico con IA". El sistema analizará el síntoma, el histórico de fallas y la ficha técnica del equipo para sugerir causas probables, componentes a revisar y herramientas requeridas.'
      },
      {
        title: '4. Cierre Técnico e Imputación de Repuestos',
        desc: 'Al terminar, ingresa las horas hombre de los técnicos participantes y los repuestos empleados. Si el repuesto provino de una máquina dada de baja (canibalizado), se computa a costo $0.00 USD para mantener la trazabilidad contable.'
      },
      {
        title: '5. Acta Formal en PDF',
        desc: 'Pulsa "Descargar Acta PDF" para generar el documento oficial firmado que certifica la liberación de la máquina para Producción.'
      }
    ]
  },
  inventory: {
    title: 'Procedimiento de Almacén, Kardex y Canibalización',
    icon: <Boxes size={20} className="text-emerald-600" />,
    badge: 'Trazabilidad Dual',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    summary: 'Manejo riguroso de repuestos nuevos ingresados por compras SAP vs. repuestos reutilizados o hallados a costo $0.',
    steps: [
      {
        title: '1. Control de Existencias y Alerta de Stock Crítico',
        desc: 'La tabla resalta en rojo aquellos repuestos cuyo stock actual es menor o igual al Stock Mínimo de seguridad. Permite alertar a Compras antes de que se produzca una parada por falta de insumos.'
      },
      {
        title: '2. ¿Cómo registrar un Repuesto Canibalizado ($0.00 USD)?',
        desc: 'Cuando se rescata una pieza funcional (válvula, motor, cilindro) de una máquina en desuso, pulsa "+ Registrar Transacción" y selecciona "Canibalización / Hallazgo en Planta". Se le asigna costo $0 USD para sumar stock físico sin generar desbalance contable.'
      },
      {
        title: '3. Ingresos Oficiales por Compras SAP',
        desc: 'Al recibir compras formales de proveedores, se selecciona el tipo "Recepción de Compra (SAP)" con su costo comercial y número de orden de compra.'
      },
      {
        title: '4. Salidas y Consumos para Mantenimiento',
        desc: 'Toda salida debe estar asociada al código de la OT en ejecución para saber exactamente en qué activo terminó cada repuesto.'
      }
    ]
  },
  schedule: {
    title: 'Procedimiento de Cronograma Preventivo y Reprogramaciones',
    icon: <CalendarClock size={20} className="text-purple-600" />,
    badge: 'Auditoría CECO',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    summary: 'Planificación sistemática de inspecciones y procedimiento de reprogramación auditada.',
    steps: [
      {
        title: '1. Frecuencias Preventivas Automáticas',
        desc: 'Cada activo tiene rutinas preventivas programadas (Semanal, Quincenal, Mensual, Trimestral). El sistema calcula dinámicamente la "Próxima Fecha de Vencimiento".'
      },
      {
        title: '2. Semáforo de Estado',
        desc: 'Verde: Programado dentro del plazo. Amarillo: Próximo a vencer en menos de 3 días. Rojo: Vencido (requiere atención prioritaria o reprogramación).'
      },
      {
        title: '3. Procedimiento de Reprogramación Auditada',
        desc: 'Si Producción no puede liberar la máquina en la fecha prevista, el Supervisor puede pulsar "Reprogramar", eligiendo una nueva fecha y digitando obligatoriamente el motivo formal (ej. "Alta demanda en turno 2, postergado con visto de Gerencia"). Queda registrado para auditorías ISO/CECO.'
      }
    ]
  },
  assets: {
    title: 'Jerarquía de Activos Industriales & CECOs',
    icon: <Wrench size={20} className="text-amber-600" />,
    badge: 'Estructura Maestra',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    summary: 'Cómo se estructuran los activos en planta: Empresa → Centro de Costo (CECO) → Área → Máquina.',
    steps: [
      {
        title: '1. Código Único de Activo',
        desc: 'Cada máquina o equipo auxiliar cuenta con una codificación estandarizada (ej. PRENSA-01, COMP-AIR-02) que coincide con la placa física remachada en el chasis.'
      },
      {
        title: '2. Asignación a Centro de Costos (CECO) y Área',
        desc: 'Los costos acumulados de mantenimiento (repuestos + horas hombre) se imputan automáticamente al CECO del área donde opera la máquina, permitiendo generar reportes financieros fidedignos.'
      },
      {
        title: '3. Ficha de Vida & Estado Operativo',
        desc: 'Puedes cambiar el estado entre Operativo, En Mantenimiento, Parada por Falla o En Espera de Repuestos para que el Dashboard refleje la disponibilidad en vivo.'
      }
    ]
  },
  catalogs: {
    title: 'Administración de Catálogos Maestros (CRUD Configuración)',
    icon: <Users size={20} className="text-indigo-600" />,
    badge: 'Panel Administrador',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    summary: 'Administración completa de tablas base sin tocar la base de datos SQL.',
    steps: [
      {
        title: '1. Gestión de Áreas de Planta',
        desc: 'Crea o edita áreas físicas de la planta de Grupo SOLE (ej. Ensamble, Troquelado, Pintura) vinculándolas a su código CECO oficial.'
      },
      {
        title: '2. Categorías de Maquinaria',
        desc: 'Estandariza los tipos de máquina (Prensas Hidráulicas, Hornos, Soldadoras, Cintas Transportadoras) para agrupar indicadores de falla.'
      },
      {
        title: '3. Centros de Costo (CeCoste)',
        desc: 'Sincroniza los códigos contables de producción con sus respectivas gerencias y jefaturas responsables.'
      },
      {
        title: '4. Reglas de Integridad Referencial',
        desc: 'El sistema impide eliminar áreas o categorías que tengan maquinaria activa asociada, garantizando que nunca se rompa la integridad de la base de datos.'
      }
    ]
  }
};

export default function HelpModal({ isOpen, onClose, initialModule = 'workOrders' }) {
  const [activeTab, setActiveTab] = useState(initialModule);

  if (!isOpen) return null;

  const currentGuide = GUIDES[activeTab] || GUIDES.workOrders;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Centro de Ayuda & Guías SOP</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Guías paso a paso para operar con máxima seguridad en Grupo SOLE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Pestañas de Módulos */}
        <div className="flex items-center gap-1.5 p-2 sm:p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            onClick={() => setActiveTab('workOrders')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'workOrders' 
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Hammer size={14} />
            <span>OTs & LOTO</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'inventory' 
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Boxes size={14} />
            <span>Repuestos $0</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'schedule' 
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarClock size={14} />
            <span>Preventivos</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'assets' 
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wrench size={14} />
            <span>Activos & CECOs</span>
          </button>

          <button
            onClick={() => setActiveTab('catalogs')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'catalogs' 
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users size={14} />
            <span>Catálogos Maestros</span>
          </button>
        </div>

        {/* Contenido de la Guía */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 bg-slate-50/40 dark:bg-slate-950/40">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentGuide.badgeStyle}`}>
                {currentGuide.badge}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              {currentGuide.icon}
              <span>{currentGuide.title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {currentGuide.summary}
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Pasos del Procedimiento de Planta
            </h4>

            {currentGuide.steps.map((step, idx) => (
              <div 
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
                  <span>{step.title}</span>
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5 sm:pl-6">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Nota de Seguridad */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Norma de Seguridad Industrial Grupo SOLE</span>
              <span>Cualquier operario o técnico tiene la autoridad y el deber de detener una labor de mantenimiento si detecta condiciones de riesgo inseguras o falta de EPPs reglamentarios.</span>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate hidden sm:inline">Manual de Procedimientos • División Rinnai Perú</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-xs text-center ml-auto cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}