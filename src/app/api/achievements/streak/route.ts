import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ streakDays: 0 });
  }

  const userId = (session.user as { id: string }).id;

  const { data: user } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .single();

  const { data: episodes } = await supabase
    .from("diary_entries")
    .select("date")
    .eq("user_id", userId)
    .eq("type", "episode")
    .order("date", { ascending: false })
    .limit(1);

  let streakDays = 0;
  const now = new Date();

  if (episodes && episodes.length > 0) {
    const lastEpisode = new Date(episodes[0].date);
    streakDays = Math.floor((now.getTime() - lastEpisode.getTime()) / 86400000);
  } else if (user) {
    streakDays = Math.floor((now.getTime() - new Date(user.created_at).getTime()) / 86400000);
  }

  return NextResponse.json({ streakDays: Math.max(0, streakDays) });
}
