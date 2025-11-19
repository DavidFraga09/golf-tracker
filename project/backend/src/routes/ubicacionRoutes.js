const express = require('express');
const router = express.Router();
const {
  createUbicacion,
  getUbicaciones,
  getUbicacionById,
  deleteUbicacion
} = require('../controllers/ubicacionController');
const auth = require('../middlewares/authMiddleware');

router.post('/', auth, createUbicacion);
router.get('/', auth, getUbicaciones);
router.get('/:id', auth, getUbicacionById);
router.delete('/:id', auth, deleteUbicacion);

module.exports = router;
