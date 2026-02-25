import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { authOptions } from "@/lib/auth";

// В Docker: /app/vpn-config (volume mount). Локально: ./vpn-config
const CONFIG_DIR = process.env.VPN_CONFIG_DIR || path.join(process.cwd(), "vpn-config");
const CONFIG_FILES = ["peer1.conf", "peer2.conf", "peer3.conf"];

function configExists(): boolean {
  for (const file of CONFIG_FILES) {
    const filePath = path.join(CONFIG_DIR, file);
    if (fs.existsSync(filePath)) return true;
  }
  return false;
}

// HEAD /api/vpn/config — проверить доступность конфига
export async function HEAD() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: configExists() ? 200 : 404 });
}

// GET /api/vpn/config — скачать конфиг WireGuard (требует авторизации)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let configContent: string | null = null;
    let filename = "nobet-vpn.conf";

    for (const file of CONFIG_FILES) {
      const filePath = path.join(CONFIG_DIR, file);
      if (fs.existsSync(filePath)) {
        configContent = fs.readFileSync(filePath, "utf-8");
        filename = `nobet-vpn-${file.replace(".conf", "")}.conf`;
        break;
      }
    }

    if (!configContent) {
      return NextResponse.json(
        {
          error: "VPN config not available",
          hint: "Admin should run: bash deploy/copy-vpn-config.sh",
        },
        { status: 404 }
      );
    }

    return new NextResponse(configContent, {
      headers: {
        "Content-Type": "application/x-wireguard-profile",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const code = err instanceof Error && "code" in err ? (err as NodeJS.ErrnoException).code : "";
    console.error("VPN config error:", message, code, err);
    return NextResponse.json(
      {
        error: "Download failed",
        hint:
          code === "EACCES"
            ? "Permission denied. Run: chmod -R 755 vpn-config"
            : "Check server logs. Ensure vpn-config exists and run: bash deploy/copy-vpn-config.sh",
      },
      { status: 500 }
    );
  }
}
