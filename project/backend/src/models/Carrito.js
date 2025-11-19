const mongoose = require('mongoose');

const carritoSchema = new mongoose.Schema({
  identificador: { type: String, required: true, unique: true },
  modelo: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ['activo', 'inactivo', 'mantenimiento'], 
    default: 'activo' 
  },
  ultima_ubicacion: {
    latitud: { type: Number },
    longitud: { type: Number }
  },
  bateria: { type: Number, min: 0, max: 100, default: 100 },
  fecha_ultimo_mantenimiento: { type: Date, default: null },
  asignado_a: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Carrito', carritoSchema);
