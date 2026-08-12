"use client";

import { useEffect, useState, use } from "react";
import BottomNav from "@/components/BottomNav";
import { getLoggedInUser, AuthUser, isAdminUser } from "@/lib/authSession";
import {
  Trophy,
  CalendarDays,
  UserCheck,
  UserX,
  Users,
  CheckCircle2,
  PlusCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Medal,
  Award,
  Shuffle,
  GripVertical,
  MoveRight,
  ArrowUpDown
} from "lucide-react";
import { generate4PlayerKDKMatches, calculateGroupStandings, KDKMatch } from "@/lib/kdk";

type Props = {
  params: Promise<{ id: string }>;
};

type Tournament = {
  id: string;
  clubId: string;
  title: string;
  eventDate: string;
  status: string;
  createdAt: string;
  groups?: {
    id: string;
    groupName: string;
    players: { id: string; displayName: string }[];
  }[];
};

export default function TournamentsPage({ params }: Props) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);

  // User attendance state
  const [attendance, setAttendance] = useState<"ATTENDING" | "ABSENT" | null>("ATTENDING");
  const [attendingUsers, setAttendingUsers] = useState<string[]>([
    "김현수", "강지훈", "박수진", "이민재", "정다운", "최유진", "윤성민", "한지은", "임동현", "장서연", "오세훈", "송미경"
  ]);

  // Admin & Form state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [playerInput, setPlayerInput] = useState("");

  // KDK Group Players & Match state per Group
  const [groupPlayers, setGroupPlayers] = useState<Record<string, string[]>>({
    "1그룹 (A조)": ["김현수", "강지훈", "박수진", "이민재"],
    "2그룹 (B조)": ["정다운", "최유진", "윤성민", "한지은"],
    "3그룹 (C조)": ["임동현", "장서연", "오세훈", "송미경"],
  });
  const [groupMatches, setGroupMatches] = useState<Record<string, KDKMatch[]>>({});

  // Drag & Drop State
  const [draggedPlayer, setDraggedPlayer] = useState<{ name: string; fromGroup: string } | null>(null);

  // Standings Sort Order State (desc | asc)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    setCurrentUser(getLoggedInUser());
    loadTournaments();
    initAttendanceList();
  }, [clubId]);

  function initAttendanceList() {
    const user = getLoggedInUser();
    setAttendingUsers((prev) => {
      if (!prev.includes(user.name)) {
        return [user.name, ...prev.filter((n) => n !== "김현수")];
      }
      return prev;
    });
  }

  async function loadTournaments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/tournaments`);
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        if (data.length > 0) {
          initTournamentView(data[0]);
        } else {
          rebuildGroupMatches(groupPlayers);
        }
      }
    } catch (e) {
      console.error(e);
      rebuildGroupMatches(groupPlayers);
    } finally {
      setLoading(false);
    }
  }

  function rebuildGroupMatches(playersMap: Record<string, string[]>) {
    const nextMatches: Record<string, KDKMatch[]> = {};
    Object.keys(playersMap).forEach((gName, idx) => {
      const names = playersMap[gName];
      nextMatches[gName] = generate4PlayerKDKMatches(names, `g${idx + 1}`);
    });
    setGroupMatches(nextMatches);
  }

  function initTournamentView(tour: Tournament) {
    setSelectedTournament(tour);
    const user = getLoggedInUser();
    
    let initPlayersMap: Record<string, string[]> = {};
    if (tour.groups && tour.groups.length > 0) {
      tour.groups.forEach((g) => {
        initPlayersMap[g.groupName] = g.players.map((p) => p.displayName);
      });
    } else {
      initPlayersMap = {
        "1그룹 (A조)": [user.name, "강지훈", "박수진", "이민재"],
        "2그룹 (B조)": ["정다운", "최유진", "윤성민", "한지은"],
        "3그룹 (C조)": ["임동현", "장서연", "오세훈", "송미경"],
      };
    }
    setGroupPlayers(initPlayersMap);
    rebuildGroupMatches(initPlayersMap);
  }

  // 🎲 3개 조 랜덤 편성 핸들러
  function handleRandomGroupAssignment() {
    const sourceList = attendingUsers.length >= 6
      ? [...attendingUsers]
      : ["김현수", "강지훈", "박수진", "이민재", "정다운", "최유진", "윤성민", "한지은", "임동현", "장서연", "오세훈", "송미경"];

    // Fisher-Yates Random Shuffle
    const shuffled = [...sourceList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 3개 조에 균등 무작위 배분
    const groupKeys = ["1그룹 (A조)", "2그룹 (B조)", "3그룹 (C조)"];
    const nextPlayersMap: Record<string, string[]> = {
      "1그룹 (A조)": [],
      "2그룹 (B조)": [],
      "3그룹 (C조)": [],
    };

    shuffled.forEach((name, idx) => {
      const targetGroupKey = groupKeys[idx % 3];
      nextPlayersMap[targetGroupKey].push(name);
    });

    setGroupPlayers(nextPlayersMap);
    rebuildGroupMatches(nextPlayersMap);
  }

  // 🖐 Drag & Drop Handlers
  function handleDragStart(e: React.DragEvent, name: string, fromGroup: string) {
    setDraggedPlayer({ name, fromGroup });
    e.dataTransfer.setData("text/plain", JSON.stringify({ name, fromGroup }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDropGroup(e: React.DragEvent, targetGroup: string) {
    e.preventDefault();
    if (!draggedPlayer) return;

    const { name, fromGroup } = draggedPlayer;
    if (fromGroup === targetGroup) return;

    setGroupPlayers((prev) => {
      const fromList = (prev[fromGroup] || []).filter((p) => p !== name);
      const targetList = Array.from(new Set([...(prev[targetGroup] || []), name]));

      const nextMap = {
        ...prev,
        [fromGroup]: fromList,
        [targetGroup]: targetList,
      };

      rebuildGroupMatches(nextMap);
      return nextMap;
    });

    setDraggedPlayer(null);
  }

  function toggleAttendance(status: "ATTENDING" | "ABSENT") {
    setAttendance(status);
    const myName = getLoggedInUser().name;
    if (status === "ATTENDING") {
      if (!attendingUsers.includes(myName)) {
        setAttendingUsers((prev) => [...prev, myName]);
      }
    } else {
      setAttendingUsers((prev) => prev.filter((u) => u !== myName));
    }
  }

  function handleScoreChange(groupName: string, matchId: string, team: 1 | 2, scoreVal: string) {
    const val = scoreVal === "" ? null : Number(scoreVal);
    setGroupMatches((prev) => {
      const currentList = prev[groupName] || [];
      const updated = currentList.map((m) => {
        if (m.id === matchId) {
          const t1Score = team === 1 ? val : m.team1Score;
          const t2Score = team === 2 ? val : m.team2Score;
          const isDone = t1Score !== null && t2Score !== null;
          return { ...m, team1Score: t1Score, team2Score: t2Score, isCompleted: isDone };
        }
        return m;
      });
      return { ...prev, [groupName]: updated };
    });
  }

  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      alert("대회 명칭과 일시를 입력하세요.");
      return;
    }

    const playersList = playerInput
      ? playerInput.split(",").map((s) => s.trim()).filter(Boolean)
      : attendingUsers;

    try {
      const res = await fetch(`/api/clubs/${clubId}/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          eventDate,
          players: playersList,
        }),
      });

      if (res.ok) {
        setTitle("");
        setEventDate("");
        setPlayerInput("");
        setShowCreateModal(false);
        loadTournaments();
      }
    } catch (e) {
      console.error(e);
      alert("대회 등록 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-100 text-lime-900 font-bold">
              <Trophy className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                클럽 월례회 대회
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  KDK SYSTEM
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">참석 신청 및 조별 KDK 대진/성적표</p>
            </div>
          </div>

          {isAdminUser(currentUser) && (
            <button
              onClick={() => setIsAdminMode((p) => !p)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                isAdminMode
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {isAdminMode ? "관리자 켜짐" : "운영진 모드"}
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md sm:max-w-lg mx-auto">
        {/* Tournament Hero Card */}
        <section className="bg-gradient-to-r from-emerald-600 via-teal-700 to-teal-800 rounded-2xl p-4 text-white shadow-md border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="bg-lime-300 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> 공식 월례회
            </span>
            {isAdminUser(currentUser) && isAdminMode && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" /> 새 월례회 개설
              </button>
            )}
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {selectedTournament ? selectedTournament.title : "8월 클럽 정기 월례회"}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {selectedTournament
                ? new Date(selectedTournament.eventDate).toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })
                : "8월 22일 (토) 14:00 경기 시작"}
            </p>
          </div>

          {/* Attendance Section */}
          <div className="bg-black/15 backdrop-blur-xs rounded-xl p-3 space-y-2 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Users className="h-4 w-4 text-lime-300" /> 나의 참석 여부
              </span>
              <span className="text-[11px] text-lime-200 font-semibold">
                현재 {attendingUsers.length}명 참석 예정
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleAttendance("ATTENDING")}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  attendance === "ATTENDING"
                    ? "bg-lime-400 text-slate-950 shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <UserCheck className="h-4 w-4" /> 참석 확정
              </button>
              <button
                onClick={() => toggleAttendance("ABSENT")}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  attendance === "ABSENT"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <UserX className="h-4 w-4" /> 불참
              </button>
            </div>
          </div>
        </section>

        {/* Attending Member Chips & Random Assignment Bar */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>참석 확정 명단 ({attendingUsers.length}명)</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                드래그 앤 드롭으로 조를 자유롭게 이동하거나 랜덤 편성하세요.
              </p>
            </div>

            <button
              onClick={handleRandomGroupAssignment}
              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 shrink-0"
            >
              <Shuffle className="h-3.5 w-3.5 text-lime-300" />
              <span>🎲 3개 조 랜덤 편성</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {attendingUsers.map((name, idx) => (
              <span
                key={name + idx}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Overall Leaderboard Card */}
        {(() => {
          const allStandingsMap: Record<string, any> = {};
          Object.keys(groupMatches).forEach((gName) => {
            const matches = groupMatches[gName] || [];
            const players = groupPlayers[gName] || Array.from(new Set(matches.flatMap((m) => [...m.team1, ...m.team2])));
            const stList = calculateGroupStandings(players, matches);
            stList.forEach((st) => {
              allStandingsMap[st.playerName] = { ...st, groupName: gName };
            });
          });

          const overallList = Object.values(allStandingsMap);
          overallList.sort((a, b) => {
            if (sortOrder === "desc") {
              if (b.wins !== a.wins) return b.wins - a.wins;
              if (b.diff !== a.diff) return b.diff - a.diff;
              return b.pointsFor - a.pointsFor;
            } else {
              if (a.wins !== b.wins) return a.wins - b.wins;
              if (a.diff !== b.diff) return a.diff - b.diff;
              return a.pointsFor - b.pointsFor;
            }
          });

          overallList.forEach((item, idx) => {
            item.overallRank = idx + 1;
          });

          return (
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-4 shadow-md border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black">
                    🏆
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                      월례회 전체 실시간 통합 순위표
                    </h3>
                    <p className="text-[10px] text-slate-300">
                      전적 입력에 따라 승수 · 득실차 · 승률 실시간 정렬
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                  className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-lime-300 border border-white/20 text-xs font-bold px-2.5 py-1.5 rounded-xl transition"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>{sortOrder === "desc" ? "내림차순 (1위→)" : "오름차순 (하위→)"}</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/60 backdrop-blur-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center">전체순위</th>
                      <th className="py-2.5 px-3">선수명 (소속조)</th>
                      <th className="py-2.5 px-3 text-center">전적</th>
                      <th className="py-2.5 px-3 text-center">득실차</th>
                      <th className="py-2.5 px-3 text-center">승률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {overallList.map((st) => (
                      <tr key={st.playerName} className="hover:bg-white/5 transition">
                        <td className="py-2 px-3 text-center font-extrabold">
                          {st.overallRank === 1 ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                              🥇
                            </span>
                          ) : st.overallRank === 2 ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-[10px]">
                              🥈
                            </span>
                          ) : st.overallRank === 3 ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-white font-black text-[10px]">
                              🥉
                            </span>
                          ) : (
                            st.overallRank
                          )}
                        </td>
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                          <span>{st.playerName}</span>
                          <span className="text-[9px] bg-slate-800 text-teal-300 px-1.5 py-0.2 rounded font-mono">
                            {st.groupName.split(" ")[0]}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-200">
                          {st.wins}승 {st.losses}패
                        </td>
                        <td
                          className={`py-2 px-3 text-center font-mono font-bold ${
                            st.diff > 0
                              ? "text-emerald-400"
                              : st.diff < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {st.diff > 0 ? `+${st.diff}` : st.diff}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-lime-300 font-mono">
                          {st.winRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}

        {/* KDK Groups, Drag & Drop, & Match Input */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-emerald-600" /> 조별 KDK 대진 & Drag & Drop 조원 편성
            </h2>
            <span className="text-[10px] bg-lime-100 text-lime-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <GripVertical className="h-3 w-3" /> 조원 드래그 이동 가능
            </span>
          </div>

          {Object.keys(groupPlayers).map((groupName, gIdx) => {
            const currentGroupPlayers = groupPlayers[groupName] || [];
            const matches = groupMatches[groupName] || [];
            const standings = calculateGroupStandings(currentGroupPlayers, matches);

            return (
              <div
                key={groupName}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropGroup(e, groupName)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition hover:border-emerald-300"
              >
                {/* Group Header & Drop Zone Info */}
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-slate-950">
                      {gIdx + 1}
                    </span>
                    <h3 className="text-xs font-bold">{groupName}</h3>
                    <span className="text-[10px] bg-white/10 text-teal-200 px-2 py-0.5 rounded-full font-mono">
                      {currentGroupPlayers.length}명 배치
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 flex items-center gap-1">
                    <GripVertical className="h-3 w-3 text-amber-400" /> 타 조원 드롭 구역
                  </span>
                </div>

                {/* Draggable Group Member Chips */}
                <div className="p-3 bg-slate-50 border-b border-slate-200/60 space-y-1.5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex items-center justify-between">
                    <span>조원 목록 (드래그하여 타 조로 이동 가능)</span>
                    <span className="text-emerald-700 font-mono">Drag & Drop Zone</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentGroupPlayers.map((pName) => (
                      <span
                        key={pName}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pName, groupName)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs cursor-grab active:cursor-grabbing transition group select-none"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        <span>{pName}</span>
                      </span>
                    ))}
                    {currentGroupPlayers.length === 0 && (
                      <span className="text-xs text-slate-400 italic py-1">
                        여기로 조원을 드래그하여 배치하세요.
                      </span>
                    )}
                  </div>
                </div>

                {/* Round Matches Input */}
                <div className="p-4 space-y-3">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-tight">
                    경기 결과 입력 (전적 반영)
                  </h4>

                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          라운드 {m.roundNum}
                        </span>
                        {m.isCompleted ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> 입력 완료
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">점수 입력 대기</span>
                        )}
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                        {/* Team 1 */}
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                          <p className="font-bold text-slate-900 text-[11px] line-clamp-1">
                            {m.team1.join(" + ")}
                          </p>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={m.team1Score ?? ""}
                            disabled={!isAdminUser(currentUser) || !isAdminMode}
                            onChange={(e) =>
                              handleScoreChange(groupName, m.id, 1, e.target.value)
                            }
                            placeholder="0"
                            className="w-9 h-8 text-center text-xs font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                          />
                          <span className="text-slate-400 font-bold">:</span>
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={m.team2Score ?? ""}
                            disabled={!isAdminUser(currentUser) || !isAdminMode}
                            onChange={(e) =>
                              handleScoreChange(groupName, m.id, 2, e.target.value)
                            }
                            placeholder="0"
                            className="w-9 h-8 text-center text-xs font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>

                        {/* Team 2 */}
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                          <p className="font-bold text-slate-900 text-[11px] line-clamp-1">
                            {m.team2.join(" + ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Group Leaderboard Table */}
                  <div className="pt-2">
                    <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-tight mb-2 flex items-center justify-between">
                      <span>{groupName} 실시간 순위표</span>
                      <span className="text-emerald-600 font-normal">승 / 득실차 / 승률</span>
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-2.5 text-center">조 순위</th>
                            <th className="py-2 px-2.5">선수명</th>
                            <th className="py-2 px-2.5 text-center">전적 (승/패)</th>
                            <th className="py-2 px-2.5 text-center">득실차</th>
                            <th className="py-2 px-2.5 text-center">승률</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {standings.map((st) => (
                            <tr key={st.playerName} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 text-center font-bold">
                                {st.rank === 1 ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                                    🥇
                                  </span>
                                ) : st.rank === 2 ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-[10px]">
                                    🥈
                                  </span>
                                ) : st.rank === 3 ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-white font-black text-[10px]">
                                    🥉
                                  </span>
                                ) : (
                                  st.rank
                                )}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-slate-900">
                                {st.playerName}
                              </td>
                              <td className="py-2 px-2.5 text-center font-semibold">
                                {st.wins}승 {st.losses}패
                              </td>
                              <td
                                className={`py-2 px-2.5 text-center font-mono font-bold ${
                                  st.diff > 0
                                    ? "text-emerald-600"
                                    : st.diff < 0
                                    ? "text-rose-500"
                                    : "text-slate-500"
                                }`}
                              >
                                {st.diff > 0 ? `+${st.diff}` : st.diff}
                              </td>
                              <td className="py-2 px-2.5 text-center font-bold text-emerald-700 font-mono">
                                {st.winRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Modal for Creating Tournament */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Trophy className="h-4 w-4" /> 신규 월례회 개설
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대회 명칭</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 9월 추석맞이 정기 월례회"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">일시</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  참가자 명단 (쉼표 분리)
                </label>
                <textarea
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  rows={3}
                  placeholder="김현수, 강지훈, 박수진, 이민재, 정다운, 최유진, 윤성민..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  미입력 시 현재 참석 확정 명단으로 자동 분배됩니다.
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
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  대회 개설하기
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
