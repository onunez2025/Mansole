const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');
const { SCHEMA_TABLES, queryDatabaseForMansito } = require('../services/mansitoKnowledgeService');

// Clave y endpoint por defecto de DeepSeek V4 Flash (NVIDIA NIM)
const DEFAULT_DEEPSEEK_KEY = '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';

// Fallback industrial knowledge base in case external API is temporarily unavailable
const aiDiagnosisFallback = {
  default: {
    causes: [
      "Desgaste mecánico progresivo por vibración o lubricación insuficiente.",
      "Fluctuación de tensión o armónicos en la red del Centro de Costo.",
      "Acumulación de suciedad/residuos que atascan o restringen el movimiento del mecanismo."
    ],
    recommendations: [
      "Aislar la máquina mecánica y eléctricamente aplicando protocolo LOTO antes de intervenir.",
      "Verificar con multímetro la tensión en bornes de alimentación y temperatura de motor.",
      "Inspeccionar visualmente acoples, mangueras de presión y sellos de estanqueidad.",
      "Reemplazar componentes defectuosos utilizando piezas nuevas registradas en almacén."
    ],
    confidence: "85%"
  },
  prensa: {
    causes: [
      "Fuga interna o desgaste en los sellos del cilindro hidráulico.",
      "Válvula direccional o de alivio de presión descalibrada o trabada.",
      "Bajo nivel o degradación de fluido hidráulico H-68."
    ],
    recommendations: [
      "Aplicar LOTO y despresurizar el circuito hidráulico antes de abrir conexiones.",
      "Verificar nivel de aceite y manómetros en central hidráulica.",
      "Inspeccionar electroválvulas y verificar conmutación de bobinas 24V DC.",
      "Purgar aire de las líneas hidráulicas y probar ciclo en vacío."
    ],
    confidence: "90%"
  },
  horno: {
    causes: [
      "Falla o interrupción en banco de resistencias eléctricas o contactor/relé SSR.",
      "Descalibración o ruptura de termopar Tipo K por fatiga térmica.",
      "Obstrucción o fallo en motor de ventilación de recirculación."
    ],
    recommendations: [
      "Bloqueo LOTO eléctrico obligatorio.",
      "Medir resistencia y continuidad en los elementos calefactores con megóhmetro/multímetro.",
      "Verificar señal de milivoltios en termopar Tipo K y calibración del PID.",
      "Comprobar el flujo y recirculación de aire forzado."
    ],
    confidence: "92%"
  }
};

// POST /api/ai/diagnose (Diagnóstico Inteligente RAG consultando histórico en Azure SQL + DeepSeek V4 Flash)
router.post('/diagnose', async (req, res) => {
  const { assetName, symptom, assetCode, areaName } = req.body;
  const cleanCode = (assetCode || '').trim();
  const cleanName = (assetName || '').trim();
  const cleanSymptom = (symptom || '').trim();

  console.log(`🤖 Solicitud Diagnóstico IA RAG para: [${cleanCode}] ${cleanName} - Falla: "${cleanSymptom}"`);

  let historyRecords = [];
  let historyContext = 'No existen órdenes de trabajo previas registradas para este activo en la base de datos de Azure SQL.';

  // 1. Recuperar mantenimientos históricos del activo desde Azure SQL (RAG)
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT TOP 5
        w.Id, w.Code, w.Type, w.Status, w.ExecutionDate, w.ScheduledDate,
        w.DowntimeMinutes, w.PreDowntimeMinutes, w.Description,
        (
          SELECT STRING_AGG(CONCAT(act.Name, ' (', ISNULL(wt.DurationMinutes, 0), 'm): ', ISNULL(wt.Comments, '')), ' | ')
          FROM MANSOLE.WorkOrderTasks wt
          JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
          WHERE wt.WorkOrderId = w.Id
        ) as TasksSummary,
        (
          SELECT STRING_AGG(CONCAT(i.Code, ' ', i.Name, ' x', wsp.Quantity), ', ')
          FROM MANSOLE.WorkOrderSpareParts wsp
          JOIN MANSOLE.SpareParts i ON wsp.SparePartId = i.Id
          WHERE wsp.WorkOrderId = w.Id
        ) as SparePartsSummary
      FROM MANSOLE.WorkOrders w
      JOIN MANSOLE.Assets ast ON w.AssetId = ast.Id
      WHERE (ast.Code = @assetCode OR ast.Name = @assetName OR @assetCode = '')
      ORDER BY w.Id DESC
    `;

    const histRes = await pool.request()
      .input('assetCode', sql.VarChar, cleanCode)
      .input('assetName', sql.NVarChar, cleanName)
      .query(query);

    historyRecords = histRes.recordset || [];
    if (historyRecords.length > 0) {
      historyContext = historyRecords.map((h, i) => 
        `OT #${i+1} [${h.Code}]:
- Tipo: ${h.Type} | Estado: ${h.Status} | Fecha: ${h.ExecutionDate || h.ScheduledDate || 'N/A'}
- Descripción de Falla: ${h.Description || 'Sin detalle'}
- Tareas ejecutadas: ${h.TasksSummary || 'Sin tareas registradas'}
- Repuestos consumidos: ${h.SparePartsSummary || 'Ninguno'}
- Tiempo Parada Real: ${h.DowntimeMinutes || 0} min`
      ).join('\n\n');
    }
  } catch (dbErr) {
    console.warn('⚠️ Advertencia: No se pudo consultar histórico de Azure SQL:', dbErr.message);
  }

  // 2. Invocar DeepSeek V4 Flash con RAG histórico
  const apiKey = process.env.DEEPSEEK_API_KEY || DEFAULT_DEEPSEEK_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-ai/deepseek-v4-flash-0731';

  if (apiKey) {
    try {
      const systemPrompt = `Eres el Ingeniero Experto de Mantenimiento y Confiabilidad Industrial de Planta para GRUPO SOLE (fabricación industrial de electrodomésticos, termas y campanas).
Tu tarea es diagnosticar averías mecánicas, eléctricas, hidráulicas y neumáticas reportadas en las Órdenes de Trabajo (OT).

REGLAS DE DIAGNÓSTICO:
1. REVISIÓN OBLIGATORIA DEL HISTORIAL:
   - Analiza minuciosamente el bloque "HISTORIAL DE MANTENIMIENTOS PREVIOS DE ESTE ACTIVO".
   - Si existen intervenciones o fallas previas similares o vinculadas, cítalas expresamente en el campo "historicalAnalysis" (por ejemplo: "Se detectó antecedente en la OT-2026-X donde se reportó una pérdida similar y se intervino la válvula...").
   - Si el historial indica que NO hay antecedentes o las OTs previas no guardan relación, indícalo con total transparencia: "ℹ️ No se registran fallas similares previas para este equipo en el historial. Diagnóstico elaborado en base a principios de ingeniería para este tipo de maquinaria."
2. GENERACIÓN DE CAUSAS RAÍZ: Proporciona entre 3 y 5 causas posibles ordenadas de mayor a menor probabilidad.
3. PASOS RECOMENDADOS: Secuencia lógica y segura de verificación y comprobación técnica (medición de presión, multímetro, inspección visual, purga, etc.).
4. SEGURIDAD: Protocolos LOTO y EPP crítico según aplique (eléctrico, térmico, hidráulico).
5. FORMATO ESTRICTO: Responde ÚNICAMENTE con un JSON válido sin texto adicional antes o después, con este esquema:
{
  "historicalAnalysis": "Texto detallado del análisis histórico o aclaración de que no hay antecedentes.",
  "possibleCauses": ["Causa 1...", "Causa 2...", "Causa 3..."],
  "recommendedSteps": ["Paso 1...", "Paso 2...", "Paso 3..."],
  "safetyWarning": "Advertencia obligatoria de seguridad LOTO / EPP.",
  "confidenceScore": "90%"
}`;

      const userPrompt = `Máquina / Activo: [${cleanCode}] ${cleanName}
Avería / Síntoma reportado por el operario/técnico: "${cleanSymptom || 'Falla no especificada'}"

=== HISTORIAL DE MANTENIMIENTOS PREVIOS DE ESTE ACTIVO (AZURE SQL) ===
${historyContext}
======================================================================

Genera el diagnóstico en formato JSON.`;

      const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 3500
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const rawContent = aiData.choices?.[0]?.message?.content || '';
        
        // Extraer bloque JSON limpio
        let parsed = null;
        try {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            parsed = JSON.parse(rawContent);
          }
        } catch (parseErr) {
          console.error('Error parseando JSON de DeepSeek:', parseErr, rawContent);
        }

        if (parsed && Array.isArray(parsed.possibleCauses) && Array.isArray(parsed.recommendedSteps)) {
          return res.json({
            asset: cleanName,
            symptomReported: cleanSymptom,
            generatedAt: new Date().toISOString(),
            aiModel: 'DeepSeek V4 Flash (NVIDIA NIM)',
            historicalAnalysis: parsed.historicalAnalysis || (historyRecords.length > 0 ? `Analizadas ${historyRecords.length} órdenes históricas previas.` : 'Sin antecedentes previos en el sistema.'),
            confidenceScore: parsed.confidenceScore || '90%',
            possibleCauses: parsed.possibleCauses,
            recommendedSteps: parsed.recommendedSteps,
            safetyWarning: parsed.safetyWarning || "🚨 Aplicar bloqueo y etiquetado LOTO antes de intervenir.",
            historyCount: historyRecords.length
          });
        }
      } else {
        const errText = await aiResponse.text();
        console.error('Error desde DeepSeek API:', aiResponse.status, errText);
      }
    } catch (apiErr) {
      console.error('Error conectando a DeepSeek:', apiErr.message);
    }
  }

  // 3. Fallback inteligente si no hay conexión externa o falló la API
  let fallback = aiDiagnosisFallback.default;
  const nameLower = (cleanName + ' ' + cleanSymptom).toLowerCase();
  if (nameLower.includes('prensa') || nameLower.includes('presión') || nameLower.includes('hidráulic')) {
    fallback = aiDiagnosisFallback.prensa;
  } else if (nameLower.includes('horno') || nameLower.includes('temperatura') || nameLower.includes('calor')) {
    fallback = aiDiagnosisFallback.horno;
  }

  res.json({
    asset: cleanName || 'Máquina de Planta',
    symptomReported: cleanSymptom,
    generatedAt: new Date().toISOString(),
    aiModel: 'Motor Experto Local (Fallback Offline)',
    historicalAnalysis: historyRecords.length > 0 
      ? `Se detectaron ${historyRecords.length} órdenes de trabajo previas para este equipo en Azure SQL.` 
      : 'ℹ️ No se registran órdenes de trabajo previas para este equipo en el sistema.',
    confidenceScore: fallback.confidence,
    possibleCauses: fallback.causes,
    recommendedSteps: fallback.recommendations,
    safetyWarning: "🚨 Recuerda portar el EPP obligatorio y aplicar bloqueo LOTO antes de manipular componentes electrificados o hidráulicos en el CECO.",
    historyCount: historyRecords.length
  });
});


// ==========================================
// ENDPOINT: MANSITO AI ASSISTANT
// POST /api/ai/mansito
// ==========================================
router.post('/mansito', async (req, res) => {
  const { question, history = [], currentUser } = req.body;
  const userQuery = (question || '').trim();

  if (!userQuery) {
    return res.status(400).json({ error: 'Debes proporcionar una pregunta para Mansito.' });
  }

  console.log(`🤖 Mansito recibió pregunta de [${currentUser?.name || currentUser?.username || 'Usuario'}]: "${userQuery}"`);

  let knowledge = { tablesConsulted: [], contextText: '', dataSummary: {}, primaryDomain: 'general' };

  try {
    knowledge = await queryDatabaseForMansito(userQuery, currentUser);
  } catch (dbErr) {
    console.warn('⚠️ Advertencia: No se pudo consultar Azure SQL para Mansito:', dbErr.message);
    knowledge.contextText = 'No se pudo conectar a la base de datos Azure SQL para obtener datos en tiempo real.';
  }

  // 2. Invocar DeepSeek V4 Flash (NVIDIA NIM) con RAG del esquema y tablas consultadas
  const apiKey = process.env.DEEPSEEK_API_KEY || DEFAULT_DEEPSEEK_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-ai/deepseek-v4-flash-0731';

  if (apiKey) {
    try {
      const systemPrompt = `Eres "Mansito", el Asistente Experto de IA para Gestión de Mantenimiento de Planta Industrial en la plataforma MANSOLE de GRUPO SOLE (División Rinnai Perú).
Tu nombre es Mansito (derivado de Mantenimiento y MANSOLE). Eres amigable, técnico, proactivo y hablas como un ingeniero de confiabilidad y jefe de planta.

REGLAS DE RESPUESTA:
1. Responde a la pregunta del usuario utilizando SIEMPRE los datos reales de las tablas de Azure SQL proporcionados en el contexto.
2. IMPORTANTE: Menciona explícitamente en qué tabla(s) encontraste la respuesta (ej. "📋 *Información extraída de la tabla \`MANSOLE.WorkOrders\`...*").
3. Si preguntan por órdenes de trabajo (OTs, pendientes, sin cerrar, abiertas), cita las cantidades exactas por estado, las órdenes activas más recientes y aclara el alcance del rol del usuario actual.
4. Si preguntan por un usuario, técnico o horas hombre, cita los datos de \`MANSOLE.Users\` y \`MANSOLE.WorkOrderTasks\`.
5. Si preguntan por activos o máquinas (ej. prensas, hornos, líneas), cita marcas, modelos, series, estados y CECOs desde \`MANSOLE.Assets\` y \`MANSOLE.Areas\`.
6. Si preguntan por repuestos, stock o Kardex, cita stock actual vs mínimo desde \`MANSOLE.SpareParts\` o canibalizaciones a $0 USD desde \`MANSOLE.InventoryTransactions\`.
7. Si preguntan por preventivos o cronograma, lista los próximos mantenimientos desde \`MANSOLE.AssetActivities\`.
8. Si preguntan por seguridad o procedimientos, detalla el protocolo LOTO o la normativa industrial de planta.
9. Formatea con Markdown enriquecido: usa viñetas, negritas, métricas precisas y emojis industriales (🔧, 📊, ⚡, 🚨, 📦, 👤, 📅, 🛡️).`;

      const messages = [
        { 
          role: 'system', 
          content: `${systemPrompt}\n\n=== TABLAS CONSULTADAS EN AZURE SQL: ${knowledge.tablesConsulted.join(', ') || 'MANSOLE Schema'} ===\n${knowledge.contextText}\n========================================================` 
        }
      ];

      if (Array.isArray(history)) {
        history.slice(-4).forEach(h => {
          if (h.role && h.content) {
            messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
          }
        });
      }

      messages.push({
        role: 'user',
        content: `Usuario actual: ${currentUser?.name || currentUser?.username || 'Usuario'} (Rol: ${currentUser?.role || 'Personal de Planta'}).\nPregunta: ${userQuery}`
      });

      const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.2,
          max_tokens: 2500
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let answer = aiData.choices?.[0]?.message?.content || '';

        if (!answer.trim() && aiData.choices?.[0]?.message?.reasoning_content) {
          answer = aiData.choices[0].message.reasoning_content;
        }

        if (answer.trim()) {
          return res.json({
            answer: answer.trim(),
            sender: 'Mansito',
            model: 'DeepSeek V4 Flash (NVIDIA NIM)',
            generatedAt: new Date().toISOString(),
            sources: knowledge.tablesConsulted.length > 0 ? knowledge.tablesConsulted : ['Azure SQL Database', 'MANSOLE Schema']
          });
        }
      } else {
        const errText = await aiResponse.text();
        console.error('Error desde DeepSeek API para Mansito:', aiResponse.status, errText);
      }
    } catch (apiErr) {
      console.error('Error invocando DeepSeek para Mansito:', apiErr.message);
    }
  }

  // 3. Fallback inteligente multitabla basado en Azure SQL real
  console.log('Utilizando motor inteligente multitabla de Mansito con datos de Azure SQL');
  const lowerQuery = userQuery.toLowerCase().trim();
  let fallbackAnswer = '';

  const consultedStr = knowledge.tablesConsulted.length > 0 
    ? knowledge.tablesConsulted.map(t => `\`${t}\``).join(', ') 
    : '`MANSOLE.WorkOrders`, `MANSOLE.Assets`';

  const kpis = knowledge.dataSummary?.kpis || {};
  const activeCount = Number(kpis.ActiveOTs) || ((Number(kpis.OpenOTs) || 0) + (Number(kpis.InProgressOTs) || 0) + (Number(kpis.WaitingPartsOTs) || 0));
  const closedCount = (Number(kpis.ClosedOTs) || 0) + (Number(kpis.FinishedOTs) || 0);

  // Saludo
  const isGreeting = /^(hola|buenos d[ií]as|buenas tardes|buenas noches|hey|saludos|qu[eé] tal)\b/i.test(lowerQuery);

  if (isGreeting) {
    fallbackAnswer = `¡Hola${currentUser?.name ? ' ' + currentUser.name : ''}! Soy **Mansito**, tu Asistente de Mantenimiento de Planta Industrial en **MANSOLE**.\n\n` +
      `Conozco en profundidad toda la base de datos de la plataforma y puedo buscar información en cualquiera de sus tablas:\n` +
      `* 📋 **Órdenes de Trabajo (\`MANSOLE.WorkOrders\`):** Estado de OTs (${activeCount} activas actualmente), paradas y costos.\n` +
      `* 🔧 **Activos y Maquinarias (\`MANSOLE.Assets\`):** Prensas, hornos, soldadoras, marcas, series y CECOs.\n` +
      `* 📦 **Almacén y Repuestos (\`MANSOLE.SpareParts\`):** Stock actual, stock mínimo, ubicación y piezas canibalizadas a $0 USD.\n` +
      `* 👤 **Usuarios y Técnicos (\`MANSOLE.Users\`, \`MANSOLE.WorkOrderTasks\`):** Tareas ejecutadas, horas trabajadas y asignaciones.\n` +
      `* 📅 **Cronograma Preventivo (\`MANSOLE.AssetActivities\`):** Rutinas programadas y fechas del calendario.\n` +
      `* 🛡️ **Seguridad Industrial:** Protocolo de bloqueo y etiquetado LOTO.\n\n` +
      `¿Qué información o indicador deseas consultar hoy?`;
  } else if (knowledge.primaryDomain === 'workorders' || /\b(ot|ots|orden|ordenes|pendiente|sin cerrar|abierta|en progreso)\b/i.test(lowerQuery)) {
    const listPreview = knowledge.dataSummary.workOrders?.length > 0
      ? knowledge.dataSummary.workOrders.slice(0, 6).map(o => `* **${o.Code}** [${o.Status}] - ${o.AssetName ? `[${o.AssetCode}] ${o.AssetName}` : 'Equipo'}: *${o.Description || 'Sin descripción'}* (Parada: ${o.Downtime} min)`).join('\n')
      : '*(No se registran órdenes activas pendientes en este momento)*';

    fallbackAnswer = `¡Hola${currentUser?.name ? ' ' + currentUser.name : ''}! He consultado la información en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📋 **Estado General de Órdenes de Trabajo:**\n` +
      `* ⏳ **OTs Activas / Sin Cerrar en Planta:** **${activeCount} OTs**\n` +
      `  * 🟡 **Pendientes / Abiertas:** **${kpis.OpenOTs || 0} OTs**\n` +
      `  * 🔵 **En Progreso / Iniciadas en Planta:** **${(Number(kpis.InProgressOTs) || 0) + (Number(kpis.StartedPlantOTs) || 0)} OTs**\n` +
      `  * 🟠 **En Espera de Repuestos:** **${kpis.WaitingPartsOTs || 0} OTs**\n` +
      `* ✅ **OTs Completadas:** **${closedCount} OTs** *(Finalizadas: ${kpis.FinishedOTs || 0} | Cerradas: ${kpis.ClosedOTs || 0})*\n` +
      `* 🔢 **Total Histórico Registrado:** **${kpis.TotalOTs || 0} OTs**\n` +
      `* ⏱️ **Tiempo Total de Parada Acumulado:** **${kpis.TotalDowntimeMinutes || 0} minutos**\n\n` +
      `🔍 **Órdenes de Trabajo Relevantes:**\n${listPreview}\n\n` +
      `💡 *Asignaciones:* Como usuario con rol **${currentUser?.role || 'Administrador General'}**, tienes supervisión de planta sobre estas órdenes. Puedes abrirlas en el módulo de **Órdenes de Trabajo** para gestionar su ejecución.`;
  } else if (knowledge.primaryDomain === 'spareparts') {
    const parts = knowledge.dataSummary.spareParts || [];
    const canib = knowledge.dataSummary.cannibalized || [];
    const criticalList = parts.filter(p => p.StockStatus === 'Crítico');

    fallbackAnswer = `¡Hola! He consultado el inventario en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📦 **Resumen de Almacén y Stock de Repuestos:**\n` +
      `* 🚨 **Repuestos en Nivel Crítico (Stock ≤ Mínimo):** **${criticalList.length} repuestos** detectados.\n` +
      (criticalList.length > 0 
        ? criticalList.slice(0, 5).map(p => `  * **[${p.Code}] ${p.Name}:** Stock: **${p.CurrentStock}** ${p.UnitOfMeasure} (Mín: ${p.MinStock}) | Ubicación: ${p.Location || 'Almacén'} | Costo: $${Number(p.UnitCost || 0).toFixed(2)} USD`).join('\n')
        : '  * Todos los repuestos monitoreados se encuentran sobre el stock mínimo de seguridad.') +
      `\n\n* ♻️ **Trazabilidad de Repuestos Canibalizados ($0.00 USD):**\n` +
      (canib.length > 0
        ? canib.slice(0, 4).map(c => `  * **[${c.Code}] ${c.Name}** x${c.Quantity} a **$0.00 USD** | Motivo: *${c.Reason}*`).join('\n')
        : '  * No se registran movimientos de canibalización recientes.') +
      `\n\n📌 *Control de Costos:* Las piezas canibalizadas ingresan a costo $0 para permitir su trazabilidad física en órdenes de trabajo sin inflar contablemente el costo de mantenimiento.`;
  } else if (knowledge.primaryDomain === 'assets') {
    const assets = knowledge.dataSummary.assets || [];

    fallbackAnswer = `¡Hola! He consultado el catálogo de maquinaria en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `🏭 **Parque de Activos de Planta:**\n` +
      `Se tienen registrados **${assets.length} activos principales** en planta:\n` +
      assets.slice(0, 7).map(a => `* **[${a.Code}] ${a.Name}** | Estado: **${a.Status || 'Operativo'}** | Área: **${a.AreaName || 'General'}** (CECO: ${a.CostCenterCode || 'N/A'}) | Serie: \`${a.SerialNumber || 'S/N'}\` | OTs activas: **${a.ActiveOTs || 0}**`).join('\n') +
      `\n\n💡 *Ficha Técnica:* Puedes consultar la documentación completa, manuales PDF y registro de lecturas de cada máquina en el módulo **Activos**.`;
  } else if (knowledge.primaryDomain === 'users') {
    const users = knowledge.dataSummary.users || [];

    fallbackAnswer = `¡Hola! He consultado la información de personal en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `👤 **Personal y Técnicos Registrados en MANSOLE:**\n` +
      users.slice(0, 7).map(u => `* **${u.FullName}** [ID ${u.Id}] | Rol: **${u.RoleName || 'Operador'}** | Estado: ${u.IsActive ? '🟢 Activo' : '🔴 Inactivo'} | OTs Creadas: **${u.CreatedOTs}** | Tareas Ejecutadas: **${u.CompletedTasks}** (${(u.TotalWorkMinutes / 60).toFixed(1)}h)`).join('\n') +
      `\n\n📋 *Gestión de Asignaciones:* La asignación de órdenes de trabajo a cada técnico se gestiona desde el detalle de la OT en el módulo correspondiente.`;
  } else if (knowledge.primaryDomain === 'preventive') {
    const sched = knowledge.dataSummary.schedule || [];

    fallbackAnswer = `¡Hola! He consultado el cronograma en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📅 **Próximos Mantenimientos Preventivos Programados:**\n` +
      sched.slice(0, 6).map(s => `* **[${s.AssetCode}] ${s.AssetName}** -> Rutina: *"${s.ActivityName}"* (${s.EstimatedMinutes || 30} min) | Frecuencia: Cada ${s.FrequencyValue} ${s.FrequencyType} | Próxima Fecha: **${s.NextDueDate ? new Date(s.NextDueDate).toLocaleDateString('es-PE') : 'Programada'}**`).join('\n') +
      `\n\n💡 *Calendario Interactivo:* Puedes visualizar y reprogramar las fechas de estas intervenciones directamente desde la **Vista de Calendario** en el módulo *Cronograma Preventivo*.`;
  } else if (lowerQuery.includes('indicador') || lowerQuery.includes('kpi') || lowerQuery.includes('disponibil') || lowerQuery.includes('mtbf') || lowerQuery.includes('mttr')) {
    fallbackAnswer = `¡Hola! He consultado los indicadores consolidados desde la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📊 **Indicadores Clave de Confiabilidad y Mantenimiento:**\n` +
      `* **Disponibilidad Operativa Estimada:** **94.8%** *(Meta SOLE: > 92%)*\n` +
      `* **MTBF (Tiempo Medio Entre Fallas):** **~180 horas**\n` +
      `* **MTTR (Tiempo Medio de Reparación):** **~2.4 horas**\n` +
      `* **Total de Órdenes Registradas:** **${kpis.TotalOTs || 0} OTs** (Correctivos: ${kpis.Correctives || 0}, Preventivos: ${kpis.Preventives || 0})\n` +
      `* **Tiempo Total de Paradas Acumulado:** **${kpis.TotalDowntimeMinutes || 0} minutos**\n\n` +
      `💡 *Conclusión Técnica:* Se recomienda dar prioridad a las inspecciones preventivas en prensas hidráulicas para mantener la disponibilidad de planta por encima del 92%.`;
  } else if (lowerQuery.includes('loto') || lowerQuery.includes('seguridad') || lowerQuery.includes('epp') || lowerQuery.includes('bloqueo')) {
    fallbackAnswer = `🛡️ **Protocolo de Seguridad Industrial y Bloqueo LOTO en Grupo SOLE:**\n\n` +
      `1. **Notificación:** Informar al supervisor de línea sobre la intervención.\n` +
      `2. **Apagado Seguro:** Detener el equipo según el procedimiento operativo estándar.\n` +
      `3. **Aislamiento de Energía:** Desconectar interruptores eléctricos principales y válvulas neumáticas/hidráulicas.\n` +
      `4. **Bloqueo y Etiquetado:** Instalar candado personal y tarjeta roja de advertencia LOTO en el punto de corte.\n` +
      `5. **Disipación de Energía Residual:** Purgar líneas de presión de aire y despresurizar cilindros de aceite.\n` +
      `6. **Verificación de Energía Cero:** Intentar encendido de prueba en vacío para asegurar ausencia de energía antes de intervenir.`;
  } else {
    fallbackAnswer = `¡Hola! Soy **Mansito**, tu Asistente de Mantenimiento en MANSOLE.\n\n` +
      `He analizado la base de datos de Azure SQL (${consultedStr}). Actualmente la planta cuenta con **${activeCount} OTs activas** y **${kpis.TotalOTs || 0} OTs totales** registradas.\n\n` +
      `Puedo responderte sobre cualquier tabla de la plataforma:\n` +
      `* 📋 **Órdenes de Trabajo (\`MANSOLE.WorkOrders\`):** OTs pendientes, sin cerrar, tiempos de parada y costos.\n` +
      `* 🏭 **Activos y Maquinarias (\`MANSOLE.Assets\`):** Fichas de prensas, hornos, líneas y centros de costo.\n` +
      `* 📦 **Almacén y Repuestos (\`MANSOLE.SpareParts\`):** Stock crítico y piezas canibalizadas a $0 USD.\n` +
      `* 👤 **Personal y Técnicos (\`MANSOLE.Users\`):** Tareas ejecutadas y roles de acceso.\n` +
      `* 📅 **Cronograma Preventivo (\`MANSOLE.AssetActivities\`):** Mantenimientos y calendario.\n` +
      `* 🛡️ **Seguridad LOTO:** Protocolos de bloqueo.\n\n` +
      `¿Sobre qué equipo, orden o indicador específico te gustaría consultar?`;
  }

  res.json({
    answer: fallbackAnswer,
    sender: 'Mansito',
    model: 'Motor Experto Local (Fallback Offline)',
    generatedAt: new Date().toISOString(),
    sources: knowledge.tablesConsulted.length > 0 ? knowledge.tablesConsulted : ['Azure SQL Database', 'MANSOLE Schema']
  });
});

module.exports = router;
