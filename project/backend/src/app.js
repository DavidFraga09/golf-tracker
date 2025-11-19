// src/utils/app.js
const express = require('express');
const cors = require('cors');

const carritoRoutes = require('../routes/carritoRoutes');
const ubicacionRoutes = require('../routes/ubicacionRoutes');
const usuarioRoutes = require('../routes/usuarioRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// Rutas principales
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/carritos', carritoRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: '❌ Ruta no encontrada' });
});

module.exports = app;
