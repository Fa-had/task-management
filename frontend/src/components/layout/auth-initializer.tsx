"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/lib/api-client";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Runs once on mount to validate the persisted auth state.
 * If Zustand says isAuthenticated but there's no valid token,
 * attempts a silent refresh. Clears auth state on failure.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, clearUser } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If not authenticated in Zustand, nothing to validate
    if (!isAuthenticated) return;

    // Check if session cookie still exists (quick gate check)
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${SESSION_COOKIE}=`));

    if (!hasCookie) {
      // Session cookie was cleared (e.g. expired) — clear auth state
      clearUser();
      clearAccessToken();
      return;
    }

    // Check if we have an access token
    const token = getAccessToken();
    if (token) {
      // Token exists — check if it's expired by decoding the JWT
      try {
        const base64 = token.split(".")[1];
        const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(json);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Access token expired — try to refresh silently
          silentRefresh(clearUser);
        }
        // Token is valid or will be refreshed proactively — keep auth state
      } catch {
        // Invalid token — try to refresh
        silentRefresh(clearUser);
      }
    } else {
      // No access token — try to refresh using the httpOnly refresh cookie
      silentRefresh(clearUser);
    }
  }, [isAuthenticated, clearUser]);

  return <>{children}</>;
}

async function silentRefresh(clearUser: () => void) {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    setAccessToken(data.access_token);
  } catch {
    // Refresh failed — clear auth state so user re-logs in
    clearUser();
    clearAccessToken();
  }
}
