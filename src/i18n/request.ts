import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedRequestLocale = await requestLocale;
  if (resolvedRequestLocale && locales.includes(resolvedRequestLocale as Locale)) {
    const locale = resolvedRequestLocale as Locale;
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default,
      timeZone: "Asia/Almaty",
    };
  }

  const cookieStore = cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = (locales.includes(localeCookie as Locale) ? localeCookie : defaultLocale) as Locale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Almaty",
  };
});
