import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../api/api";
import { Alert } from "react-native";

export default function useAuth() {
  const [loading, setLoading] = useState(false);

  // Registro de cuenta de usuario
  const register = async (nombre, email, password, rol = "usuario") => {
    try {
      setLoading(true);

      const res = await API.post("/usuarios/register", {
        nombre,
        email,
        password,
        rol
      });

      Alert.alert("Registro exitoso", "Usuario creado correctamente");
      return true;

    } catch (err) {
      console.error("Error en registro:", err.response?.data || err.message);

      Alert.alert(
        "Error en registro",
        err.response?.data?.message || "No se pudo registrar el usuario"
      );

      return false;

    } finally {
      setLoading(false);
    }
  };

  // Inicio de sesión y almacenamiento de datos
  const login = async (loginData) => {
    try {
      setLoading(true);

      const res = await API.post("/usuarios/login", loginData);

      if (!res.data || !res.data.user) {
        throw new Error("Respuesta inválida del servidor");
      }

      const user = {
        ...res.data.user,
        profilePictureUrl: res.data.user.profilePictureUrl || null
      };

      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      Alert.alert("Bienvenido", `Hola ${user.nombre}`);

      // Redirección basada en rol asignado
      if (user.rol === "supervisor") return "SupervisorDashboard";
      if (user.rol === "Bellman") return "BellmanDashboard";
      return "UserDashboard";

    } catch (err) {
      console.error("Error en login:", err.response?.data || err.message);

      Alert.alert(
        "Error en login",
        err.response?.data?.message || "Credenciales incorrectas"
      );

      return null;

    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión y limpiar datos
  const logout = async (navigation) => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
      navigation.replace("Login");
    } catch (err) {
      console.error("Error en logout:", err);
    }
  };

  return { loading, register, login, logout };
}
