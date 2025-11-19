const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
  tipo_alerta: { 
    type: String, 
    enum: [
      'Emergencia médica', 
      'Falla mecánica', 
      'Batería baja', 
      'Accidente', 
      'Obstáculo', 
      'Otra'
    ],
    required: true 
  },
  detalle: { type: String, default: '' },

  ubicacion: {
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true }
  },

  atendida: { type: Boolean, default: false },

  carrito_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Carrito', 
    required: true 
  },

  usuario_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  }

}, { timestamps: true });


module.exports = mongoose.models.Alerta || mongoose.model('Alerta', alertaSchema);
