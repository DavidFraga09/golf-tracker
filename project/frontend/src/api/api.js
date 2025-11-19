import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API = axios.create({

  baseURL: "http://172.22.6.248:5000/api",
  // baseURL: "http://192.168.0.8:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para incluir token JWT
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
//http://192.168.0.14
//172.22.6.248
//192.168.0.13