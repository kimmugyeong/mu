"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bell, Trophy, Activity, ShoppingBag } from "lucide-react";

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

  // 로그인 및 회원가입 페이지/뷰에서는 하단 네비게이션 바 마운트 해제 (숨김 처리)
  if (
    view === "auth" ||
    pathname?.includes("/login") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/join")
  ) {
    return null;
  }

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
      label: "홈",
      icon: Home,
      isActive: (view === "clubs" || (view === "club" && activeTab !== "notices" && activeTab !== "tournaments" && activeTab !== "matches" && activeTab !== "merch")) && !isMerchandisePage,
      onClick: () => {
        if (onNavigateHome) onNavigateHome();
        else router.push("/");
      },
    },
    {
      id: "notices",
      label: "공지",
      icon: Bell,
      isActive: pathname?.includes("/notices") || (view === "club" && activeTab === "notices"),
      onClick: () => {
        if (selectedClubId) router.push(`/clubs/${selectedClubId}/notices`);
        else if (onNavigateTab) onNavigateTab("notices");
        else router.push("/clubs/c1/notices");
      },
    },
    {
      id: "tournaments",
      label: "월례회",
      icon: Trophy,
      isActive: pathname?.includes("/tournaments") || (view === "club" && (activeTab === "tournaments" || activeTab === "tournament")),
      onClick: () => {
        if (selectedClubId) router.push(`/clubs/${selectedClubId}/tournaments`);
        else if (onNavigateTab) onNavigateTab("tournaments");
        else router.push("/clubs/c1/tournaments");
      },
    },
    {
      id: "matches",
      label: "경기전적",
      icon: Activity,
      isActive: pathname?.includes("/matches") || (view === "club" && activeTab === "matches"),
      onClick: () => {
        if (selectedClubId) router.push(`/clubs/${selectedClubId}/matches`);
        else if (onNavigateTab) onNavigateTab("matches");
        else router.push("/clubs/c1/matches");
      },
    },
    {
      id: "merch",
      label: "단체복",
      icon: ShoppingBag,
      isActive: isMerchandisePage || (view === "club" && activeTab === "merch"),
      onClick: handleMerchandiseClick,
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
