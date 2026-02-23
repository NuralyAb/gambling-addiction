import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);

  const [todayRes, weekRes, monthRes, topDomainsRes, recentRes] = await Promise.all([
    supabase.from("block_events").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", todayStart.toISOString()),
    supabase.from("block_events").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", weekStart.toISOString()),
    supabase.from("block_events").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", monthStart.toISOString()),
    supabase.from("block_events").select("domain")
      .eq("user_id", userId).gte("created_at", monthStart.toISOString())
      .order("created_at", { ascending: false }).limit(500),
    supabase.from("block_events").select("id, domain, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  const domainCounts: Record<string, number> = {};
  (topDomainsRes.data || []).forEach((e) => {
    domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
  });
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));

  return NextResponse.json({
    today: todayRes.count || 0,
    week: weekRes.count || 0,
    month: monthRes.count || 0,
    topDomains,
    recent: (recentRes.data || []).map((e) => ({
      id: e.id,
      domain: e.domain,
      blocked_at: e.created_at,
    })),
  });
}
