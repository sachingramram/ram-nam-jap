// app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  newEmail: z.string().email().optional(),
  newPassword: z.string().min(6).optional()
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, newEmail, newPassword } = parsed.data;

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (newEmail) {
    const dupe = await User.findOne({ email: newEmail });
    if (dupe) return NextResponse.json({ error: "New email already in use" }, { status: 409 });
    user.email = newEmail;
  }
  if (newPassword) {
    user.passwordHash = await bcrypt.hash(newPassword, 10);
  }
  await user.save();
  return NextResponse.json({ ok: true });
}
