import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const withAuthConfig = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default async function middleware(request: NextRequest, event: { waitUntil: (p: Promise<unknown>) => void }) {
  try {
    return await withAuthConfig(request, event);
  } catch (err) {
    console.error("Middleware error:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/pgsi-test/:path*",
    "/diary/:path*",
    "/analytics/:path*",
    "/ai-insights/:path*",
    "/achievements/:path*",
    "/support/:path*",
    "/resources/:path*",
    "/extension/:path*",
    "/education/:path*",
    "/admin/:path*",
  ],
};
