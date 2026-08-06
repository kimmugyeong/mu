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
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; username: string } | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clubForm, setClubForm] = useState<ClubFormState>(initialClubForm);
  const [clubErrors, setClubErrors] = useState<Partial<Record<keyof ClubFormState, string>>>({});
  const [clubStatus, setClubStatus] = useState("");

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

      setLoggedInUser({ name: result.user.name, username: result.user.username });
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
              <button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="rounded-full bg-teal-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                {showCreateForm ? "닫기" : "클럽 생성"}
              </button>
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
            <h2 className="text-lg font-semibold">오늘의 일정</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• 오후 6:30 · 자유연습</li>
              <li>• 오후 8:00 · 클럽 미팅</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">최근 소식</h2>
            <p className="mt-2 text-sm text-gray-600">이번 주말에 코트 예약이 열렸습니다. 참여해 보세요.</p>
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
