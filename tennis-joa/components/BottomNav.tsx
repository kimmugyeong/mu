"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Home, ShoppingBag, Trophy } from "lucide-react";

type Props = {
  clubId: string;
};

export default function BottomNav({ clubId }: Props) {
  const pathname = usePathname();

  const items = [
    { href: `/clubs/${clubId}`, label: "홈", icon: Home },
    { href: `/clubs/${clubId}/notices`, label: "공지", icon: Bell },
    { href: `/clubs/${clubId}/tournaments`, label: "월례회", icon: Trophy },
    { href: `/clubs/${clubId}/matches`, label: "경기전적", icon: Activity },
    { href: `/clubs/${clubId}/merchandise`, label: "단체복", icon: ShoppingBag },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg py-1 px-2 rounded-t-2xl">
      <ul className="flex justify-around items-center">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 text-center">
              <Link
                href={item.href}
                className={`relative inline-flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all active:scale-95 w-full ${
                  active ? "text-emerald-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-lime-400 rounded-full shadow-xs animate-pulse" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "text-emerald-600 scale-110" : "text-slate-400"}`} />
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

