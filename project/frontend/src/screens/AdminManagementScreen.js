import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { API } from '../api/api';
import useAuth from '../hooks/useAuth';

// 🎨 Paleta premium estilo resort
const COLORS = {
  PRIMARY: "#204D45",
  SECONDARY: "#77A89A",
  ACCENT: "#F6C945",
  BACKGROUND: "#F2EFE7",
  CARD: "#FFFFFF",
  DANGER: "#D9534F",
  SUCCESS: "#7CB342",
  TEXT: "#2A2A2A",
  LIGHT_TEXT: "#FFFFFF",
  BORDER: "#DFDCCE",
  SHADOW: "rgba(0,0,0,0.15)",
};

const AdminManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/usuarios");
      setUsers(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      Alert.alert("❌ Error", "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Cambiar rol a admin
  const promoteToAdmin = async (userId, userName) => {
    try {
      await API.put(`/usuarios/${userId}`, { rol: 'admin' });
      Alert.alert("✅ Éxito", `${userName} ahora es Administrador`);
      fetchUsers();
    } catch (err) {
      console.error("Error al promover usuario:", err);
      Alert.alert("❌ Error", "No se pudo promover el usuario");
    }
  };

  // Cambiar rol a usuario
  const demoteToRegular = async (userId, userName) => {
    try {
      await API.put(`/usuarios/${userId}`, { rol: 'usuario' });
      Alert.alert("⚠️ Rol actualizado", `${userName} ahora es Usuario`);
      fetchUsers();
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      Alert.alert("❌ Error", "No se pudo cambiar el rol");
    }
  };

  const UserItem = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Ionicons 
          name={user.rol === 'admin' ? "shield-checkmark" : "person"} 
          size={24} 
          color={user.rol === 'admin' ? COLORS.PRIMARY : COLORS.SECONDARY} 
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.nombre}</Text>
          <Text style={styles.useremail}>{user.email}</Text>
          <View style={[styles.roleBadge, { 
            backgroundColor: user.rol === 'admin' 
              ? COLORS.SUCCESS + '33' 
              : COLORS.BORDER 
          }]}>
            <Text style={[
              styles.userRole,
              { color: user.rol === 'admin' ? COLORS.SUCCESS : COLORS.TEXT }
            ]}>
              {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {user.rol !== 'admin' ? (
          <TouchableOpacity 
            style={styles.promoteButton}
            onPress={() => 
              Alert.alert(
                "Promover a Admin",
                `¿Promover a ${user.nombre} a administrador?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Promover", onPress: () => promoteToAdmin(user._id, user.nombre) }
                ]
              )
            }
          >
            <MaterialIcons name="admin-panel-settings" size={18} color={COLORS.LIGHT_TEXT} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.demoteButton}
            onPress={() => 
              Alert.alert(
                "Quitar rol de Admin",
                `¿Quitar privilegios a ${user.nombre}?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Quitar", onPress: () => demoteToRegular(user._id, user.nombre) }
                ]
              )
            }
          >
            <Ionicons name="person-remove" size={18} color={COLORS.LIGHT_TEXT} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.rol === 'admin').length,
    usuarios: users.filter(u => u.rol === 'usuario').length
  }), [users]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color={COLORS.LIGHT_TEXT} />
        </TouchableOpacity>

        <Text style={styles.title}>Gestión de Usuarios</Text>

        <TouchableOpacity onPress={() => logout(navigation)} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={26} color={COLORS.LIGHT_TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <StatCard number={stats.total} label="Total" color={COLORS.PRIMARY} />
          <StatCard number={stats.admins} label="Admins" color={COLORS.ACCENT} />
          <StatCard number={stats.usuarios} label="Usuarios" color={COLORS.SECONDARY} />
        </View>

        <Text style={styles.subtitle}>Lista de Usuarios</Text>

        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <UserItem user={item} />}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Botón Flotante */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchUsers}
      >
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Tarjeta de estadística
const StatCard = ({ number, label, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statNumber, { color }]}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.TEXT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.LIGHT_TEXT,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.SECONDARY,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ACCENT,
    paddingLeft: 10,
  },
  userCard: {
    backgroundColor: COLORS.CARD,
    padding: 18,
    marginBottom: 12,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  useremail: {
    fontSize: 14,
    color: COLORS.SECONDARY,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
    gap: 8,
  },
  promoteButton: {
    backgroundColor: COLORS.SUCCESS,
    padding: 10,
    borderRadius: 10,
    elevation: 3,
  },
  demoteButton: {
    backgroundColor: COLORS.DANGER,
    padding: 10,
    borderRadius: 10,
    elevation: 3,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: COLORS.PRIMARY,
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default AdminManagementScreen;
