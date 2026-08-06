"use client";

import { useState } from "react";
import { authenticateUser, saveUser, validateSignupInput } from "@/lib/auth";

type Mode = "login" | "signup";

type FormState = {
  name: string;
  username: string;
  password: string;
};

const initialForm: FormState = {
  name: "",
  username: "",
  password: "",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; email: string } | null>(null);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const user = authenticateUser(form.username.trim().toLowerCase(), form.password);
    if (user) {
      setLoggedInUser({ name: user.name, email: user.username });
      setStatus(`${user.name}님, 환영합니다.`);
      setForm((prev) => ({ ...prev, password: "" }));
      return;
    }

    setStatus("아이디 또는 비밀번호가 올바르지 않습니다.");
  };

  const handleSignup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSignupInput(form) as Partial<Record<keyof FormState, string>>;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("");
      return;
    }

    saveUser({
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      password: form.password,
    });

    setStatus("회원가입이 완료되었습니다. 이제 로그인해 주세요.");
    setErrors({});
    setForm(initialForm);
    setMode("login");
  };

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

        {loggedInUser ? (
          <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5 text-sm text-teal-700 shadow-sm">
            <p className="font-semibold">{loggedInUser.name}님, 로그인되었습니다.</p>
            <p className="mt-1">아이디: {loggedInUser.email}</p>
          </div>
        ) : null}

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
