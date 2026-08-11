import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maple Wallet",
  description: "메이플스토리 캐릭터와 메소 거래내역을 관리하는 Maple Wallet입니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
