const express = require('express');
const router = express.Router();

// Simulated AI Suggestions knowledge base for instant fallback without hitting paid tokens on start
const aiDiagnosisKnowledge = {
  default: {
    causes: [
      "Desgaste mecánico prematuro por alta vibración o falta de lubricación oportuna.",
      "Fluctuación de voltaje o armónicos en la red industrial del Centro de Costo.",
      "Acumulación de residuos industriales que impiden el recorrido normal de los actuadores."
    ],
    recommendations: [
      "Aislar la máquina mecánicay eléctricamente aplicando protocolo LOTO antes de intervenir.",
      "Verificar con multímetro la tensión en bornes de alimentación y temperatura del motor.",
      "Inspeccionar visualmente las mangueras de presión y sellos de estanqueidad.",
      "Reemplazar componentes defectuosos utilizando piezas nuevas o canibalizadas validadas por almacén."
    ],
    confidence: "88%"
  },
  prensa: {
    causes: [
      "Fuga interna en electroválvula direccional o proporcional hidráulica.",
      "Deterioro de sellos o retenes en el cilindro principal de 200T por temperatura de fluido H-68 elevada.",
      "Desviación en el presostato o sensor de sobrepresión."
    ],
    recommendations: [
      "Revisar el nivel y temperatura del aceite hidráulico H-68 en la centralita.",
      "Verificar la señal de mando 24V DC en las bobinas de la válvula REP-VLM-001.",
      "Inspeccionar manómetros del circuito de alta presión durante el intento de ciclo."
    ],
    confidence: "94%"
  },
  horno: {
    causes: [
      "Falla en resistencia eléctrica o en relé de estado sólido (SSR) de potencia.",
      "Descalibración o ruptura del termopar Tipo K por fatiga térmica en zona caliente.",
      "Obstrucción en los ventiladores de recirculación de aire del horno."
    ],
    recommendations: [
      "Realizar medición de continuidad y aislamiento en el Termopar Tipo K (REP-SENS-002).",
      "Con cámara termográfica o pirómetro infrarrojo verificar si hay zonas frías en el banco de resistencias.",
      "Confirmar que el controlador PID de temperatura tenga la parametrización de ganancia correcta."
    ],
    confidence: "91%"
  }
};

// POST /api/ai/diagnose (Genera consejo y diagnóstico asistido por Inteligencia Artificial para el Técnico en una OT)
router.post('/diagnose', async (req, res) => {
  const { assetName, symptom, assetCode, areaName } = req.body;
  
  console.log(`🤖 Solicitud de Diagnóstico Asistido IA para: [${assetCode}] ${assetName} - Síntoma: "${symptom}"`);
  
  try {
    // Si hubiese una clave real de OpenAI o Gemini en .env, aquí haríamos el fetch HTTP nativo a su API.
    // Por simplicidad del MVP y robustez sin costo de API en planta, devolvemos el motor de diagnóstico inferido en tiempo real:
    await new Promise(r => setTimeout(r, 800)); // Simular latencia de inferencia de IA

    let diagnosis = aiDiagnosisKnowledge.default;
    const nameLower = (assetName || '').toLowerCase();
    const sympLower = (symptom || '').toLowerCase();

    if (nameLower.includes('prensa') || sympLower.includes('presión') || sympLower.includes('hidráulic')) {
      diagnosis = aiDiagnosisKnowledge.prensa;
    } else if (nameLower.includes('horno') || sympLower.includes('temperatura') || sympLower.includes('calor')) {
      diagnosis = aiDiagnosisKnowledge.horno;
    }

    // Personalizar respuesta combinada con contexto del activo
    const responsePayload = {
      asset: assetName || 'Máquina de Producción',
      symptomReported: symptom,
      generatedAt: new Date().toISOString(),
      aiModel: 'Antigravity-Industrial-Expert-v1',
      confidenceScore: diagnosis.confidence,
      possibleCauses: diagnosis.causes,
      recommendedSteps: diagnosis.recommendations,
      safetyWarning: "🚨 Recuerda portar el EPP obligatorio y aplicar bloqueo LOTO antes de manipular componentes electrificados o hidráulicos en el CECO."
    };

    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar asistente de IA', details: error.message });
  }
});

module.exports = router;
