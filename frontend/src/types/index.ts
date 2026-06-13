// Auth

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Tasks

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

// API

export interface PaginatedResponse<T> {
  tasks: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// UI

export interface TaskFilters {
  search: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  sort_by: "created_at" | "updated_at" | "due_date" | "priority";
  order: "asc" | "desc";
  page: number;
  limit: number;
}

export interface DashboardStats {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
}

// Ant Colony

export type AntBehavior =
  | "idle"
  | "wandering"
  | "walking"
  | "animated"
  | "investigating"
  | "celebrating"
  | "gathering"
  | "messenger"
  | "returning";

export interface AntState {
  id: number;
  x: number;
  y: number;
  behavior: AntBehavior;
  direction: number;
  speed: number;
  targetAngle: number;
  behaviorTimer: number;
  pauseTimer: number;
  animatedTimer: number;
  targetX: number | null;
  targetY: number | null;
  scale: number;
}
