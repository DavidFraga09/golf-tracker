import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  RefreshControl,
  ImageBackground,
  Image,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../context/AuthContext";
import { API } from "../api/api";

/* =========================
⚙️ CONFIG
========================= */
// 👀 Asegúrate de que esta IP sea la misma que uses en api.js
// const SOCKET_SERVER_URL = "http://172.22.6.248:5000";
const SOCKET_SERVER_URL = "http://192.168.0.8:5000";

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
  MY_LOCATION: "#4285F4",
};

const { width, height } = Dimensions.get("window");

const MAYAKOBA = { latitude: 20.7061, longitude: -87.0371 };
const DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

const lightStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 40 }],
  },
];

/* =========================
UTILS
========================= */
const generateColor = (id = "") => {
  let hash = 0;
  if (!id) return "#808080";
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
};

/* =========================
COMPONENTES PEQUEÑOS
========================= */
const BatteryPill = ({ pct = 0 }) => {
  let icon = "battery-full-outline";
  let color = COLORS.SUCCESS;
  if (pct <= 20) {
    icon = "battery-low-outline";
    color = COLORS.DANGER;
  } else if (pct <= 50) {
    icon = "battery-half-outline";
    color = COLORS.ACCENT;
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ marginLeft: 6, fontWeight: "700", color }}>{pct}%</Text>
    </View>
  );
};

const StatusChip = ({ status }) => {
  const map = {
    activo: { icon: "checkmark-circle", color: COLORS.SUCCESS, label: "ACTIVO" },
    mantenimiento: { icon: "build", color: COLORS.ACCENT, label: "MANTTO." },
    inactivo: { icon: "close-circle", color: COLORS.DANGER, label: "INACTIVO" },
  };
  const s = map[status] ?? { icon: "help-circle", color: COLORS.INFO, label: "?" };
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={s.icon} size={18} color={s.color} />
      <Text style={{ marginLeft: 6, fontWeight: "700", color: s.color }}>
        {s.label}
      </Text>
    </View>
  );
};

/* =========================
MODAL: CAMBIAR ESTADO
========================= */
const ChangeStateModal = ({ visible, onClose, cart, onChange }) => {
  if (!cart) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayModal}>
        <View style={styles.changeStateSheet}>
          <Text style={styles.changeTitle}>Cambiar Estado</Text>
          <Text style={styles.changeSubtitle}>{cart.identificador}</Text>

          {["activo", "mantenimiento", "inactivo"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.stateOption,
                {
                  backgroundColor:
                    s === "activo"
                      ? COLORS.SUCCESS
                      : s === "mantenimiento"
                      ? COLORS.ACCENT
                      : COLORS.DANGER,
                },
              ]}
              onPress={() => onChange(s)}
            >
              <Text style={styles.stateText}>{s.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* =========================
COMPONENTE PRINCIPAL
========================= */
export default function AdminDashboard({ navigation, user }) {
  const [carritos, setCarritos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [routeHistory, setRouteHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMap, setExpandedMap] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newCartId, setNewCartId] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showChangeState, setShowChangeState] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [myHeading, setMyHeading] = useState(0);

  // 🔔 Alertas
  const [alerts, setAlerts] = useState([]);

  // 🔹 Estados del formulario "Agregar Carrito"
  const [newIdentificador, setNewIdentificador] = useState("");
  const [newModelo, setNewModelo] = useState("");
  const [newEstado, setNewEstado] = useState("activo");
  const [savingCart, setSavingCart] = useState(false);

  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const flatListRef = useRef(null);

  const backgroundImage = require("../../assets/1.jpg");

  const { logout, user: authUser } = useAuth();
  const currentUser = user || authUser;

  /* StatusBar */
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor(COLORS.PRIMARY);
    }
  }, []);

  /* =========================
    CARGAR CARRITOS + ALERTAS
  ========================== */
  const loadCarritos = async (withSpinner = false) => {
    try {
      if (withSpinner) setRefreshing(true);

      const t = await AsyncStorage.getItem("token");
      console.log("🔑 TOKEN EN STORAGE (loadCarritos):", t);

      // 1) Carritos
      const { data: carritosData } = await API.get("/carritos");

      const carritosConVelocidad = carritosData.map((c) => ({
        ...c,
        velocidad: c.velocidad || 0,
      }));

      setCarritos(carritosConVelocidad);

      // 2) Alertas (todas, filtramos en front)
      try {
        const { data: alertasData } = await API.get("/alertas");
        setAlerts(Array.isArray(alertasData) ? alertasData : []);
      } catch (errAlerts) {
        console.log("⚠️ Error al cargar alertas:", errAlerts?.response?.data || errAlerts.message);
        setAlerts([]);
      }

      const first = carritosConVelocidad.find(
        (c) => c.ultima_ubicacion?.latitud && c.ultima_ubicacion?.longitud
      );

      if (first && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: first.ultima_ubicacion.latitud,
            longitude: first.ultima_ubicacion.longitud,
            latitudeDelta: DELTA.latitudeDelta / 2,
            longitudeDelta: DELTA.longitudeDelta / 2,
          },
          800
        );
      }
    } catch (e) {
      console.log("❌ ERROR AL CARGAR CARRITOS →", e?.response?.status, e?.message);
      console.log("📌 DETALLE COMPLETO →", e?.response?.data ?? e);

      Alert.alert("Error", "No se pudo cargar la flota.");
      setCarritos([]);
      setAlerts([]);
    } finally {
      setLoading(false);
      if (withSpinner) setRefreshing(false);
    }
  };

  /* =========================
    INIT
  ========================== */
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      console.log("🔍 Token en Dashboard antes de cargar:", token);

      if (!token) {
        Alert.alert("Sesión expirada", "Vuelve a iniciar sesión para ver la flota.", [
          {
            text: "OK",
            onPress: logout,
          },
        ]);
        setLoading(false);
        return;
      }

      loadCarritos(true);
    };

    init();
  }, [logout]);

  /* Ubicación Admin */
  useEffect(() => {
    let subLoc, subHead;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subLoc = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1200,
          distanceInterval: 1,
        },
        (loc) => setMyLocation(loc.coords)
      );

      subHead = await Location.watchHeadingAsync((h) => setMyHeading(h.magHeading));
    };

    start();
    return () => {
      subLoc?.remove();
      subHead?.remove();
    };
  }, []);

  /* SOCKET */
  const connectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const s = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    s.on("connect", () => console.log("🟢 Socket conectado"));
    s.on("disconnect", () => console.log("🔴 Socket desconectado"));

    s.on("ubicacion_actualizada", (data) => {
      setCarritos((prev) =>
        prev.map((c) =>
          c._id === data.carritoId
            ? {
                ...c,
                ultima_ubicacion: {
                  latitud: data.latitud,
                  longitud: data.longitud,
                },
                bateria: data.bateria ?? c.bateria,
                velocidad: data.velocidad ?? c.velocidad,
              }
            : c
        )
      );

      if (selected?._id === data.carritoId && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: data.latitud,
            longitude: data.longitud,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          },
          400
        );
      }
    });

    socketRef.current = s;
  }, [selected]);

  useEffect(() => {
    connectSocket();
    return () => socketRef.current?.disconnect();
  }, [connectSocket]);

  /* 🔔 Agrupar alertas por carrito (solo NO atendidas) */
  const alertsByCarrito = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      if (a.atendida) return;
      const id = a.carrito_id?._id || a.carrito_id;
      if (!id) return;
      if (!map[id]) map[id] = [];
      map[id].push(a);
    });
    return map;
  }, [alerts]);

  /* Métricas */
  const metrics = useMemo(
    () => ({
      total: carritos.length,
      activos: carritos.filter((c) => c.estado === "activo").length,
      baja: carritos.filter((c) => (c.bateria ?? 100) < 30).length,
      conAlertas: Object.keys(alertsByCarrito).length,
    }),
    [carritos, alertsByCarrito]
  );

  /* Helpers selección */
  const focusOnCart = (cart) => {
    setSelected(cart);
    setRouteHistory(null);

    if (cart.ultima_ubicacion && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: cart.ultima_ubicacion.latitud,
          longitude: cart.ultima_ubicacion.longitud,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        450
      );
    }
  };

  const handleCardPress = (cart) => {
    focusOnCart(cart);
  };

  const handleMarkerPress = (cart, index) => {
    focusOnCart(cart);
    if (flatListRef.current && carritos.length > 0) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.1,
        });
      } catch (err) {
        console.log("⚠️ Error al hacer scroll en FlatList:", err?.message);
      }
    }
  };

  const handleChangeState = async (newState) => {
    if (!selected) return;

    try {
      await API.put(`/carritos/${selected._id}`, { estado: newState });
      setCarritos((prev) =>
        prev.map((c) => (c._id === selected._id ? { ...c, estado: newState } : c))
      );
      setShowChangeState(false);
      Alert.alert("Éxito", `Estado cambiado a ${newState}`);
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado");
    }
  };

  const handleAddCarrito = () => {
    // Solo abre el modal y resetea campos
    setNewIdentificador("");
    setNewModelo("");
    setNewEstado("activo");
    setShowAdd(true);
  };

  const handleDeleteCarrito = async () => {
    if (!selected) return;

    try {
      await API.delete(`/carritos/${selected._id}`);
      setCarritos((prev) => prev.filter((c) => c._id !== selected._id));
      setSelected(null);
      setShowDelete(false);
      Alert.alert("Éxito", "Carrito eliminado");
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el carrito");
    }
  };

  /* ✅ CREAR CARRITO NUEVO (FUNCIONAL) */
  const handleSubmitNewCarrito = async () => {
    if (!newIdentificador.trim() || !newModelo.trim()) {
      Alert.alert("Campos incompletos", "Ingresa identificador y modelo.");
      return;
    }

    try {
      setSavingCart(true);

      const payload = {
        identificador: newIdentificador.trim(),
        modelo: newModelo.trim(),
        estado: newEstado,
      };

      if (myLocation) {
        payload.ultima_ubicacion = {
          latitud: myLocation.latitude,
          longitud: myLocation.longitude,
        };
      }

      const { data } = await API.post("/carritos", payload);
      const carritoCreado = data?.carrito ?? data;

      setCarritos((prev) => [...prev, carritoCreado]);

      setShowAdd(false);
      setNewIdentificador("");
      setNewModelo("");
      setNewEstado("activo");

      Alert.alert("Éxito", "Carrito creado correctamente.");
    } catch (error) {
      console.log("❌ Error al crear carrito:", error?.response?.data || error.message);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "No se pudo crear el carrito."
      );
    } finally {
      setSavingCart(false);
    }
  };

  /* 🔹 Cerrar sesión con confirmación */
  const confirmLogout = () => {
    Alert.alert("Cerrar sesión", "¿Deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);
  };

  /* RENDER ITEM DE LA LISTA */
  const renderCartItem = ({ item }) => {
    const isSelected = selected?._id === item._id;
    const activeAlerts = alertsByCarrito[item._id] || [];
    const hasActiveAlert = activeAlerts.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          hasActiveAlert && styles.cardAlert,
        ]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardRowTop}>
          <Text style={styles.cardTitle}>{item.identificador}</Text>
          <StatusChip status={item.estado} />
        </View>

        <Text style={styles.cardSubtitle}>{item.modelo}</Text>

        <View style={styles.cardRowBottom}>
          <BatteryPill pct={item.bateria ?? 0} />
          {item.ultima_ubicacion?.latitud && item.ultima_ubicacion?.longitud ? (
            <Text style={styles.cardCoords}>
              {item.ultima_ubicacion.latitud.toFixed(4)},{" "}
              {item.ultima_ubicacion.longitud.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.cardCoordsEmpty}>Sin ubicación aún</Text>
          )}
        </View>

        {/* Badge de alerta */}
        {hasActiveAlert && (
          <View style={styles.alertBadgeRow}>
            <Ionicons name="warning" size={14} color={COLORS.DANGER} />
            <Text style={styles.alertBadgeText}>
              {activeAlerts.length === 1
                ? "1 alerta activa"
                : `${activeAlerts.length} alertas activas`}
            </Text>
          </View>
        )}

        {/* Panel de alertas del carrito seleccionado */}
        {isSelected && hasActiveAlert && (
          <View style={styles.alertPanel}>
            {activeAlerts.map((alert) => (
              <View key={alert._id} style={styles.alertItem}>
                <View style={styles.alertItemHeader}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.DANGER} />
                  <Text style={styles.alertItemTitle}>{alert.tipo_alerta}</Text>
                </View>
                {!!alert.detalle && (
                  <Text style={styles.alertItemDetail}>{alert.detalle}</Text>
                )}
                <Text style={styles.alertItemTime}>
                  {alert.createdAt
                    ? new Date(alert.createdAt).toLocaleString()
                    : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /* RENDER */
  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={styles.container}>
        <View style={styles.darkOverlay} />
        <View style={styles.center}>
          <BlurView intensity={90} style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Cargando flota...</Text>
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

        <Text style={styles.topBarTitle}>Panel Administrativo</Text>

        {/* Avatar logout */}
        <TouchableOpacity onPress={confirmLogout}>
          <Image
            source={{ uri: currentUser?.profilePictureUrl || undefined }}
            style={styles.profileImage}
            defaultSource={require("../../assets/3.jpg")}
          />
        </TouchableOpacity>
      </BlurView>

      {/* Contenido Principal */}
      <FlatList
        ref={flatListRef}
        data={carritos}
        keyExtractor={(item) => item._id}
        renderItem={renderCartItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadCarritos(true)} />
        }
        ListHeaderComponent={
          <>
            {/* Métricas */}
            <View style={{ padding: 16 }}>
              <Text style={styles.titleMain}>Resumen de Flota</Text>

              <View style={styles.kpiRow}>
                <BlurView intensity={80} style={styles.kpi}>
                  <Text style={styles.kpiValue}>{metrics.total}</Text>
                  <Text style={styles.kpiLabel}>TOTAL</Text>
                </BlurView>

                <BlurView intensity={80} style={styles.kpi}>
                  <Text style={styles.kpiValue}>{metrics.activos}</Text>
                  <Text style={styles.kpiLabel}>ACTIVOS</Text>
                </BlurView>

                <BlurView intensity={80} style={styles.kpi}>
                  <Text style={styles.kpiValue}>{metrics.baja}</Text>
                  <Text style={styles.kpiLabel}>BATERÍA BAJA</Text>
                </BlurView>

                <BlurView intensity={80} style={styles.kpi}>
                  <Text style={styles.kpiValue}>{metrics.conAlertas}</Text>
                  <Text style={styles.kpiLabel}>ALERTAS</Text>
                </BlurView>
              </View>

              {/* Botón Agregar */}
              <TouchableOpacity
                style={styles.addButtonInline}
                onPress={handleAddCarrito}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addButtonInlineText}>Agregar Carrito</Text>
              </TouchableOpacity>

              {/* Mapa */}
              <View
                style={[
                  styles.mapCard,
                  expandedMap && { height: 420 },
                ]}
              >
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{ ...MAYAKOBA, ...DELTA }}
                  customMapStyle={lightStyle}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                >
                  {/* Marcadores de carritos */}
                  {carritos.map((cart, index) => {
                    const colorEstado =
                      cart.estado === "activo"
                        ? "#2ECC71"
                        : cart.estado === "mantenimiento"
                        ? "#FFC107"
                        : "#E74C3C";

                    const hasActiveAlert =
                      (alertsByCarrito[cart._id] || []).length > 0;

                    return (
                      <Marker
                        key={cart._id}
                        coordinate={{
                          latitude: cart.ultima_ubicacion?.latitud || MAYAKOBA.latitude,
                          longitude: cart.ultima_ubicacion?.longitud || MAYAKOBA.longitude,
                        }}
                        onPress={() => handleMarkerPress(cart, index)}
                      >
                        <View
                          style={[
                            styles.markerCircle,
                            {
                              backgroundColor: colorEstado,
                              borderColor: hasActiveAlert ? COLORS.DANGER : "#fff",
                              borderWidth: hasActiveAlert ? 3 : 2,
                              shadowColor: hasActiveAlert ? COLORS.DANGER : "#000",
                              shadowOpacity: hasActiveAlert ? 0.7 : 0.3,
                            },
                          ]}
                        >
                          <Text style={styles.markerNumber}>{index + 1}</Text>
                        </View>
                      </Marker>
                    );
                  })}

                  {/* Mi ubicación */}
                  {myLocation && (
                    <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }}>
                      <View style={styles.meDot}>
                        <Ionicons name="person" size={12} color="#fff" />
                      </View>
                    </Marker>
                  )}
                </MapView>

                {/* Label del carrito seleccionado */}
                {selected && selected.ultima_ubicacion ? (() => {
                  const point = {
                    latitude: selected.ultima_ubicacion.latitud,
                    longitude: selected.ultima_ubicacion.longitud,
                  };

                  const screenPoint = mapRef.current?.pointForCoordinate(point);
                  if (!screenPoint) return null;

                  return (
                    <View
                      style={[
                        styles.floatingLabel,
                        {
                          left: screenPoint.x - 75,
                          top: screenPoint.y - 60,
                        },
                      ]}
                    >
                      <Text style={styles.labelTitle}>{selected.modelo}</Text>
                      <Text style={styles.labelState}>
                        {selected.estado.toUpperCase()}
                      </Text>
                    </View>
                  );
                })() : null}

                {/* Botones del mapa */}
                <TouchableOpacity
                  style={styles.fabLeft}
                  onPress={() => setExpandedMap(!expandedMap)}
                >
                  <Ionicons
                    name={expandedMap ? "contract" : "expand"}
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fabRight}>
                  <Ionicons name="navigate" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.fabText}>Navegar</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de carritos - título */}
              <View style={styles.flotaHeader}>
                <Text style={styles.flotaHeaderText}>
                  Flota ({carritos.length})
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: "#fff", fontSize: 16 }}>
              No hay carritos registrados
            </Text>
          </View>
        }
      />

      {/* Modal cambiar estado */}
      <ChangeStateModal
        visible={showChangeState}
        onClose={() => setShowChangeState(false)}
        cart={selected}
        onChange={handleChangeState}
      />

      {/* Modal para AGREGAR carrito */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Agregar Carrito</Text>

            <Text style={styles.modalLabel}>Identificador</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. CART-004"
              placeholderTextColor="#999"
              value={newIdentificador}
              onChangeText={setNewIdentificador}
              autoCapitalize="characters"
            />

            <Text style={styles.modalLabel}>Modelo</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Club Car Tempo"
              placeholderTextColor="#999"
              value={newModelo}
              onChangeText={setNewModelo}
            />

            <Text style={styles.modalLabel}>Estado</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["activo", "mantenimiento", "inactivo"].map((estado) => {
                const active = newEstado === estado;
                return (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.modalStateBtn,
                      {
                        backgroundColor: active ? COLORS.PRIMARY : "#eee",
                      },
                    ]}
                    onPress={() => setNewEstado(estado)}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : COLORS.TEXT_DARK,
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      {estado.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {myLocation && (
              <Text style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
                Usará tu ubicación actual como ubicación inicial del carrito.
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 18,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: COLORS.BORDER },
                ]}
                disabled={savingCart}
                onPress={() => setShowAdd(false)}
              >
                <Text style={{ fontWeight: "800", color: COLORS.TEXT_DARK }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: COLORS.PRIMARY },
                ]}
                onPress={handleSubmitNewCarrito}
                disabled={savingCart}
              >
                {savingCart ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontWeight: "800", color: "#fff" }}>
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: "#fff",
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
  titleMain: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpi: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
    color: "#fff",
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ddd",
  },
  addButtonInline: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonInlineText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  mapCard: {
    marginTop: 14,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    height: 320,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  meDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.MY_LOCATION,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
  },
  fabLeft: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabRight: {
    position: "absolute",
    right: 12,
    top: 12,
    borderRadius: 20,
    backgroundColor: COLORS.ACCENT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    elevation: 6,
  },
  fabText: {
    marginLeft: 6,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  flotaHeader: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  flotaHeaderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  card: {
    marginHorizontal: 18,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.ACCENT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  cardAlert: {
    borderWidth: 2,
    borderColor: COLORS.DANGER,
  },
  cardRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardRowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cardTitle: {
    color: COLORS.TEXT_DARK,
    fontWeight: "900",
    fontSize: 16,
  },
  cardSubtitle: {
    marginTop: 4,
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
  },
  cardCoords: {
    fontSize: 11,
    color: "#777",
    fontStyle: "italic",
  },
  cardCoordsEmpty: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  speedText: {
    marginLeft: 4,
    fontWeight: "800",
    color: COLORS.TEXT_DARK,
    fontSize: 13,
  },
  btnSmall: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  btnSmallText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  overlayModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  changeStateSheet: {
    width: "90%",
    borderRadius: 16,
    padding: 18,
    backgroundColor: COLORS.CARD,
  },
  changeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  changeSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  stateOption: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 6,
  },
  stateText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  cancelBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.BORDER,
  },
  cancelText: {
    color: COLORS.TEXT_DARK,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalSheet: {
    width: "90%",
    borderRadius: 16,
    padding: 18,
    backgroundColor: COLORS.CARD,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  modalLabel: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    color: COLORS.TEXT_DARK,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    color: COLORS.TEXT_DARK,
  },
  modalStateBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeRedBtn: {
    marginTop: 10,
    alignSelf: "stretch",
    backgroundColor: COLORS.DANGER,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeRedText: {
    color: "#fff",
    fontWeight: "800",
  },
  qrOkBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    backgroundColor: COLORS.PRIMARY,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  qrOkText: {
    color: "#fff",
    fontWeight: "800",
  },
  floatingLabel: {
    position: "absolute",
    width: 150,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    zIndex: 9999,
    alignItems: "center",
  },
  labelTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  labelState: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerNumber: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },

  /* Alertas en cards */
  alertBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  alertBadgeText: {
    marginLeft: 4,
    color: COLORS.DANGER,
    fontWeight: "800",
    fontSize: 12,
  },
  alertPanel: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  alertItem: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
  },
  alertItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  alertItemTitle: {
    marginLeft: 4,
    color: COLORS.DANGER,
    fontWeight: "800",
    fontSize: 13,
  },
  alertItemDetail: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  alertItemTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
});
