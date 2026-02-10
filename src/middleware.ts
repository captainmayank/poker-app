import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROLES } from "./lib/constants";

export default auth((req) => {
  const token = req.auth;
  const path = req.nextUrl.pathname;

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin-only routes
  const adminRoutes = ["/players", "/sessions/new"];
  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));

  if (isAdminRoute && token?.user?.role !== ROLES.ADMIN) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sessions/:path*",
    "/players/:path*",
    "/settlements/:path*",
    "/reports/:path*",
  ],
};
