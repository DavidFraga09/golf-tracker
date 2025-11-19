module.exports = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ message: 'Requiere rol admin' });
  }
  next();
};
