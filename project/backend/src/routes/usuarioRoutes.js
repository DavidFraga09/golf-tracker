const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser
} = require('../controllers/usuarioController');
const auth = require('../middlewares/authMiddleware');
const adminOnly = require('../middlewares/adminOnly');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);

router.get('/', getAllUsers);                 // puedes protegerlo si quieres: [auth, adminOnly]
router.put('/:id', auth, updateUser);         // actualizar usuario
router.delete('/:id', auth, adminOnly, deleteUser); // solo admin

module.exports = router;
