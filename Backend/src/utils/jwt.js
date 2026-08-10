const jwt = require('jsonwebtoken');

// Sin valor por defecto a propósito: firmar con un secreto conocido permitiría
// a cualquiera forjar tokens de administrador.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'Falta JWT_SECRET en el entorno. Genera uno con: ' +
    'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
  );
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generar Access Token (corta duración)
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generar Refresh Token (larga duración)
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verificar y decodificar token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error(`Token inválido: ${error.message}`);
  }
}

/**
 * Decodificar token sin verificar (para casos especiales)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Generar tokens de respuesta
 */
function generateTokens(user, permissions) {
  const accessPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    role: user.role,
    permissions: permissions || []
  };

  const refreshPayload = {
    userId: user.id,
    type: 'refresh'
  };

  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken(refreshPayload),
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generateTokens,
  JWT_SECRET
};
