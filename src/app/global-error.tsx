"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "system-ui", background: "#1a1f2e", color: "#e2e8f0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ color: "#f87171", marginBottom: "1rem" }}>Произошла ошибка</h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              background: "#22c55e",
              color: "#14532d",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Попробовать снова
          </button>
          <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#64748b" }}>
            Если ошибка повторяется, выполните: <code style={{ background: "#232838", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>rm -rf .next && npm run dev</code>
          </p>
        </div>
      </body>
    </html>
  );
}
