"use client";

import { useEffect, useState, use } from "react";
import BottomNav from "@/components/BottomNav";
import { getLoggedInUser, AuthUser, isAdminUser } from "@/lib/authSession";
import {
  Activity,
  PlusCircle,
  Trophy,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  UserCheck,
  AlertTriangle
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type ClubMember = {
  id: string;
  name: string;
  username: string;
  ntrp?: number;
};

type MatchRecord = {
  id: string;
  clubId: string;
  matchType: string;
  player1Id?: string | null;
  player1Name?: string | null;
  player2Id?: string | null;
  player2Name?: string | null;
  opponent1Name?: string | null;
  opponent2Name?: string | null;
  score?: string | null;
  isWin?: boolean | null;
  matchDate: string;
};

export default function MatchesPage({ params }: Props) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;

  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"RECORDS" | "LEADERBOARD">("RECORDS");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  // Input Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));

  // Member vs Guest toggle state per player
  const [isGuestP1, setIsGuestP1] = useState(false);
  const [isGuestP2, setIsGuestP2] = useState(false);
  const [isGuestO1, setIsGuestO1] = useState(false);
  const [isGuestO2, setIsGuestO2] = useState(false);

  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [opponent1Name, setOpponent1Name] = useState("");
  const [opponent2Name, setOpponent2Name] = useState("");

  // 개편된 점수 입력 방식: 우리팀 점수 & 상대팀 점수 분리
  const [team1Score, setTeam1Score] = useState<number>(6);
  const [team2Score, setTeam2Score] = useState<number>(4);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 우리팀 스코어 > 상대팀 스코어 기반 승/패 자동 판정
  const computedIsWin = Number(team1Score) > Number(team2Score);
  const computedScoreString = `${team1Score}-${team2Score}`;

  useEffect(() => {
    loadMatches();
    loadMembers();
    initLoggedInUser();
  }, [clubId]);

  function initLoggedInUser() {
    const user = getLoggedInUser();
    setCurrentUser(user);
    if (user.name && user.name !== "방문자") {
      setPlayer1Name(user.name);
    }
  }

  async function loadMatches() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/matches`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.error("전적 불러오기 에러:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      let memberList: ClubMember[] = [];

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          memberList = data.map((m: any) => ({
            id: m.id || m.userName,
            name: m.name || m.userName || "선수",
            username: m.username || m.userName || "user",
            ntrp: m.ntrp || 3.5,
          }));
        }
      }

      const sessionUser = getLoggedInUser();
      const currentLoginName = sessionUser.name;

      // 로그인 유저가 드롭다운 목록에 포함되도록 보장
      if (!memberList.some((m) => m.name === currentLoginName)) {
        memberList.unshift({
          id: sessionUser.id || "u_me",
          name: currentLoginName,
          username: sessionUser.username,
          ntrp: 3.5,
        });
      }

      setMembers(memberList);

      setPlayer1Name(currentLoginName);
      setPlayer2Name(memberList.find((m) => m.name !== currentLoginName)?.name || memberList[0]?.name || "상대선수");
      setOpponent1Name(memberList[1]?.name || memberList[0]?.name || "상대선수 1");
      setOpponent2Name(memberList[2]?.name || memberList[0]?.name || "상대선수 2");
    } catch (e) {
      console.error("회원 목록 불러오기 에러:", e);
      const sessionUser = getLoggedInUser();
      const fallbackList = [
        { id: "u_me", name: sessionUser.name, username: sessionUser.username, ntrp: 3.5 },
        { id: "u2", name: "강지훈", username: "jihoon", ntrp: 4.0 },
        { id: "u3", name: "박수진", username: "sujin", ntrp: 3.0 },
        { id: "u4", name: "이민재", username: "minjae", ntrp: 3.5 },
      ];
      setMembers(fallbackList);
      setPlayer1Name(sessionUser.name);
      setPlayer2Name("강지훈");
      setOpponent1Name("박수진");
      setOpponent2Name("이민재");
    }
  }

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const finalP1 = isGuestP1 ? `(게스트)${player1Name.trim()}` : player1Name.trim();
    const finalP2 = isGuestP2 ? `(게스트)${player2Name.trim()}` : player2Name.trim();
    const finalO1 = isGuestO1 ? `(게스트)${opponent1Name.trim()}` : opponent1Name.trim();
    const finalO2 = isGuestO2 ? `(게스트)${opponent2Name.trim()}` : opponent2Name.trim();

    if (!finalP1 || !finalP2 || !finalO1 || !finalO2) {
      setErrorMessage("우리팀과 상대팀 모든 선수 이름을 입력해 주세요.");
      return;
    }

    if (team1Score === team2Score) {
      setErrorMessage("테니스 경기는 동점 스코어가 존재하지 않습니다. 승리 팀의 점수를 더 높게 설정하세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        matchType: "DOUBLE",
        player1Name: finalP1,
        player2Name: finalP2,
        opponent1Name: finalO1,
        opponent2Name: finalO2,
        score: computedScoreString,
        isWin: computedIsWin,
        matchDate,
      };

      const res = await fetch(`/api/clubs/${clubId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setErrorMessage(null);
        loadMatches();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || "경기 전적 등록 실패 (서버 응답 오류)";
        setErrorMessage(msg);
        console.error("경기 전적 등록 에러 상세:", errorData);
      }
    } catch (err: any) {
      console.error("네트워크/요청 에러:", err);
      setErrorMessage("서버 통신 중 에러가 발생했습니다: " + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate Overall Leaderboard Standings
  const leaderboardStats = (() => {
    const stats: Record<
      string,
      { wins: number; losses: number; gamesWon: number; gamesLost: number }
    > = {};

    matches.forEach((m) => {
      let p1 = "선수1";
      let p2 = "선수2";
      let o1 = "상대1";
      let o2 = "상대2";

      if (m.opponent1Name && m.opponent1Name.includes("&")) {
        const parts = m.opponent1Name.split("&").map((s) => s.trim());
        p1 = parts[0] || p1;
        p2 = parts[1] || p2;
      } else {
        p1 = m.player1Id || m.player1Name || p1;
        p2 = m.player2Id || m.player2Name || p2;
      }

      if (m.opponent2Name && m.opponent2Name.includes("&")) {
        const parts = m.opponent2Name.split("&").map((s) => s.trim());
        o1 = parts[0] || o1;
        o2 = parts[1] || o2;
      } else {
        o1 = m.opponent1Name || o1;
        o2 = m.opponent2Name || o2;
      }

      let team1ScoreSum = 0;
      let team2ScoreSum = 0;

      if (m.score) {
        const parts = m.score.split(",").map((s) => s.trim());
        parts.forEach((pt) => {
          const nums = pt.split("-").map((n) => parseInt(n, 10));
          if (nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
            team1ScoreSum += nums[0];
            team2ScoreSum += nums[1];
          }
        });
      }

      const team1Win = m.isWin ?? team1ScoreSum > team2ScoreSum;
      const team2Win = !team1Win;

      [p1, p2].forEach((name) => {
        if (!stats[name]) stats[name] = { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
        stats[name].gamesWon += team1ScoreSum;
        stats[name].gamesLost += team2ScoreSum;
        if (team1Win) stats[name].wins += 1;
        else stats[name].losses += 1;
      });

      [o1, o2].forEach((name) => {
        if (!stats[name]) stats[name] = { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
        stats[name].gamesWon += team2ScoreSum;
        stats[name].gamesLost += team1ScoreSum;
        if (team2Win) stats[name].wins += 1;
        else stats[name].losses += 1;
      });
    });

    const list = Object.keys(stats).map((name) => {
      const st = stats[name];
      const total = st.wins + st.losses;
      const winRate = total > 0 ? Math.round((st.wins / total) * 100) : 0;
      const diff = st.gamesWon - st.gamesLost;
      return {
        name,
        wins: st.wins,
        losses: st.losses,
        gamesWon: st.gamesWon,
        gamesLost: st.gamesLost,
        diff,
        winRate,
        rank: 1,
      };
    });

    list.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.diff - a.diff;
    });

    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  })();

  const filteredMatches = matches.filter((m) => {
    const q = searchQuery.toLowerCase();
    const str1 = (m.opponent1Name || "").toLowerCase();
    const str2 = (m.opponent2Name || "").toLowerCase();
    return str1.includes(q) || str2.includes(q);
  });

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen pb-24">
      {/* Header Banner */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
              <Activity className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                클럽 경기 전적 & 랭킹
                <span className="text-[10px] bg-lime-100 text-lime-900 font-extrabold px-2 py-0.5 rounded-full">
                  MATCH SYSTEM
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">회원/게스트 지정 및 팀 스코어 구분 등록</p>
            </div>
          </div>

          <button
            onClick={() => {
              setErrorMessage(null);
              setShowCreateModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" /> 경기 등록
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md sm:max-w-lg mx-auto">
        {/* Top Summary Card */}
        <section className="bg-gradient-to-r from-emerald-600 via-teal-700 to-teal-800 rounded-2xl p-4 text-white shadow-md border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-white/20 text-lime-300 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                <Sparkles className="h-3 w-3" /> 매치 데이터 센터
              </div>
              <h2 className="text-lg font-extrabold">클럽 복식 전적 기록</h2>
              <p className="text-xs text-emerald-100/90">
                등록 회원 {members.length}명 · 누적 경기 {matches.length}건
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lime-300 backdrop-blur-xs font-mono font-bold text-xl">
              🎾
            </div>
          </div>
        </section>

        {/* View Switcher Tabs */}
        <section className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveView("RECORDS")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeView === "RECORDS"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            역대 경기 기록 ({matches.length})
          </button>
          <button
            onClick={() => setActiveView("LEADERBOARD")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              activeView === "LEADERBOARD"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> 전체 순위표 (리더보드)
          </button>
        </section>

        {activeView === "RECORDS" ? (
          <>
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="선수 또는 게스트 이름 검색..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Matches Card List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">경기 전적을 불러오는 중...</div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-2 shadow-2xs">
                <Activity className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">등록된 경기 전적이 없습니다.</p>
                <p className="text-xs text-slate-400">상단 '+ 경기 등록' 버튼으로 점수를 구분하여 입력해보세요.</p>
              </div>
            ) : (
              <section className="space-y-3">
                {filteredMatches.map((m) => {
                  const teamAStr = m.opponent1Name || "TEAM A";
                  const teamBStr = m.opponent2Name || "TEAM B";
                  const formattedDate = new Date(m.matchDate).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <article
                      key={m.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {formattedDate}
                        </span>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            m.isWin
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                              : "bg-rose-100 text-rose-800 border border-rose-300/60"
                          }`}
                        >
                          {m.isWin ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {m.isWin ? "우리팀 승리 (WIN)" : "우리팀 패배 (LOSE)"}
                        </span>
                      </div>

                      {/* Doubles Teams Matching */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        {/* Team A */}
                        <div
                          className={`p-3 rounded-xl border text-center space-y-1 ${
                            m.isWin
                              ? "bg-emerald-50/80 border-emerald-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            OUR TEAM (A)
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 leading-snug">
                            {teamAStr}
                          </p>
                        </div>

                        {/* Score Badge */}
                        <div className="text-center px-1">
                          <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {m.score || "6-4"}
                          </span>
                        </div>

                        {/* Team B */}
                        <div
                          className={`p-3 rounded-xl border text-center space-y-1 ${
                            !m.isWin
                              ? "bg-emerald-50/80 border-emerald-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            OPPONENT (B)
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 leading-snug">
                            {teamBStr}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        ) : (
          /* Leaderboard Overall Rankings Table */
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" /> 클럽 개인 통합 순위표
              </h3>
              <span className="text-[10px] text-slate-400">승률 순 자동 정렬</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center">순위</th>
                    <th className="py-2.5 px-3">선수명</th>
                    <th className="py-2.5 px-3 text-center">전적 (승/패)</th>
                    <th className="py-2.5 px-3 text-center">총 득실</th>
                    <th className="py-2.5 px-3 text-center">승률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leaderboardStats.map((st) => (
                    <tr key={st.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-bold">
                        {st.rank === 1 ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-xs">
                            1
                          </span>
                        ) : st.rank === 2 ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-[10px]">
                            2
                          </span>
                        ) : st.rank === 3 ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-white font-black text-[10px]">
                            3
                          </span>
                        ) : (
                          st.rank
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1">
                        {st.name.includes("(게스트)") ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
                            게스트
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                            회원
                          </span>
                        )}
                        <span>{st.name.replace("(게스트)", "")}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {st.wins}승 {st.losses}패
                      </td>
                      <td
                        className={`py-2.5 px-3 text-center font-mono font-bold ${
                          st.diff > 0
                            ? "text-emerald-600"
                            : st.diff < 0
                            ? "text-rose-500"
                            : "text-slate-500"
                        }`}
                      >
                        {st.diff > 0 ? `+${st.diff}` : st.diff}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-emerald-700">
                        {st.winRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Modal for Registering Doubles Match */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> 복식 경기 입력
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="p-5 space-y-3.5">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-pulse">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">등록 실패 에러</p>
                    <p className="text-[11px] font-normal mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">경기 일자</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white font-medium"
                />
              </div>

              {/* Team A Selection */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-700" /> 우리 팀 (TEAM A)
                  </p>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                    동일 클럽 회원 필터링 됨
                  </span>
                </div>

                {/* Player 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">선수 1 (나)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestP1((p) => !p);
                        setPlayer1Name("");
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      {isGuestP1 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestP1 ? (
                    <input
                      type="text"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="게스트 이름 입력 (예: 홍길동)"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                  ) : (
                    <select
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                    >
                      {members.map((m) => (
                        <option key={m.id + "p1"} value={m.name}>
                          {m.name} {player1Name === m.name ? "(본인/로그인)" : `(${m.username})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Player 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">선수 2 (파트너)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestP2((p) => !p);
                        setPlayer2Name("");
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      {isGuestP2 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestP2 ? (
                    <input
                      type="text"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="게스트 이름 입력"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                  ) : (
                    <select
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                    >
                      {members.map((m) => (
                        <option key={m.id + "p2"} value={m.name}>
                          {m.name} ({m.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Team B Selection */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <p className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-600" /> 상대 팀 (TEAM B)
                </p>

                {/* Opponent 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">상대선수 1</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestO1((p) => !p);
                        setOpponent1Name("");
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      {isGuestO1 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestO1 ? (
                    <input
                      type="text"
                      value={opponent1Name}
                      onChange={(e) => setOpponent1Name(e.target.value)}
                      placeholder="게스트 이름 입력"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                  ) : (
                    <select
                      value={opponent1Name}
                      onChange={(e) => setOpponent1Name(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                    >
                      {members.map((m) => (
                        <option key={m.id + "o1"} value={m.name}>
                          {m.name} ({m.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Opponent 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">상대선수 2</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestO2((p) => !p);
                        setOpponent2Name("");
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      {isGuestO2 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestO2 ? (
                    <input
                      type="text"
                      value={opponent2Name}
                      onChange={(e) => setOpponent2Name(e.target.value)}
                      placeholder="게스트 이름 입력"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                  ) : (
                    <select
                      value={opponent2Name}
                      onChange={(e) => setOpponent2Name(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                    >
                      {members.map((m) => (
                        <option key={m.id + "o2"} value={m.name}>
                          {m.name} ({m.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 개편된 스코어 독립 입력 (Number Inputs) */}
              <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    점수 구분 입력 (Score)
                  </label>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      computedIsWin
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {computedIsWin ? "우리팀 승리 (WIN)" : "우리팀 패배 (LOSE)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                      우리팀 스코어
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={team1Score}
                      onChange={(e) => setTeam1Score(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                      className="w-full text-center text-lg font-mono font-black text-slate-900 border border-slate-300 rounded-lg py-1 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      상대팀 스코어
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={team2Score}
                      onChange={(e) => setTeam2Score(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                      className="w-full text-center text-lg font-mono font-black text-slate-900 border border-slate-300 rounded-lg py-1 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 text-center font-mono font-semibold">
                  최종 스코어: {computedScoreString} ({computedIsWin ? "우리팀 승리" : "상대팀 승리"})
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {isSubmitting ? "등록 처리 중..." : "전적 등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav clubId={clubId} />
    </div>
  );
}
