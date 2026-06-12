import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies (refresh token)
});

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

    if (error.response?.status === 401 && !original._retry) {
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
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
