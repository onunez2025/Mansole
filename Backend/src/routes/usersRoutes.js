/**
 * /api/users — Redirige al router canónico en /api/auth
 *
 * El esquema real de MANSOLE.Users usa:
 *   FirstName, LastName, Email, PasswordHash, RoleId, IsActive
 *
 * Toda la lógica de Usuarios y Roles ya está implementada correctamente
 * en authRoutes.js (montado en /api/auth). Este archivo existe únicamente
 * para evitar un 404 si algún cliente llama a /api/users directamente.
 * El frontend (api.js) usa /api/auth/users — que es la ruta correcta.
 */
const express = require('express');
const router = express.Router();

router.all('*', (req, res) => {
  res.status(308).json({
    error: 'Ruta movida permanentemente',
    message: 'Usa /api/auth/users para gestión de usuarios. Este endpoint fue deprecado.',
    canonical: `/api/auth${req.path}`
  });
});

module.exports = router;
