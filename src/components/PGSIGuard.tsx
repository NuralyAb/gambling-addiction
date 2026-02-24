"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function PGSIGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/pgsi-test" || pathname?.startsWith("/admin")) {
      setChecked(true);
      return;
    }

    fetch("/api/pgsi")
      .then((res) => res.json())
      .then((data) => {
        if (!data.completed) {
          router.replace("/pgsi-test");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked && pathname !== "/pgsi-test") {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
