const { ContainerClient } = require('@azure/storage-blob');
const path = require('path');

let containerClientInstance = null;

function getContainerClient() {
  if (containerClientInstance) return containerClientInstance;

  const sasUrl = process.env.AZURE_STORAGE_SAS_URL;
  if (!sasUrl) {
    throw new Error('AZURE_STORAGE_SAS_URL no está configurada en las variables de entorno (.env)');
  }

  containerClientInstance = new ContainerClient(sasUrl);
  return containerClientInstance;
}

/**
 * Obtiene el token SAS del URL para concatenarlo al blobUrl
 * permitiendo descargar o visualizar el archivo directamente con permisos 'r'.
 */
function getSasQuery() {
  const sasUrl = process.env.AZURE_STORAGE_SAS_URL || '';
  const queryIndex = sasUrl.indexOf('?');
  return queryIndex !== -1 ? sasUrl.substring(queryIndex) : '';
}

/**
 * Sube un archivo a Azure Blob Storage en el contenedor 'produccion'
 * @param {Buffer} buffer - Contenido binario del archivo
 * @param {string} originalName - Nombre original del archivo subido
 * @param {string} mimeType - Tipo MIME (image/png, application/pdf, etc.)
 * @param {string} folder - Subcarpeta virtual ('assets', 'workorders', etc.)
 * @returns {Promise<{blobName: string, blobUrl: string, originalName: string, size: number}>}
 */
async function uploadToBlob(buffer, originalName, mimeType, folder = 'assets') {
  const client = getContainerClient();

  // Limpiar nombre del archivo: remover caracteres especiales y espacios
  const cleanBase = path.basename(originalName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Reemplazar caracteres raros por guión bajo

  const blobName = `${folder}/${Date.now()}-${cleanBase}`;
  const blockBlobClient = client.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: mimeType || 'application/octet-stream'
    }
  });

  // URL directo con SAS token para visualización/descarga directa en navegador
  const sasQuery = getSasQuery();
  const directUrl = blockBlobClient.url.includes('?') 
    ? blockBlobClient.url 
    : `${blockBlobClient.url}${sasQuery}`;

  return {
    blobName,
    blobUrl: directUrl,
    cleanUrl: blockBlobClient.url.split('?')[0],
    originalName,
    size: buffer.length,
    mimeType
  };
}

/**
 * Lista los blobs dentro de una carpeta / prefijo
 */
async function listBlobs(prefix = '') {
  const client = getContainerClient();
  const sasQuery = getSasQuery();
  const results = [];

  for await (const blob of client.listBlobsFlat({ prefix })) {
    const blockBlobClient = client.getBlockBlobClient(blob.name);
    const directUrl = blockBlobClient.url.includes('?') 
      ? blockBlobClient.url 
      : `${blockBlobClient.url}${sasQuery}`;

    results.push({
      name: blob.name,
      size: blob.properties.contentLength,
      contentType: blob.properties.contentType,
      lastModified: blob.properties.lastModified,
      url: directUrl
    });
  }

  return results;
}

module.exports = {
  getContainerClient,
  uploadToBlob,
  listBlobs
};
