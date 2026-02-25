"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";

export default function Providers({
  children,
  messages,
}: {
  children: React.ReactNode;
  messages: Record<string, unknown>;
}) {
  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider>{children}</SessionProvider>
    </NextIntlClientProvider>
  );
}
