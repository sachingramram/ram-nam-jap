import type { Metadata } from "next";
import "./../styles/globals.css";
import HeaderServer from "@/components/HeaderServer";

export const metadata: Metadata = {
  title: "Ram Nam Jap",
  description: "Simple classic राम नाम जप with voice/tap counting and progress."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HeaderServer />
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}
