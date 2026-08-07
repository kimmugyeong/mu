"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  Settings2,
  Share2,
  ShoppingBag,
  Trophy,
  Users,
  UserPlus,
} from "lucide-react";

type ClubPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const tabs = [
  { id: "overview", label: "전체보기", icon: ClipboardList },
  { id: "notice", label: "공지사항", icon: Bell },
  { id: "tournament", label: "월례회", icon: Trophy },
  { id: "matches", label: "경기전적", icon: CalendarDays },
  { id: "merch", label: "단체복", icon: ShoppingBag, href: "/merchandise" },
];

export default function ClubPage({ params }: ClubPageProps) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const club = {
    name: "Green Court Tennis Club",
    subtitle: "서울 강남권 최고의 스포츠 커뮤니티",
    members: 128,
    monthlyRounds: 3,
    notices: 8,
    merchCount: 4,
    manager: "김현수",
    description:
      "매주 새벽과 주말에 모여 실력을 쌓는 프리미엄 테니스 클럽. 초보부터 중급까지 모두 환영합니다.",
    venue: "잠실 실내 코트",
    chatLink: "https://chat.example.com/green-court",
    rules: [
      "매너를 준수하며 경기를 진행합니다.",
      "라켓과 용품은 개인 책임으로 관리합니다.",
      "정시에 도착하여 러닝 시간을 준수합니다.",
    ],
    newMembers: [
      { name: "강지훈", joined: "2일 전" },
      { name: "박수진", joined: "5일 전" },
      { name: "이민재", joined: "1주일 전" },
      { name: "정다운", joined: "1주일 전" },
    ],
    notice: {
      title: "주말 대회 참가비 및 준비물 안내",
      date: "2026년 8월 10일",
      excerpt: "이번 주 토요일 월례회 전 참석자들은 운동화와 물, 개인 라켓을 꼭 준비해 주세요.",
    },
    event: {
      title: "8월 월례회 대회",
      day: "D-5",
      datetime: "8월 12일 토요일 · 14:00",
      location: "잠실 인도어 코트 A홀",
    },
    recentMatch: {
      result: "승 3 / 패 1",
      score: "6-3, 4-6, 10-8",
      summary: "이번 달 가장 치열한 복식 경기로 역전승을 거두었습니다.",
    },
  };

  return (
    <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-800 shadow-xl shadow-slate-900/10">
        <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.12),_transparent)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-tight shadow-sm backdrop-blur">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                  <Users className="h-5 w-5" />
                </span>
                <span>클럽 ID: {clubId}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl font-black text-white shadow-lg shadow-slate-900/20">
                  G
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{club.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-100 sm:text-base">{club.subtitle}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200">회원수</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{club.members}</p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200">이번 달</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{club.monthlyRounds}회</p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200">관리자</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{club.manager}</p>
                </div>
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur sm:p-8">
              <div className="flex items-center justify-between gap-3 text-slate-100">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-200">클럽 소개</p>
                  <p className="mt-3 text-base leading-7 text-slate-100">{club.description}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  <Settings2 className="h-4 w-4" /> 클럽 설정
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  <Share2 className="h-4 w-4" /> 링크 복사
                </button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-100">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 font-semibold text-white shadow-sm">
                  <Users className="h-4 w-4" /> {club.members}명의 멤버
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 font-semibold text-white shadow-sm">
                  <UserPlus className="h-4 w-4" /> 신규 가입자 {club.newMembers.length}명
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "전체 멤버",
            value: club.members,
            icon: Users,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            title: "이번 달 월례회",
            value: `${club.monthlyRounds}회`,
            icon: Trophy,
            tone: "bg-teal-50 text-teal-700",
          },
          {
            title: "공지사항",
            value: `${club.notices}건`,
            icon: Bell,
            tone: "bg-slate-50 text-slate-700",
          },
          {
            title: "단체복 공제",
            value: `${club.merchCount}건`,
            icon: ShoppingBag,
            tone: "bg-cyan-50 text-cyan-700",
            href: `/clubs/${clubId}/merchandise`,
          },
        ].map((item) => (
          <article
            key={item.title}
            onClick={() => item.href && router.push(item.href)}
            className={`group rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              item.href ? "cursor-pointer" : ""
            }`}
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${item.tone}`}>
              <item.icon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm text-slate-500">{item.title}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">메인 탭</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">클럽 대시보드</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === "merch") {
                      router.push(`/clubs/${clubId}/merchandise`);
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-transparent bg-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">최신 필독 공지</p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{club.notice.title}</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> 필독
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{club.notice.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
              <span>발행일: {club.notice.date}</span>
              <span className="rounded-2xl bg-slate-100 px-3 py-2">클럽 공지</span>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">다가오는 일정</p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{club.event.title}</h3>
              </div>
              <span className="rounded-3xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">{club.event.day}</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">일시</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{club.event.datetime}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">장소</p>
                <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-teal-600" /> {club.event.location}
                </p>
              </div>
            </div>
            <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              <CalendarDays className="h-4 w-4" /> 참가 신청
            </button>
          </article>

          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">최근 경기 결과</p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{club.recentMatch.result}</h3>
              </div>
              <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{club.recentMatch.score}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{club.recentMatch.summary}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <MessageCircle className="h-4 w-4 text-slate-400" /> 4일 전 경기
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <Users className="h-4 w-4 text-slate-400" /> 5명 참가
              </span>
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">클럽 정보</p>
                <h3 className="mt-3 text-lg font-bold text-slate-900">매너 수칙</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">클럽 추천</span>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <p className="inline-flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-teal-600" /> 코트 위치: {club.venue}
              </p>
              <p className="inline-flex items-center gap-2 text-slate-700">
                <MessageCircle className="h-4 w-4 text-teal-600" /> 단톡방: <a href={club.chatLink} className="font-semibold text-teal-700 hover:underline">바로가기</a>
              </p>
            </div>
            <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              {club.rules.map((rule) => (
                <p key={rule} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  {rule}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">신규 회원</p>
                <h3 className="mt-3 text-lg font-bold text-slate-900">최근 가입자</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">최근 7일</span>
            </div>
            <div className="mt-6 space-y-4">
              {club.newMembers.map((member) => (
                <div key={member.name} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      {member.name.slice(0, 1)}
                    </div>
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
          </div>
        </aside>
      </section>
    </main>
  );
}
