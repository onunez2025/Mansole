const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

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
  const apiKey = process.env.DEEPSEEK_API_KEY;
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

module.exports = router;
