# Análisis del esquema MANSOLE — mapeo entre familias de tablas

**Base:** `soledb-puntoventa` · **Esquema:** `MANSOLE` · **Verificado en vivo:** 2026-08-11

---

## Resumen ejecutivo

El esquema `MANSOLE` contiene **36 tablas de tres generaciones distintas** que conviven sin
relación entre sí. La aplicación consulta únicamente la generación de demo, por lo que
**los 10 meses de operación real (540 órdenes de trabajo, 106 activos) son invisibles
para la plataforma.**

Ninguna de las dos familias principales es superior a la otra:

- La familia **española** tiene los **datos**, y un modelo de activos más rico
  (centro de costo, cuenta contable, proveedor, garantía, frecuencia preventiva, lecturas).
- La familia **inglesa** tiene el **modelo mejor diseñado** (tipos correctos, decimales para
  dinero, tablas de unión, control de stock), pero está vacía.

La decisión no es "cuál usar" sino **qué se conserva de cada una**.

---

## Las tres generaciones

| Generación | Convención | PK | Estado |
|---|---|---|---|
| **1. Española** | `ActivoID`, `OTID`, `PascalCase` con prefijo de entidad | `nvarchar` | **Datos reales de producción** |
| **2. Inglesa** | `Assets`, `WorkOrders`, `PascalCase` | `int` identity | Semillas de demo (3-4 filas) |
| **3. Supabase-style** | `plantas`, `profiles`, `snake_case` | `uniqueidentifier` | **Totalmente vacía** — abandonada |

La generación 3 (`plantas`, `profiles`, `categorias_activos`) no tiene una sola fila y ningún
código la referencia. **Candidata a eliminar.**

---

## Inventario con volumen real

### Familia española — datos de producción

| Tabla | Filas | Contenido |
|---|---|---|
| `OrdenTrabajo` | **540** | OTs, oct-2025 a jul-2026 |
| `OrdenTrabajoTareas` | **625** | Checklists ejecutados por OT |
| `Partes` | **531** | Catálogo de partes |
| `OrdenTrabajoAdjuntos` | **497** | Fotos y evidencias |
| `OrdenTrabajoObservaciones` | **466** | Comentarios de técnicos |
| `Tareas` | **377** | Catálogo maestro de tareas |
| `OrdenTrabajoComponentes` | **303** | Consumo de repuestos por OT |
| `CeCoste` | **152** | Centros de costo |
| `Activos` | **106** | Activos de planta |
| `Componentes` | **82** | Componentes |
| `Usuarios` | **9** | Usuarios reales |
| `ActivosUbicacion` | 6 | Ubicaciones |
| `UsuariosPerfiles` | 6 | Perfiles/roles reales |
| `ActivosAdjuntos` | 3 | Documentos de activos |

### Familia inglesa — lo que consulta el código

| Tabla | Filas | La consulta |
|---|---|---|
| `Assets` | 4 | `assetRoutes`, `kpiRoutes`, `workOrderRoutes`, `scheduleRoutes` |
| `Roles` | 4 | `authRoutes` |
| `Users` | 4 | `authRoutes` (hashes inválidos de 59 caracteres) |
| `Areas` | 4 | `assetRoutes`, `kpiRoutes`, `scheduleRoutes` |
| `AssetCategories` | 4 | `assetRoutes` |
| `Activities` | 3 | `activityRoutes`, `scheduleRoutes` |
| `SpareParts` | 3 | `inventoryRoutes` |
| `AuditLogs` | 1 | `authMiddleware` |
| `WorkOrders` | **0** | `workOrderRoutes`, `kpiRoutes` |
| `AssetActivities` | **0** | `scheduleRoutes` (por eso el cronograma sale vacío) |
| `InventoryTransactions` | **0** | `inventoryRoutes` |
| `WorkOrderTasks` | **0** | nadie |
| `WorkOrderTechnicians` | **0** | nadie |
| `WorkOrderSpareParts` | **0** | nadie |
| `Attachments` | **0** | nadie |
| `AssetSpareParts` | **0** | nadie |
| `ActivityAreas` / `ActivityCategories` | **0** | `activityRoutes` |

---

## Mapeo campo por campo

### Activos → Assets
La española **gana**: 22 columnas contra 12, con todo lo contable y lo preventivo.

| `Activos` (real) | `Assets` (código) | Nota |
|---|---|---|
| `ActivoID` nvarchar | `Id` int + `Code` nvarchar | **PK incompatible** (ver calidad de datos) |
| `ActivoNombre` | `Name` | directo |
| `ActivoTipo` | `CategoryId` → `AssetCategories` | texto vs FK |
| `ActivoDescripcion` | — | **se perdería** |
| `ActivoStatus` | `Status` | directo |
| `ActivoUbicacion` | `AreaId` → `Areas` | texto vs FK |
| `ActivoCoordenadas` | — | **se perdería** (GPS) |
| `ActivoResponsable` | — | **se perdería** |
| `ActivoCeCo` | `Areas.CostCenterCode` | indirecto vía área |
| `ActivoCuentaContable` | — | **se perdería** |
| `ActivoFechaCompra` / `ActivoValorCompra` | `AcquisitionDate` / — | valor **se perdería** |
| `ActivoProveedor` | — | **se perdería** |
| `ActivoGarantia` | — | **se perdería** |
| `ActivoFrecuenciaCantidad` / `ActivoFrecuenciaTipo` | `AssetActivities.FrequencyValue`/`FrequencyType` | equivalente |
| `ActivoRegistrarLecturas` | — | **se perdería** (horómetro) |
| `ActivoTiempoProgramadoPorDia`, `ActivoTiempoCantidad` | — | **se perdería** |
| — | `Brand`, `Model`, `SerialNumber`, `ParentAssetId` | la inglesa aporta jerarquía y ficha técnica |

### OrdenTrabajo → WorkOrders
La inglesa **gana** en la cabecera; la española gana con sus tablas hijas.

| `OrdenTrabajo` (real) | `WorkOrders` (código) | Nota |
|---|---|---|
| `OTID` nvarchar (`003FC7FD`) | `Id` int + `Code` | PK incompatible |
| `OTTipo` | `Type` | Preventivo/Correctivo/Actividad Fecha |
| `ActivoID` | `AssetId` | FK |
| `OTTecnicosResponsables` nvarchar | `WorkOrderTechnicians` (tabla) | **string delimitado vs tabla de unión** |
| `OTCriticidad` | `Priority` | directo |
| `OTStatus` | `Status` | directo |
| `OTFechaCreacion` | `CreatedAt` | directo |
| `OTUsuarioCreacion` | `CreatedByUserId` | texto vs FK |
| — | `Description` | **la real no tiene descripción** |
| — | `ScheduledDate`, `ExecutionDate` | **la real no las tiene** |
| — | `DowntimeMinutes` | **la real no lo tiene** (mata el MTTR) |
| — | `LaborCost`, `TotalCost` | **la real no tiene costos** |
| — | `AiDiagnosis` | la real no lo tiene |
| `OrdenTrabajoTareas` (625) | `WorkOrderTasks` (0) | la real tiene fechas inicio/fin, imagen final, usuario asignado |
| `OrdenTrabajoComponentes` (303) | `WorkOrderSpareParts` (0) | cantidad como nvarchar |
| `OrdenTrabajoObservaciones` (466) | — | **no existe en la inglesa** |
| `OrdenTrabajoAdjuntos` (497) | `Attachments` (0) | |

### Tareas → Activities
La española **gana**.

| `Tareas` (real) | `Activities` (código) |
|---|---|
| `TareaID` nvarchar | `Id` int |
| `TareaDescripcion` | `Name` |
| `TareaTipo` | `Type` |
| `TareaTiempoEstandar` int | `EstimatedMinutes` |
| `TareaEspecialidad` | — **se perdería** (mecánico/eléctrico) |
| `TareaCodigoTiempo` | — **se perdería** |
| — | `Resources` |

### Partes / Componentes → SpareParts
La inglesa **gana con diferencia**. Esto es el hallazgo más serio del inventario.

| `Partes` (real, 531) | `SpareParts` (código) |
|---|---|
| `ParteID`, `ParteTipo`, `ParteDescripcion` | `Code`, `Name`, `Description` |
| — | `CurrentStock` **no existe en la real** |
| — | `MinStock` **no existe** |
| — | `UnitCost` **no existe** |
| — | `UnitOfMeasure` **no existe** |
| — | `Location` **no existe** |
| — | `Condition` **no existe** (nuevo/canibalizado) |

> **La familia española no tiene control de inventario.** `Partes` es solo un catálogo
> descriptivo: sin stock, sin costo, sin mínimos, sin ubicación. Toda la funcionalidad de
> almacén y de canibalización a $0 vive únicamente en el modelo inglés, que está vacío.

### Usuarios → Users

| `Usuarios` (real, 9) | `Users` (código, 4) |
|---|---|
| `UsuarioID` nvarchar (`dchipana`) | `Id` int |
| `UsuarioNombre` | `FirstName` + `LastName` |
| `UsuarioContraseña` **texto plano** | `PasswordHash` bcrypt |
| `UsuarioPerfil` (`9fd38f4b` → `UsuariosPerfiles`) | `RoleId` → `Roles` |
| `UsuarioStatus` | `IsActive` bit |
| `UsuarioTelefono`, `UsuarioFoto`, `UsuarioVer` | — se perderían |
| — | `Email` **la real no tiene email** |

Consecuencias directas:
1. **El login por email es imposible** contra `Usuarios`: habría que autenticar por `UsuarioID`.
2. Las contraseñas están **sin hashear** (8 de 9 tienen 3 caracteres).
3. Los perfiles reales son 6 y **no coinciden** con el mapa de `permissions.js`:

| Perfil real | ¿Está en `permissions.js`? |
|---|---|
| Administrador | ✅ |
| Coordinador de Mantenimiento y Producción | ❌ |
| Analista de Planeamiento | ❌ |
| Asistente Mantenimiento | ❌ |
| Técnico Mecánico | ❌ |
| Técnico Electricista | ❌ |

`getPermissionsForRole` falla cerrado, así que hoy un usuario real entraría **sin ningún permiso**.

---

## Calidad de los datos reales

| Hallazgo | Medición | Gravedad |
|---|---|---|
| `ActivoID` con formato mixto | 73 códigos (`TE00000031`) + **33 nombres libres** (`Cortadora de manguera 2`) | **Alta** — la PK no es sistemática |
| CeCo roto | **84 de 106 activos** apuntan a un `CeCoste` inexistente | **Alta** — el control contable no cierra |
| Estados duplicados | `Finalizada` (434) y `Completada` (95) significan lo mismo | Media |
| Todo es `nvarchar` | `ActivoValorCompra` y `OTCantidad` son texto, no decimales | Media |
| OTs huérfanas | 3 de 540 (0,6%) | Baja |
| Tareas huérfanas | 0 de 625 | — |

La integridad OT↔Tareas es perfecta y la OT↔Activos casi perfecta: **los datos son
confiables**. Los problemas están en la llave de activos, el enlace contable y los tipos.

---

## Recomendación

**Híbrido, en dos fases.** Ninguna migración en un solo sentido funciona: la española tiene
los datos y la ficha de activos, la inglesa tiene el control de inventario y las métricas.

**Fase A — dejar de mentir (rápido).** Repuntar las rutas de lectura a las tablas españolas
para que la plataforma muestre las 540 OTs y los 106 activos reales. Sin migrar nada, sin
tocar la base. La plataforma pasa de decorativa a útil.

**Fase B — cerrar los huecos del modelo.** Agregar a las tablas españolas lo que solo existe
en el modelo inglés: stock/costo/mínimos de repuestos, fechas programada y de ejecución de
OT, minutos de parada y costos. Sin eso no hay MTTR, ni disponibilidad, ni almacén.

**Antes de cualquiera de las dos**, tres correcciones que no dependen de la decisión:
1. Hashear las contraseñas de `Usuarios` (script aparte).
2. Alinear los 6 perfiles reales en `permissions.js`.
3. Normalizar `ActivoID` y el enlace de `CeCoste`, o el reporte contable nunca cerrará.

**Eliminar** la generación 3 (`plantas`, `profiles`, `categorias_activos`): 0 filas, 0 código.
