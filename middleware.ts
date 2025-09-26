// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isJap = req.nextUrl.pathname.startsWith("/jap");
  if (!isJap) return NextResponse.next();

  const hasSession = req.cookies.get("rn_session");
  if (!hasSession) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("next", "/jap");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/jap"]
};
