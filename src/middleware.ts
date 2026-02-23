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
    "/analytics/:path*",
    "/support/:path*",
    "/resources/:path*",
  ],
};
