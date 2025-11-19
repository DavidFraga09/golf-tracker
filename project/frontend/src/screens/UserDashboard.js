import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { API } from "../api/api";
import useAuth from "../hooks/useAuth";

const COLORS = {
  PRIMARY: "#1E3F20",
  SECONDARY: "#59775B",
  ACCENT: "#FFC107",
  BACKGROUND: "#F5F5DC",
  CARD: "#FFFFFF",
  DANGER: "#C0392B",
  WARNING: "#E67E22",
  TEXT_DARK: "#2B2B2B",
};

export default function UserDashboard({ navigation }) {
  const [carritoAsignado, setCarritoAsignado] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const solicitarCarrito = async () => {
    try {
      setLoading(true);
      const res = await API.get("/carritos");

      const disponibles = res.data.filter(
        (c) => c.estado === "activo" && c.bateria > 10
      );

      if (disponibles.length === 0) {
        Alert.alert(
          "Sin disponibilidad",
          "No hay carritos activos con batería suficiente."
        );
        return;
      }

      const carrito = disponibles.sort((a, b) => b.bateria - a.bateria)[0];
      setCarritoAsignado(carrito);

      Alert.alert(
        "Carrito asignado",
        `Carrito: ${carrito.identificador}\nBatería: ${carrito.bateria}%`
      );
    } catch (err) {
      console.error("Error solicitando carrito:", err);
      Alert.alert("Error", "No se pudo asignar un carrito.");
    } finally {
      setLoading(false);
    }
  };

  const liberarCarrito = () => {
    Alert.alert(
      "Liberar Carrito",
      "¿Deseas liberar el carrito?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, liberar",
          onPress: () => {
            setCarritoAsignado(null);
            Alert.alert("Listo", "Carrito liberado exitosamente.");
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí", onPress: () => logout(navigation) },
      ]
    );
  };

  // Coordenadas fallback por si no existe posición aún
  const lat = carritoAsignado?.ultima_ubicacion?.latitud || 20.6375;
  const lon = carritoAsignado?.ultima_ubicacion?.longitud || -87.0702;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>

      {carritoAsignado ? (
        <>
          <Text style={styles.subtitle}>Tu carrito asignado</Text>

          <View style={styles.card}>
            <Text style={styles.carritoId}>
              ID: {carritoAsignado.identificador}
            </Text>
            <Text style={styles.infoText}>
              Modelo: {carritoAsignado.modelo}
            </Text>

            <Text
              style={[
                styles.battery,
                carritoAsignado.bateria < 20 && styles.batteryLow,
              ]}
            >
              Batería: {carritoAsignado.bateria}%
            </Text>

            <Text
              style={[
                styles.status,
                carritoAsignado.estado === "activo"
                  ? styles.statusActive
                  : styles.statusInactive,
              ]}
            >
              Estado: {carritoAsignado.estado}
            </Text>
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: lat,
              longitude: lon,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
          >
            <Marker
              coordinate={{ latitude: lat, longitude: lon }}
              pinColor={COLORS.PRIMARY}
              title={carritoAsignado.identificador}
              description={`Batería: ${carritoAsignado.bateria}%`}
            />
          </MapView>

          <TouchableOpacity style={styles.liberarBtn} onPress={liberarCarrito}>
            <Text style={styles.btnText}>Liberar Carrito</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noCarritoContainer}>
          <Text style={styles.noCarritoText}>
            No tienes un carrito asignado
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={solicitarCarrito}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Solicitar Carrito</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// =======================
// 🎨 ESTILOS PREMIUM
// =======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.PRIMARY,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: COLORS.TEXT_DARK,
  },
  noCarritoContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  noCarritoText: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.CARD,
    padding: 18,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  carritoId: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 5,
    color: COLORS.PRIMARY,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.TEXT_DARK,
  },
  battery: {
    marginTop: 10,
    fontWeight: "700",
  },
  batteryLow: {
    color: COLORS.ACCENT,
  },
  status: {
    marginTop: 5,
    fontWeight: "700",
  },
  statusActive: {
    color: "green",
  },
  statusInactive: {
    color: "red",
  },
  map: {
    height: 240,
    marginVertical: 20,
    borderRadius: 16,
  },
  btn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  liberarBtn: {
    backgroundColor: COLORS.WARNING,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: COLORS.DANGER,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});
