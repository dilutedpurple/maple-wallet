"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "캐릭터 검색" },
  { href: "/ledger", label: "가계부" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8ddd5] bg-[#fffdfa]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
        <Link href="/" className="text-lg font-black tracking-[-0.03em] text-[#302722]">
          Maple <span className="text-[#d96746]">Wallet</span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-1 rounded-xl bg-[#f3ebe5] p-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition sm:px-4 ${
                  active
                    ? "bg-white text-[#d96746] shadow-sm"
                    : "text-[#756860] hover:text-[#302722]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
