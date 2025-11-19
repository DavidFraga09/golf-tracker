// backend/src/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket"],
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id}`);

    // JOIN
    socket.on("join_carrito", (carrito_id) => {
      if (!carrito_id) return;

      socket.join(carrito_id);
      console.log(`📌 Socket ${socket.id} unido al carrito: ${carrito_id}`);

      socket.emit("joined_room", { carrito_id });
    });

    // UBICACIÓN ACTUALIZADA
    socket.on("ubicacion_actualizada", (data) => {
      if (!data || !data.carrito_id) {
        console.log("⚠️ Datos inválidos recibidos en ubicación:", data);
        return;
      }

      io.to(data.carrito_id).emit("ubicacion_actualizada", data);

      console.log(
        `📡 Ubicación recibida → Carrito ${data.carrito_id} | Lat: ${data.latitud}, Lon: ${data.longitud}`
      );
    });

    // ALERTAS
    socket.on("alerta", (alertData) => {
      io.emit("alerta", alertData);
      console.log("🚨 Alerta emitida:", alertData);
    });

    // DISCONNECT
    socket.on("disconnect", (reason) => {
      console.log(`🔴 Cliente desconectado (${socket.id}) → Motivo: ${reason}`);
    });

    socket.on("error", (err) => {
      console.error(`⚠️ Error en socket ${socket.id}:`, err.message);
    });
  });

  console.log("✅ Socket.IO inicializado correctamente\n");
  return io;
}

function getIO() {
  if (!io) throw new Error("❌ Socket.IO no inicializado");
  return io;
}

module.exports = { initSocket, getIO };
