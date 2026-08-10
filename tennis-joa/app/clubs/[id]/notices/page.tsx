"use client";

import { useEffect, useState, use } from "react";
import BottomNav from "@/components/BottomNav";
import { getLoggedInUser } from "@/lib/authSession";
import {
  Bell,
  PlusCircle,
  Pin,
  CheckCircle2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Trash2,
  AlertCircle
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type Notice = {
  id: string;
  clubId: string;
  authorId?: string | null;
  authorName?: string | null;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
};

export default function NoticesPage({ params }: Props) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "IMPORTANT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Admin state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadNotices();
  }, [clubId]);

  async function loadNotices() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/notices`);
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("공지사항 제목과 내용을 작성해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const authorUser = getLoggedInUser();
    try {
      const res = await fetch(`/api/clubs/${clubId}/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isImportant,
          authorName: authorUser.name,
        }),
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        setIsImportant(false);
        setShowCreateModal(false);
        loadNotices();
      } else {
        alert("공지 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredNotices = notices
    .filter((n) => (filter === "IMPORTANT" ? n.isImportant : true))
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const importantCount = notices.filter((n) => n.isImportant).length;

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen pb-24">
      {/* Header Banner */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                클럽 공지사항
                <span className="text-[10px] bg-lime-100 text-lime-900 font-extrabold px-2 py-0.5 rounded-full">
                  NOTICE
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">클럽의 중요 일정 및 공지를 안내합니다</p>
            </div>
          </div>

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
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md sm:max-w-lg mx-auto">
        {/* Status Summary Card */}
        <section className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 rounded-2xl p-4 text-white shadow-md border border-emerald-600/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-white/20 text-lime-300 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                <Sparkles className="h-3 w-3" /> 동호회 소식함
              </div>
              <h2 className="text-lg font-extrabold">최신 공지를 확인하세요</h2>
              <p className="text-xs text-emerald-100/90">
                필독 공지 {importantCount}건 포함 · 총 {notices.length}건 등록됨
              </p>
            </div>
            {isAdminMode && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" /> 공지 작성
              </button>
            )}
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="공지 제목 또는 내용 검색..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                filter === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              전체 공지 ({notices.length})
            </button>
            <button
              onClick={() => setFilter("IMPORTANT")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                filter === "IMPORTANT"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Pin className="h-3.5 w-3.5" /> 필독 공지 ({importantCount})
            </button>
          </div>
        </section>

        {/* Notices List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">공지사항을 불러오는 중...</div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-2 shadow-2xs">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">등록된 공지사항이 없습니다.</p>
            <p className="text-xs text-slate-400">새로운 모임 소식이 등록되면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <section className="space-y-3">
            {filteredNotices.map((item) => {
              const isExpanded = expandedId === item.id;
              const formattedDate = new Date(item.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <article
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    item.isImportant
                      ? "border-amber-300/80 shadow-sm ring-1 ring-amber-100"
                      : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.isImportant && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300/60">
                            <Pin className="h-3 w-3 text-amber-600" /> 필독
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formattedDate}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                        {item.content}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> 작성자: {item.authorName || "운영진"}
                        </span>
                        <span className="text-emerald-700 font-semibold">테니스 좋아 공식 공지</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Modal for Creating Notice */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Bell className="h-4 w-4" /> 신규 공지사항 등록
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">공지 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 8월 월례회 코트 및 파트너 안내"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">공지 내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="공지할 상세 내용을 입력하세요..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="isImportantCheck"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="h-4 w-4 accent-amber-600 rounded"
                />
                <label htmlFor="isImportantCheck" className="text-xs font-bold text-amber-900 cursor-pointer flex items-center gap-1">
                  <Pin className="h-3.5 w-3.5 text-amber-600" /> 필독 공지사항으로 등록
                </label>
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
                  {isSubmitting ? "등록 중..." : "공지 등록하기"}
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
