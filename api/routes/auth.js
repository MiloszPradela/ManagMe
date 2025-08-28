const express = require('express');
const router = express.Router();

// Importowanie wyspecjalizowanych routerów
const authenticationRoutes = require('./authentication');
const userRoutes = require('./user');
const passwordRoutes = require('./password');

// Ścieżki bazowe: /register, /login, /google
router.use('/', authenticationRoutes);

// Ścieżki użytkownika: /me, /me/profile, /me/avatar
router.use('/me', userRoutes);

// Ścieżki hasła: /password/forgot, /password/reset
router.use('/password', passwordRoutes);

module.exports = router;
