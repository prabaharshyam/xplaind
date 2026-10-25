import { type NextRequest, NextResponse } from "next/server";
import { userClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const client = await userClient();
  await client?.auth.signOut();
  return NextResponse.redirect(new URL("/?signedout=1", request.url), 303);
}
