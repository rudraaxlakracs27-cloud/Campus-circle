import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getSessionUser();

  return NextResponse.json({ currentUser });
}
