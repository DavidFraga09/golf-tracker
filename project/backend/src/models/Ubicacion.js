const mongoose = require('mongoose');

const ubicacionSchema = new mongoose.Schema({
  carrito_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrito', required: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  ultima_ubicacion: {
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true }
  },
  estado: { 
    type: String, 
    enum: ['en curso', 'completado', 'avanzado'], 
    default: 'en curso' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Ubicacion', ubicacionSchema);
