const express = require('express');
const router = express.Router();
const {
  createAlerta,
  getAlertas,
  getAlertaById,
  atenderAlerta,
  deleteAlerta
} = require('../controllers/alertaController');
const auth = require('../middlewares/authMiddleware');
const adminOnly = require('../middlewares/adminOnly');

// Crear nueva alerta
router.post('/', auth, createAlerta);
  
// Obtener todas las alertas
router.get('/', auth, getAlertas);

// Obtener una alerta por ID
router.get('/:id', auth, getAlertaById);

// Marcar alerta como atendida
router.put('/:id/atender', auth, atenderAlerta);

// Eliminar alerta (solo admin)
router.delete('/:id', auth, adminOnly, deleteAlerta);

module.exports = router;
