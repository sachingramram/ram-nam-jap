import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ exists: false, error: "Invalid email" }, { status: 400 });
  }
  await dbConnect();
  const exists = Boolean(await User.findOne({ email: parsed.data.email }).lean().exec());
  return NextResponse.json({ exists });
}
