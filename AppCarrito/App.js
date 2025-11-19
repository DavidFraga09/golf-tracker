import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import { CameraView } from "expo-camera";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================================
 🔗 SERVIDOR SOCKET.IO
================================ */
const SOCKET_SERVER_URL = "http://172.22.6.248:5000";

/* 🎨 Colores */
const COLORS = {
  PRIMARY: "#1A4314",
  SUCCESS: "#4CAF50",
  DANGER: "#CC3333",
  BACKGROUND: "#F7F3EB",
  TEXT: "#2A2A2A",
  SECONDARY: "#5F8D4E",
};

/* ================================
 🛰️ 1. TRANSMISIÓN GPS (TrackerScreen)
================================ */
const TrackerScreen = ({ carrito_id }) => {
  const [status, setStatus] = useState("Inicializando...");
  const [location, setLocation] = useState(null);
  const [socketStatus, setSocketStatus] = useState("desconectado");

  const socketRef = useRef(null);
  const locationSubscriber = useRef(null);

  useEffect(() => {
    const setup = async () => {
      try {
        // Conexión al servidor
        setStatus("Conectando al servidor...");
        socketRef.current = io(SOCKET_SERVER_URL, {
          transports: ["websocket"],
        });

        socketRef.current.on("connect", () => setSocketStatus("conectado"));
        socketRef.current.on("disconnect", () =>
          setSocketStatus("desconectado")
        );
        socketRef.current.on("connect_error", () =>
          setSocketStatus("error")
        );

        // Permisos GPS
        setStatus("Pidiendo permiso de ubicación...");
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setStatus("❌ Permiso de ubicación denegado");
          return;
        }

        // Iniciar transmisión continua
        setStatus("Buscando coordenadas...");
        locationSubscriber.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000,
            distanceInterval: 1,
          },
          (loc) => {
            const coords = loc.coords;
            setLocation(coords);
            setStatus("📡 Enviando ubicación...");

            // 🟢 Emitir ubicación usando carrito_id (igual al backend)
            if (socketRef.current?.connected) {
              socketRef.current.emit("ubicacion_actualizada", {
                carrito_id,                             // ← CORREGIDO
                latitud: coords.latitude,
                longitud: coords.longitude,
                direccion: coords.heading ?? 0,
                bateria: 100,
              });
            }
          }
        );
      } catch (err) {
        console.error("Error Tracker:", err);
        setStatus("⚠️ Error iniciando el rastreo");
      }
    };

    setup();

    return () => {
      locationSubscriber.current?.remove();
      socketRef.current?.disconnect();
    };
  }, [carrito_id]);

  const getSocketColor = () => {
    if (socketStatus === "conectado") return COLORS.SUCCESS;
    if (socketStatus === "error") return COLORS.DANGER;
    return COLORS.TEXT;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 MODO CARRITO</Text>
      <Text style={styles.id}>
        ID: {carrito_id ? carrito_id.substring(0, 10) : "??"}...
      </Text>

      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      <Text style={styles.status}>{status}</Text>

      {/* INFO */}
      <View style={styles.infoBox}>
        <Text style={styles.label}>Socket:</Text>
        <Text style={[styles.value, { color: getSocketColor() }]}>
          {socketStatus.toUpperCase()}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Latitud:</Text>
        <Text style={styles.value}>
          {location?.latitude?.toFixed(5) || "..."}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Longitud:</Text>
        <Text style={styles.value}>
          {location?.longitude?.toFixed(5) || "..."}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: COLORS.DANGER }]}
        onPress={async () => {
          await AsyncStorage.removeItem("assigned_cart_id");
          Alert.alert("Sesión cerrada", "Reinicia la app para volver a escanear.");
        }}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ================================
 📷 2. SCANEAR QR
================================ */
const ScannerScreen = ({ onScanSuccess }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getPerms = async () => {
      const cam = await CameraView.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
      setHasPermission(cam.status === "granted");
    };
    getPerms();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);

    Alert.alert("Carrito Detectado", `ID: ${data}`, [
      { text: "Cancelar", onPress: () => setScanned(false) },
      {
        text: "Confirmar",
        onPress: () => onScanSuccess(data), // ← Guarda carrito_id tal cual
      },
    ]);
  };

  if (hasPermission === null)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.status}>Pidiendo permisos...</Text>
      </View>
    );

  if (!hasPermission)
    return (
      <View style={styles.container}>
        <Text style={[styles.status, { color: COLORS.DANGER }]}>
          ❌ Permiso de cámara denegado
        </Text>
        <Button
          title="Reintentar"
          onPress={() => setHasPermission(null)}
          color={COLORS.PRIMARY}
        />
      </View>
    );

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Escanea el código QR del carrito</Text>
        <View style={styles.scannerBox} />
      </View>
    </View>
  );
};

/* ================================
 🧠 3. APP PRINCIPAL
================================ */
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [carrito_id, setCarritoId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const id = await AsyncStorage.getItem("assigned_cart_id");
      if (id) setCarritoId(id);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleScanSuccess = async (id) => {
    await AsyncStorage.setItem("assigned_cart_id", id);
    setCarritoId(id);
  };

  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.status}>Cargando...</Text>
      </View>
    );

  return carrito_id ? (
    <TrackerScreen carrito_id={carrito_id} />
  ) : (
    <ScannerScreen onScanSuccess={handleScanSuccess} />
  );
}

/* ================================
 🎨 ESTILOS
================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.PRIMARY },
  id: { fontSize: 14, color: COLORS.SECONDARY, marginBottom: 20 },
  status: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT,
    textAlign: "center",
    marginVertical: 20,
  },
  infoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 4,
  },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: "700" },

  scannerContainer: { flex: 1, backgroundColor: "black" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  overlayText: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "600",
  },
  scannerBox: {
    width: 260,
    height: 260,
    borderColor: "#fff",
    borderWidth: 2,
    borderRadius: 12,
  },

  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: "70%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
