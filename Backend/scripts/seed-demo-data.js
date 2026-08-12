const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');

async function seedData() {
    let pool;
    try {
        pool = await getDbConnection();
        console.log('Connected to database. Starting seed process...');

        let insertedActivities = 0;
        let insertedSpareParts = 0;
        let insertedAssetActivities = 0;
        let insertedWorkOrders = 0;
        let insertedTransactions = 0;

        // 1. Seed Activities (7 more)
        const activities = [
            { Name: 'Revisión de rodamientos motor principal', Type: 'Mecánico', EstimatedMinutes: 60, Resources: 'Extractor, Grasa litio' },
            { Name: 'Calibración de termocupla PT100', Type: 'Instrumentación', EstimatedMinutes: 45, Resources: 'Calibrador Fluke' },
            { Name: 'Inspección de tablero eléctrico y ajuste de bornes', Type: 'Eléctrico', EstimatedMinutes: 90, Resources: 'Destornillador aislado, Multímetro' },
            { Name: 'Cambio de aceite reductor corona sin fin', Type: 'Mecánico', EstimatedMinutes: 120, Resources: 'Aceite ISO 220, Bandeja' },
            { Name: 'Prueba de lazos de control PID', Type: 'Instrumentación', EstimatedMinutes: 180, Resources: 'Laptop, Cable comunicación' },
            { Name: 'Limpieza de filtros neumáticos', Type: 'Mecánico', EstimatedMinutes: 30, Resources: 'Trapos, Solvente' },
            { Name: 'Medición de aislamiento de motor', Type: 'Eléctrico', EstimatedMinutes: 60, Resources: 'Megóhmetro' }
        ];

        for (const act of activities) {
            const checkRes = await pool.request()
                .input('name', sql.NVarChar, act.Name)
                .query(`SELECT Id FROM MANSOLE.Activities WHERE Name = @name`);
            
            if (checkRes.recordset.length === 0) {
                await pool.request()
                    .input('name', sql.NVarChar, act.Name)
                    .input('type', sql.NVarChar, act.Type)
                    .input('estimatedMinutes', sql.Int, act.EstimatedMinutes)
                    .input('resources', sql.NVarChar, act.Resources)
                    .query(`
                        INSERT INTO MANSOLE.Activities (Name, Type, EstimatedMinutes, Resources)
                        VALUES (@name, @type, @estimatedMinutes, @resources)
                    `);
                insertedActivities++;
            }
        }

        // 2. Seed SpareParts (7 more)
        const spareParts = [
            { Code: 'REP-ROD-004', Name: 'Rodamiento 6204 ZZ', Description: 'Rodamiento rígido de bolas sellado', UnitOfMeasure: 'Und', CurrentStock: 15, MinStock: 5, Location: 'EST-A-01', UnitCost: 25.00, Condition: 'Nuevo' },
            { Code: 'REP-FIL-005', Name: 'Filtro de aire 1/2"', Description: 'Filtro regulador lubricador neumático', UnitOfMeasure: 'Und', CurrentStock: 8, MinStock: 2, Location: 'EST-B-02', UnitCost: 85.50, Condition: 'Nuevo' },
            { Code: 'REP-CON-006', Name: 'Contactor 220V 9A', Description: 'Contactor tripolar para motor', UnitOfMeasure: 'Und', CurrentStock: 12, MinStock: 4, Location: 'EST-C-01', UnitCost: 65.00, Condition: 'Nuevo' },
            { Code: 'REP-ACE-007', Name: 'Aceite ISO 220', Description: 'Aceite para reductores industriales', UnitOfMeasure: 'Gal', CurrentStock: 5, MinStock: 2, Location: 'ALM-LUB', UnitCost: 120.00, Condition: 'Nuevo' },
            { Code: 'REP-COR-008', Name: 'Correa en V B-52', Description: 'Correa de transmisión tipo V', UnitOfMeasure: 'Und', CurrentStock: 20, MinStock: 10, Location: 'EST-A-03', UnitCost: 35.00, Condition: 'Nuevo' },
            { Code: 'REP-PLC-009', Name: 'Módulo PLC Repotenciado', Description: 'Módulo de entradas digitales Siemens', UnitOfMeasure: 'Und', CurrentStock: 1, MinStock: 0, Location: 'EST-E-01', UnitCost: 450.00, Condition: 'Reacondicionado' },
            { Code: 'REP-TER-010', Name: 'Termocupla Tipo K', Description: 'Sensor de temperatura vaina inox', UnitOfMeasure: 'Und', CurrentStock: 6, MinStock: 2, Location: 'EST-C-02', UnitCost: 75.00, Condition: 'Nuevo' }
        ];

        for (const sp of spareParts) {
            const checkRes = await pool.request()
                .input('code', sql.NVarChar, sp.Code)
                .query(`SELECT Id FROM MANSOLE.SpareParts WHERE Code = @code`);
            
            if (checkRes.recordset.length === 0) {
                await pool.request()
                    .input('code', sql.NVarChar, sp.Code)
                    .input('name', sql.NVarChar, sp.Name)
                    .input('description', sql.NVarChar, sp.Description)
                    .input('uom', sql.NVarChar, sp.UnitOfMeasure)
                    .input('currentStock', sql.Decimal(18,2), sp.CurrentStock)
                    .input('minStock', sql.Decimal(18,2), sp.MinStock)
                    .input('location', sql.NVarChar, sp.Location)
                    .input('unitCost', sql.Decimal(18,2), sp.UnitCost)
                    .input('condition', sql.NVarChar, sp.Condition)
                    .query(`
                        INSERT INTO MANSOLE.SpareParts (Code, Name, Description, UnitOfMeasure, CurrentStock, MinStock, Location, UnitCost, Condition)
                        VALUES (@code, @name, @description, @uom, @currentStock, @minStock, @location, @unitCost, @condition)
                    `);
                insertedSpareParts++;
            }
        }

        // Fetch existing IDs to use for relationships
        const dbAssets = (await pool.request().query('SELECT Id, Code FROM MANSOLE.Assets')).recordset;
        const dbAreas = (await pool.request().query('SELECT Id FROM MANSOLE.Areas')).recordset;
        const dbActivities = (await pool.request().query('SELECT Id, Name FROM MANSOLE.Activities')).recordset;
        const dbSpareParts = (await pool.request().query('SELECT Id, Code FROM MANSOLE.SpareParts')).recordset;
        const dbUsers = (await pool.request().query('SELECT Id FROM MANSOLE.Users')).recordset;

        // 3. Seed AssetActivities (12 entries)
        if (dbAssets.length > 0 && dbActivities.length > 0 && dbAreas.length > 0) {
            const assetActivities = [
                { assetIdx: 0, actIdx: 0, freqType: 'Mensual', freqValue: 1, nextDue: '2026-07-20', lastExec: '2026-06-20' }, // Past
                { assetIdx: 1, actIdx: 1, freqType: 'Semanal', freqValue: 1, nextDue: '2026-08-10', lastExec: '2026-08-03' }, // Past
                { assetIdx: 2, actIdx: 2, freqType: 'Anual', freqValue: 1, nextDue: '2026-08-14', lastExec: '2025-08-14' }, // Prox
                { assetIdx: 3, actIdx: 3, freqType: 'Horómetro', freqValue: 500, nextDue: '2026-08-13', lastExec: '2026-05-10' }, // Prox
                { assetIdx: 0, actIdx: 4, freqType: 'Diaria', freqValue: 1, nextDue: '2026-08-15', lastExec: '2026-08-14' }, // Prox
                { assetIdx: 1, actIdx: 5, freqType: 'Semanal', freqValue: 2, nextDue: '2026-08-25', lastExec: '2026-08-11' }, // Fut
                { assetIdx: 2, actIdx: 6, freqType: 'Mensual', freqValue: 3, nextDue: '2026-09-10', lastExec: '2026-06-10' }, // Fut
                { assetIdx: 3, actIdx: 0, freqType: 'Mensual', freqValue: 6, nextDue: '2026-10-01', lastExec: '2026-04-01' }, // Fut
                { assetIdx: 0, actIdx: 1, freqType: 'Anual', freqValue: 2, nextDue: '2027-01-15', lastExec: '2025-01-15' }, // Fut
                { assetIdx: 1, actIdx: 2, freqType: 'Diaria', freqValue: 1, nextDue: '2026-08-01', lastExec: '2026-07-31' }, // Past
                { assetIdx: 2, actIdx: 3, freqType: 'Horómetro', freqValue: 1000, nextDue: '2026-08-20', lastExec: '2026-01-15' }, // Fut
                { assetIdx: 3, actIdx: 4, freqType: 'Semanal', freqValue: 1, nextDue: '2026-08-12', lastExec: '2026-08-05' }  // Today
            ];

            for (const aa of assetActivities) {
                const assetId = dbAssets[aa.assetIdx % dbAssets.length].Id;
                const areaId = dbAreas[aa.assetIdx % dbAreas.length].Id;
                const activityId = dbActivities[aa.actIdx % dbActivities.length].Id;

                const checkRes = await pool.request()
                    .input('assetId', sql.Int, assetId)
                    .input('activityId', sql.Int, activityId)
                    .query(`SELECT Id FROM MANSOLE.AssetActivities WHERE AssetId = @assetId AND ActivityId = @activityId`);

                if (checkRes.recordset.length === 0) {
                    await pool.request()
                        .input('assetId', sql.Int, assetId)
                        .input('areaId', sql.Int, areaId)
                        .input('activityId', sql.Int, activityId)
                        .input('freqType', sql.NVarChar, aa.freqType)
                        .input('freqValue', sql.Int, aa.freqValue)
                        .input('nextDue', sql.Date, aa.nextDue)
                        .input('lastExec', sql.Date, aa.lastExec)
                        .query(`
                            INSERT INTO MANSOLE.AssetActivities (AssetId, AreaId, ActivityId, FrequencyType, FrequencyValue, NextDueDate, LastExecutionDate)
                            VALUES (@assetId, @areaId, @activityId, @freqType, @freqValue, @nextDue, @lastExec)
                        `);
                    insertedAssetActivities++;
                }
            }
        }

        // 4. Seed WorkOrders (15 entries)
        if (dbAssets.length > 0 && dbAreas.length > 0 && dbUsers.length > 0) {
            const wos = [];
            const statuses = ['Pendiente', 'En Progreso', 'Iniciado en Planta', 'Finalizada', 'Cerrada'];
            const priorities = ['Alta', 'Normal', 'Baja', 'Urgente'];
            const types = ['Preventivo', 'Correctivo'];
            
            for (let i = 1; i <= 15; i++) {
                const codeNum = i.toString().padStart(3, '0');
                const isCorrectivo = i % 3 === 0;
                
                const wo = {
                    Code: `OT-2026-${codeNum}`,
                    AssetId: dbAssets[i % dbAssets.length].Id,
                    AreaId: dbAreas[i % dbAreas.length].Id,
                    Type: types[isCorrectivo ? 1 : 0],
                    Priority: priorities[i % 4],
                    Status: statuses[i % 5],
                    ScheduledDate: `2026-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
                    ExecutionDate: (i % 5 === 3 || i % 5 === 4) ? `2026-08-${(i % 28 + 2).toString().padStart(2, '0')}` : null,
                    DowntimeMinutes: isCorrectivo ? (i * 30) % 480 : 0,
                    Description: isCorrectivo ? 'Falla reportada en equipo, pérdida de presión' : 'Mantenimiento preventivo rutinario',
                    LaborCost: 50 + (i * 20),
                    TotalCost: 100 + (i * 50),
                    CreatedByUserId: dbUsers[i % 3].Id
                };
                wos.push(wo);
            }

            for (const wo of wos) {
                const checkRes = await pool.request()
                    .input('code', sql.NVarChar, wo.Code)
                    .query(`SELECT Id FROM MANSOLE.WorkOrders WHERE Code = @code`);
                
                if (checkRes.recordset.length === 0) {
                    const req = pool.request()
                        .input('code', sql.NVarChar, wo.Code)
                        .input('assetId', sql.Int, wo.AssetId)
                        .input('areaId', sql.Int, wo.AreaId)
                        .input('type', sql.NVarChar, wo.Type)
                        .input('priority', sql.NVarChar, wo.Priority)
                        .input('status', sql.NVarChar, wo.Status)
                        .input('scheduledDate', sql.Date, wo.ScheduledDate)
                        .input('downtime', sql.Int, wo.DowntimeMinutes)
                        .input('description', sql.NVarChar, wo.Description)
                        .input('laborCost', sql.Decimal(18,2), wo.LaborCost)
                        .input('totalCost', sql.Decimal(18,2), wo.TotalCost)
                        .input('createdBy', sql.Int, wo.CreatedByUserId);
                    
                    if (wo.ExecutionDate) {
                        req.input('executionDate', sql.Date, wo.ExecutionDate);
                        await req.query(`
                            INSERT INTO MANSOLE.WorkOrders (Code, AssetId, AreaId, Type, Priority, ScheduledDate, ExecutionDate, DowntimeMinutes, Description, Status, LaborCost, TotalCost, CreatedByUserId)
                            VALUES (@code, @assetId, @areaId, @type, @priority, @scheduledDate, @executionDate, @downtime, @description, @status, @laborCost, @totalCost, @createdBy)
                        `);
                    } else {
                        await req.query(`
                            INSERT INTO MANSOLE.WorkOrders (Code, AssetId, AreaId, Type, Priority, ScheduledDate, DowntimeMinutes, Description, Status, LaborCost, TotalCost, CreatedByUserId)
                            VALUES (@code, @assetId, @areaId, @type, @priority, @scheduledDate, @downtime, @description, @status, @laborCost, @totalCost, @createdBy)
                        `);
                    }
                    insertedWorkOrders++;
                }
            }
        }

        // 5. Seed InventoryTransactions (10 entries)
        if (dbSpareParts.length > 0 && dbUsers.length > 0) {
            const transType = ['IN', 'OUT'];
            const reasonsIn = ['Compra SAP', 'Hallazgo', 'Canibalización'];
            const reasonsOut = ['Consumo OT', 'Ajuste'];

            const txs = [];
            for (let i = 1; i <= 10; i++) {
                const isIn = i % 2 === 0;
                txs.push({
                    SparePartId: dbSpareParts[i % dbSpareParts.length].Id,
                    TransactionType: transType[isIn ? 0 : 1],
                    Reason: isIn ? reasonsIn[i % reasonsIn.length] : reasonsOut[i % reasonsOut.length],
                    Quantity: (i % 5) + 1,
                    UnitCost: 25.00 * i,
                    Date: `2026-08-0${(i%9)+1}T10:00:00Z`,
                    UserId: dbUsers[i % dbUsers.length].Id,
                    Reference: isIn ? `SAP-45000123${i}` : `OT-2026-00${i}`
                });
            }

            for (const tx of txs) {
                const checkRes = await pool.request()
                    .input('ref', sql.NVarChar, tx.Reference)
                    .input('spId', sql.Int, tx.SparePartId)
                    .query(`SELECT Id FROM MANSOLE.InventoryTransactions WHERE Reference = @ref AND SparePartId = @spId`);
                
                if (checkRes.recordset.length === 0) {
                    await pool.request()
                        .input('spId', sql.Int, tx.SparePartId)
                        .input('txType', sql.NVarChar, tx.TransactionType)
                        .input('reason', sql.NVarChar, tx.Reason)
                        .input('qty', sql.Decimal(18,2), tx.Quantity)
                        .input('unitCost', sql.Decimal(18,2), tx.UnitCost)
                        .input('date', sql.DateTime, tx.Date)
                        .input('userId', sql.Int, tx.UserId)
                        .input('ref', sql.NVarChar, tx.Reference)
                        .query(`
                            INSERT INTO MANSOLE.InventoryTransactions (SparePartId, TransactionType, Reason, Quantity, UnitCost, Date, UserId, Reference)
                            VALUES (@spId, @txType, @reason, @qty, @unitCost, @date, @userId, @ref)
                        `);
                    insertedTransactions++;
                }
            }
        }

        console.log('--- SEED SUMMARY ---');
        console.log(`Activities inserted: ${insertedActivities}`);
        console.log(`SpareParts inserted: ${insertedSpareParts}`);
        console.log(`AssetActivities inserted: ${insertedAssetActivities}`);
        console.log(`WorkOrders inserted: ${insertedWorkOrders}`);
        console.log(`InventoryTransactions inserted: ${insertedTransactions}`);
        console.log('Seed completed successfully.');

    } catch (err) {
        console.error('Error in seed process:', err);
        process.exit(1);
    }
    process.exit(0);
}

seedData();
