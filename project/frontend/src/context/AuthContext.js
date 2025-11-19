import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../api/api";

export const USER_KEY = "user";
export const TOKEN_KEY = "token";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =======================================
      🔑 LOGIN CORREGIDO
  ======================================= */
  const login = async ({ email, password, rol }) => {
    try {
      console.log("📤 AuthContext: Enviando login:", { email, password, rol });

      const { data } = await API.post("/usuarios/login", { email, password, rol });

      const backendUser = data.user || data.usuario;
      if (!backendUser) throw new Error("Respuesta inválida del servidor.");

      const userData = {
        ...backendUser,
        profilePictureUrl: backendUser.profilePictureUrl || null,
      };

      setUser(userData);
      setToken(data.token);

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_KEY, data.token);

      setIsDark(userData.rol === "admin");

      console.log("📥 AuthContext: Login OK:", userData);

      return userData; // 🔥 IMPORTANTE PARA NAVEGAR

    } catch (error) {
      console.error("❌ AuthContext error:", error.response?.data || error);
      throw new Error(error?.response?.data?.message || "Credenciales incorrectas.");
    }
  };

  /* =======================================
      🚪 LOGOUT
  ======================================= */
  const logout = async () => {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    setIsDark(false);
  };

  /* =======================================
      🔄 AUTO LOGIN
  ======================================= */
  const checkSession = async () => {
    try {
      setLoading(true);

      const storedUser = await AsyncStorage.getItem(USER_KEY);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        setIsDark(userData.rol === "admin");
      }

    } catch (err) {
      console.error("❌ Error cargando sesión", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
      <AuthContext.Provider value={{ user, token, loading, isDark, login, logout, setIsDark }}>
    {children}
  </AuthContext.Provider>

  );
};

export const useAuth = () => useContext(AuthContext);
