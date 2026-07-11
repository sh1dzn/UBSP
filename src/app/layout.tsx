import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÖRKEN — Поддержка бизнеса",
  description: "Единый цифровой портал поддержки бизнеса Казахстана.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
