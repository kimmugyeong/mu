"use client";

import { useState } from "react";

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
  location: string;
  members: string;
  description: string;
  tag: string;
};

const initialForm: FormState = {
  name: "",
  username: "",
  password: "",
};

const featuredClubs: Club[] = [
  {
    id: "sunrise",
    name: "선라이즈 테니스 클럽",
    location: "강남구",
    members: "128명",
    description: "주말 아침 연습과 친목 모임이 활발한 클럽입니다.",
    tag: "주말 러닝",
  },
  {
    id: "park",
    name: "공원 테니스 모임",
    location: "송파구",
    members: "84명",
    description: "초보자도 쉽게 참가할 수 있는 편한 분위기입니다.",
    tag: "초보 환영",
  },
];

const joinedClubs: Club[] = [
  {
    id: "royal",
    name: "로얄 테니스 스쿨",
    location: "서초구",
    members: "54명",
    description: "주 3회 코트 훈련과 경기 지원이 잘 되어 있습니다.",
    tag: "실전 중심",
  },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [view, setView] = useState<ViewMode>("auth");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; username: string } | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

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
              <span className="text-sm text-teal-600">추천 클럽</span>
            </div>
            <div className="mt-4 space-y-3">
              {featuredClubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => openClub(club)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{club.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{club.location} · {club.members}</p>
                    </div>
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
                      {club.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{club.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">현재 가입된 클럽</h2>
              <span className="text-sm text-gray-400">2개</span>
            </div>
            <div className="mt-4 space-y-3">
              {joinedClubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => openClub(club)}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{club.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{club.location} · {club.members}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      가입됨
                    </span>
                  </div>
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
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-700">{selectedClub.location}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{selectedClub.members}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{selectedClub.tag}</span>
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
