"use client";

import { useEffect, useState } from "react";
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
    return (
      <main className="flex-1 bg-gray-50 px-5 py-6 text-gray-900">
        <section className="space-y-4">
          <button
            type="button"
            onClick={goToClubs}
            className="text-sm font-medium text-teal-700"
          >
            ← 클럽 목록으로
          </button>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-teal-600">클럽 메인</p>
            <h1 className="mt-2 text-2xl font-semibold">{selectedClub.name}</h1>
            <p className="mt-2 text-sm text-gray-600">{selectedClub.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-700">{selectedClub.address}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{selectedClub.city}</span>
              {selectedClub.contactPhone ? <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{selectedClub.contactPhone}</span> : null}
              {selectedClub.contactEmail ? <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{selectedClub.contactEmail}</span> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {([['notices','공지사항'], ['merch','단체복'], ['matches','경기전적'], ['tournaments','월례회']] as const).map(([key,label]) => (
                <button key={key} type="button" onClick={() => setActiveTab(key)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${activeTab === key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'notices' ? (
              <div className="mt-4 space-y-3">
                {loggedInUser?.isAdmin ? (
                  <form onSubmit={handleCreateNotice} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <input value={noticeForm.title} onChange={(event) => setNoticeForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="공지 제목" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                    <textarea value={noticeForm.content} onChange={(event) => setNoticeForm((prev) => ({ ...prev, content: event.target.value }))} placeholder="공지 내용을 입력하세요" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" rows={3} />
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={noticeForm.isImportant} onChange={(event) => setNoticeForm((prev) => ({ ...prev, isImportant: event.target.checked }))} /> 필독 공지</label>
                    <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">공지 등록</button>
                  </form>
                ) : null}
                {notices.map((notice) => (
                  <div key={notice.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                      {notice.isImportant ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">필독</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{notice.content}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === 'merch' ? (
              <div className="mt-4 space-y-3">
                {loggedInUser?.isAdmin ? (
                  <form onSubmit={handleCreateMerch} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <input value={merchForm.name} onChange={(event) => setMerchForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="상품명" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                    <input value={merchForm.price} onChange={(event) => setMerchForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="가격" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                    <input value={merchForm.sizes} onChange={(event) => setMerchForm((prev) => ({ ...prev, sizes: event.target.value }))} placeholder="사이즈(예: S,M,L)" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                    <textarea value={merchForm.description} onChange={(event) => setMerchForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="설명" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" rows={2} />
                    <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">상품 등록</button>
                  </form>
                ) : null}
                {merchandises.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <span className="text-sm font-medium text-teal-700">{item.price.toLocaleString()}원</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    <p className="mt-2 text-sm text-gray-500">사이즈: {item.sizes?.join(', ')}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === 'matches' ? (
              <div className="mt-4 space-y-3">
                <form onSubmit={handleCreateMatch} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <input value={matchForm.opponent1Name} onChange={(event) => setMatchForm((prev) => ({ ...prev, opponent1Name: event.target.value }))} placeholder="상대 1" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  <input value={matchForm.opponent2Name} onChange={(event) => setMatchForm((prev) => ({ ...prev, opponent2Name: event.target.value }))} placeholder="상대 2" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  <input value={matchForm.score} onChange={(event) => setMatchForm((prev) => ({ ...prev, score: event.target.value }))} placeholder="세트 스코어" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={matchForm.isWin} onChange={(event) => setMatchForm((prev) => ({ ...prev, isWin: event.target.checked }))} /> 승리</label>
                  <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">경기 결과 등록</button>
                </form>
                {matches.map((match) => (
                  <div key={match.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>{match.matchType}</span>
                      <span>{match.isWin ? '승' : '패'}</span>
                    </div>
                    <p className="mt-2">대전: {match.opponent1Name} / {match.opponent2Name}</p>
                    <p className="mt-1">점수: {match.score}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === 'tournaments' ? (
              <div className="mt-4 space-y-3">
                <form onSubmit={handleCreateTournament} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <input value={tournamentForm.title} onChange={(event) => setTournamentForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="대회 제목" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  <input type="date" value={tournamentForm.eventDate} onChange={(event) => setTournamentForm((prev) => ({ ...prev, eventDate: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  <input value={tournamentForm.players} onChange={(event) => setTournamentForm((prev) => ({ ...prev, players: event.target.value }))} placeholder="참가자 이름(쉼표로 구분)" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                  <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">대회 생성</button>
                </form>
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">{tournament.title}</p>
                    <p className="mt-1">일시: {tournament.eventDate}</p>
                    <p className="mt-1">상태: {tournament.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
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
