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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-sm lg:hidden">
      <ul className="mx-auto flex max-w-xl justify-between px-4 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 text-center">
              <Link href={item.href} className={`inline-flex flex-col items-center gap-1 py-1 text-xs ${active ? 'text-emerald-600' : 'text-slate-600'}`}>
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={`text-[11px] ${active ? 'font-semibold' : ''}`}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
