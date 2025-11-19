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

// 🔐 IMPORTACIÓN CORRECTA DEL CONTEXTO
import { useAuth } from "../context/AuthContext";

// 🎨 COLORES
const PRIMARY_COLOR = "#1E3F20";
const SECONDARY_COLOR = "#4CAF50";
const TEXT_COLOR = "#333333";
const LIGHT_BACKGROUND = "#F5F5DC";
const CONTAINER_BG_TRANSPARENT = "rgba(255, 255, 255, 0.9)";

const RegisterScreen = ({ navigation }) => {
  const { register, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🎬 Animación del botón
  const buttonAnimatedValue = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(buttonAnimatedValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(buttonAnimatedValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  // 🎬 Animación del contenedor
  const containerAnimatedOpacity = useRef(new Animated.Value(0)).current;
  const containerAnimatedTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnimatedOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(containerAnimatedTranslateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ========================
  // 🚀 FUNCIÓN DE REGISTRO
  // ========================
  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("❌ Error", "Por favor completa todos los campos");
      return;
    }

    // Validación básica del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("❌ Error", "El email no es válido");
      return;
    }

    if (password.length < 6) {
      Alert.alert("❌ Error", "La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    // 🔥 Enviar datos al hook register
    const success = await register({
      nombre,
      email,
      password,
      rol: "usuario", // ✔ El rol REAL en tu BD
    });

    if (success) {
      Alert.alert("✔ Listo", "Tu cuenta ha sido creada con éxito");
      navigation.navigate("Login");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} />

      {/* Fondo visual */}
      <Image source={require("../../assets/2.jpg")} style={styles.backgroundImage} />
      <View style={styles.backgroundOverlay} />

      {/* Contenedor */}
      <Animated.View
        style={[
          styles.loginContainer,
          {
            opacity: containerAnimatedOpacity,
            transform: [{ translateY: containerAnimatedTranslateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={26} color={PRIMARY_COLOR} />
          </TouchableOpacity>

          <Text style={styles.title}>Crear Cuenta</Text>
          <View style={{ width: 30 }} />
        </View>

        <Text style={styles.subtitle}>
          Únete a la plataforma de carritos de golf.
        </Text>

        {/* Información */}
        <View style={styles.roleInfo}>
          <Ionicons name="information-circle-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.roleInfoText}>
            Tu cuenta será de tipo <Text style={{ fontWeight: "bold" }}>Usuario</Text>.  
            Si necesitas un rol administrativo, contacta al soporte.
          </Text>
        </View>

        {/* NOMBRE */}
        <View style={styles.inputGroup}>
          <Ionicons name="person" size={20} color={PRIMARY_COLOR} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
        </View>

        {/* email */}
        <View style={styles.inputGroup}>
          <Ionicons name="mail" size={20} color={PRIMARY_COLOR} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
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
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.togglePassword}
            disabled={loading}
          >
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>

        {/* BOTÓN REGISTRAR */}
        <Animated.View style={{ width: "100%", transform: [{ scale: buttonAnimatedValue }] }}>
          <TouchableOpacity
            style={[
              styles.button,
              (!nombre || !email || !password || loading) && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={!nombre || !email || !password || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>CREAR CUENTA</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* LINK LOGIN */}
        <View style={styles.links}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.linkStrong}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

// 🎨 ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.9,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30,63,32,0.4)",
  },

  loginContainer: {
    backgroundColor: CONTAINER_BG_TRANSPARENT,
    width: "85%",
    maxWidth: 380,
    padding: 30,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 15,
  },

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  backButton: {
    padding: 5,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    flex: 1,
    textAlign: "center",
    marginLeft: -30,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },

  roleInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(76,175,80,0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: SECONDARY_COLOR,
  },

  roleInfoText: {
    flex: 1,
    fontSize: 13,
    color: TEXT_COLOR,
    lineHeight: 18,
  },

  inputGroup: {
    width: "100%",
    marginBottom: 15,
    position: "relative",
  },

  icon: {
    position: "absolute",
    left: 18,
    zIndex: 1,
  },

  input: {
    backgroundColor: LIGHT_BACKGROUND,
    borderRadius: 15,
    padding: 15,
    paddingLeft: 55,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 16,
    color: TEXT_COLOR,
  },

  togglePassword: {
    position: "absolute",
    right: 15,
    zIndex: 1,
    padding: 10,
  },

  button: {
    backgroundColor: PRIMARY_COLOR,
    width: "100%",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    elevation: 6,
  },

  buttonDisabled: {
    backgroundColor: "#A0A0A0",
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },

  links: { marginTop: 25, alignItems: "center" },

  link: { color: TEXT_COLOR, fontSize: 14 },

  linkStrong: {
    color: SECONDARY_COLOR,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});

export default RegisterScreen;
