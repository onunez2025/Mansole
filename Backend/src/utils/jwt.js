const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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
    userId: user.Id,
    username: user.Username,
    email: user.Email,
    roleId: user.Role_Id,
    permissions: permissions || []
  };

  const refreshPayload = {
    userId: user.Id,
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
