import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "generate-questions — Phase 3" });
}
