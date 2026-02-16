import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const dataPath = path.join(
      process.cwd(),
      "public/data/ai-pilot-data.json"
    );
    const data = await fs.readFile(dataPath, "utf-8");
    const parsed = JSON.parse(data);

    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Generated": parsed.generated || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error reading AI pilot data:", error);
    return NextResponse.json(
      { error: "Failed to load AI pilot data. Run the pipeline first: python scripts/ai-pilot-pipeline.py" },
      { status: 500 }
    );
  }
}
