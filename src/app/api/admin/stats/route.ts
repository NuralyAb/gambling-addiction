import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  try {
    const [usersRes, diaryRes, chatRes, blockRes, pgsiRes] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("diary_entries").select("id", { count: "exact", head: true }),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }),
      supabase.from("block_events").select("id", { count: "exact", head: true }),
      supabase.from("pgsi_results").select("id", { count: "exact", head: true }),
    ]);

    const blockCount =
      blockRes.error != null ? 0 : (blockRes as { count?: number }).count ?? 0;

    return new Response(
      JSON.stringify({
        users: usersRes.count ?? 0,
        diaryEntries: diaryRes.count ?? 0,
        chatMessages: chatRes.count ?? 0,
        blockEvents: blockCount,
        pgsiResults: pgsiRes.count ?? 0,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Admin stats error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
}
