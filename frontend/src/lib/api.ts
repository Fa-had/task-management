import { apiClient, setAccessToken, clearAccessToken } from "./api-client";
import type {
  AuthResponse,
  SignupPayload,
  LoginPayload,
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  PaginatedResponse,
  TaskFilters,
} from "@/types";

// Auth API

export const authApi = {
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/signup", payload);
    setAccessToken(data.access_token);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    setAccessToken(data.access_token);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
    clearAccessToken();
  },

  refresh: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/refresh");
    setAccessToken(data.access_token);
    return data;
  },
};

// Tasks API

export const tasksApi = {
  list: async (filters: Partial<TaskFilters>): Promise<PaginatedResponse<Task>> => {
    const { data } = await apiClient.get<PaginatedResponse<Task>>("/tasks", {
      params: filters,
    });
    return data;
  },

  get: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.post<Task>("/tasks", payload);
    return data;
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
