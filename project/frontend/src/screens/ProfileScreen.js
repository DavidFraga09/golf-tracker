import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../api/api";

// 🟢 CORRECTO: AuthContext REAL
import { USER_KEY, useAuth } from "../context/AuthContext";

import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  PRIMARY: "#1E3F20",
  SECONDARY: "#59775B",
  ACCENT: "#FFC107",
  BACK: "#F5F5DC",
  CARD: "#FFFFFF",
  DANGER: "#E74C3C",
  TEXT_DARK: "#2B2B2B",

  // DARK MODE
  DARK_BG: "#0f141c",
  DARK_CARD: "#16222f",
  DARK_TEXT: "#d8e1ea",
};

export default function ProfileScreen({ navigation, isDark }) {
  const { logout, user: authUser } = useAuth();

  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const themeBg = isDark ? COLORS.DARK_BG : COLORS.BACK;
  const cardBg = isDark ? COLORS.DARK_CARD : COLORS.CARD;
  const textClr = isDark ? COLORS.DARK_TEXT : COLORS.TEXT_DARK;

  // =============================
  // 🔁 Cargar usuario desde contexto o storage
  // =============================
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authUser) {
          setUser(authUser);
        } else {
          const stored = await AsyncStorage.getItem(USER_KEY);
          if (stored) setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.log("❌ Error cargando usuario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [authUser]);

  // =============================
  // 🚪 Logout corregido
  // =============================
  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar Sesión", style: "destructive", onPress: () => logout() },
    ]);
  };

  // =============================
  // 📸 Cambiar foto de perfil
  // =============================
  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitas permitir acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;

    uploadImage(result.assets[0].uri);
  };

  // =============================
  // 🚀 Subir imagen al backend (100% corregido)
  // =============================
  const uploadImage = async (uri) => {
    try {
      setIsUploading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No token encontrado.");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      const fileExt = uri.split(".").pop();
      const fileName = `foto.${fileExt}`;

      formData.append("foto_perfil", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        type: "image/jpeg",
        name: fileName,
      });

      const { data } = await API.put("/usuarios/profile/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // Tu backend debe regresar: { foto_perfil: "url" }
      const updatedUser = { ...user, foto_perfil: data.foto_perfil };

      setUser(updatedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

      Alert.alert("Éxito", "Foto actualizada correctamente.");
    } catch (error) {
      console.log("❌ Error subiendo imagen:", error.response?.data || error);
      Alert.alert("Error", "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  // =============================
  // ⏳ Loading Screen
  // =============================
  if (loading || !user) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themeBg, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  // =============================
  // 🧩 Vista principal
  // =============================
  return (
    <ScrollView style={[styles.container, { backgroundColor: themeBg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textClr }]}>
          Mi Perfil
        </Text>
      </View>

      {/* FOTO */}
      <View style={styles.profileSection}>
        <View style={[styles.avatarContainer, { backgroundColor: cardBg }]}>
          {isUploading ? (
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          ) : user.foto_perfil ? (
            <Image
              key={user.foto_perfil}
              source={{ uri: `${user.foto_perfil}?t=${Date.now()}` }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color={textClr} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.SECONDARY }]}
          onPress={handleChangePhoto}
          disabled={isUploading}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>
            {isUploading ? "Cargando..." : "Cambiar Foto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* INFO */}
      <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={22} color={textClr} />
          <Text style={[styles.infoLabel, { color: textClr }]}>Nombre:</Text>
          <Text style={[styles.infoValue, { color: textClr }]}>
            {user.nombre}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={22} color={textClr} />
          <Text style={[styles.infoLabel, { color: textClr }]}>email:</Text>
          <Text style={[styles.infoValue, { color: textClr }]}>
            {user.email}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={22} color={textClr} />
          <Text style={[styles.infoLabel, { color: textClr }]}>Rol:</Text>
          <Text style={[styles.infoValue, { color: textClr }]}>
            {user.rol}
          </Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "900" },

  profileSection: { alignItems: "center", paddingVertical: 20 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  avatar: { width: "100%", height: "100%" },

  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },

  infoCard: { margin: 20, padding: 15, borderRadius: 16, elevation: 3 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoLabel: { fontSize: 16, fontWeight: "700", marginLeft: 15, flex: 1 },
  infoValue: { fontSize: 16, flex: 2, textAlign: "right" },

  logoutButton: {
    backgroundColor: COLORS.DANGER,
    margin: 20,
    alignSelf: "center",
    width: "90%",
    justifyContent: "center",
  },
});
