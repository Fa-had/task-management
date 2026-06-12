"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api";
import type { SignupPayload, LoginPayload } from "@/types";
import { toast } from "sonner";

export function useAuth() {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const router = useRouter();

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) => authApi.signup(payload),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(`Welcome to task_management, ${data.user.name}! 🐜`);
      router.push("/dashboard");
    },
    onError: (error: {
      response?: { data?: { error?: { message?: string } } };
    }) => {
      const message = error?.response?.data?.error?.message || "Signup failed";
      toast.error(message);
    },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setUser(data.user);
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
      toast.success("Logged out successfully.");
      router.push("/auth/login");
    },
  });

  return {
    user,
    isAuthenticated,
    signup: signupMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isSigningUp: signupMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
