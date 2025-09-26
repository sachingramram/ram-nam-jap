import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordOnly = z.object({
  mode: z.literal("passwordOnly"),
  email: z.string().email(),
  newPassword: z.string().min(6)
});

const emailOnly = z.object({
  mode: z.literal("emailOnly"),
  newEmail: z.string().email(),
  password: z.string().min(6)
});

const both = z.object({
  mode: z.literal("both"),
  newEmail: z.string().email(),
  newPassword: z.string().min(6)
});

const schema = z.discriminatedUnion("mode", [passwordOnly, emailOnly, both]);

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();

  switch (parsed.data.mode) {
    case "passwordOnly": {
      const { email, newPassword } = parsed.data;
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ ok: false, error: "Email not found" }, { status: 404 });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();
      return NextResponse.json({ ok: true, updated: "password" });
    }

    case "emailOnly": {
      const { newEmail, password } = parsed.data;
      const dupe = await User.findOne({ email: newEmail });
      if (dupe) {
        return NextResponse.json({ ok: false, error: "New email already in use" }, { status: 409 });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ name: newEmail.split("@")[0], email: newEmail, passwordHash });
      return NextResponse.json({ ok: true, created: true });
    }

    case "both": {
      const { newEmail, newPassword } = parsed.data;
      const dupe = await User.findOne({ email: newEmail });
      if (dupe) {
        return NextResponse.json({ ok: false, error: "New email already in use" }, { status: 409 });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await User.create({ name: newEmail.split("@")[0], email: newEmail, passwordHash });
      return NextResponse.json({ ok: true, created: true });
    }
  }
}
