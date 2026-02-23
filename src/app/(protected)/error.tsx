"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h1 className="text-xl font-semibold text-red-400 mb-2">Что-то пошло не так</h1>
      <p className="text-slate-400 text-sm text-center mb-6 max-w-md">{error.message}</p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Попробовать снова</Button>
        <Link href="/dashboard">
          <Button variant="secondary">На дашборд</Button>
        </Link>
      </div>
    </div>
  );
}
