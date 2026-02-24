import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  try {
    const { data, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return new Response(
        JSON.stringify({ logs: [], tableMissing: true }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ logs: data ?? [], tableMissing: false }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Admin logs error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  let body: { action: string; details?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }

  const email = (session.user?.email as string) ?? "unknown";

  try {
    await supabase.from("admin_logs").insert({
      admin_email: email,
      action: body.action ?? "unknown",
      details: body.details ?? null,
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Admin logs POST error:", e);
    return new Response(JSON.stringify({ error: "Failed to write log" }), { status: 500 });
  }
}
