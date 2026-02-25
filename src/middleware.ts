import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const authMiddleware = withAuth(
  function middleware(req) {
    return intlMiddleware(req);
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/pgsi-test",
  "/diary",
  "/progress",
  "/analytics",
  "/ai-insights",
  "/achievements",
  "/help",
  "/support",
  "/resources",
  "/extension",
  "/education",
  "/sos",
  "/admin",
];

export default function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-auth middleware typing
    return (authMiddleware as (req: NextRequest, event: NextFetchEvent) => ReturnType<typeof intlMiddleware>)(req, event);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
