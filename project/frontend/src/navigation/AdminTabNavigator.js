import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Pantallas
import AdminDashboard from "../screens/AdminDashboard";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AlertasScreen from "../screens/AlertasScreen";


const Tab = createBottomTabNavigator();

const COLORS = {
  PRIMARY: "#1E3F20",
  DARK_BG: "#0f141c",
  DARK_CARD: "#16222f",
  CARD: "#FFFFFF",
  ACCENT: "#FFC107",
};

// 🌟 AdminTabNavigator optimizado y compatible con tu AuthContext
export default function AdminTabNavigator({ user, logout, isDark, setIsDark }) {
  
  // Función para activar/desactivar modo oscuro
  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // ÍCONOS
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home-outline";

          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          if (route.name === "Perfil") iconName = focused ? "person" : "person-outline";
          if (route.name === "Ajustes")
            iconName = focused ? "settings" : "settings-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        // Colores dinámicos
        tabBarActiveTintColor: isDark ? COLORS.ACCENT : COLORS.PRIMARY,
        tabBarInactiveTintColor: isDark ? "#888" : "gray",

        // Estilos dinámicos del TabBar
        tabBarStyle: {
          backgroundColor: isDark ? COLORS.DARK_CARD : COLORS.CARD,
          borderTopColor: isDark ? COLORS.DARK_BG : "#ddd",
          elevation: 12,
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      
      {/* =====================  HOME / DASHBOARD ===================== */}
      <Tab.Screen name="Home" options={{ title: "Inicio" }}>
        {(props) => (
          <AdminDashboard
            {...props}
            user={user}
            logout={logout}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Alertas"
        component={AlertasScreen}
        options={{
          tabBarLabel: "Alertas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alarm-outline" color={color} size={size} />
          ),
        }}
      />


      {/* =====================  PERFIL ===================== */}
      <Tab.Screen name="Perfil">
        {(props) => (
          <ProfileScreen
            {...props}
            user={user}
            logout={logout}
            isDark={isDark}
          />
        )}
      </Tab.Screen>

      {/* =====================  AJUSTES ===================== */}
      <Tab.Screen name="Ajustes">
        {(props) => (
          <SettingsScreen
            {...props}
            isDark={isDark}
            toggleDark={toggleDark}
            user={user}
            logout={logout}
          />
        )}
      </Tab.Screen>

    </Tab.Navigator>
  );
}
