const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['admin', 'supervisor', 'bellman', 'usuario'],
    default: 'usuario'
  },
  telefono: { type: String, default: null },
  foto_perfil: { type: String, default: null },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

// Encriptar contraseña antes de guardar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Usuario', usuarioSchema);
