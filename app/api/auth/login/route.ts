import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input", emailExists: false, passwordValid: false },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  await dbConnect();
  const user = await User.findOne({ email });

  // Email not found
  if (!user) {
    // For your specific UX, we explicitly say email doesn't exist.
    return NextResponse.json(
      { ok: false, error: "Email not found", emailExists: false, passwordValid: false },
      { status: 401 }
    );
  }

  // Email exists, check password
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password", emailExists: true, passwordValid: false },
      { status: 401 }
    );
  }

  // Success
  const token = signToken({ sub: user._id.toString(), email: user.email, name: user.name });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
