"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  ChevronLeft,
  Crown,
  Sparkles,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type ClubMember = {
  id: string;
  clubId: string;
  userName: string;
  userEmail?: string | null;
  role: "OWNER" | "MANAGER" | "MEMBER" | string;
  status: string;
  joinedAt: string;
};

export default function ClubAdminPage({ params }: Props) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;
  const router = useRouter();

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 로그인 유저 세션 관리
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role?: string } | null>(null);

  useEffect(() => {
    // 세션 정보 확인
    const saved = localStorage.getItem("loggedInUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (e) {
        // ignore
      }
    }
    loadMembers();
  }, [clubId]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        showToast("클럽원 목록을 가져오지 못했습니다.");
      }
    } catch (e) {
      console.error(e);
      showToast("서버 통신 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 권한 변경 (MEMBER ↔ MANAGER)
  async function handleToggleRole(member: ClubMember) {
    if (member.role === "OWNER") {
      alert("최초 생성자(OWNER)의 권한은 변경할 수 없습니다.");
      return;
    }

    const nextRole = member.role === "MANAGER" ? "MEMBER" : "MANAGER";
    const confirmMsg =
      nextRole === "MANAGER"
        ? `${member.userName} 님에게 관리자(매니저) 권한을 위임하시겠습니까?`
        : `${member.userName} 님의 매니저 권한을 해제하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(member.id);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, nextRole }),
      });

      if (res.ok) {
        showToast(
          nextRole === "MANAGER"
            ? `${member.userName} 님이 매니저로 지정되었습니다.`
            : `${member.userName} 님의 매니저 권한이 해제되었습니다.`
        );
        loadMembers();
      } else {
        const err = await res.json();
        alert(err.error || "권한 변경에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // 회원 강퇴 처리
  async function handleRemoveMember(member: ClubMember) {
    if (member.role === "OWNER") {
      alert("클럽 생성자(OWNER)는 강퇴할 수 없습니다.");
      return;
    }

    if (!confirm(`정말로 ${member.userName} 님을 클럽에서 강퇴/퇴출하시겠습니까?`)) {
      return;
    }

    setActionLoadingId(member.id);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });

      if (res.ok) {
        showToast(`${member.userName} 님이 클럽에서 퇴출되었습니다.`);
        loadMembers();
      } else {
        const err = await res.json();
        alert(err.error || "강퇴 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredMembers = members.filter((m) =>
    m.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ownerCount = members.filter((m) => m.role === "OWNER").length;
  const managerCount = members.filter((m) => m.role === "MANAGER").length;
  const memberCount = members.filter((m) => m.role === "MEMBER").length;

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/clubs/${clubId}`}
              className="p-1 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                클럽 관리자 대시보드
                <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                  ADMIN ONLY
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">클럽원 권한 관리 및 회원 제어</p>
            </div>
          </div>

          <button
            onClick={loadMembers}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
            title="목록 새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md sm:max-w-lg mx-auto">
        {/* Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-4 text-white shadow-md border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="bg-lime-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> 최고 관리 권한
            </span>
            <span className="text-xs font-mono text-slate-300">클럽 ID: {clubId}</span>
          </div>

          <div>
            <h2 className="text-lg font-extrabold">전체 클럽원 {members.length}명 대시보드</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              소유자 {ownerCount}명 · 매니저 {managerCount}명 · 일반회원 {memberCount}명
            </p>
          </div>
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="클럽원 이름으로 검색..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        {/* Member Management List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
              <Users className="h-4 w-4 text-emerald-600" /> 회원 목록 및 권한 위임
            </h3>
            <span className="text-[10px] text-slate-400">자동 가입(APPROVED) 처리됨</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
              <span>클럽원 목록을 가져오는 중...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <Info className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">해당하는 클럽원이 없습니다.</p>
            </div>
          ) : (
            filteredMembers.map((m) => {
              const formattedDate = new Date(m.joinedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              const isOwner = m.role === "OWNER";
              const isManager = m.role === "MANAGER";
              const isActionLoading = actionLoadingId === m.id;

              return (
                <article
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-sm ${
                          isOwner
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : isManager
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isOwner ? (
                          <Crown className="h-5 w-5 text-amber-600" />
                        ) : isManager ? (
                          <Shield className="h-5 w-5 text-emerald-600" />
                        ) : (
                          m.userName.slice(0, 1)
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm">{m.userName}</h4>
                          {isOwner ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                              소유자 (OWNER)
                            </span>
                          ) : isManager ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                              매니저 (MANAGER)
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              일반 회원
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          가입일: {formattedDate} · 자동 승인됨
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {!isOwner && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(m)}
                        disabled={isActionLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isManager
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {isManager ? "매니저 권한 해제" : "매니저 권한 위임"}
                      </button>

                      <button
                        onClick={() => handleRemoveMember(m)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 강퇴
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav clubId={clubId} />
    </div>
  );
}
