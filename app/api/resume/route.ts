import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const dataPath = path.join(
      process.cwd(),
      "docs/autoresume/resume-integration.json"
    );
    const data = await fs.readFile(dataPath, "utf-8");
    const parsed = JSON.parse(data);

    // Add cache headers for live updates
    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Generated": parsed.generated || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error reading resume data:", error);
    return NextResponse.json(
      { error: "Failed to load resume data" },
      { status: 500 }
    );
  }
}
