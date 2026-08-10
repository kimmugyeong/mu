"use client";

import { useEffect, useState, use } from "react";
import BottomNav from "@/components/BottomNav";
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
  UserPlus
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

  // Input Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));

  // Player selection vs Guest input states for 4 players
  const [isGuestP1, setIsGuestP1] = useState(false);
  const [isGuestP2, setIsGuestP2] = useState(false);
  const [isGuestO1, setIsGuestO1] = useState(false);
  const [isGuestO2, setIsGuestO2] = useState(false);

  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [opponent1Name, setOpponent1Name] = useState("");
  const [opponent2Name, setOpponent2Name] = useState("");
  const [score, setScore] = useState("");
  const [isWin, setIsWin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMatches();
    loadMembers();
  }, [clubId]);

  async function loadMatches() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/matches`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
        if (data.length >= 4) {
          setPlayer1Name(data[0].name);
          setPlayer2Name(data[1].name);
          setOpponent1Name(data[2].name);
          setOpponent2Name(data[3].name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();

    const p1 = isGuestP1 ? `(게스트)${player1Name.trim()}` : player1Name;
    const p2 = isGuestP2 ? `(게스트)${player2Name.trim()}` : player2Name;
    const o1 = isGuestO1 ? `(게스트)${opponent1Name.trim()}` : opponent1Name;
    const o2 = isGuestO2 ? `(게스트)${opponent2Name.trim()}` : opponent2Name;

    if (!p1 || !p2 || !o1 || !o2 || !score.trim()) {
      alert("모든 플레이어 정보와 스코어를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchType: "DOUBLE",
          player1Id: p1,
          player2Id: p2,
          opponent1Name: o1,
          opponent2Name: o2,
          score: score.trim(),
          isWin,
          matchDate,
        }),
      });

      if (res.ok) {
        setScore("");
        setShowCreateModal(false);
        loadMatches();
      } else {
        alert("경기 전적 등록에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate Overall Leaderboard Standings based on Match Records
  const leaderboardStats = (() => {
    const stats: Record<
      string,
      { wins: number; losses: number; gamesWon: number; gamesLost: number }
    > = {};

    matches.forEach((m) => {
      const p1 = m.player1Id || m.player1Name || "플레이어1";
      const p2 = m.player2Id || m.player2Name || "플레이어2";
      const o1 = m.opponent1Name || "상대1";
      const o2 = m.opponent2Name || "상대2";

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
    const p1 = (m.player1Id || m.player1Name || "").toLowerCase();
    const p2 = (m.player2Id || m.player2Name || "").toLowerCase();
    const o1 = (m.opponent1Name || "").toLowerCase();
    const o2 = (m.opponent2Name || "").toLowerCase();
    return p1.includes(q) || p2.includes(q) || o1.includes(q) || o2.includes(q);
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
                  RANKING
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">회원 검증 & 게스트 복식 경기 등록 시스템</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
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
                회원 {members.length}명 등록됨 · 총 {matches.length}경기 집계 중
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
                <p className="text-xs text-slate-400">상단 '+ 경기 등록' 버튼으로 회원/게스트 복식 전적을 추가해보세요.</p>
              </div>
            ) : (
              <section className="space-y-3">
                {filteredMatches.map((m) => {
                  const p1 = m.player1Id || m.player1Name || "선수1";
                  const p2 = m.player2Id || m.player2Name || "선수2";
                  const o1 = m.opponent1Name || "상대1";
                  const o2 = m.opponent2Name || "상대2";
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
                          {m.isWin ? "승리 (WIN)" : "패배 (LOSE)"}
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
                            TEAM A
                          </span>
                          <p className="text-xs font-extrabold text-slate-900">
                            {p1} + {p2}
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
                            TEAM B
                          </span>
                          <p className="text-xs font-extrabold text-slate-900">
                            {o1} + {o2}
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
              <span className="text-[10px] text-slate-400">회원 & 게스트 승률 순 정렬</span>
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

      {/* Modal for Registering Doubles Match with Member vs Guest Controls */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> 복식 경기 입력 (회원/게스트)
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">경기 일자</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Team A */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2.5">
                <p className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-700" /> 우리 팀 (TEAM A)
                </p>

                {/* Player 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">플레이어 1</label>
                    <button
                      type="button"
                      onClick={() => setIsGuestP1((p) => !p)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      {isGuestP1 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestP1 ? (
                    <input
                      type="text"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="게스트 이름을 입력하세요 (예: 홍길동)"
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
                          {m.name} ({m.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Player 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">플레이어 2 (파트너)</label>
                    <button
                      type="button"
                      onClick={() => setIsGuestP2((p) => !p)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      {isGuestP2 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestP2 ? (
                    <input
                      type="text"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="게스트 이름을 입력하세요"
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

              {/* Team B */}
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
                      onClick={() => setIsGuestO1((p) => !p)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      {isGuestO1 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestO1 ? (
                    <input
                      type="text"
                      value={opponent1Name}
                      onChange={(e) => setOpponent1Name(e.target.value)}
                      placeholder="게스트 이름을 입력하세요"
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
                      onClick={() => setIsGuestO2((p) => !p)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      {isGuestO2 ? "← 회원 목록 선택" : "+ 게스트 직접 입력"}
                    </button>
                  </div>
                  {isGuestO2 ? (
                    <input
                      type="text"
                      value={opponent2Name}
                      onChange={(e) => setOpponent2Name(e.target.value)}
                      placeholder="게스트 이름을 입력하세요"
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

              {/* Score & Result */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">경기 스코어</label>
                  <input
                    type="text"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="예: 6-4"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">우리팀 승패</label>
                  <select
                    value={isWin ? "WIN" : "LOSE"}
                    onChange={(e) => setIsWin(e.target.value === "WIN")}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-bold"
                  >
                    <option value="WIN">승리 (WIN)</option>
                    <option value="LOSE">패배 (LOSE)</option>
                  </select>
                </div>
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
                  {isSubmitting ? "등록 중..." : "전적 등록 완료"}
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
