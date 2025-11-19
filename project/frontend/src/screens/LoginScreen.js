import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";

const PRIMARY_COLOR = "#1E3F20";
const SECONDARY_COLOR = "#4CAF50";
const TEXT_COLOR = "#333333";
const LIGHT_BACKGROUND = "#F5F5DC";
const CONTAINER_BG_TRANSPARENT = "rgba(255, 255, 255, 0.9)";

// 🔹 Roles definidos según tu BD
const ROLES = [
  { id: "admin", label: "Administrador" },
  { id: "supervisor", label: "Supervisor" },
  { id: "bellman", label: "Bellman" },
  { id: "usuario", label: "Usuario" },
];

const LoginScreen = ({ navigation }) => {
  const { login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const buttonAnimatedValue = useRef(new Animated.Value(1)).current;
  const containerAnimatedOpacity = useRef(new Animated.Value(0)).current;
  const containerAnimatedTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnimatedOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(containerAnimatedTranslateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  /* ==========================================================
     🔎 VALIDACIÓN + LOG + ALERTA DE ROL
   ========================================================== */
  const handleLogin = async () => {
    if (!email || !password || !rol)
      return Alert.alert("⚠️ Campos requeridos", "Completa los tres campos para continuar.");

    setIsLoginLoading(true);

    try {
      const loggedUser = await login({ email, password, rol });

      console.log("======================================");
      console.log("📤 Rol seleccionado en la app:", rol);
      console.log("📥 Rol recibido desde backend:", loggedUser?.rol);
      console.log("🧩 Usuario completo:", loggedUser);
      console.log("======================================");

      // Mostrar alerta para validación visual
      Alert.alert(
        "Resultado de validación de rol",
        `🔸 Rol seleccionado: ${rol}\n🔸 Rol devuelto por backend: ${loggedUser?.rol}`
      );

      // ⛔ NO navega hasta confirmar rol correcto
      // Cuando ya confirmes, borra el 'return' de abajo
      return;

      // 🚀 Navegación por roles (activar después)
      if (loggedUser.rol === "admin") {
        navigation.replace("AdminTabs");
      } else if (loggedUser.rol === "supervisor") {
        navigation.replace("SupervisorTabs");
      } else {
        navigation.replace("UserTabs");
      }

    } catch (error) {
      Alert.alert("❌ Error al iniciar sesión", error.message || "Verifica tus datos.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const isLoading = authLoading || isLoginLoading;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} />

      <Image source={require("../../assets/2.jpg")} style={styles.backgroundImage} />
      <View style={styles.backgroundOverlay} />

      <Animated.View style={[styles.loginContainer, { opacity: containerAnimatedOpacity, transform: [{ translateY: containerAnimatedTranslateY }] }]}>

        <Image source={require("../../assets/alila-logo.png")} style={styles.logo} />
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Ingresa con tus credenciales</Text>

        {/* email */}
        <View style={styles.inputGroup}>
          <Ionicons name="mail" size={20} color={PRIMARY_COLOR} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputGroup}>
          <Ionicons name="lock-closed" size={20} color={PRIMARY_COLOR} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity style={styles.togglePassword} onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>

        {/* ROLES */}
        <Text style={styles.roleLabel}>Selecciona tu rol</Text>
        <View style={styles.rolesContainer}>
          {ROLES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.roleOption, rol === item.id && styles.roleOptionSelected]}
              onPress={() => setRol(item.id)}
              disabled={isLoading}
            >
              <Text style={[styles.roleOptionText, rol === item.id && styles.roleOptionTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTÓN LOGIN */}
        <TouchableOpacity style={[styles.button, (!email || !password || !rol || isLoading) && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
        </TouchableOpacity>

      </Animated.View>
    </KeyboardAvoidingView>
  );
};

/* ==========================================================
   🎨 ESTILOS
   ========================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: PRIMARY_COLOR },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", resizeMode: "cover", opacity: 0.9 },
  backgroundOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(30, 63, 32, 0.4)" },
  loginContainer: { backgroundColor: CONTAINER_BG_TRANSPARENT, width: "85%", padding: 30, borderRadius: 25, alignItems: "center", elevation: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  logo: { width: 180, height: 60, resizeMode: "contain", marginBottom: 15 },
  title: { fontSize: 32, fontWeight: "800", color: PRIMARY_COLOR, marginBottom: 5 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 25, textAlign: "center", fontWeight: "500" },
  inputGroup: { width: "100%", marginBottom: 15, position: "relative", justifyContent: "center" },
  icon: { position: "absolute", left: 18, zIndex: 1 },
  input: { backgroundColor: LIGHT_BACKGROUND, borderRadius: 15, padding: 15, paddingLeft: 55, borderWidth: 1, borderColor: "#E0E0E0", fontSize: 16, color: TEXT_COLOR },
  togglePassword: { position: "absolute", right: 15, zIndex: 1, height: "100%", justifyContent: "center", padding: 10 },
  roleLabel: { width: "100%", fontSize: 14, fontWeight: "600", color: TEXT_COLOR, marginBottom: 8, marginTop: 5 },
  rolesContainer: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 15 },
  roleOption: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: PRIMARY_COLOR, backgroundColor: "#FFFFFF", marginHorizontal: 4, marginVertical: 3 },
  roleOptionSelected: { backgroundColor: PRIMARY_COLOR },
  roleOptionText: { fontSize: 12, fontWeight: "600", color: PRIMARY_COLOR },
  roleOptionTextSelected: { color: "#FFFFFF" },
  button: { backgroundColor: PRIMARY_COLOR, width: "100%", padding: 18, borderRadius: 15, alignItems: "center", marginTop: 20 },
  buttonDisabled: { backgroundColor: "#636363" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "900" },
});

export default LoginScreen;
