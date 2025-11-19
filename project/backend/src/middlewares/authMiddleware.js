// backend/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No se proporcionó token" });
    }

    // Espera formato: "Bearer token"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Formato de token inválido" });
    }

    const token = parts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Token inválido o expirado" });
      }

      // Guardas los datos del usuario en la request
      req.user = decoded;
      next(); // ✅ Importante: continuar con la ruta
    });
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    return res.status(500).json({ message: "Error de autenticación" });
  }
};
