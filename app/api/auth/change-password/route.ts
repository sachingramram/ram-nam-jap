import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { getUserFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export async function POST(req: Request) {
  const userJwt = await getUserFromCookie();
  if (!userJwt) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const user = await User.findById(userJwt.sub);
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.oldPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ ok: false, error: "Old password incorrect" }, { status: 401 });

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();
  return NextResponse.json({ ok: true });
}
