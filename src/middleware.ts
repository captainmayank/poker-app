import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROLES } from "./lib/constants";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes
    const adminRoutes = ["/players", "/sessions/new"];
    const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));

    if (isAdminRoute && token?.role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sessions/:path*",
    "/players/:path*",
    "/settlements/:path*",
    "/reports/:path*",
  ],
};
