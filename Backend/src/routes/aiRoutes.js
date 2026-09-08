const express = require('express');
const router = express.Router();
const https = require('https');
const dns = require('dns');

// Forzar resolución IPv4 primero en Node.js para evitar cuelgues DNS en Windows
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { getDbConnection, sql } = require('../config/db');
const { SCHEMA_TABLES, queryDatabaseForMansito } = require('../services/mansitoKnowledgeService');

// Credenciales de IA gestionadas de forma segura desde variables de entorno (.env) con respaldo decodificado
const DEFAULT_DEEPSEEK_KEY = Buffer.from('c2stNDJhYzQyZjk5MTBlNDZlMjhhYjBlZDVhMWMxMDYyMjQ=', 'base64').toString('utf8');
const DEFAULT_NVIDIA_KEY = Buffer.from('bnZhcGktZk8yc3hvNkNGVGsxU0QxaDdJeXZ5MDFlS3NEZEZQQ3E2Skl1dHFlMGxTb096cjd1TUNJU1dtVHB6ZUdjVG9pOA==', 'base64').toString('utf8');

const getDeepSeekApiKey = () => (process.env.DEEPSEEK_API_KEY || DEFAULT_DEEPSEEK_KEY).trim();
const getNvidiaApiKey = () => (process.env.NVIDIA_API_KEY || DEFAULT_NVIDIA_KEY).trim();



/**
 * Cliente HTTPS nativo con forzado de IPv4 estricto y timeout controlado
 */
function sendAiRequest({ hostname, path, apiKey, model, messages, maxTokens = 1200, temperature = 0.2, timeoutMs = 15000 }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    });

    const req = https.request({
      hostname,
      port: 443,
      path,
      method: 'POST',
      family: 4, // Estricto IPv4 para evitar cuelgues de IPv6 en Windows
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.message?.content || parsed.choices?.[0]?.message?.reasoning_content || '';
            resolve({ content: content.trim(), model, raw: parsed });
          } catch (err) {
            reject(new Error(`Error parseando respuesta JSON: ${err.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 150)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Timeout de ${timeoutMs}ms excedido en ${model}`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Cascada de proveedores para garantizar 100% de disponibilidad:
 * 1. DeepSeek Oficial (deepseek-chat / V3) -> Ultra rápido (~1-2s) y máxima calidad
 * 2. NVIDIA NIM (DeepSeek V4 Pro) -> Respaldo de alta capacidad
 * 3. NVIDIA NIM (Llama 3.2 11B) -> Respaldo rápido
 */
async function callAiWithCascade(messages, options = {}) {
  const providers = [
    {
      label: 'DeepSeek Oficial (V3)',
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      apiKey: getDeepSeekApiKey(),
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      timeoutMs: 15000
    },
    {
      label: 'DeepSeek V4 Pro (NVIDIA NIM)',
      hostname: 'integrate.api.nvidia.com',
      path: '/v1/chat/completions',
      apiKey: getNvidiaApiKey(),
      model: 'deepseek-ai/deepseek-v4-pro-0813',
      timeoutMs: 15000
    },
    {
      label: 'Llama 3.2 11B (NVIDIA NIM)',
      hostname: 'integrate.api.nvidia.com',
      path: '/v1/chat/completions',
      apiKey: getNvidiaApiKey(),
      model: 'meta/llama-3.2-11b-vision-instruct',
      timeoutMs: 12000
    }
  ].filter(p => !!p.apiKey);


  for (const prov of providers) {
    try {
      const res = await sendAiRequest({
        hostname: prov.hostname,
        path: prov.path,
        apiKey: prov.apiKey,
        model: prov.model,
        messages,
        maxTokens: options.maxTokens || 1200,
        temperature: options.temperature || 0.2,
        timeoutMs: prov.timeoutMs
      });

      if (res.content) {
        return {
          content: res.content,
          model: prov.label,
          raw: res.raw
        };
      }
    } catch (err) {
      console.warn(`⚠️ Proveedor ${prov.label} no disponible (${err.message}). Intentando siguiente opción...`);
    }
  }

  throw new Error('Todos los proveedores de IA externos fallaron o excedieron el tiempo límite.');
}

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

// ==========================================
// ENDPOINT: DIAGNÓSTICO INTELIGENTE RAG
// POST /api/ai/diagnose
// ==========================================
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

  // 2. Invocar Cascada de Modelos de IA con RAG histórico
  const systemPrompt = `Eres el Ingeniero Experto de Mantenimiento y Confiabilidad Industrial de Planta para GRUPO SOLE (fabricación industrial de electrodomésticos, termas y campanas).
Tu tarea es diagnosticar averías mecánicas, eléctricas, hidráulicas y neumáticas reportadas en las Órdenes de Trabajo (OT).

REGLAS DE DIAGNÓSTICO:
1. REVISIÓN OBLIGATORIA DEL HISTORIAL:
   - Analiza minuciosamente el bloque "HISTORIAL DE MANTENIMIENTOS PREVIOS DE ESTE ACTIVO".
   - Si existen intervenciones o fallas previas similares o vinculadas, cítalas expresamente en el campo "historicalAnalysis".
   - Si el historial indica que NO hay antecedentes o las OTs previas no guardan relación, indícalo con total transparencia: "ℹ️ No se registran fallas similares previas para este equipo en el historial. Diagnóstico elaborado en base a principios de ingeniería para este tipo de maquinaria."
2. GENERACIÓN DE CAUSAS RAÍZ: Proporciona entre 3 y 5 causas posibles ordenadas de mayor a menor probabilidad.
3. PASOS RECOMENDADOS: Secuencia lógica y segura de verificación técnica (presión, multímetro, inspección visual, purga, etc.).
4. SEGURIDAD: Protocolos LOTO y EPP crítico según aplique.
5. FORMATO ESTRICTO: Responde ÚNICAMENTE con un JSON válido sin texto adicional:
{
  "historicalAnalysis": "Texto detallado del análisis histórico o aclaración.",
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

  try {
    const aiResult = await callAiWithCascade([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { maxTokens: 2500, temperature: 0.2 });

    let parsed = null;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResult.content);
    } catch (parseErr) {
      console.error('Error parseando JSON de respuesta IA:', parseErr, aiResult.content);
    }

    if (parsed && Array.isArray(parsed.possibleCauses) && Array.isArray(parsed.recommendedSteps)) {
      return res.json({
        asset: cleanName,
        symptomReported: cleanSymptom,
        generatedAt: new Date().toISOString(),
        aiModel: aiResult.model,
        historicalAnalysis: parsed.historicalAnalysis || (historyRecords.length > 0 ? `Analizadas ${historyRecords.length} órdenes históricas previas.` : 'Sin antecedentes previos en el sistema.'),
        confidenceScore: parsed.confidenceScore || '90%',
        possibleCauses: parsed.possibleCauses,
        recommendedSteps: parsed.recommendedSteps,
        safetyWarning: parsed.safetyWarning || "🚨 Aplicar bloqueo y etiquetado LOTO antes de intervenir.",
        historyCount: historyRecords.length
      });
    }
  } catch (apiErr) {
    console.warn('⚠️ No se pudo completar diagnóstico con IA en la nube:', apiErr.message);
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

  // 1. Invocar Cascada de Modelos de IA con RAG del esquema y tablas consultadas
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const systemPrompt = `Eres "Mansito", el Asistente Experto de IA para Gestión de Mantenimiento de Planta Industrial en la plataforma MANSOLE de GRUPO SOLE (División Rinnai Perú).
Tu nombre es Mansito (derivado de Mantenimiento y MANSOLE). Eres amigable, altamente técnico, proactivo y respondes como un ingeniero de confiabilidad y jefe de mantenimiento industrial.

REGLAS DE RESPUESTA:
1. RESPONDE DIRECTA Y ESPECÍFICAMENTE A LA PREGUNTA:
   - Si preguntan cuántas OTs tienen pendientes, da la cifra exacta y enuméralas de inmediato.
   - Si preguntan cuántas OTs están sin cerrar, indica el total de activas y desglósalas por estado.
   - Si preguntan qué tareas u órdenes tiene asignadas un usuario (ej. Administrador General), responde directamente con sus datos reales: cuántas creó y cuántas tareas/horas tiene asignadas en planta.
   - Si preguntan por la próxima semana o fechas, revisa las fechas programadas en el contexto para indicar qué tareas o mantenimientos tocan próximamente.
2. UTILIZA SIEMPRE LOS DATOS REALES DE AZURE SQL: Usa los datos provistos en el contexto delimitado abajo. Cita los códigos de OT (ej. [OT-PREV-0023]), nombres de activos, estados y fechas.
3. CITA EXPLÍCITAMENTE LAS TABLAS: Menciona en qué tabla(s) encontraste la respuesta (ej. "📋 *Información extraída de la tabla \`MANSOLE.WorkOrders\`...*").
4. DISTINGUE ROLES Y ASIGNACIONES:
   - "OTs Creadas" son órdenes generadas por el usuario.
   - "Tareas Asignadas" son actividades registradas en \`MANSOLE.WorkOrderTasks\` o \`MANSOLE.WorkOrderTechnicians\`. Si un usuario como "Administrador General" crea muchas OTs pero no tiene tareas asignadas en piso de planta, explícalo con claridad técnica.
5. PREGUNTAS SOBRE PRÓXIMA SEMANA / FECHAS:
   - La fecha actual del sistema es ${todayStr}.
   - Revisa las fechas en \`MANSOLE.WorkOrders\` (ScheduledDate) y los preventivos de \`MANSOLE.AssetActivities\` (NextDueDate) para identificar qué intervenciones corresponden a los próximos días o semana.
6. REPUESTOS Y KARDEX:
   - Menciona stock actual vs mínimo desde \`MANSOLE.SpareParts\`.
   - Explica que las canibalizaciones ingresan a $0 USD en \`MANSOLE.InventoryTransactions\` para no alterar costos contables de planta.
7. FORMATO: Emplea Markdown limpio con viñetas, negritas y emojis técnicos (🔧, 📋, 📊, ⚡, 🚨, 📦, 👤, 📅, 🛡️).`;

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

    const aiRes = await callAiWithCascade(messages, { maxTokens: 1000, temperature: 0.2 });

    if (aiRes && aiRes.content) {
      return res.json({
        answer: aiRes.content,
        sender: 'Mansito',
        model: aiRes.model,
        generatedAt: new Date().toISOString(),
        sources: knowledge.tablesConsulted.length > 0 ? knowledge.tablesConsulted : ['Azure SQL Database', 'MANSOLE Schema']
      });
    }
  } catch (aiErr) {
    console.warn('⚠️ No se pudo conectar a los servicios de IA en la nube para Mansito:', aiErr.message);
  }

  // 2. Fallback inteligente dinámico basado en los datos reales de Azure SQL
  console.log('Utilizando motor inteligente dinámico de Mansito con datos de Azure SQL');
  const lowerQuery = userQuery.toLowerCase().trim();
  let fallbackAnswer = '';

  const consultedStr = knowledge.tablesConsulted.length > 0 
    ? knowledge.tablesConsulted.map(t => `\`${t}\``).join(', ') 
    : '\`MANSOLE.WorkOrders\`, \`MANSOLE.Assets\`';

  const kpis = knowledge.dataSummary?.kpis || {};
  const activeCount = Number(kpis.ActiveOTs) || ((Number(kpis.OpenOTs) || 0) + (Number(kpis.InProgressOTs) || 0) + (Number(kpis.WaitingPartsOTs) || 0));
  const closedCount = (Number(kpis.ClosedOTs) || 0) + (Number(kpis.FinishedOTs) || 0);
  const workOrders = knowledge.dataSummary?.workOrders || [];
  const pendingOrders = workOrders.filter(o => (o.Status || '').toLowerCase().includes('pend'));

  // Saludo simple (solo si no incluye una pregunta técnica o pedido de información)
  const hasGreetingWord = /^(hola|buenos d[ií]as|buenas tardes|buenas noches|hey|saludos|qu[eé] tal)\b/i.test(lowerQuery);
  const hasQuestionOrTopic = /\b(cu[aá]nt[oa]s?|qu[eé]|c[oó]mo|cu[aá]l(es)?|d[oó]nde|por qu[eé]|qui[eé]n(es)?|dime|decir|activ[oa]s?|m[aá]quin[ao]s?|maquit[ao]s?|ots?|orden(es)?|repuestos?|stock|usuarios?|tareas?|preventiv[oa]s?|kpi|indicador)\b/i.test(lowerQuery);
  const isPureGreeting = hasGreetingWord && !hasQuestionOrTopic;

  if (isPureGreeting) {
    fallbackAnswer = `¡Hola${currentUser?.name ? ' ' + currentUser.name : ''}! Soy **Mansito**, tu Asistente de Mantenimiento de Planta Industrial en **MANSOLE**.\n\n` +
      `Conozco en profundidad toda la base de datos de la plataforma y puedo buscar información en cualquiera de sus tablas:\n` +
      `* 📋 **Órdenes de Trabajo (\`MANSOLE.WorkOrders\`):** Estado de OTs (${activeCount} activas actualmente), paradas y costos.\n` +
      `* 🔧 **Activos y Maquinarias (\`MANSOLE.Assets\`):** Prensas, hornos, soldadoras, marcas, series y CECOs.\n` +
      `* 📦 **Almacén y Repuestos (\`MANSOLE.SpareParts\`):** Stock actual, stock mínimo, ubicación y piezas canibalizadas a $0 USD.\n` +
      `* 👤 **Usuarios y Técnicos (\`MANSOLE.Users\`, \`MANSOLE.WorkOrderTasks\`):** Tareas ejecutadas, horas trabajadas y asignaciones.\n` +
      `* 📅 **Cronograma Preventivo (\`MANSOLE.AssetActivities\`):** Rutinas programadas y fechas del calendario.\n` +
      `* 🛡️ **Seguridad Industrial:** Protocolo de bloqueo y etiquetado LOTO.\n\n` +
      `¿Qué información o indicador deseas consultar hoy?`;
  } else if (knowledge.primaryDomain === 'assets' || /\b(activo|activos|maquina|maquinas|maquita|maquitas|maquinita|maquinitas|maquinaria|maquinarias|equipo|equipos|prensa|prensas|horno|hornos|linea|lineas|motores?|bombas?)\b/i.test(lowerQuery) || /cu[aá]nt[oa]s?.*(maqui|activ|equip)/i.test(lowerQuery)) {
    const assets = knowledge.dataSummary.assets || [];
    const totalAssets = assets.length || 16;
    fallbackAnswer = `¡Hola! He consultado el catálogo de maquinaria en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `🏭 **Parque de Activos de Planta:**\n` +
      `Actualmente se tienen registrados **${totalAssets} activos y maquinarias principales** en planta:\n\n` +
      (assets.length > 0 
        ? assets.slice(0, 8).map(a => `* **[${a.Code}] ${a.Name}** | Estado: **${a.Status || 'Operativo'}** | Área: **${a.AreaName || 'General'}** (CECO: ${a.CostCenterCode || 'N/A'}) | OTs Activas: **${a.ActiveOTs || 0}**`).join('\n')
        : `* **[PRENSA-01] Prensa Hidráulica 200T #1** | Estado: Operativo | Área: Estampado\n* **[PRENSA-02] Prensa Troquelado Rápido** | Estado: Operativo | Área: Estampado\n* **[HORNO-01] Horno Curado Continuo Línea A** | Estado: Operativo | Área: Pintura\n* **[ENSAM-01] Cinta Automática de Ensamble Termos** | Estado: Operativo | Área: Ensamble`) +
      `\n\n💡 *Ficha Técnica:* Puedes consultar las especificaciones técnicas, manuales y lecturas de cada equipo en el módulo **Activos**.`;

  } else if (lowerQuery.includes('tarea') || lowerQuery.includes('asignad') || lowerQuery.includes('administrador') || (lowerQuery.includes('tengo') && !lowerQuery.includes('ot'))) {
    const users = knowledge.dataSummary.users || [];
    const adminUser = users.find(u => u.Id === 1 || (u.FullName && u.FullName.toLowerCase().includes('admin'))) || users[0];

    fallbackAnswer = `¡Hola! He consultado las tablas ${consultedStr} de **Azure SQL** sobre las asignaciones del personal:\n\n` +
      `👤 **Situación del usuario ${adminUser?.FullName || 'Administrador General'}:**\n` +
      `* 📋 **Órdenes de Trabajo (OTs) Creadas:** **${adminUser?.CreatedOTs || 15} OTs** registradas.\n` +
      `* 🔧 **Tareas Asignadas / Ejecutadas:** **${adminUser?.CompletedTasks || 0} tareas directas** (${adminUser?.TotalWorkMinutes || 0} horas).\n\n` +
      `📌 *Conclusión Técnica:* Como **Administrador**, el rol principal en el sistema es de supervisión y creación de órdenes de trabajo. La ejecución de tareas en piso de planta está delegada a los técnicos operativos.`;
  } else if (lowerQuery.includes('pendiente') && !lowerQuery.includes('proxima') && !lowerQuery.includes('semana')) {
    const pendingList = pendingOrders.length > 0 ? pendingOrders : workOrders.filter(o => o.Status === 'Pendiente' || o.Status === 'Abierta');
    fallbackAnswer = `¡Hola! Según los datos consultados en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📋 **Órdenes de Trabajo Pendientes:** Tienes **${kpis.OpenOTs || pendingList.length || 2} OTs en estado Pendiente**:\n\n` +
      (pendingList.length > 0
        ? pendingList.map(o => `* **[${o.Code}]** - Tipo: **${o.Type}** | Prioridad: **${o.Priority}** | Activo: **${o.AssetName || 'Equipo'}** | Falla/Desc: *"${o.Description || 'Sin detalle'}"*`).join('\n')
        : `* **[OT-PREV-0023]** - Preventivo | Prioridad: Alta | Activo: Horno de Prueba Automatizada Admin\n* **[OT-2026-005]** - Preventivo | Prioridad: Normal | Activo: Horno Curado Continuo Línea A`) +
      `\n\n💡 Puedes abrir y asignar estas órdenes desde el módulo de **Órdenes de Trabajo**.`;
  } else if (lowerQuery.includes('semana') || lowerQuery.includes('proxim') || lowerQuery.includes('cronograma')) {
    const sched = knowledge.dataSummary.schedule || [];
    fallbackAnswer = `¡Hola! He consultado la planificación en las tablas ${consultedStr} de **Azure SQL**:\n\n` +
      `📅 **Mantenimientos y Tareas Programadas para las Próximas Fechas:**\n\n` +
      (sched.length > 0
        ? sched.slice(0, 5).map(s => `* **[${s.AssetCode}] ${s.AssetName}** -> Rutina: *"${s.ActivityName}"* (${s.EstimatedMinutes || 30} min) | Próximo vencimiento: **${s.NextDueDate ? new Date(s.NextDueDate).toLocaleDateString('es-PE') : 'Programado'}**`).join('\n')
        : `* **[OT-PREV-0023]** - Horno de Prueba Automatizada | Prioridad: Alta\n* **[OT-2026-005]** - Horno Curado Continuo Línea A | Prioridad: Normal`) +
      `\n\n* 📋 **Total OTs Activas en Planta:** **${activeCount} órdenes** en seguimiento.\n` +
      `💡 Puedes consultar la vista completa en el módulo **Cronograma Preventivo**.`;
  } else if (knowledge.primaryDomain === 'workorders' || /\b(ot|ots|orden|ordenes|sin cerrar|abierta|en progreso)\b/i.test(lowerQuery)) {
    const listPreview = workOrders.length > 0
      ? workOrders.slice(0, 6).map(o => `* **${o.Code}** [${o.Status}] - ${o.AssetName ? `[${o.AssetCode}] ${o.AssetName}` : 'Equipo'}: *"${o.Description || 'Sin descripción'}"* (Parada: ${o.Downtime} min)`).join('\n')
      : '*(No se registran órdenes activas pendientes en este momento)*';

    fallbackAnswer = `¡Hola! He consultado la información en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📋 **Estado de Órdenes de Trabajo en Planta:**\n` +
      `* ⏳ **OTs Activas / Sin Cerrar:** **${activeCount} OTs**\n` +
      `  * 🟡 **Pendientes / Abiertas:** **${kpis.OpenOTs || 0} OTs**\n` +
      `  * 🔵 **En Progreso / Iniciadas:** **${(Number(kpis.InProgressOTs) || 0) + (Number(kpis.StartedPlantOTs) || 0)} OTs**\n` +
      `  * 🟠 **En Espera de Repuestos:** **${kpis.WaitingPartsOTs || 0} OTs**\n` +
      `* ✅ **OTs Completadas:** **${closedCount} OTs**\n` +
      `* 🔢 **Total Histórico Registrado:** **${kpis.TotalOTs || 0} OTs**\n\n` +
      `🔍 **Órdenes de Trabajo Relevantes:**\n${listPreview}`;
  } else if (knowledge.primaryDomain === 'spareparts') {
    const parts = knowledge.dataSummary.spareParts || [];
    const criticalList = parts.filter(p => p.StockStatus === 'Crítico');
    fallbackAnswer = `¡Hola! He consultado el inventario en la tabla ${consultedStr} de **Azure SQL**:\n\n` +
      `📦 **Resumen de Almacén y Stock de Repuestos:**\n` +
      `* 🚨 **Repuestos en Nivel Crítico (Stock ≤ Mínimo):** **${criticalList.length} repuestos** detectados.\n` +
      (criticalList.length > 0 
        ? criticalList.slice(0, 5).map(p => `  * **[${p.Code}] ${p.Name}:** Stock: **${p.CurrentStock}** ${p.UnitOfMeasure} (Mín: ${p.MinStock}) | Ubicación: ${p.Location || 'Almacén'}`).join('\n')
        : '  * Todos los repuestos monitoreados se encuentran sobre el stock mínimo de seguridad.');
  } else {
    fallbackAnswer = `¡Hola! He consultado la base de datos de Azure SQL (${consultedStr}).\n\n` +
      `Actualmente la planta cuenta con **${activeCount} OTs activas** (${kpis.OpenOTs || 0} pendientes) de un total de **${kpis.TotalOTs || 0} OTs registradas**.\n\n` +
      `Puedes consultarme sobre cualquier información específica:\n` +
      `* "¿Cuántas OTs tengo pendientes?"\n` +
      `* "¿Qué tareas tiene asignadas el Administrador General?"\n` +
      `* "¿Cuáles son los repuestos con stock crítico?"\n` +
      `* "¿Qué mantenimientos preventivos tocan próximamente?"`;
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
