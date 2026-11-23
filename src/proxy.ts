import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PAGES_PUBLIQUES = ["/connexion", "/inscription"];

// Optimistic check only (cookie presence). Each page and action still checks the session.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PAGES_PUBLIQUES.includes(pathname)) return NextResponse.next();
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|ico|webmanifest)$).*)"],
};
