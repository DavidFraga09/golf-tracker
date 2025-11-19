import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 🎨 Tus Colores Premium
const COLORS = {
  PRIMARY: "#1E3F20",
  BACK: "#F5F5DC",
  CARD: "#FFFFFF",
  TEXT_DARK: "#2B2B2B",

  // Dark Mode
  DARK_BG: "#0f141c",
  DARK_CARD: "#16222f",
  DARK_TEXT: "#d8e1ea",
};

export default function SettingsScreen({ isDark, toggleDark }) {
  // Estilos dinámicos
  const themeBg = isDark ? COLORS.DARK_BG : COLORS.BACK;
  const cardBg = isDark ? COLORS.DARK_CARD : COLORS.CARD;
  const textClr = isDark ? COLORS.DARK_TEXT : COLORS.TEXT_DARK;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textClr }]}>Ajustes</Text>
      </View>

      {/* Tarjeta principal */}
      <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.cardTitle, { color: textClr }]}>Preferencias</Text>

        {/* 🌙 Toggle Modo Oscuro */}
        <View style={styles.settingRow}>
          <Ionicons
            name={isDark ? "moon" : "moon-outline"}
            size={24}
            color={textClr}
          />
          <Text style={[styles.settingLabel, { color: textClr }]}>
            Modo Oscuro
          </Text>
          <Switch
            trackColor={{ false: "#767577", true: COLORS.PRIMARY }}
            thumbColor={isDark ? COLORS.PRIMARY : "#f4f3f4"}
            onValueChange={toggleDark}
            value={isDark}
          />
        </View>

        {/* Notificaciones */}
        <TouchableOpacity
          style={styles.settingRow}
          activeOpacity={0.6}
        >
          <Ionicons name="notifications-outline" size={24} color={textClr} />
          <Text style={[styles.settingLabel, { color: textClr }]}>
            Notificaciones
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color={textClr}
          />
        </TouchableOpacity>

        {/* Ayuda */}
        <TouchableOpacity style={styles.settingRow} activeOpacity={0.6}>
          <Ionicons name="help-circle-outline" size={24} color={textClr} />
          <Text style={[styles.settingLabel, { color: textClr }]}>
            Ayuda y Soporte
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color={textClr}
          />
        </TouchableOpacity>

        {/* Nueva sección opcional */}
        <TouchableOpacity style={styles.settingRow} activeOpacity={0.6}>
          <Ionicons name="shield-checkmark-outline" size={24} color={textClr} />
          <Text style={[styles.settingLabel, { color: textClr }]}>
            Privacidad y Seguridad
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color={textClr}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 🎨 ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
  },

  settingsCard: {
    margin: 20,
    padding: 15,
    borderRadius: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 15,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  settingLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 15,
    flex: 1,
  },
});
