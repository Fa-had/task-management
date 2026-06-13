// Server-safe auth utilities.
// These run in both Server Components and middleware.

import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./auth-constants";

export { SESSION_COOKIE, SESSION_MAX_AGE };

/**
 * Set the session cookie after a successful login/signup.
 * Called from Server Actions or Route Handlers if added later.
 */
export async function setSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear the session cookie on logout.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Read the current session value (server-side only).
 */
export async function getSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
