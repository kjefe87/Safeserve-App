import { NextResponse } from "next/server";

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
