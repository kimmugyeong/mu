"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Shirt, Trophy, Bell, UserCheck, User } from "lucide-react";

type MainBottomNavProps = {
  view: "auth" | "clubs" | "club";
  selectedClubId?: string | null;
  activeTab?: string;
  onNavigateHome?: () => void;
  onNavigateTab?: (tab: "notices" | "tournaments" | "matches" | "merch") => void;
  onNavigateAuth?: () => void;
  loggedInUser?: { name: string; username: string; isAdmin?: boolean } | null;
};

export default function MainBottomNav({
  view,
  selectedClubId,
  activeTab = "notices",
  onNavigateHome,
  onNavigateTab,
  onNavigateAuth,
  loggedInUser,
}: MainBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 단체복 수요조사 페이지 여부 확인
  const isMerchandisePage = pathname?.includes("/merchandise");

  const handleMerchandiseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedClubId) {
      router.push(`/clubs/${selectedClubId}/merchandise`);
    } else {
      if (onNavigateTab) {
        onNavigateTab("merch");
      } else {
        router.push("/clubs/c1/merchandise");
      }
    }
  };

  const items = [
    {
      id: "home",
      label: "홈/클럽",
      icon: Home,
      isActive: (view === "clubs" || view === "club") && !isMerchandisePage && activeTab !== "merch" && activeTab !== "tournaments" && activeTab !== "tournament" && activeTab !== "notices",
      onClick: () => {
        if (onNavigateHome) onNavigateHome();
        else router.push("/");
      },
    },
    {
      id: "merch",
      label: "수요조사",
      icon: Shirt,
      isActive: isMerchandisePage || (view === "club" && activeTab === "merch"),
      onClick: handleMerchandiseClick,
    },
    {
      id: "tournaments",
      label: "월례회",
      icon: Trophy,
      isActive: view === "club" && (activeTab === "tournaments" || activeTab === "tournament"),
      onClick: () => {
        if (onNavigateTab) onNavigateTab("tournaments");
      },
    },
    {
      id: "notices",
      label: "공지사항",
      icon: Bell,
      isActive: view === "club" && activeTab === "notices",
      onClick: () => {
        if (onNavigateTab) onNavigateTab("notices");
      },
    },
    {
      id: "profile",
      label: loggedInUser ? "내 정보" : "로그인",
      icon: loggedInUser ? UserCheck : User,
      isActive: view === "auth",
      onClick: () => {
        if (onNavigateAuth) onNavigateAuth();
      },
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg py-1 px-2 rounded-t-2xl">
      <ul className="flex justify-around items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <li key={item.id} className="flex-1 text-center">
              <button
                type="button"
                onClick={item.onClick}
                className={`relative inline-flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all active:scale-95 w-full ${
                  active
                    ? "text-emerald-700 font-bold"
                    : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-lime-400 rounded-full shadow-xs animate-pulse" />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    active ? "text-emerald-600 scale-110" : "text-slate-400 group-hover:scale-105"
                  }`}
                />
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
