import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if user has a session cookie
  const sessionCookie = request.cookies.get('authjs.session-token') || request.cookies.get('__Secure-authjs.session-token');

  // If no session, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sessions/:path*",
    "/players/:path*",
    "/settlements/:path*",
    "/reports/:path*",
  ],
};
