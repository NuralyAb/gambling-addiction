import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ admin: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(
    JSON.stringify({ admin: isAdmin(session) }),
    { headers: { "Content-Type": "application/json" } }
  );
}
