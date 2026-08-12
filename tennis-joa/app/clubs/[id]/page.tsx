"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { getLoggedInUser, AuthUser, isAdminUser } from "@/lib/authSession";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Settings2,
  Share2,
  ShoppingBag,
  Trophy,
  Users,
  UserPlus,
  Shirt,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRightLeft,
  Crown,
  Check
} from "lucide-react";

type ClubPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Club = {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
};

export default function ClubPage({ params }: ClubPageProps) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;
  const router = useRouter();

  const [clubInfo, setClubInfo] = useState<Club | null>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 세션 사용자 정보
  const [currentUser, setCurrentUser] = useState<AuthUser>({ id: "", name: "방문자", username: "", role: "USER", isAdmin: false });
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>("MEMBER");

  // 전체 회원 명단 조회 모달 state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [clubMembersList, setClubMembersList] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    // 1. 유저 프로필은 로그인 세션에서 단 1회 읽어와 고정 (클럽 전환 시 변이 불가)
    const activeUser = getLoggedInUser();
    setCurrentUser(activeUser);

    loadClubData(activeUser.name);
  }, [clubId]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function loadClubData(userName?: string) {
    setLoading(true);
    const queryName = userName || currentUser.name;
    try {
      const [clubsRes, memRes, membersRes] = await Promise.all([
        fetch("/api/clubs"),
        fetch(`/api/clubs/my-memberships?username=${encodeURIComponent(queryName)}`),
        fetch(`/api/clubs/${clubId}/members`),
      ]);

      if (clubsRes.ok) {
        const clubsData: Club[] = await clubsRes.json();
        setAllClubs(clubsData);
        const matched = clubsData.find((c) => c.id === clubId);
        if (matched) {
          setClubInfo(matched);
        } else {
          setClubInfo({
            id: clubId,
            name: "그린코트 프리미엄 테니스 클럽",
            address: "서울 강남구 테헤란로 123",
            city: "서울",
            description: "매주 주말과 새벽 모임을 개최하는 프리미엄 테니스 커뮤니티입니다.",
          });
        }
      }

      if (memRes.ok) {
        const memData = await memRes.json();
        setJoinedClubIds(memData.joinedClubIds || []);
      }

      if (membersRes.ok) {
        const membersList = await membersRes.json();
        setClubMembersList(membersList);
        if (Array.isArray(membersList)) {
          const myMem = membersList.find(
            (m: any) => m.userName === queryName || m.userName === currentUser.username
          );
          if (myMem) {
            setUserRole(myMem.role || "MEMBER");
          } else {
            setUserRole("MEMBER");
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function openMembersModal() {
    setShowMembersModal(true);
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      if (res.ok) {
        const data = await res.json();
        setClubMembersList(data);
      }
    } catch (e) {
      console.error("전체 회원 불러오기 오류:", e);
    } finally {
      setMembersLoading(false);
    }
  }

  // 신규 클럽 가입 신청 -> 즉시 자동 승인 (Auto-Approved)
  async function handleAutoJoinClub(targetClub: Club) {
    setJoiningClubId(targetClub.id);
    const userName = currentUser?.name || "회원";

    try {
      const res = await fetch(`/api/clubs/${targetClub.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setJoinedClubIds((prev) => Array.from(new Set([...prev, targetClub.id])));
        showToast(`${targetClub.name}에 자동 승인으로 가입 완료되었습니다! 🎉`);
        setShowSwitchModal(false);
        router.push(`/clubs/${targetClub.id}`);
      } else {
        console.error("클럽 자동 가입 에러:", data);
        alert(data.error || "가입 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setJoiningClubId(null);
    }
  }

  const currentClubName = clubInfo ? clubInfo.name : "그린코트 테니스 클럽";
  const currentClubAddr = clubInfo ? `${clubInfo.city} · ${clubInfo.address}` : "서울 강남구 테헤란로 123";

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen pb-24 space-y-5 px-4 py-4 max-w-md sm:max-w-lg mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-emerald-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-lime-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Switcher Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSwitchModal(true)}
            className="inline-flex items-center gap-1.5 bg-white text-emerald-800 border border-emerald-200 shadow-2xs hover:bg-emerald-50 px-3 py-2 rounded-xl text-xs font-extrabold transition-all"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600" />
            <span>클럽 전환</span>
          </button>

          <button
            onClick={openMembersModal}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs px-3 py-2 rounded-xl text-xs font-extrabold transition-all"
          >
            <Users className="h-3.5 w-3.5" />
            <span>전체 회원 명단</span>
          </button>
        </div>

        {isAdminUser(currentUser) && (
          <Link
            href={`/clubs/${clubId}/admin`}
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>관리자 대시보드</span>
          </Link>
        )}
      </div>

      {/* Main Club Hero Card */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-teal-800 p-5 text-white shadow-md border border-emerald-500/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="bg-lime-300 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> 공식 스마트 테니스 클럽
            </span>
            <span className="text-[11px] text-teal-100/80 font-mono">ID: {clubId}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black text-white shadow-inner shrink-0">
              {currentClubName.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{currentClubName}</h1>
              <p className="mt-0.5 text-xs text-teal-100/90">{currentClubAddr}</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-100/90 bg-black/15 rounded-xl p-3 backdrop-blur-xs border border-white/10">
            {clubInfo?.description || "매주 새벽과 주말에 모여 실력을 쌓는 프리미엄 테니스 클럽입니다."}
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <button
              onClick={openMembersModal}
              className="bg-white/10 hover:bg-white/20 active:scale-95 transition backdrop-blur-xs rounded-xl p-2 border border-white/20 text-left flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <p className="text-[10px] text-teal-100 uppercase font-bold">전체 회원</p>
                <Users className="h-3 w-3 text-lime-300 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-base font-extrabold text-white mt-0.5">
                {clubMembersList.length > 0 ? `${clubMembersList.length}명` : "128명"}
              </p>
            </button>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
              <p className="text-[10px] text-teal-100 uppercase">이번 달 월례회</p>
              <p className="text-base font-extrabold text-lime-300 mt-0.5">3회</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
              <p className="text-[10px] text-teal-100 uppercase">단체복 수요</p>
              <p className="text-base font-extrabold text-white mt-0.5">4건</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Features Grid */}
      <section className="space-y-3">
        {/* Notice Preview */}
        <Link
          href={`/clubs/${clubId}/notices`}
          className="block bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
              <Bell className="h-3 w-3 text-amber-600" /> 필독 공지
            </span>
            <span className="text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
              전체보기 <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            주말 월례회 준비물 및 클럽 코트 매너 수칙 안내
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            이번 주 월례회 참가자는 개인 라켓, 테니스화, 음료수를 지참해 주시고 정시 도착 부탁드립니다.
          </p>
        </Link>

        {/* Monthly Tournament Preview */}
        <Link
          href={`/clubs/${clubId}/tournaments`}
          className="block bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="bg-lime-100 text-lime-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Trophy className="h-3 w-3 text-emerald-700" /> 8월 월례회
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
              D-5 (참석 신청중)
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            8월 정기 월례회 KDK 대진표 & 조별 성적표
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            8월 22일 토요일 14:00 · 3개 조 자동 분배 대진표 구성
          </p>
        </Link>

        {/* Matches & Leaderboard Preview */}
        <Link
          href={`/clubs/${clubId}/matches`}
          className="block bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              🎾 복식 경기 전적
            </span>
            <span className="text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
              랭킹 보기 <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <div>
              <p className="text-xs font-bold text-slate-900">최근 경기: {currentUser.name}+강지훈 vs 박수진+이민재</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">결과: 6-4 (우리팀 승리)</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              전체 랭킹
            </span>
          </div>
        </Link>

        {/* Group Uniform Merch Preview */}
        <Link
          href={`/clubs/${clubId}/merchandise`}
          className="block bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 p-4 shadow-2xs hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shirt className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs font-extrabold text-emerald-900">클럽 단체복 수요조사</h3>
            </div>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              4개 진행중
            </span>
          </div>
          <p className="text-xs text-slate-600">
            2026 봄/여름 정기 클럽 단체 카라티 수요조사에 본인 이름 자동 연동으로 신속 참여하세요.
          </p>
        </Link>
      </section>

      {/* Switch Club Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 max-h-[80vh] flex flex-col">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4" /> 클럽 선택 및 가입 (자동 승인)
              </h3>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 leading-relaxed">
                가입을 신청하면 기다림 없이 <span className="font-bold text-emerald-700">'자동 승인 (Auto-Approved)'</span> 되어 즉시 대시보드로 이동합니다.
              </p>

              <div className="space-y-2">
                {allClubs.map((club) => {
                  const isCurrent = club.id === clubId;
                  const isJoined = joinedClubIds.includes(club.id);
                  const isJoining = joiningClubId === club.id;

                  return (
                    <div
                      key={club.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-xs">{club.name}</h4>
                          {isCurrent ? (
                            <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                              현재 접속중
                            </span>
                          ) : isJoined ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                              가입됨
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {club.city} · {club.address}
                        </p>
                      </div>

                      {isCurrent ? (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 shrink-0"
                        >
                          접속중
                        </button>
                      ) : isJoined ? (
                        <button
                          onClick={() => {
                            setShowSwitchModal(false);
                            router.push(`/clubs/${club.id}`);
                          }}
                          className="px-3 py-1.5 bg-lime-100 text-lime-900 hover:bg-lime-200 text-xs font-bold rounded-lg transition shrink-0"
                        >
                          입장하기 →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAutoJoinClub(club)}
                          disabled={isJoining}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-2xs shrink-0 flex items-center gap-1"
                        >
                          {isJoining ? (
                            "가입중..."
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5" /> 자동 가입
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Members List Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-lime-300" />
                <h3 className="text-sm font-bold">
                  전체 회원 명단 ({clubMembersList.length}명)
                </h3>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/10"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {/* Member Search */}
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="회원 이름 검색..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition"
              />

              {membersLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">회원 명단을 불러오는 중...</div>
              ) : (
                <div className="space-y-2">
                  {clubMembersList
                    .filter((m) =>
                      (m.userName || m.name || "").toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                    .map((m, idx) => {
                      const name = m.userName || m.name || `회원 ${idx + 1}`;
                      const role = m.role || "MEMBER";
                      const isOwner = role === "OWNER";
                      const isManager = role === "MANAGER";

                      return (
                        <div
                          key={m.id || idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs shrink-0">
                              {name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">{name}</span>
                                {isOwner ? (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                    👑 소유자
                                  </span>
                                ) : isManager ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                    🛡 매니저
                                  </span>
                                ) : (
                                  <span className="bg-slate-200 text-slate-700 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                                    회원
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                가입상태: {m.status || "APPROVED (자동승인)"}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "최근가입"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav clubId={clubId} />
    </div>
  );
}
