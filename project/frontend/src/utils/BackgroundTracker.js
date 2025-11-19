// frontend/utils/BackgroundTracker.js
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { API } from "../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const LOCATION_TASK_NAME = "golf-cart-location-tracker";

/* ============================================================
   1. DEFINICIÓN DE LA TAREA EN SEGUNDO PLANO
============================================================ */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Error en tarea de ubicación:", error.message);
    return;
  }

  if (!data) return;

  const { locations } = data;
  const location = locations?.[0];

  if (!location) return;

  const carritoId = await AsyncStorage.getItem("assigned_cart_id");

  if (!carritoId) {
    console.log("⚠️ No hay carrito asignado, deteniendo rastreo.");
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    return;
  }

  const { latitude, longitude } = location.coords;

  try {
    // =========================================================
    //  NUEVO MODELO → actualiza ultima_ubicacion en Carrito
    // =========================================================
    await API.put(`/carritos/${carritoId}/ubicacion`, {
      latitud: latitude,
      longitud: longitude,
    });

    console.log(
      `📍 Ubicación enviada: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`
    );
  } catch (err) {
    console.error("❌ Error enviando ubicación:", err.response?.data || err.message);
  }
});

/* ============================================================
   2. INICIAR EL RASTREO
============================================================ */
export const startBackgroundTracking = async (carritoId) => {
  try {
    // Permiso foreground
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Se necesita acceso a tu ubicación.");
      return;
    }

    // Permiso background
    let bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Activa permisos de ubicación en segundo plano para rastrear el carrito."
      );
      return;
    }

    // Guardar carrito
    await AsyncStorage.setItem("assigned_cart_id", carritoId);

    // Iniciar rastreo
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 4000, // cada 4s
      distanceInterval: 5, // cada 5m
      showsBackgroundLocationIndicator: true,

      foregroundService: {
        notificationTitle: "Rastreo Activo",
        notificationBody: "La ubicación del carrito se está enviando.",
        notificationColor: "#1E3F20",
      },
    });

    Alert.alert("📡 Rastreo Iniciado", `Carrito ${carritoId} transmitiendo ubicación.`);
  } catch (err) {
    console.error("❌ Error iniciando rastreo:", err.message);
    Alert.alert("Error", "No se pudo iniciar el rastreo.");
  }
};

/* ============================================================
   3. DETENER EL RASTREO
============================================================ */
export const stopBackgroundTracking = async () => {
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );

    if (running) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      await AsyncStorage.removeItem("assigned_cart_id");

      Alert.alert("🛑 Rastreo detenido", "La ubicación ya no se está enviando.");
    }
  } catch (err) {
    console.error("❌ Error deteniendo rastreo:", err.message);
  }
};
