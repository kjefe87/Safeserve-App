import { NextResponse } from "next/server";

// Runs on the edge, so we only check for the presence of the session cookie here —
// not decrypt/verify it (iron-session's full verify needs Node runtime).
// Each protected page does the real session check + role check server-side on render.
// This middleware just stops obviously-logged-out users from even loading protected pages.

const PROTECTED_PATHS = [
  "/dashboard",
  "/checklists",
  "/issues",
  "/temp-logs",
  "/inspection-report",
  "/staff-certs",
  "/compliance-logs",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = request.cookies.has("safeserve_session");
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checklists/:path*",
    "/issues/:path*",
    "/temp-logs/:path*",
    "/inspection-report/:path*",
    "/staff-certs/:path*",
    "/compliance-logs/:path*",
  ],
};
