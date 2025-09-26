import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ loggedIn: false });
  return NextResponse.json({
    loggedIn: true,
    user: { name: user.name, email: user.email }
  });
}
