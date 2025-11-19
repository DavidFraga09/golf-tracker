const Ubicacion = require('../models/Ubicacion');

// POST /
exports.createUbicacion = async (req, res) => {
  try {
    const ubicacion = new Ubicacion(req.body);
    await ubicacion.save();
    res.status(201).json({ message: 'Ubicación registrada', ubicacion });
  } catch (err) {
    res.status(400).json({ message: 'Error al registrar ubicación', error: err.message });
  }
};

// GET /
exports.getUbicaciones = async (_req, res) => {
  try {
    const ubicaciones = await Ubicacion.find()
      .populate('carrito_id', 'identificador modelo')
      .populate('usuario_id', 'nombre rol');
    res.json(ubicaciones);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener ubicaciones', error: err.message });
  }
};

// GET /:id
exports.getUbicacionById = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findById(req.params.id)
      .populate('carrito_id', 'identificador modelo')
      .populate('usuario_id', 'nombre rol');
    if (!ubicacion) return res.status(404).json({ message: 'Ubicación no encontrada' });
    res.json(ubicacion);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener ubicación', error: err.message });
  }
};

// DELETE /:id
exports.deleteUbicacion = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findByIdAndDelete(req.params.id);
    if (!ubicacion) return res.status(404).json({ message: 'Ubicación no encontrada' });
    res.json({ message: 'Ubicación eliminada' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar ubicación', error: err.message });
  }
};
