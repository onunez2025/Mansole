/**
 * Historial oficial de versiones y Pull Requests publicados en MANSOLE CMMS Industrial.
 * Cada entrada documenta el PR asociado, fecha, resumen ejecutivo y detalle de cambios por categoría.
 */

export const CURRENT_VERSION = 'v2.9.0';
export const LAST_RELEASE_DATE = '08 de Septiembre, 2026';
export const GITHUB_REPO_URL = 'https://github.com/onunez2025/Mansole';

export const CHANGELOG_DATA = [
  {
    version: 'v2.9.0',
    prNumber: 28,
    prTitle: 'feat(reports): fichas tecnicas con firmas, historial ConsuMan por fechas, programacion preventiva y Mansito lateral con DeepSeek',
    prUrl: `${GITHUB_REPO_URL}/pull/28`,
    commitHash: '858288b',
    commitUrl: `${GITHUB_REPO_URL}/commit/858288b`,
    date: '08 de Septiembre, 2026',
    isLatest: true,
    tag: 'Actual / Major Release',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    summary: 'Lanzamiento integral de módulos de reportes oficiales para Planta Callao / Metusa: Ficha Técnica individual de Orden de Trabajo con firmas tripartitas, Módulo de Reportes con Historial ConsuMan por fechas (PDF y CSV), Programación Preventiva interactiva y modernización de Mansito con panel lateral expandible y motor DeepSeek.',
    highlights: [
      'Reporte 1: Ficha Técnica de Orden de Trabajo con cronometraje de horas hombre, repuestos valorizados y 3 bloques de firmas (Técnico, Supervisor y Producción).',
      'Reporte 2: Historial ConsuMan por rango de fechas agrupado por Layout de Activo, duración en HH:MM, subtotales y total general de planta con exportación a PDF y Excel.',
      'Carga de Mantenimientos Programados: Modal en Cronograma para vincular activos con tareas del catálogo maestro y frecuencias periódicas.',
      'Mansito Drawer Lateral: Asistente de IA rediseñado como panel lateral deslizable y expandible con renderizado elegante de tablas Markdown y soporte de lenguaje natural.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Reportes OT',
        title: 'Ficha Técnica de Servicio con Firmas de Conformidad',
        desc: 'Modal imprimible en formato A4 con membrete corporativo SOLE, registro de horas efectivas de técnicos, repuestos consumidos de almacén y casilleros para firmas físicas.'
      },
      {
        type: 'feat',
        scope: 'Reportes Planta',
        title: 'Historial de Hs de Mantenimiento (Formato ConsuMan)',
        desc: 'Réplica fidedigna del estándar ConsuMan con agrupación por ruta de activo (Nave de Producción / Metusa), cálculo de tiempos en HH:MM y exportación instantánea a PDF y CSV.'
      },
      {
        type: 'feat',
        scope: 'Cronograma',
        title: 'Programación Preventiva Directa en Azure SQL',
        desc: 'Nueva funcionalidad para programar rutinas cíclicas (semanal, quincenal, mensual, horómetro) asociando el catálogo maestro de actividades a los activos de planta.'
      },
      {
        type: 'feat',
        scope: 'IA Mansito',
        title: 'Panel Lateral Deslizante y Motor DeepSeek',
        desc: 'Transición de chat flotante a drawer lateral con opción de pantalla ancha, dibujo visual de tablas Markdown y comprensión de consultas en lenguaje natural.'
      }
    ]
  },
  {
    version: 'v2.8.1',
    prNumber: 27,
    prTitle: 'fix(ai): alta disponibilidad de Mansito con IPv4 estricto, cascada multimodelo y respuestas dinamicas de Azure SQL',
    prUrl: `${GITHUB_REPO_URL}/pull/27`,
    commitHash: '24fe643',
    commitUrl: `${GITHUB_REPO_URL}/commit/24fe643`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Hotfix AI',
    tagColor: 'bg-slate-50 text-slate-700 border-slate-200',
    summary: 'Optimización de rendimiento y resiliencia del asistente Mansito: conexión HTTPS con IPv4 nativo (family: 4) para erradicar el retardo DNS de Windows, cascada multimodelo automática (DeepSeek V4 Pro -> Llama 3.2 11B -> GPT-OSS 20B) y motor dinámico de Azure SQL para responder de forma personalizada según cada consulta.',
    highlights: [
      'Conexión HTTPS nativa con resolución IPv4 forzada (family: 4) reduciendo el tiempo de respuesta de +18s a menos de 2s.',
      'Cascada de alta disponibilidad multimodelo automática: DeepSeek V4 Pro, Llama 3.2 11B y GPT-OSS 20B.',
      'Respuestas dinámicas y específicas para asignaciones de usuarios, OTs pendientes y cronogramas semanales.',
      'Afinación de extracción de tablas SQL y compresión de prompts para inferencia fluida y precisa.'
    ],
    changes: [
      {
        type: 'fix',
        scope: 'IA Mansito',
        title: 'Resolución de cuelgues DNS e IPv6 en Windows',
        desc: 'Implementación de agente HTTPS con family: 4 estricto, eliminando el timeout provocado por la resolución de direcciones IPv6 en entornos Windows.'
      },
      {
        type: 'perf',
        scope: 'IA Cascada',
        title: 'Arquitectura de respaldo automático de modelos',
        desc: 'Inferencia analítica primaria con DeepSeek V4 Pro con conmutación transparente a Llama 3.2 11B en caso de picos de latencia en NVIDIA NIM.'
      },
      {
        type: 'feat',
        scope: 'Servicio RAG',
        title: 'Respuestas contextuales dinámicas de Azure SQL',
        desc: 'El asistente identifica con precisión la consulta del usuario (tareas personales, conteo de OTs pendientes o preventivos programados) evitando respuestas genéricas.'
      }
    ]
  },
  {
    version: 'v2.8.0',
    prNumber: 26,
    prTitle: 'feat(inventory): catalogo maestro de codigos, recepciones de almacen SAP/canibalizacion $0, salidas por OT y kardex valorizado',
    prUrl: `${GITHUB_REPO_URL}/pull/26`,
    commitHash: '3330b63',
    commitUrl: `${GITHUB_REPO_URL}/commit/3330b63`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Major Feature',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    summary: 'Lanzamiento del módulo integral de gestión de inventarios y almacén: Catálogo maestro de códigos de repuesto, registro de Entradas con N° Guía/OC SAP y canibalización $0 USD, control de Salidas por mantenimiento y Kardex Consolidado con trazabilidad valorizada.',
    highlights: [
      'Pestaña de Catálogo & Stock Maestro con búsqueda rápida por código de repuesto, ubicación y stock crítico.',
      'Módulo de Entradas de Almacén con modal de registro para compras SAP y piezas canibalizadas a $0 USD.',
      'Módulo de Salidas por Mantenimiento con egresos y consumos vinculados a Órdenes de Trabajo.',
      'Kardex Consolidado cronológico con diferenciación visual de entradas (+) y salidas (-).',
      'Corrección visual de cobertura superior "glass" en formularios y modales de detalle.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Almacén & Kardex',
        title: 'Módulo de Entradas y Recepciones de Almacén',
        desc: 'Nuevo endpoint y modal para registrar ingresos de repuestos sumando stock disponible de forma atómica en MANSOLE.SpareParts y registrando la transacción.'
      },
      {
        type: 'feat',
        scope: 'Almacén & Kardex',
        title: 'Soporte Contable para Canibalización a $0 USD',
        desc: 'Permite ingresar piezas recuperadas de equipos en desuso a costo cero para trazabilidad en OTs sin distorsionar el balance contable en SAP.'
      },
      {
        type: 'feat',
        scope: 'Almacén & Kardex',
        title: 'Kardex Consolidado Multimovimiento',
        desc: 'Historial completo de entradas y salidas ordenadas cronológicamente con usuario responsable, motivo, fecha y documento de respaldo.'
      },
      {
        type: 'ui',
        scope: 'Modales & Detalle',
        title: 'Ajuste de fondo glass en cabeceras',
        desc: 'Ampliación de cobertura superior translúcida para eliminar espacios residuales de vistas previas en formularios y detalles.'
      }
    ]
  },
  {
    version: 'v2.7.0',
    prNumber: 25,
    prTitle: 'feat(ai): copiloto interactivo Mansito con RAG en Azure SQL y DeepSeek V4 Flash para consultas globales',
    prUrl: `${GITHUB_REPO_URL}/pull/25`,
    commitHash: 'bffdcb6',
    commitUrl: `${GITHUB_REPO_URL}/commit/bffdcb6`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Major AI',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    summary: 'Lanzamiento del copiloto y asistente de inteligencia artificial "Mansito", ubicado en la esquina inferior derecha, capaz de responder cualquier consulta sobre indicadores, usuarios, activos, repuestos y cronogramas de toda la plataforma.',
    highlights: [
      'Asistente de IA "Mansito" flotante y reactivo en la esquina inferior derecha.',
      'Consultas en lenguaje natural con RAG en vivo conectado a las tablas de Azure SQL (MANSOLE).',
      'Reporte conversacional de indicadores (KPIs), disponibilidad, MTBF, MTTR y paradas acumuladas.',
      'Auditoría y consulta de actividades, horas trabajadas y tareas por técnico o usuario específico.',
      'Diagnóstico de máquinas críticas, repuestos con stock bajo y piezas canibalizadas a $0 USD.'
    ],
    changes: [
      {
        type: 'ai',
        scope: 'Copiloto Mansito',
        title: 'Asistente IA permanente para toda la plataforma',
        desc: 'Widget flotante accesible desde cualquier módulo con memoria conversacional, sugerencias rápidas y renderizado Markdown.'
      },
      {
        type: 'feat',
        scope: 'Backend RAG',
        title: 'Endpoint POST /api/ai/mansito',
        desc: 'Recuperación de contexto multi-tabla (KPIs, Assets, Users, SpareParts, Schedule, WorkOrders) e inferencia con DeepSeek V4 Flash.'
      },
      {
        type: 'perf',
        scope: 'Resiliencia',
        title: 'Motor Experto de Reglas Offline (Fallback)',
        desc: 'Garantiza respuestas inmediatas incluso en caso de desconexión temporal de la API externa de IA.'
      }
    ]
  },
  {
    version: 'v2.6.0',
    prNumber: 24,
    prTitle: 'feat(dashboard, navbar): selector de periodo inicial/final en kpis, centro de notificaciones interactivo y registro de cambios',
    prUrl: `${GITHUB_REPO_URL}/pull/24`,
    commitHash: '68433db',
    commitUrl: `${GITHUB_REPO_URL}/commit/68433db`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Estable',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    summary: 'Incorporación de filtrado temporal avanzado en el Dashboard de KPIs, Centro de Notificaciones interactivo en Navbar y visor centralizado de versiones y Pull Requests.',
    highlights: [
      'Selector de rango de fechas (Desde / Hasta) con presets rápidos y recálculo dinámico de Disponibilidad y MTBF.',
      'Centro de Notificaciones en vivo con conteo reactivo de no leídas, acciones rápidas y cierre inteligente.',
      'Enlace de Registro de Cambios (Changelog) y visualización global de versión en toda la plataforma.',
      'Limpieza visual de la barra superior removiendo el badge redundante de Azure SQL.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Dashboard & KPIs',
        title: 'Selector de período inicial y final dinámico',
        desc: 'Permite filtrar el cálculo de KPIs por fechas personalizadas con recálculo dinámico de horas base (días * 24h) y accesos rápidos (Agosto 2026, Julio-Agosto, Últimos 30 días, Año 2026).'
      },
      {
        type: 'feat',
        scope: 'Navbar & Notificaciones',
        title: 'Centro de Notificaciones Interactivo',
        desc: 'Menú desplegable con alertas de planta (paradas críticas, preventivos por vencer, repuestos canibalizados $0, auditoría RBAC), marcado de leídas y eliminación individual.'
      },
      {
        type: 'feat',
        scope: 'Plataforma & Versión',
        title: 'Registro de Cambios (Changelog) y Versionado Global',
        desc: 'Modal interactivo con historial completo de Pull Requests, buscador de cambios por módulo y badges de versión v2.6.0 en Navbar, Sidebar y Landing.'
      },
      {
        type: 'ui',
        scope: 'Navbar',
        title: 'Eliminación de badge estático Azure SQL',
        desc: 'Se retiró el indicador no accionable para priorizar los accesos operativos del personal de planta.'
      }
    ]
  },
  {
    version: 'v2.5.2',
    prNumber: 23,
    prTitle: 'fix(landing): optimizar disenio responsivo y orden en vistas moviles y tabletas',
    prUrl: `${GITHUB_REPO_URL}/pull/23`,
    commitHash: '713ea8a',
    commitUrl: `${GITHUB_REPO_URL}/commit/713ea8a`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'UI/UX Mobile',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    summary: 'Refactorización responsiva integral de la página de aterrizaje (Landing) para teléfonos y tabletas industriales.',
    highlights: [
      'Eliminación total de desbordamientos horizontales en pantallas estrechas (< 640px).',
      'Reordenamiento jerárquico de la demostración interactiva de IA y la calculadora de retorno de inversión (ROI).'
    ],
    changes: [
      {
        type: 'ui',
        scope: 'Landing Page',
        title: 'Optimización móvil y tabletas',
        desc: 'Padding dinámico adaptado, tipografía escalable, botones de toque ergonómico y ajuste de grillas de 1 a 3 columnas según el ancho del dispositivo.'
      },
      {
        type: 'fix',
        scope: 'Landing Demo',
        title: 'Corrección de solapamiento en tabs interactivos',
        desc: 'Distribución responsiva de pestañas de demostración de OT, KPIs y Copiloto IA.'
      }
    ]
  },
  {
    version: 'v2.5.1',
    prNumber: 22,
    prTitle: 'feat(rbac): refactorizar matriz a arquitectura master-detail por rol con acordeones y switches de modulo',
    prUrl: `${GITHUB_REPO_URL}/pull/22`,
    commitHash: 'e14e49a',
    commitUrl: `${GITHUB_REPO_URL}/commit/e14e49a`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Seguridad & RBAC',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    summary: 'Reemplazo de la matriz masiva de columnas por una interfaz Master-Detail por rol con acordeones de módulos y switches individuales.',
    highlights: [
      'Escalabilidad infinita: soporte para más de 20 roles y decenas de capacidades sin scrolls horizontales infinitos.',
      'Control granular de permisos por módulo con interruptores reactivos y guardado atómico.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Seguridad & RBAC',
        title: 'Matriz Master-Detail con acordeones',
        desc: 'Panel izquierdo para seleccionar el rol operativo y panel derecho con tarjetas desplegables por cada uno de los 8 módulos del sistema.'
      },
      {
        type: 'security',
        scope: 'Auditoría',
        title: 'Trazabilidad de cambios de privilegios',
        desc: 'Confirmación visual de cambios de estado y sincronización con el backend sin recargas de página.'
      }
    ]
  },
  {
    version: 'v2.5.0',
    prNumber: 21,
    prTitle: 'feat(schedule, ui): vista interactiva de calendario mensual, fondos animados y acordeones en detalle de OT',
    prUrl: `${GITHUB_REPO_URL}/pull/21`,
    commitHash: '5e2af1d',
    commitUrl: `${GITHUB_REPO_URL}/commit/5e2af1d`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Major Feature',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    summary: 'Lanzamiento del Calendario Mensual Preventivo, acordeones colapsables en detalle de OT y ambientación cyber-industrial animada.',
    highlights: [
      'Vista de Calendario Mensual Preventivo con navegación mes a mes, chips de estado y reprogramación visual.',
      'Acordeones colapsables independientes en las 4 secciones de la OT (Descripción, IA, Tareas, Repuestos).',
      'Fondos animados de nodos de telemetría IoT sobre Canvas de alto rendimiento en Login y Landing.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Cronograma Preventivo',
        title: 'Vista interactiva de Calendario Mensual',
        desc: 'Visualización mensual tipo cuadrícula con conteo de preventivos por día, badges de criticidad y apertura directa de la OT.'
      },
      {
        type: 'ui',
        scope: 'Órdenes de Trabajo',
        title: 'Acordeón colapsable por segmentos en OT',
        desc: 'El operario puede expandir u ocultar individualmente cada bloque: Descripción, Diagnóstico IA, Tareas cronometradas y Repuestos consumidos.'
      },
      {
        type: 'ui',
        scope: 'Fondo Animado',
        title: 'Canvas de telemetría industrial y partículas IoT',
        desc: 'Simulación visual de nodos de sensores de planta en tiempo real con auroras atmosféricas sutiles.'
      }
    ]
  },
  {
    version: 'v2.4.0',
    prNumber: 20,
    prTitle: 'feat(ai, auth): integracion de DeepSeek V4 Flash (NVIDIA NIM) con RAG y refresco silencioso JWT',
    prUrl: `${GITHUB_REPO_URL}/pull/20`,
    commitHash: '056eed2',
    commitUrl: `${GITHUB_REPO_URL}/commit/056eed2`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Inteligencia Artificial',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    summary: 'Implementación del Asistente Diagnóstico IA potenciado por DeepSeek V4 Flash sobre microservicios NVIDIA NIM y RAG en Azure SQL.',
    highlights: [
      'RAG conectado a fallas históricas reales para sugerir causas probables y protocolos LOTO.',
      'Refresco proactivo y transparente del token JWT en background eliminando errores 401.'
    ],
    changes: [
      {
        type: 'ai',
        scope: 'Copiloto IA',
        title: 'Integración DeepSeek V4 Flash + RAG',
        desc: 'Generación contextual de diagnósticos basada en órdenes de trabajo pasadas del mismo activo o familia de equipos.'
      },
      {
        type: 'security',
        scope: 'Autenticación',
        title: 'Renovación de token JWT en segundo plano',
        desc: 'Interceptors de Axios y ciclo de vida en useAuth para renovar el token antes de su expiración.'
      }
    ]
  },
  {
    version: 'v2.3.0',
    prNumber: 19,
    prTitle: 'feat(workorders): cronometro de tareas, imputacion de repuestos por tarea y liquidacion de OT',
    prUrl: `${GITHUB_REPO_URL}/pull/19`,
    commitHash: 'caef4ef',
    commitUrl: `${GITHUB_REPO_URL}/commit/caef4ef`,
    date: '08 de Septiembre, 2026',
    isLatest: false,
    tag: 'Gestión de OTs',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    summary: 'Trazabilidad de tareas con control de tiempo y asignación directa de repuestos del almacén con validación de stock.',
    highlights: [
      'Cronómetros de ejecución por tarea (Iniciar, Pausar, Completar).',
      'Asignación de repuestos por tarea individual con alerta de stock insuficiente.',
      'Cálculo automatizado del tiempo total de parada combinando tiempos de respuesta y horas hombre.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Órdenes de Trabajo',
        title: 'Tareas cronometradas vinculadas al Catálogo',
        desc: 'Registro exacto de minutos trabajados por técnico con trazabilidad de inicio y fin.'
      },
      {
        type: 'feat',
        scope: 'Almacén & Repuestos',
        title: 'Consumo de repuestos por tarea',
        desc: 'Descuento automático en Kardex e imputación contable al Centro de Costo (CECO).'
      },
      {
        type: 'fix',
        scope: 'Flujo de Estados',
        title: 'Bloqueo de modificación en OTs liquidadas',
        desc: 'Reglas de negocio que impiden añadir repuestos o reabrir tareas en órdenes formalmente cerradas.'
      }
    ]
  },
  {
    version: 'v2.2.0',
    prNumber: 18,
    prTitle: 'feat(catalogs, sop): administracion de catalogos maestros y manual interactivo de procedimientos SOP',
    prUrl: `${GITHUB_REPO_URL}/pull/18`,
    commitHash: 'd45dcdb',
    commitUrl: `${GITHUB_REPO_URL}/commit/d45dcdb`,
    date: '07 de Septiembre, 2026',
    isLatest: false,
    tag: 'Catálogos & SOP',
    tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
    summary: 'Administración de catálogos base de planta y sistema interactivo de procedimientos operativos estándar (SOP).',
    highlights: [
      'CRUD de Activos, Actividades, Tipos de Mantenimiento y Centros de Costo (CECO).',
      'Manual de Procedimientos SOP integrado con protocolos LOTO obligatorios.'
    ],
    changes: [
      {
        type: 'feat',
        scope: 'Catálogos Maestros',
        title: 'Gestión centralizada de maestros de mantenimiento',
        desc: 'Pantallas para altas, bajas y modificaciones de catálogos con validación de unicidad de códigos.'
      },
      {
        type: 'feat',
        scope: 'SOP & Calidad',
        title: 'Modal Central de Procedimientos SOP',
        desc: 'Guías paso a paso para el personal de planta sobre protocolos LOTO, canibalización $0 y ciclo de vida de OTs.'
      }
    ]
  },
  {
    version: 'v2.1.0',
    prNumber: 17,
    prTitle: 'perf & ui: overhaul visual cyber-industrial, pool azure sql optimizado y caching de kpis',
    prUrl: `${GITHUB_REPO_URL}/pull/17`,
    commitHash: 'daef87c',
    commitUrl: `${GITHUB_REPO_URL}/commit/daef87c`,
    date: '07 de Septiembre, 2026',
    isLatest: false,
    tag: 'Rendimiento & UI',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
    summary: 'Optimización de rendimiento en consultas Azure SQL y renovación de diseño de interfaz de usuario.',
    highlights: [
      'Caché en memoria de 15 segundos para KPIs de disponibilidad y MTBF/MTTR.',
      'Skeleton loaders en todas las tablas para eliminar saltos de maquetación.'
    ],
    changes: [
      {
        type: 'perf',
        scope: 'Backend & Base de Datos',
        title: 'Pool de conexiones optimizado y caching reactivo',
        desc: 'Reducción de latencia de 240ms a <20ms en consultas recurrentes del Dashboard.'
      },
      {
        type: 'ui',
        scope: 'Diseño Global',
        title: 'Estilo Cyber-Industrial minimalista',
        desc: 'Paleta Slate/Indigo con contraste AA, tipografía legible y microinteracciones fluidas.'
      }
    ]
  },
  {
    version: 'v2.0.0',
    prNumber: 16,
    prTitle: 'feat(core): arquitectura RBAC con 6 perfiles industriales y sistema de toasts sonner',
    prUrl: `${GITHUB_REPO_URL}/pull/16`,
    commitHash: 'c1c698b',
    commitUrl: `${GITHUB_REPO_URL}/commit/c1c698b`,
    date: '02 de Septiembre, 2026',
    isLatest: false,
    tag: 'Lanzamiento Base',
    tagColor: 'bg-slate-100 text-slate-700 border-slate-300',
    summary: 'Lanzamiento de la arquitectura de seguridad por roles y control de acceso basado en capacidades industriales.',
    highlights: [
      '6 perfiles industriales: SuperAdmin, Jefe de Planta, Supervisor, Técnico Mecánico, Técnico Eléctrico y Almacenero.',
      'Sistema de notificaciones Toast no intrusivas con Sonner.',
      'Soporte completo de navegación móvil con Sidebar colapsable.'
    ],
    changes: [
      {
        type: 'security',
        scope: 'Seguridad RBAC',
        title: '6 perfiles de acceso con permisos restringidos',
        desc: 'Protección de rutas de negocio en Express y validación de capacidades en React.'
      },
      {
        type: 'ui',
        scope: 'Navegación Móvil',
        title: 'Drawer móvil con control táctil',
        desc: 'Menú lateral con telón de fondo adaptable a smartphones y tabletas de operarios.'
      }
    ]
  }
];
