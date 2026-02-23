import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirmation?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (body.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'You must send { "confirmation": "DELETE" } to confirm' },
      { status: 400 }
    );
  }

  const tables = [
    "chat_messages",
    "diary_entries",
    "pgsi_results",
    "block_events",
    "extension_tokens",
    "unlock_requests",
    "weekly_reports",
  ];

  for (const table of tables) {
    try {
      await supabase.from(table).delete().eq("user_id", userId);
    } catch (err) {
      console.error(`Failed to delete from ${table}:`, err);
    }
  }

  try {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      console.error("Failed to delete user row:", error);
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Failed to delete user row:", err);
    return NextResponse.json(
      { error: "Failed to delete user account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Account deleted" });
}
