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
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  try {
    const [recentUsers, recentBlock] = await Promise.all([
      supabase
        .from("users")
        .select("id, email, name, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("block_events")
        .select("id, user_id, domain, url, blocked_at, created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
        .then((r) => ({ data: r.data ?? [], error: r.error })),
    ]);

    const users = (recentUsers.data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      created_at: u.created_at,
    }));

    const blockData = "data" in recentBlock ? recentBlock.data ?? [] : [];
    const blocks = blockData.map((b: { id: string; user_id: string; domain?: string; url?: string; blocked_at?: string; created_at?: string }) => ({
      id: b.id,
      user_id: b.user_id,
      domain: b.url ?? b.domain ?? "(unknown)",
      blocked_at: b.blocked_at ?? b.created_at,
    }));

    return new Response(
      JSON.stringify({ users, blocks }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Admin activity error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
}
