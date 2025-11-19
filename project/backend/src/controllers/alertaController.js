const Alerta = require('../models/Alerta');

// POST /api/alertas
exports.createAlerta = async (req, res) => {
  try {
    const alerta = new Alerta(req.body);
    await alerta.save();
    res.status(201).json({ message: '🚨 Alerta registrada correctamente', alerta });
  } catch (err) {
    res.status(400).json({ message: 'Error al registrar alerta', error: err.message });
  }
};

// GET /api/alertas
exports.getAlertas = async (_req, res) => {
  try {
    const alertas = await Alerta.find()
      .populate('carrito_id', 'identificador modelo estado')
      .populate('usuario_id', 'nombre rol email');
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener alertas', error: err.message });
  }
};

// GET /api/alertas/:id
exports.getAlertaById = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id)
      .populate('carrito_id', 'identificador modelo estado')
      .populate('usuario_id', 'nombre rol email');
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });
    res.json(alerta);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener alerta', error: err.message });
  }
};

// PUT /api/alertas/:id/atender
exports.atenderAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { atendida: true },
      { new: true }
    );
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });
    res.json({ message: '✅ Alerta marcada como atendida', alerta });
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar alerta', error: err.message });
  }
};

// DELETE /api/alertas/:id
exports.deleteAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findByIdAndDelete(req.params.id);
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });
    res.json({ message: '🗑️ Alerta eliminada correctamente' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar alerta', error: err.message });
  }
};
