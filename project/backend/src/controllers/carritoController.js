const Carrito = require('../models/Carrito');

// POST /
exports.createCarrito = async (req, res) => {
  try {
    const carrito = new Carrito(req.body);
    await carrito.save();
    res.status(201).json({ message: 'Carrito creado', carrito });
  } catch (err) {
    res.status(400).json({ message: 'Error al crear carrito', error: err.message });
  }
};

// GET /
exports.getCarritos = async (_req, res) => {
  try {
    const carritos = await Carrito.find().populate('asignado_a', 'nombre rol email');
    res.json(carritos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener carritos', error: err.message });
  }
};

// GET /:id
exports.getCarritoById = async (req, res) => {
  try {
    const carrito = await Carrito.findById(req.params.id).populate('asignado_a', 'nombre rol');
    if (!carrito) return res.status(404).json({ message: 'Carrito no encontrado' });
    res.json(carrito);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener carrito', error: err.message });
  }
};

// PUT /:id
exports.updateCarrito = async (req, res) => {
  try {
    const carrito = await Carrito.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!carrito) return res.status(404).json({ message: 'Carrito no encontrado' });
    res.json({ message: 'Carrito actualizado', carrito });
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar carrito', error: err.message });
  }
};

// DELETE /:id
exports.deleteCarrito = async (req, res) => {
  try {
    const carrito = await Carrito.findByIdAndDelete(req.params.id);
    if (!carrito) return res.status(404).json({ message: 'Carrito no encontrado' });
    res.json({ message: 'Carrito eliminado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar carrito', error: err.message });
  }
};
