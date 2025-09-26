// lib/db.ts
import mongoose, { type Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI in .env.local");
}

type Cached = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

// Extend NodeJS global type once
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: Cached | undefined;
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached = global.mongooseCache; // now const ✅

export async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "ram_nam_jap",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
