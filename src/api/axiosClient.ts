/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/axiosClient.ts
import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/" ; // عدليها حسب الـ backend

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  },
});

// تخزين / حذف التوكن في localStorage فقط
export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

// كل request يشيّك على token من localStorage
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  console.log("Attaching token to request:", token);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("accessToken");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
