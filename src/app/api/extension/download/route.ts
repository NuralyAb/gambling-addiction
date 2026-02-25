import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import archiver from "archiver";

// GET /api/extension/download — скачать расширение как zip (с подставленным URL сайта)
export async function GET(request: Request) {
  try {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "nobet.kz";
    const siteUrl = `${proto}://${host}`.replace(/\/$/, "");

    const extensionDir = path.join(process.cwd(), "extension");
    if (!fs.existsSync(extensionDir)) {
      return NextResponse.json({ error: "Extension not found" }, { status: 404 });
    }

    const files = [
      "manifest.json",
      "background.js",
      "popup.html",
      "popup.js",
      "settings.html",
      "settings.js",
      "blocked.html",
      "blocked.js",
      "styles.css",
    ];

    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));

    const zipReady = new Promise<void>((resolve, reject) => {
      archive.on("end", () => resolve());
      archive.on("error", reject);
    });

    for (const file of files) {
      const filePath = path.join(extensionDir, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf-8");

        // Подставляем URL сайта
        content = content.replace(
          /siteUrl:\s*['"]?[^'"]*['"]?/,
          `siteUrl: '${siteUrl}'`
        );
        content = content.replace(/'http:\/\/localhost:3000'/g, `'${siteUrl}'`);
        content = content.replace(/"http:\/\/localhost:3000"/g, `"${siteUrl}"`);
        content = content.replace(/state\.siteUrl \|\| 'http:\/\/localhost:3000'/g, `state.siteUrl || '${siteUrl}'`);
        if (file === "settings.html") {
          content = content.replace(
            /placeholder="URL сайта \(http:\/\/localhost:3000\)"/,
            `placeholder="URL сайта (${siteUrl})"`
          );
        }

        archive.append(content, { name: `nobet-extension/${file}` });
      }
    }

    const iconsDir = path.join(extensionDir, "icons");
    if (fs.existsSync(iconsDir)) {
      const iconFiles = fs.readdirSync(iconsDir);
      for (const icon of iconFiles) {
        const iconPath = path.join(iconsDir, icon);
        if (fs.statSync(iconPath).isFile()) {
          archive.file(iconPath, { name: `nobet-extension/icons/${icon}` });
        }
      }
    }

    archive.finalize();
    await zipReady;

    const zipBuffer = Buffer.concat(chunks);
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="nobet-extension.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (err) {
    console.error("Extension download error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
