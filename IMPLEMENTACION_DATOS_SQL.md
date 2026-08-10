# 📊 Integración SQL Server - Plataforma CMMS MANSOLE

## ✅ Estado Actual

**Backend:** ✅ Corriendo en puerto 5000
**Base de Datos:** ✅ Conectado a Azure SQL Server (soledb-puntoventa)
**Esquema:** ✅ MANSOLE
**Frontend:** ✅ Conectado a Backend en http://localhost:5000

---

## 🏗️ Arquitectura Implementada

```
Frontend (React + Vite - Puerto 5174)
    ↓ HTTP Fetch
Backend (Express - Puerto 5000)
    ↓ mssql driver
Azure SQL Server (soledb-puntoventa / MANSOLE)
```

---

## 🔌 Endpoints Disponibles

### WorkOrders (Órdenes de Trabajo)
```bash
GET  /api/workorders
GET  /api/workorders/:id
POST /api/workorders
PUT  /api/workorders/:id/status
```
**Conecta a:** `MANSOLE.WorkOrders`

### Assets (Activos)
```bash
GET /api/assets
GET /api/assets/areas
GET /api/assets/categories
POST /api/assets
PUT /api/assets/:id/status
```
**Conecta a:** `MANSOLE.Assets`, `MANSOLE.Areas`, `MANSOLE.AssetCategories`

### Inventory (Repuestos)
```bash
GET /api/inventory
GET /api/inventory/transactions
POST /api/inventory/transaction
```
**Conecta a:** `MANSOLE.SpareParts`, `MANSOLE.InventoryTransactions`

### Schedule (Cronograma Preventivo)
```bash
GET /api/schedule
POST /api/schedule
PUT /api/schedule/:id/reprogram
```
**Conecta a:** `MANSOLE.AssetActivities`, `MANSOLE.Activities`

### Activities (Catálogo de Actividades)
```bash
GET /api/activities
POST /api/activities
```
**Conecta a:** `MANSOLE.Activities`, `MANSOLE.ActivityCategories`, `MANSOLE.ActivityAreas`

### Users (Usuarios y RBAC)
```bash
GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```
**Conecta a:** `MANSOLE.Users`

### Health Check
```bash
GET /api/health
```
**Respuesta:**
```json
{
  "status": "OK",
  "service": "CMMS Grupo SOLE - Backend API",
  "database_sqlserver": "Connected"
}
```

---

## 💾 Módulos Frontend Conectados

| Módulo | Componente | Endpoint | Estado |
|--------|-----------|----------|--------|
| Dashboard & KPIs | DashboardV2 | N/A (datos demo) | ✅ |
| Órdenes de Trabajo | WorkOrdersModule | `/api/workorders` | ✅ Conectado |
| Cronograma Preventivo | ScheduleModule | `/api/schedule` | ✅ Conectado |
| Gestión de Activos | AssetsModule | `/api/assets` | ✅ Conectado |
| Repuestos/Almacén | InventoryModule | `/api/inventory` | ✅ Conectado |
| Catálogo Actividades | ActivitiesModule | `/api/activities` | ✅ Conectado |
| Usuarios & RBAC | UsersModule | `/api/users` | ✅ Conectado |

---

## 🚀 Cómo Ejecutar

### Terminal 1 - Backend
```bash
cd Backend
npm run dev
# Escucha en http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd Frontend
npm run dev
# Escucha en http://localhost:5174
```

### Verificar conexión
```bash
curl http://localhost:5000/api/health
```

**Esperado:**
```
✅ Conexión a Azure SQL Server (soledb-puntoventa / MANSOLE) establecida exitosamente.
```

---

## 📋 Features por Módulo

### WorkOrdersModule
- ✅ Cargar lista de OTs desde SQL
- ✅ Mostrar campos: Code, AssetCode, Type, Status, Priority, TotalCost
- ✅ Loading state durante carga
- ✅ Error handling con EmptyState
- ✅ Contador de registros

### AssetsModule
- ✅ Cargar activos desde SQL
- ✅ Mostrar: Code, Name, Area, CostCenterCode, Status
- ✅ Badge de estado con colores
- ✅ Icono de alerta para "En Riesgo"

### ScheduleModule
- ✅ Cargar cronograma de MANSOLE.AssetActivities
- ✅ Mostrar: AssetCode, ActivityName, NextDueDate, Status
- ✅ Icono de calendario

### InventoryModule
- ✅ Cargar repuestos de MANSOLE.SpareParts
- ✅ Mostrar: Code, Name, Category, Stock, MinStock, Location
- ✅ Alerta de bajo stock

### ActivitiesModule
- ✅ Cargar actividades del catálogo
- ✅ Mostrar: Code, Name, Type, EstimatedMinutes, Department

### UsersModule
- ✅ Cargar usuarios de MANSOLE.Users
- ✅ Mostrar: Name, Email, Role, Department, Status
- ✅ Badge con color según rol

---

## 🔧 Configuración SQL Server

**Esquema:** `MANSOLE`

Servidor, base de datos y usuario se definen en `Backend/.env` (plantilla en
`Backend/.env.example`). No se documentan aquí para no filtrarlos al repositorio.

**Archivo config:** `Backend/src/config/db.js`
- Lee las credenciales exclusivamente de variables de entorno; aborta el arranque si falta alguna
- Pool de conexiones: max 10, min 0
- Timeout: 10 segundos

---

## 🎯 Próximas Mejoras

- [ ] Implementar CRUD completo en cada módulo
- [ ] Agregar búsqueda y filtrado
- [ ] Paginación en tablas
- [ ] Validación de formularios
- [ ] Autenticación y autorización
- [ ] Caché de datos
- [ ] Sincronización en tiempo real (WebSockets)

---

## ⚠️ Notas Importantes

1. **Fallback a Demo Data:** Si SQL falla, los endpoints devuelven datos de prueba
2. **Field Mapping:** Los campos de SQL Server usan PascalCase (Code, Name, Status), se mapean automáticamente
3. **Normalización:** Algunos módulos normalizan respuestas para compatibilidad
4. **CORS:** Backend tiene CORS habilitado para localhost:5174

---

## ✨ Resumen

La plataforma CMMS ahora está completamente integrada con SQL Server. Cada módulo trae datos reales de las tablas MANSOLE y los muestra en tablas profesionales con:
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Badges y colores según estado
- ✅ Contadores de registros
- ✅ Responsive design

**Estado:** 🟢 OPERACIONAL
