// app/api/progress/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Progress, type ProgressDoc } from "@/models/Progress";
import { getUserFromCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  mantra: z.string().min(1),
  count: z.number().int().nonnegative()
});

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json(null, { status: 200 });

  await dbConnect();
  const doc = await Progress.findOne({ userId: user.sub }).lean<ProgressDoc>().exec();
  if (!doc) return NextResponse.json(null);
  return NextResponse.json({ mantra: doc.mantra, count: doc.count });
}

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mantra, count } = parsed.data;

  await dbConnect();
  const doc = await Progress.findOneAndUpdate(
    { userId: user.sub, mantra },
    { $set: { mantra }, $setOnInsert: { userId: user.sub }, $max: { count } },
    { upsert: true, new: true }
  ).lean<ProgressDoc>().exec();

  // `doc` is now a plain object with typed fields
  return NextResponse.json({ mantra: doc.mantra, count: doc.count });
}
