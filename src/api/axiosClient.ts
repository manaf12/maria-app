/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/axiosClient.ts
import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000" ; // عدليها حسب الـ backend

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

  // ضع التوكن
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ⚠️ لا تجبر JSON إذا الـ data عبارة عن FormData
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  } else {
    // لو كان FormData → احذف Content-Type ودعه تلقائي
    delete config.headers["Content-Type"];
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
