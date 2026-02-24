import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/pgsi-test/:path*",
    "/diary/:path*",
    "/progress/:path*",
    "/analytics/:path*",
    "/ai-insights/:path*",
    "/achievements/:path*",
    "/help/:path*",
    "/support/:path*",
    "/resources/:path*",
    "/extension/:path*",
    "/education/:path*",
    "/admin/:path*",
  ],
};
