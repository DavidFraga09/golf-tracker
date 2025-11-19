import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

// Context
import { AuthProvider, useAuth } from "./src/context/AuthContext";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AdminTabNavigator from "./src/navigation/AdminTabNavigator";
import UserDashboard from "./src/screens/UserDashboard";

const Stack = createNativeStackNavigator();

/* ============================================
   NAVEGADOR PRINCIPAL
============================================ */
function AppNavigator() {
  const { user, loading, logout, isDark, setIsDark } = useAuth();

  // ⏳ Pantalla de carga durante la verificación del token
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#0f141c" : "#F5F5DC",
        }}
      >
        <ActivityIndicator size="large" color="#1E3F20" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* ============================================
            SI ESTÁ AUTENTICADO
        ============================================= */}
        {user ? (
          <>
            {user.rol === "admin" ? (
              <Stack.Screen name="AdminTabs">
                {(props) => (
                  <AdminTabNavigator
                    {...props}
                    user={user}
                    logout={logout}
                    isDark={isDark}
                    setIsDark={setIsDark}
                  />
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="UserTabs">
                {(props) => (
                  <UserDashboard
                    {...props}
                    user={user}
                    logout={logout}
                    isDark={isDark}
                    setIsDark={setIsDark}
                  />
                )}
              </Stack.Screen>
            )}
          </>
        ) : (
          <>
            {/* ============================================
                NO AUTENTICADO → LOGIN + REGISTRO
            ============================================= */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ============================================
   ENVOLVER TODO CON AuthProvider
============================================ */
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
