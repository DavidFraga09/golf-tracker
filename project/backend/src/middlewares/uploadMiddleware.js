// backend/src/middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================================
// 📁 UBICACIÓN DE LA CARPETA "uploads"
// ======================================================
// Guardamos archivos FUERA de src/ para que no dé errores al compilar
const uploadDir = path.join(__dirname, "../../uploads");

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📂 Carpeta 'uploads' creada:", uploadDir);
}

// ======================================================
// 🗂️ CONFIGURACIÓN DE MULTER (almacenamiento)
// ======================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    try {
      const userId = req.user?.id || req.user?._id || "guest";
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);

      cb(null, `user-${userId}-${timestamp}${ext}`);
    } catch (error) {
      console.error("❌ Error al generar nombre de archivo:", error);
      cb(error);
    }
  },
});

// ======================================================
// 🔍 FILTRO: SOLO IMÁGENES PERMITIDAS
// ======================================================
const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(new Error("No se envió ningún archivo"), false);
  }

  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (.jpg, .png, .jpeg)"), false);
  }
};

// ======================================================
// 🚀 EXPORTACIÓN FINAL DEL MIDDLEWARE
// ======================================================
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máx. 5MB
});

module.exports = upload;
