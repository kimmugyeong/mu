"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ClipboardList, MapPin, MessageCircle, Settings2, Share2, ShoppingBag, Trophy, Users, UserPlus } from "lucide-react";
import { validateClubInput } from "@/lib/clubValidation";

type Mode = "login" | "signup";
type ViewMode = "auth" | "clubs" | "club";

type FormState = {
  name: string;
  username: string;
  password: string;
};

type Club = {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt?: string;
};

const initialForm: FormState = {
  name: "",
  username: "",
  password: "",
};

type ClubFormState = {
  name: string;
  address: string;
  city: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
};

const initialClubForm: ClubFormState = {
  name: "",
  address: "",
  city: "",
  description: "",
  contactPhone: "",
  contactEmail: "",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [view, setView] = useState<ViewMode>("auth");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; username: string; isAdmin?: boolean } | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clubForm, setClubForm] = useState<ClubFormState>(initialClubForm);
  const [clubErrors, setClubErrors] = useState<Partial<Record<keyof ClubFormState, string>>>({});
  const [clubStatus, setClubStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"notices" | "merch" | "matches" | "tournaments">("notices");
  const [notices, setNotices] = useState<any[]>([]);
  const [merchandises, setMerchandises] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", isImportant: false });
  const [merchForm, setMerchForm] = useState({ name: "", description: "", price: "", imageUrl: "", sizes: "" });
  const [orderForm, setOrderForm] = useState({ merchandiseId: "", selectedSize: "", quantity: "1", userId: "" });
  const [matchForm, setMatchForm] = useState({ matchType: "DOUBLE", player1Id: "", player2Id: "", opponent1Name: "", opponent2Name: "", score: "", isWin: true });
  const [tournamentForm, setTournamentForm] = useState({ title: "", eventDate: "", players: "" });

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const openClub = (club: Club) => {
    setSelectedClub(club);
    setView("club");
  };

  const goToClubs = () => {
    setSelectedClub(null);
    setView("clubs");
  };

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const response = await fetch("/api/clubs");
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setClubs(data);
      } catch {
        // ignore
      }
    };

    if (view === "clubs") {
      loadClubs();
    }
  }, [view]);

  useEffect(() => {
    if (!selectedClub) return;

    const loadClubData = async () => {
      try {
        const [noticesRes, merchRes, ordersRes, matchesRes, tournamentsRes] = await Promise.all([
          fetch(`/api/clubs/${selectedClub.id}/notices`),
          fetch(`/api/clubs/${selectedClub.id}/merchandises`),
          fetch(`/api/clubs/${selectedClub.id}/orders`),
          fetch(`/api/clubs/${selectedClub.id}/matches`),
          fetch(`/api/clubs/${selectedClub.id}/tournaments`),
        ]);
        const [noticesData, merchData, ordersData, matchesData, tournamentsData] = await Promise.all([
          noticesRes.json(),
          merchRes.json(),
          ordersRes.json(),
          matchesRes.json(),
          tournamentsRes.json(),
        ]);
        setNotices(noticesData);
        setMerchandises(merchData);
        setOrders(ordersData);
        setMatches(matchesData);
        setTournaments(tournamentsData);
      } catch {
        // ignore
      }
    };

    loadClubData();
  }, [selectedClub]);

  const updateClubField = (field: keyof ClubFormState, value: string) => {
    setClubForm((prev) => ({ ...prev, [field]: value }));
    setClubErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCreateClub = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const nextErrors = validateClubInput(clubForm);

    if (Object.keys(nextErrors).length > 0) {
      setClubErrors(nextErrors);
      setClubStatus("");
      return;
    }

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubForm),
      });

      if (!response.ok) {
        const result = await response.json();
        setClubStatus(result.error ?? "클럽 생성에 실패했습니다.");
        return;
      }

      const createdClub = await response.json();
      setClubs((prev) => [createdClub, ...prev]);
      setClubForm(initialClubForm);
      setShowCreateForm(false);
      setClubStatus("클럽이 생성되었습니다.");
      setSelectedClub(createdClub);
      setView("club");
    } catch {
      setClubStatus("클럽 생성 중 문제가 발생했습니다.");
    }
  };

  const handleCreateNotice = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!selectedClub) return;
    const response = await fetch(`/api/clubs/${selectedClub.id}/notices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...noticeForm, authorId: loggedInUser?.username === "admin" ? undefined : undefined }),
    });
    if (response.ok) {
      const created = await response.json();
      setNotices((prev) => [created, ...prev]);
      setNoticeForm({ title: "", content: "", isImportant: false });
    }
  };

  const handleCreateMerch = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!selectedClub) return;
    const response = await fetch(`/api/clubs/${selectedClub.id}/merchandises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...merchForm, sizes: merchForm.sizes.split(",").map((item) => item.trim()).filter(Boolean) }),
    });
    if (response.ok) {
      const created = await response.json();
      setMerchandises((prev) => [created, ...prev]);
      setMerchForm({ name: "", description: "", price: "", imageUrl: "", sizes: "" });
    }
  };

  const handleCreateOrder = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!selectedClub || !loggedInUser) return;
    const response = await fetch(`/api/clubs/${selectedClub.id}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orderForm, userId: loggedInUser.username, quantity: Number(orderForm.quantity) }),
    });
    if (response.ok) {
      const created = await response.json();
      setOrders((prev) => [created, ...prev]);
      setOrderForm((prev) => ({ ...prev, selectedSize: "", quantity: "1" }));
    }
  };

  const handleCreateMatch = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!selectedClub) return;
    const response = await fetch(`/api/clubs/${selectedClub.id}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchForm),
    });
    if (response.ok) {
      const created = await response.json();
      setMatches((prev) => [created, ...prev]);
      setMatchForm({ matchType: "DOUBLE", player1Id: "", player2Id: "", opponent1Name: "", opponent2Name: "", score: "", isWin: true });
    }
  };

  const handleCreateTournament = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!selectedClub) return;
    const response = await fetch(`/api/clubs/${selectedClub.id}/tournaments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tournamentForm, players: tournamentForm.players.split(",").map((item) => item.trim()).filter(Boolean) }),
    });
    if (response.ok) {
      const created = await response.json();
      setTournaments((prev) => [created, ...prev]);
      setTournamentForm({ title: "", eventDate: "", players: "" });
    }
  };

  const validateClientInput = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "이름을 입력해주세요.";
    }

    if (!form.username.trim()) {
      nextErrors.username = "아이디를 입력해주세요.";
    } else if (!/^[a-z0-9_]{4,20}$/i.test(form.username)) {
      nextErrors.username = "아이디는 4~20자의 영문, 숫자, _만 사용할 수 있습니다.";
    }

    if (!form.password) {
      nextErrors.password = "비밀번호를 입력해주세요.";
    } else if (form.password.length < 8) {
      nextErrors.password = "비밀번호는 8자리 이상이어야 합니다.";
    }

    return nextErrors;
  };

  const handleLogin = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.user) {
        setStatus("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      const isAdmin = result.user.username === "admin";
      setLoggedInUser({ name: result.user.name, username: result.user.username, isAdmin });
      setStatus(`${result.user.name}님, 환영합니다.`);
      setForm((prev) => ({ ...prev, password: "" }));
      setView("clubs");
    } catch {
      setStatus("로그인 중 문제가 발생했습니다.");
    }
  };

  const handleSignup = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const nextErrors = validateClientInput();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrors({ username: result.error ?? "회원가입에 실패했습니다." });
        setStatus("");
        return;
      }

      setStatus("회원가입이 완료되었습니다. 이제 로그인해 주세요.");
      setErrors({});
      setForm(initialForm);
      setMode("login");
    } catch {
      setStatus("회원가입 중 문제가 발생했습니다.");
    }
  };

  if (view === "clubs") {
    return (
      <main className="flex-1 bg-gray-50 px-5 py-6 text-gray-900">
        <section className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-teal-600">환영합니다</p>
            <h1 className="mt-2 text-2xl font-semibold">{loggedInUser?.name ?? "회원"}님</h1>
            <p className="mt-2 text-sm text-gray-500">클럽을 탐색하고, 가입된 클럽을 확인해 보세요.</p>
          </div>

          {status ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
              {status}
            </div>
          ) : null}

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">클럽 찾기</h2>
              {loggedInUser?.isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm((prev) => !prev)}
                  className="rounded-full bg-teal-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  {showCreateForm ? "닫기" : "클럽 생성"}
                </button>
              ) : null}
            </div>

            {showCreateForm ? (
              <form onSubmit={handleCreateClub} className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">클럽 이름</label>
                  <input value={clubForm.name} onChange={(event) => updateClubField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  {clubErrors.name ? <p className="mt-1 text-sm text-red-500">{clubErrors.name}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">주소</label>
                  <input value={clubForm.address} onChange={(event) => updateClubField("address", event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  {clubErrors.address ? <p className="mt-1 text-sm text-red-500">{clubErrors.address}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">도시</label>
                  <input value={clubForm.city} onChange={(event) => updateClubField("city", event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  {clubErrors.city ? <p className="mt-1 text-sm text-red-500">{clubErrors.city}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">클럽 소개</label>
                  <textarea value={clubForm.description} onChange={(event) => updateClubField("description", event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" rows={3} />
                  {clubErrors.description ? <p className="mt-1 text-sm text-red-500">{clubErrors.description}</p> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">연락처</label>
                    <input value={clubForm.contactPhone} onChange={(event) => updateClubField("contactPhone", event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                    {clubErrors.contactPhone ? <p className="mt-1 text-sm text-red-500">{clubErrors.contactPhone}</p> : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                    <input value={clubForm.contactEmail} onChange={(event) => updateClubField("contactEmail", event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                    {clubErrors.contactEmail ? <p className="mt-1 text-sm text-red-500">{clubErrors.contactEmail}</p> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">생성</button>
                  <button type="button" onClick={() => { setShowCreateForm(false); setClubForm(initialClubForm); setClubErrors({}); setClubStatus(""); }} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">취소</button>
                </div>
                {clubStatus ? <p className="text-sm text-gray-600">{clubStatus}</p> : null}
              </form>
            ) : null}

            <div className="mt-4 space-y-3">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => openClub(club)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{club.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{club.address} · {club.city}</p>
                    </div>
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
                      새 클럽
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{club.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (view === "club" && selectedClub) {
    const clubStats = [
      { title: "전체 멤버", value: clubs.length ? clubs.length : 128, icon: Users, tone: "bg-emerald-50 text-emerald-700" },
      { title: "이번 달 월례회", value: "3회", icon: Trophy, tone: "bg-teal-50 text-teal-700" },
      { title: "공지사항", value: `${notices.length || 8}건`, icon: Bell, tone: "bg-slate-50 text-slate-700" },
      { title: "단체복 공제", value: `${merchandises.length || 4}건`, icon: ShoppingBag, tone: "bg-cyan-50 text-cyan-700" },
    ];

    const recentMembers = [
      { name: "강지훈", joined: "2일 전" },
      { name: "박수진", joined: "5일 전" },
      { name: "이민재", joined: "1주일 전" },
      { name: "정다운", joined: "1주일 전" },
    ];

    const upcomingEvent = {
      title: "8월 월례회 대회",
      day: "D-5",
      datetime: "8월 22일 토요일 · 14:00",
      location: `${selectedClub.address} ${selectedClub.city}`,
    };

    const recentMatch = {
      result: "승 3 / 패 1",
      score: "6-3, 4-6, 10-8",
      summary: "최근 월례회 경기에서 치열한 역전승을 거두었습니다.",
    };

    return (
      <main className="flex-1 bg-slate-50 px-5 py-6 text-slate-900 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-800 p-6 text-white shadow-2xl shadow-slate-950/10 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-3xl font-black text-white shadow-lg shadow-slate-950/20">
                    {selectedClub.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-teal-100/80">클럽 헤더</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{selectedClub.name}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100/90">{selectedClub.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 shadow-sm backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-teal-100/75">멤버</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{clubStats[0].value}</p>
                  </div>
                  <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 shadow-sm backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-teal-100/75">월례회</p>
                    <p className="mt-2 text-2xl font-semibold text-white">3회</p>
                  </div>
                  <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 shadow-sm backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-teal-100/75">관리자</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{loggedInUser?.name ?? "관리자"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:w-auto">
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  <Settings2 className="h-4 w-4" /> 클럽 설정
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  <Share2 className="h-4 w-4" /> 초대 링크 복사
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {clubStats.map((item) => (
              <article key={item.title} className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${item.tone}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm text-slate-500">{item.title}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
              </article>
            ))}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">메인 탭</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">클럽 대시보드</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "notices", label: "공지사항", icon: Bell },
                  { id: "tournament", label: "월례회", icon: Trophy },
                  { id: "matches", label: "경기전적", icon: CalendarDays },
                  { id: "merch", label: "단체복", icon: ShoppingBag },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${isActive ? "border border-emerald-500 bg-emerald-50 text-emerald-700" : "border border-transparent bg-slate-100 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
            <div className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">최신 필독 공지사항</p>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">월례회 준비물 및 일정 안내</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> 필독
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">이번 월례회 전 참가자는 운동화, 물, 개인 라켓을 반드시 준비하시고 10분 전에 도착해 주세요.</p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-2">발행일: 2026-08-07</span>
                  <span className="rounded-full bg-slate-100 px-3 py-2">작성자: 운영진</span>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">다가오는 일정</p>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{upcomingEvent.title}</h3>
                  </div>
                  <span className="rounded-3xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">{upcomingEvent.day}</span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">일시</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{upcomingEvent.datetime}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">장소</p>
                    <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900"><MapPin className="h-4 w-4 text-teal-600" />{upcomingEvent.location}</p>
                  </div>
                </div>
                <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  <CalendarDays className="h-4 w-4" /> 참가 신청
                </button>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">최근 경기 결과</p>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{recentMatch.result}</h3>
                  </div>
                  <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{recentMatch.score}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{recentMatch.summary}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"><MessageCircle className="h-4 w-4 text-slate-400" /> 최근 경기 요약</span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"><Users className="h-4 w-4 text-slate-400" /> 5명 참가</span>
                </div>
              </article>
            </div>

            <aside className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">클럽 정보</p>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">매너 수칙 & 안내</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">추천</span>
                </div>
                <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                  <p className="inline-flex items-center gap-2 text-slate-700"><MapPin className="h-4 w-4 text-teal-600" /> 코트 위치: {selectedClub.address}, {selectedClub.city}</p>
                  <p className="inline-flex items-center gap-2 text-slate-700"><MessageCircle className="h-4 w-4 text-teal-600" /> 단톡방: <a href="#" className="font-semibold text-teal-700 hover:underline">바로가기</a></p>
                </div>
                <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span> 매너를 준수하며 경기를 진행합니다.</p>
                  <p className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span> 개인 장비는 스스로 관리합니다.</p>
                  <p className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span> 정시에 도착하여 러닝 시간을 준수합니다.</p>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">최근 가입 멤버</p>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">최근 가입자</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">최근 7일</span>
                </div>
                <div className="mt-6 space-y-4">
                  {recentMembers.map((member) => (
                    <div key={member.name} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">{member.name.slice(0, 1)}</div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.joined}</p>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
                        <UserPlus className="h-3.5 w-3.5" /> 환영
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col justify-center px-6 py-10 text-gray-900">
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-600">테니스 클럽</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {mode === "login" ? "회원 로그인" : "회원가입"}
          </h1>
          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            클럽 경기, 전적, 매치 정보를 바로 확인하세요.
          </p>
        </div>

        <div className="flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrors({});
              setStatus("");
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrors({});
              setStatus("");
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500"
            }`}
          >
            회원가입
          </button>
        </div>

        {status ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            {status}
          </div>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="example123"
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="8자리 이상 입력"
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              로그인
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="홍길동"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              {errors.name ? <p className="mt-2 text-sm text-red-500">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700">
                아이디
              </label>
              <input
                id="signup-username"
                type="text"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="example123"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              {errors.username ? <p className="mt-2 text-sm text-red-500">{errors.username}</p> : null}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="8자리 이상 입력"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              {errors.password ? <p className="mt-2 text-sm text-red-500">{errors.password}</p> : null}
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              가입하기
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
