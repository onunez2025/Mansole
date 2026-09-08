const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDbConnection, sql } = require('../config/db');
const { uploadToBlob } = require('../services/blobService');

// Configuración de Multer para carga en memoria (máximo 50MB por archivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

/**
 * Obtiene el token SAS del URL configurado en el servidor
 */
function getSasQuery() {
  const sasUrl = process.env.AZURE_STORAGE_SAS_URL || '';
  const queryIndex = sasUrl.indexOf('?');
  return queryIndex !== -1 ? sasUrl.substring(queryIndex) : '';
}

/**
 * POST /api/attachments/upload
 * Sube un archivo a Azure Blob Storage e inserta el registro en MANSOLE.Attachments
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha adjuntado ningún archivo' });
    }

    const { entityType, entityId } = req.body;
    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'entityType y entityId son requeridos' });
    }

    const folder = entityType.toLowerCase() === 'asset' ? 'assets' : (entityType.toLowerCase() === 'workorder' ? 'workorders' : 'general');

    // Subir a Azure Blob Storage
    const blobResult = await uploadToBlob(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    // Guardar referencia en Azure SQL Database (MANSOLE.Attachments)
    const pool = await getDbConnection();
    const query = `
      INSERT INTO MANSOLE.Attachments (EntityType, EntityId, FileName, BlobUrl, UploadedAt)
      VALUES (@entityType, @entityId, @fileName, @blobUrl, GETDATE());
      SELECT SCOPE_IDENTITY() AS Id, GETDATE() AS UploadedAt;
    `;

    const result = await pool.request()
      .input('entityType', sql.NVarChar(50), entityType)
      .input('entityId', sql.Int, parseInt(entityId, 10))
      .input('fileName', sql.NVarChar(255), req.file.originalname)
      .input('blobUrl', sql.NVarChar(1000), blobResult.blobUrl)
      .query(query);

    const newRecord = result.recordset[0];

    res.status(201).json({
      id: newRecord.Id,
      entityType,
      entityId: parseInt(entityId, 10),
      fileName: req.file.originalname,
      blobUrl: blobResult.blobUrl,
      uploadedAt: newRecord.UploadedAt,
      size: req.file.size,
      mimeType: req.file.mimetype,
      message: 'Archivo subido exitosamente a Azure Blob Storage y registrado en MANSOLE'
    });
  } catch (error) {
    console.error('Error al subir archivo a Azure Blob Storage:', error);
    res.status(500).json({ 
      error: 'Error al subir archivo a Azure Blob Storage', 
      details: error.message 
    });
  }
});

/**
 * GET /api/attachments/:entityType/:entityId
 * Lista los archivos adjuntos de una entidad (ej. Asset con Id=3)
 */
router.get('/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT Id, EntityType, EntityId, FileName, BlobUrl, UploadedAt
      FROM MANSOLE.Attachments
      WHERE EntityType = @entityType AND EntityId = @entityId
      ORDER BY UploadedAt DESC
    `;

    const result = await pool.request()
      .input('entityType', sql.NVarChar(50), entityType)
      .input('entityId', sql.Int, parseInt(entityId, 10))
      .query(query);

    const sasQuery = getSasQuery();

    // Asegurar que cada URL tenga el SAS Token vigente
    const attachments = result.recordset.map(att => {
      let activeUrl = att.BlobUrl;
      if (sasQuery && !activeUrl.includes('?')) {
        activeUrl = `${activeUrl}${sasQuery}`;
      }
      return {
        id: att.Id,
        entityType: att.EntityType,
        entityId: att.EntityId,
        fileName: att.FileName,
        blobUrl: activeUrl,
        uploadedAt: att.UploadedAt
      };
    });

    res.json(attachments);
  } catch (error) {
    console.error('Error al consultar adjuntos:', error);
    res.status(500).json({ error: 'Error al consultar adjuntos en BD', details: error.message });
  }
});

/**
 * DELETE /api/attachments/:id
 * Elimina el registro del adjunto de la base de datos
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('DELETE FROM MANSOLE.Attachments WHERE Id = @id');

    res.json({ message: 'Adjunto desvinculado exitosamente de la base de datos' });
  } catch (error) {
    console.error('Error al eliminar adjunto:', error);
    res.status(500).json({ error: 'Error al eliminar adjunto', details: error.message });
  }
});

module.exports = router;
