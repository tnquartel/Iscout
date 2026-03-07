import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iScout",
  description: "Het online scoutingspel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
