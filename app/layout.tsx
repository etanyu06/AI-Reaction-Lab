import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Reaction Lab",
  description: "Opt-in landing page reaction testing for user research."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
