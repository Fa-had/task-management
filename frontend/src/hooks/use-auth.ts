"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-constants";
import type { SignupPayload, LoginPayload } from "@/types";
import { toast } from "sonner";
import { TASKS_KEY } from "./use-tasks";

// Sync a lightweight session cookie so Next.js middleware can check
// auth status without parsing the JWT. The actual access token lives
// in sessionStorage (in-memory via api-client.ts).
function syncSessionCookie(set: boolean) {
  if (typeof document === "undefined") return;
  if (set) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax${
      location.protocol === "https:" ? "; Secure" : ""
    }`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  }
}

export function useAuth() {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) => authApi.signup(payload),
    onSuccess: (data) => {
      setUser(data.user);
      syncSessionCookie(true);
      toast.success(`Welcome to AntFlow, ${data.user.name}! 🐜`);
      router.push("/dashboard");
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      const message = error?.response?.data?.error?.message ?? "Signup failed";
      toast.error(message);
    },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setUser(data.user);
      syncSessionCookie(true);
      toast.success(`Welcome back, ${data.user.name}! 🐜`);
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Invalid email or password.");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearUser();
      syncSessionCookie(false);
      qc.removeQueries({ queryKey: [TASKS_KEY] });
      toast.success("Logged out. See you soon! 🐜");
      router.push("/auth/login");
    },
  });

  return {
    user,
    isAuthenticated,
    signup:      signupMutation.mutate,
    login:       loginMutation.mutate,
    logout:      logoutMutation.mutate,
    isSigningUp: signupMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
