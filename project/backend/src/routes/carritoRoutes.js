const express = require('express');
const router = express.Router();
const {
  createCarrito,
  getCarritos,
  getCarritoById,
  updateCarrito,
  deleteCarrito
} = require('../controllers/carritoController');
const auth = require('../middlewares/authMiddleware');
const adminOnly = require('../middlewares/adminOnly');

router.post('/', auth, adminOnly, createCarrito);
router.get('/', auth, getCarritos);
router.get('/:id', auth, getCarritoById);
router.put('/:id', auth, updateCarrito);
router.delete('/:id', auth, adminOnly, deleteCarrito);

module.exports = router;
