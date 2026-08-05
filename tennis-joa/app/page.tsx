"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert(`로그인 성공\n이메일: ${email}\n비밀번호: ${password}`);
  };

  return (
    <main className="flex-1 flex flex-col justify-center px-6 py-10 text-gray-900">
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-600">테니스 클럽</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            회원 로그인
          </h1>
          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            클럽 경기, 전적, 매치 정보를 바로 확인하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="rounded-3xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
          <p>처음 방문하셨나요? 클럽 관리자에게 회원 등록을 요청하세요.</p>
        </div>
      </section>
    </main>
  );
}