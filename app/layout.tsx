import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CERBO — l'agent qui apprend en direct",
  description:
    "Qualification de leads par un agent Hermes. Corrige-le à la voix ; la règle devient un skill persistant. Preuve sourcée Cloudflare D1, en live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-offwhite antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
