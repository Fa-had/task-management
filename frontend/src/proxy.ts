// Next.js 16 note: middleware.ts is deprecated in favour of proxy.ts,
// but remains functional in 16.x. Rename to proxy.ts when ready to adopt
// the new Adapter API. Run: npx @next/codemod@canary upgrade latest
// to migrate automatically.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require the user to be logged in
const PROTECTED_PREFIXES = ["/dashboard"];

// Routes that should redirect to /dashboard if already authenticated
const AUTH_PREFIXES = ["/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth state from Zustand persisted store in localStorage via a cookie
  // We use a lightweight session cookie set on login to avoid parsing JWT here
  const sessionCookie = request.cookies.get("antflow_session");
  const isAuthenticated = !!sessionCookie?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute  = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public files  (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
