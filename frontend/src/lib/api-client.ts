import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { SESSION_COOKIE } from "./auth-constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies (refresh token)
});

let _refreshFailed = false;

// Request interceptor: attach access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const url = original.url ?? "";
    const isAuthRequest = url.startsWith("/auth/");
    if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
      // If a previous refresh already failed, don't retry — go straight to login
      if (_refreshFailed) {
        _redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.access_token;
        setAccessToken(newToken);
        _refreshFailed = false;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        _refreshFailed = true;
        processQueue(refreshError, null);
        clearAccessToken();
        _redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function _redirectToLogin() {
  if (typeof window === "undefined") return;
  // Clear the lightweight session cookie so middleware stops redirecting to /dashboard
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  window.location.replace("/auth/login");
}

// Token helpers (in-memory + sessionStorage for tab persistence)
let _accessToken: string | null = null;

export const getAccessToken = (): string | null => {
  if (_accessToken) return _accessToken;
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("access_token");
  }
  return null;
};

export const setAccessToken = (token: string) => {
  _accessToken = token;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("access_token", token);
  }
};

export const clearAccessToken = () => {
  _accessToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("access_token");
  }
};

// ─── Proactive token refresh ─────────────────────────────────────────────────
// Decode JWT payload to check expiry without a library
function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string, bufferSeconds = 60): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  // Refresh if within `bufferSeconds` of expiry
  return payload.exp * 1000 < Date.now() + bufferSeconds * 1000;
}

let proactiveRefreshInitiated = false;

function initProactiveRefresh() {
  if (proactiveRefreshInitiated) return;
  proactiveRefreshInitiated = true;

  if (typeof document === "undefined") return;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;

    const token = getAccessToken();
    if (!token) {
      // No access token but might have a valid refresh cookie — try refreshing
      tryProactiveRefresh();
      return;
    }

    if (isTokenExpiringSoon(token, 120)) {
      tryProactiveRefresh();
    }
  });
}

let _proactiveRefreshInFlight = false;

async function tryProactiveRefresh() {
  if (_proactiveRefreshInFlight || isRefreshing || _refreshFailed) return;
  _proactiveRefreshInFlight = true;

  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = data.access_token;
    setAccessToken(newToken);
  } catch {
    // Refresh failed — the response interceptor will handle redirect on next API call
  } finally {
    _proactiveRefreshInFlight = false;
  }
}

// Initialize on import (client-side only)
if (typeof window !== "undefined") {
  initProactiveRefresh();
}
