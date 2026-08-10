"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays, CheckCircle2, ClipboardList, MapPin, MessageCircle, Settings2, Share2, ShoppingBag, Trophy, Users, UserPlus, Shirt, ChevronRight, Lock } from "lucide-react";
import { validateClubInput } from "@/lib/clubValidation";
import MainBottomNav from "@/components/MainBottomNav";

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
  const router = useRouter();
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
      <main className="flex-1 bg-slate-50 px-4 py-6 text-slate-900 space-y-5">
        <section className="space-y-5">
          {/* Welcome Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
            <div className="flex items-center justify-between">
              <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                🎾 테니스 클럽 포털
              </span>
              <span className="text-xs text-slate-400 font-medium">Tennis Joa</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              {loggedInUser?.name ?? "회원"}님, 반갑습니다!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              클럽을 탐색하거나 가입된 테니스 클럽 대시보드로 이동하세요.
            </p>
          </div>

          {status ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {status}
            </div>
          ) : null}

          {/* Club Finder Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">클럽 찾기</h2>
                <p className="text-xs text-slate-500 mt-0.5">등록된 동호회 목록입니다.</p>
              </div>
              {loggedInUser?.isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm((prev) => !prev)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm px-3.5 py-1.5 text-xs transition"
                >
                  {showCreateForm ? "닫기" : "+ 클럽 생성"}
                </button>
              ) : null}
            </div>

            {showCreateForm ? (
              <form onSubmit={handleCreateClub} className="mt-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-200 p-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">클럽 이름</label>
                  <input value={clubForm.name} onChange={(event) => updateClubField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" placeholder="예: 그린코트 테니스 클럽" />
                  {clubErrors.name ? <p className="mt-1 text-xs text-red-500">{clubErrors.name}</p> : null}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">주소</label>
                  <input value={clubForm.address} onChange={(event) => updateClubField("address", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" placeholder="예: 서울 강남구 테헤란로 123" />
                  {clubErrors.address ? <p className="mt-1 text-xs text-red-500">{clubErrors.address}</p> : null}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">도시</label>
                  <input value={clubForm.city} onChange={(event) => updateClubField("city", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" placeholder="예: 서울" />
                  {clubErrors.city ? <p className="mt-1 text-xs text-red-500">{clubErrors.city}</p> : null}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">클럽 소개</label>
                  <textarea value={clubForm.description} onChange={(event) => updateClubField("description", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" rows={2} placeholder="클럽 소개 및 모임 시간 안내" />
                  {clubErrors.description ? <p className="mt-1 text-xs text-red-500">{clubErrors.description}</p> : null}
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">연락처</label>
                    <input value={clubForm.contactPhone} onChange={(event) => updateClubField("contactPhone", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" placeholder="010-0000-0000" />
                    {clubErrors.contactPhone ? <p className="mt-1 text-xs text-red-500">{clubErrors.contactPhone}</p> : null}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">이메일</label>
                    <input value={clubForm.contactEmail} onChange={(event) => updateClubField("contactEmail", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" placeholder="club@example.com" />
                    {clubErrors.contactEmail ? <p className="mt-1 text-xs text-red-500">{clubErrors.contactEmail}</p> : null}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm px-4 py-2 text-xs transition">생성 완료</button>
                  <button type="button" onClick={() => { setShowCreateForm(false); setClubForm(initialClubForm); setClubErrors({}); setClubStatus(""); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">취소</button>
                </div>
                {clubStatus ? <p className="text-xs text-emerald-700 font-medium">{clubStatus}</p> : null}
              </form>
            ) : null}

            <div className="mt-4 space-y-3">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => openClub(club)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{club.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{club.address} · {club.city}</p>
                    </div>
                    <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      입장하기 →
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">{club.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <MainBottomNav
          view="clubs"
          selectedClubId={selectedClub?.id || (clubs.length > 0 ? clubs[0].id : "c1")}
          onNavigateHome={() => setView("clubs")}
          onNavigateTab={(tab) => {
            if (clubs.length > 0) {
              setSelectedClub(clubs[0]);
              setActiveTab(tab);
              setView("club");
            }
          }}
          onNavigateAuth={() => setView("auth")}
          loggedInUser={loggedInUser}
        />
      </main>
    );
  }

  if (view === "club" && selectedClub) {
    const clubStats = [
      { title: "전체 멤버", value: clubs.length ? clubs.length : 128, icon: Users, tone: "bg-emerald-50 text-emerald-700" },
      { title: "이번 달 월례회", value: "3회", icon: Trophy, tone: "bg-lime-50 text-lime-800" },
      { title: "공지사항", value: `${notices.length || 8}건`, icon: Bell, tone: "bg-teal-50 text-teal-700" },
      { title: "단체복 공제", value: `${merchandises.length || 4}건`, icon: ShoppingBag, tone: "bg-emerald-50 text-emerald-700" },
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
      <main className="flex-1 bg-slate-50 px-4 py-6 text-slate-900 space-y-5">
        <button
          type="button"
          onClick={goToClubs}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 transition"
        >
          ← 클럽 목록으로 돌아가기
        </button>

        <section className="space-y-5">
          {/* Main Hero Header Card with Emerald-600 & Teal-700 Gradient */}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-teal-800 p-5 text-white shadow-md border border-emerald-500/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  🎾 공식 클럽
                </span>
                <span className="text-xs text-teal-100/80 font-mono">ID: {selectedClub.id.slice(0, 6)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black text-white shadow-inner">
                  {selectedClub.name.slice(0, 1)}
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{selectedClub.name}</h1>
                  <p className="mt-0.5 text-xs text-teal-100/90">{selectedClub.city} · {selectedClub.address}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-100/90 bg-black/10 rounded-xl p-3 backdrop-blur-xs">{selectedClub.description}</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "전체 멤버", value: clubs.length ? clubs.length : 128, icon: Users, tone: "bg-emerald-50 text-emerald-700", href: null },
              { title: "이번 달 월례회", value: "3회", icon: Trophy, tone: "bg-lime-50 text-lime-800", href: null },
              { title: "공지사항", value: `${notices.length || 8}건`, icon: Bell, tone: "bg-teal-50 text-teal-700", href: null },
              { title: "단체복 공제", value: `${merchandises.length || 4}건`, icon: ShoppingBag, tone: "bg-emerald-50 text-emerald-700", href: `/clubs/${selectedClub.id}/merchandise` },
            ].map((item) => (
              <article
                key={item.title}
                onClick={() => item.href && router.push(item.href)}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 ${
                  item.href ? "cursor-pointer" : ""
                }`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">{item.title}</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{item.value}</p>
              </article>
            ))}
          </div>

          {/* Main Dashboard Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">클럽 대시보드</h2>
              <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                실시간 업데이트
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              {[
                { id: "notices", label: "공지사항", icon: Bell },
                { id: "tournament", label: "월례회", icon: Trophy },
                { id: "matches", label: "경기전적", icon: CalendarDays },
                { id: "merch", label: "단체복", icon: ShoppingBag, href: `/clubs/${selectedClub.id}/merchandise` },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.href) {
                        router.push(tab.href);
                      } else {
                        setActiveTab(tab.id as any);
                      }
                    }}
                    className={`inline-flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs transition ${
                      isActive
                        ? "bg-emerald-600 text-white font-semibold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Specific Content */}
          <div className="space-y-4">
            {activeTab === "merch" ? (
              <article className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                      <Shirt className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">단체복 구매 수요조사</h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {merchandises.length}개 진행중
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  클럽 단체복 수요조사에 참여하고 필요한 옵션을 선택해보세요.
                </p>

                {merchandises.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {merchandises.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-200 flex-shrink-0">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400 text-xs">의류</div>}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] font-semibold text-emerald-700">{item.price?.toLocaleString()}원</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          {item.status === "OPEN" ? "수요조사중" : "마감"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href={`/clubs/${selectedClub.id}/merchandise`}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold py-3 text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Shirt className="h-4 w-4" /> 단체복 수요조사 페이지로 이동 <ChevronRight className="h-4 w-4" />
                </Link>
              </article>
            ) : (
              <>
                {/* Notice Section */}
                <article className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      필독 공지
                    </span>
                    <span className="text-xs text-slate-400 font-medium">2026-08-07</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-900">월례회 준비물 및 코트 에티켓 안내</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    이번 주 월례회 참가자는 라켓, 테니스화, 음료수를 지참해 주시고 정시 10분 전 코트에 도착 부탁드립니다.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>작성자: 운영진</span>
                    <span className="text-emerald-600 font-semibold cursor-pointer hover:underline">자세히 보기 →</span>
                  </div>
                </article>

                {/* Upcoming Event Card */}
                <article className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">다음 월례회</span>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{upcomingEvent.title}</h3>
                    </div>
                    <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      {upcomingEvent.day}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> {upcomingEvent.datetime}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-600" /> {upcomingEvent.location}</p>
                  </div>
                  <button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm py-2.5 text-xs transition flex items-center justify-center gap-1.5">
                    <CalendarDays className="h-4 w-4" /> 참가 신청하기
                  </button>
                </article>

                {/* Recent Match Card */}
                <article className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">최근 경기 전적</h3>
                    <span className="bg-lime-100 text-lime-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      {recentMatch.result}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                    스코어: {recentMatch.score}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{recentMatch.summary}</p>
                </article>

                {/* Club Members Card */}
                <article className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-900">신규 가입 멤버</h3>
                    <span className="text-xs text-slate-400">최근 7일</span>
                  </div>
                  <div className="space-y-2">
                    {recentMembers.map((member) => (
                      <div key={member.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {member.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{member.name}</p>
                            <p className="text-[10px] text-slate-400">{member.joined}</p>
                          </div>
                        </div>
                        <button className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition">
                          환영하기
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              </>
            )}
          </div>
        </section>

        <MainBottomNav
          view="club"
          selectedClubId={selectedClub.id}
          activeTab={activeTab}
          onNavigateHome={() => setView("clubs")}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onNavigateAuth={() => setView("auth")}
          loggedInUser={loggedInUser}
        />
      </main>
    );
  }

  /* AUTH VIEW MODE */
  return (
    <main className="flex-1 flex flex-col justify-center px-5 py-8 text-slate-900 space-y-6">
      <section className="space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 bg-lime-100 text-lime-900 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
            🎾 스마트 테니스 동호회 플랫폼
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mt-2">
            Tennis Joa
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            클럽 경기전적, 월례회 대회, 단체복 공제를 손쉽게 스마트하게 관리하세요.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100/90 border border-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrors({});
              setStatus("");
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "login"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
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
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "signup"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            회원가입
          </button>
        </div>

        {status ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 text-xs text-emerald-800 font-medium">
            {status}
          </div>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="아이디를 입력하세요"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm py-3.5 text-sm transition-all mt-2"
            >
              로그인하기
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="홍길동"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="signup-username" className="block text-xs font-semibold text-slate-700">
                아이디
              </label>
              <input
                id="signup-username"
                type="text"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="영문, 숫자 4자 이상"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              {errors.username ? <p className="mt-1 text-xs text-red-500">{errors.username}</p> : null}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700">
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="8자 이상 입력"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password}</p> : null}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm py-3.5 text-sm transition-all mt-2"
            >
              회원가입 완료
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

