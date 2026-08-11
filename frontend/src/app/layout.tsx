import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maple Wallet | 캐릭터 검색",
  description: "메이플스토리 캐릭터 기본정보를 검색하는 Maple Wallet입니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
