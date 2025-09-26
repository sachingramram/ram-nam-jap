// components/HeaderServer.tsx
import { cookies } from "next/headers";
import Header from "./Header";

export default async function HeaderServer() {
  const c = await cookies();
  const hasSession = Boolean(c.get("rn_session")?.value);
  return <Header initialLoggedIn={hasSession} />;
}
