import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { API } from "../api/api";
import { useAuth } from "../context/AuthContext";

/* =========================
⚙️ CONFIG
========================= */
const COLORS = {
  PRIMARY: "#1E3F20",
  SECONDARY: "#59775B",
  ACCENT: "#FFC107",
  BACK: "#F5F5DC",
  CARD: "#FFFFFF",
  DANGER: "#E74C3C",
  SUCCESS: "#2ECC71",
  TEXT_DARK: "#2B2B2B",
  TEXT_LIGHT: "#FFFFFF",
  BORDER: "#E1E1E1",
  INFO: "#3498DB",
};

const MAYAKOBA = { latitude: 20.7061, longitude: -87.0371 };
const DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

const TIPOS_ALERTA = [
  "Todas",
  "Emergencia médica",
  "Falla mecánica",
  "Batería baja",
  "Accidente",
  "Obstáculo",
  "Otra",
];

/* Helpers para colores por tipo / estado */
const getTipoColor = (tipo) => {
  switch (tipo) {
    case "Emergencia médica":
      return "#e74c3c";
    case "Falla mecánica":
      return "#e67e22";
    case "Batería baja":
      return "#f1c40f";
    case "Accidente":
      return "#c0392b";
    case "Obstáculo":
      return "#8e44ad";
    case "Otra":
      return "#3498db";
    default:
      return COLORS.INFO;
  }
};

const getTipoIcon = (tipo) => {
  switch (tipo) {
    case "Emergencia médica":
      return "medkit-outline";
    case "Falla mecánica":
      return "build-outline";
    case "Batería baja":
      return "battery-dead-outline";
    case "Accidente":
      return "warning-outline";
    case "Obstáculo":
      return "alert-circle-outline";
    case "Otra":
      return "information-circle-outline";
    default:
      return "alert-circle-outline";
  }
};

/* =========================
SCREEN PRINCIPAL
========================= */
export default function AlertasScreen({ navigation }) {
  const { logout } = useAuth();

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState("Todas");
  const [selectedAlerta, setSelectedAlerta] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const backgroundImage = require("../../assets/1.jpg");

  /* StatusBar */
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor(COLORS.PRIMARY);
    }
  }, []);

  /* Cargar alertas */
  const loadAlertas = useCallback(
    async (withSpinner = false) => {
      try {
        if (withSpinner) setRefreshing(true);
        const { data } = await API.get("/alertas"); // GET /api/alertas
        setAlertas(data || []);
      } catch (error) {
        console.log("❌ Error al cargar alertas:", error?.response?.data || error.message);
        Alert.alert("Error", "No se pudieron cargar las alertas.");
      } finally {
        setLoading(false);
        if (withSpinner) setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAlertas(false);
  }, [loadAlertas]);

  /* Filtrado por tipo */
  const alertasFiltradas = useMemo(() => {
    if (selectedTipo === "Todas") return alertas;
    return alertas.filter((a) => a.tipo_alerta === selectedTipo);
  }, [alertas, selectedTipo]);

  /* Contadores */
  const metrics = useMemo(() => {
    const total = alertas.length;
    const pendientes = alertas.filter((a) => !a.atendida).length;
    const atendidas = alertas.filter((a) => a.atendida).length;
    return { total, pendientes, atendidas };
  }, [alertas]);

  /* Marcar como atendida */
  const marcarComoAtendida = async (alerta) => {
    if (!alerta || alerta.atendida) return;

    try {
      await API.put(`/alertas/${alerta._id}`, { atendida: true });
      setAlertas((prev) =>
        prev.map((a) =>
          a._id === alerta._id ? { ...a, atendida: true } : a
        )
      );
      Alert.alert("Listo", "La alerta fue marcada como atendida.");
    } catch (error) {
      console.log("❌ Error al actualizar alerta:", error?.response?.data || error.message);
      Alert.alert("Error", "No se pudo marcar la alerta como atendida.");
    }
  };

  const confirmMarcarAtendida = (alerta) => {
    if (!alerta || alerta.atendida) return;
    Alert.alert(
      "Marcar como atendida",
      "¿Confirmas que esta alerta ya fue atendida?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, marcar",
          style: "destructive",
          onPress: () => marcarComoAtendida(alerta),
        },
      ]
    );
  };

  /* RENDER de una alerta */
  const renderAlerta = ({ item }) => {
    const colorTipo = getTipoColor(item.tipo_alerta);
    const iconName = getTipoIcon(item.tipo_alerta);

    return (
      <TouchableOpacity
        style={[
          styles.alertCard,
          item.atendida && { borderColor: "#2ecc71", borderWidth: 1.5 },
        ]}
        activeOpacity={0.9}
        onPress={() => setSelectedAlerta(item)}
      >
        {/* Header tipo + chip estado */}
        <View style={styles.alertHeaderRow}>
          <View style={styles.alertTipoRow}>
            <View
              style={[
                styles.tipoIconCircle,
                { backgroundColor: colorTipo },
              ]}
            >
              <Ionicons name={iconName} size={18} color="#fff" />
            </View>
            <View style={{ marginLeft: 8, flexShrink: 1 }}>
              <Text style={styles.alertTipoText}>{item.tipo_alerta}</Text>
              <Text style={styles.alertCarText}>
                {item.carrito_id?.identificador || "Carrito desconocido"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.chipEstado,
              item.atendida
                ? { backgroundColor: "rgba(46, 204, 113, 0.15)" }
                : { backgroundColor: "rgba(231, 76, 60, 0.15)" },
            ]}
          >
            <Ionicons
              name={item.atendida ? "checkmark-circle" : "alert-circle"}
              size={16}
              color={item.atendida ? "#2ecc71" : "#e74c3c"}
            />
            <Text
              style={[
                styles.chipEstadoText,
                { color: item.atendida ? "#2ecc71" : "#e74c3c" },
              ]}
            >
              {item.atendida ? "ATENDIDA" : "PENDIENTE"}
            </Text>
          </View>
        </View>

        {/* Detalle */}
        {item.detalle ? (
          <Text style={styles.alertDetalle} numberOfLines={2}>
            {item.detalle}
          </Text>
        ) : (
          <Text style={styles.alertDetalleEmpty}>Sin detalles adicionales</Text>
        )}

        {/* Ubicación mini + fecha */}
        <View style={styles.alertFooterRow}>
          <View style={styles.coordsRow}>
            <Ionicons name="location-outline" size={14} color="#555" />
            <Text style={styles.coordsText}>
              {item.ubicacion?.latitud?.toFixed(4)},{" "}
              {item.ubicacion?.longitud?.toFixed(4)}
            </Text>
          </View>

          <Text style={styles.alertFecha}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>

        {/* Botón marcar atendida */}
        {!item.atendida && (
          <TouchableOpacity
            style={styles.btnAtendida}
            onPress={() => confirmMarcarAtendida(item)}
          >
            <Ionicons name="checkmark-done" size={16} color="#fff" />
            <Text style={styles.btnAtendidaText}>Marcar como atendida</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  /* Loading inicial */
  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={styles.container}>
        <View style={styles.darkOverlay} />
        <View style={styles.center}>
          <BlurView intensity={90} style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Cargando alertas...</Text>
          </BlurView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.container}>
      <View style={styles.darkOverlay} />

      {/* Top Bar */}
      <BlurView intensity={90} style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Alertas de Carritos</Text>

        {/* Botón de refresh rápido */}
        <TouchableOpacity onPress={() => loadAlertas(true)}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </BlurView>

      {/* Contenido */}
      <View style={{ flex: 1 }}>
        {/* Métricas arriba */}
        <View style={styles.metricsContainer}>
          <BlurView intensity={70} style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL</Text>
            <Text style={styles.metricValue}>{metrics.total}</Text>
          </BlurView>

          <BlurView intensity={70} style={styles.metricCard}>
            <Text style={styles.metricLabel}>PENDIENTES</Text>
            <Text style={[styles.metricValue, { color: "#e74c3c" }]}>
              {metrics.pendientes}
            </Text>
          </BlurView>

          <BlurView intensity={70} style={styles.metricCard}>
            <Text style={styles.metricLabel}>ATENDIDAS</Text>
            <Text style={[styles.metricValue, { color: "#2ecc71" }]}>
              {metrics.atendidas}
            </Text>
          </BlurView>
        </View>

        {/* Filtros tipo alerta */}
        <View style={styles.filterScrollWrapper}>
          <FlatList
            data={TIPOS_ALERTA}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            renderItem={({ item }) => {
              const isActive = selectedTipo === item;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedTipo(item)}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Lista de alertas + mapa mini del seleccionado */}
        <View style={{ flex: 1 }}>
          {/* Mapa del alerta seleccionado (arriba, pequeño) */}
          {selectedAlerta && (
            <View style={styles.mapWrapper}>
              <BlurView intensity={70} style={styles.mapBlur}>
                <View style={styles.mapHeaderRow}>
                  <Text style={styles.mapTitle}>
                    {selectedAlerta.carrito_id?.identificador || "Carrito"}
                  </Text>
                  <Text style={styles.mapSubtitle}>
                    {selectedAlerta.tipo_alerta}
                  </Text>
                </View>

                <View style={styles.mapContainer}>
                  <MapView
                    style={{ flex: 1, borderRadius: 12 }}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                      latitude: selectedAlerta.ubicacion?.latitud || MAYAKOBA.latitude,
                      longitude: selectedAlerta.ubicacion?.longitud || MAYAKOBA.longitude,
                      ...DELTA,
                    }}
                    onMapReady={() => setMapReady(true)}
                  >
                    {mapReady && selectedAlerta.ubicacion?.latitud && (
                      <Marker
                        coordinate={{
                          latitude: selectedAlerta.ubicacion.latitud,
                          longitude: selectedAlerta.ubicacion.longitud,
                        }}
                      >
                        <View style={styles.markerAlert}>
                          <Ionicons
                            name={getTipoIcon(selectedAlerta.tipo_alerta)}
                            size={18}
                            color="#fff"
                          />
                        </View>
                      </Marker>
                    )}
                  </MapView>
                </View>
              </BlurView>
            </View>
          )}

          {/* Lista de alertas */}
          <FlatList
            data={alertasFiltradas}
            keyExtractor={(item) => item._id}
            renderItem={renderAlerta}
            contentContainerStyle={
              alertasFiltradas.length === 0
                ? [styles.listEmptyContainer]
                : { paddingHorizontal: 16, paddingBottom: 30 }
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadAlertas(true)}
                tintColor="#fff"
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
                  No hay alertas registradas para este filtro.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </ImageBackground>
  );
}

/* =========================
STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  topBar: {
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  topBarTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    width: "75%",
    height: "26%",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontWeight: "700",
  },

  /* Métricas */
  metricsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  metricLabel: {
    color: "#eee",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  metricValue: {
    marginTop: 4,
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  /* Filtros */
  filterScrollWrapper: {
    marginTop: 8,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  filterChipActive: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  filterChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: COLORS.PRIMARY,
  },

  /* Lista de alertas */
  alertCard: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  alertHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertTipoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  tipoIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTipoText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT_DARK,
  },
  alertCarText: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  chipEstado: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  chipEstadoText: {
    fontSize: 11,
    fontWeight: "700",
  },
  alertDetalle: {
    marginTop: 6,
    fontSize: 13,
    color: "#444",
  },
  alertDetalleEmpty: {
    marginTop: 6,
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  alertFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coordsText: {
    fontSize: 11,
    color: "#555",
  },
  alertFecha: {
    fontSize: 11,
    color: "#888",
  },
  btnAtendida: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnAtendidaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Mapa mini alerta seleccionada */
  mapWrapper: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  mapBlur: {
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  mapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  mapTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  mapSubtitle: {
    color: "#f1c40f",
    fontWeight: "700",
    fontSize: 12,
  },
  mapContainer: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  markerAlert: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e74c3c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
