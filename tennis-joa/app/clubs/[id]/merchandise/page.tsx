"use client";

import { useEffect, useState, use } from "react";
import BottomNav from "@/components/BottomNav";
import {
  ShoppingBag,
  PlusCircle,
  XCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Shirt,
  BarChart3,
  Check
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

type Order = {
  id: string;
  merchandiseId: string;
  userId: string;
  userName?: string | null;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  createdAt: string;
};

type Merchandise = {
  id: string;
  clubId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  colors: string[];
  sizes: string[];
  status: "OPEN" | "CLOSED" | string;
  createdAt: string;
  orders?: Order[];
};

export default function MerchandisePage({ params }: Props) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;

  const [merchandises, setMerchandises] = useState<Merchandise[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedMerch, setSelectedMerch] = useState<Merchandise | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedStats, setExpandedStats] = useState<Record<string, boolean>>({});
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    colors: "",
    sizes: "",
  });
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    // Try to prefill user info from localStorage if present
    const savedUser = localStorage.getItem("loggedInUser");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserId(parsed.username || parsed.id || "user_" + Math.floor(Math.random() * 1000));
        setApplicantName(parsed.name || parsed.username || "");
      } catch (e) {
        setUserId("user_guest");
        setApplicantName("익명회원");
      }
    } else {
      setUserId("user_" + Math.floor(Math.random() * 1000));
      setApplicantName("");
    }

    loadMerchandises();
    loadUserOrders();
  }, [clubId]);

  async function loadMerchandises() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/merchandises`);
      if (res.ok) {
        const data = await res.json();
        setMerchandises(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserOrders() {
    try {
      const res = await fetch(`/api/clubs/${clubId}/orders`);
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openApplyModal(item: Merchandise) {
    if (item.status === "CLOSED") {
      alert("해당 상품은 수요 조사가 마감되었습니다.");
      return;
    }
    setSelectedMerch(item);
    setSelectedColor(item.colors && item.colors.length ? item.colors[0] : "");
    setSelectedSize(item.sizes && item.sizes.length ? item.sizes[0] : "");
    setQuantity(1);
    setShowApplyModal(true);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result as string);
      setCreateForm((p) => ({ ...p, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateMerchandise(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.price) {
      alert("상품명과 가격을 입력해 주세요.");
      return;
    }

    const payload = {
      name: createForm.name.trim(),
      description: createForm.description.trim() || null,
      price: Number(createForm.price),
      imageUrl: createForm.imageUrl || null,
      colors: createForm.colors ? createForm.colors.split(",").map((s) => s.trim()).filter(Boolean) : [],
      sizes: createForm.sizes ? createForm.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      status: "OPEN",
    };

    try {
      const res = await fetch(`/api/clubs/${clubId}/merchandises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCreateForm({ name: "", description: "", price: "", imageUrl: "", colors: "", sizes: "" });
        setUploadPreview(null);
        setShowCreateModal(false);
        loadMerchandises();
      } else {
        const err = await res.json();
        alert(err.error || "상품 등록에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  }

  async function toggleStatus(item: Merchandise) {
    const newStatus = item.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const res = await fetch(`/api/clubs/${clubId}/merchandises/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadMerchandises();
      } else {
        alert("상태 변경 실패");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteMerchandise(merchandiseId: string) {
    if (!confirm("정말 이 상품과 관련된 수요조사 데이터를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/merchandises/${merchandiseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadMerchandises();
        loadUserOrders();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function submitApplication() {
    if (!selectedMerch) return;
    if (!selectedColor || !selectedSize) {
      alert("색상과 사이즈를 모두 선택해주세요.");
      return;
    }
    if (!applicantName.trim()) {
      alert("신청자 성함(닉네임)을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      merchandiseId: selectedMerch.id,
      userId: userId || "user_guest",
      userName: applicantName.trim(),
      selectedColor,
      selectedSize,
      quantity,
    };

    try {
      const res = await fetch(`/api/clubs/${clubId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowApplyModal(false);
        loadMerchandises();
        loadUserOrders();
        alert("단체복 수요조사 신청이 완료되었습니다!");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "신청에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("신청 내역을 취소하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadMerchandises();
        loadUserOrders();
      } else {
        alert("취소 실패");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const toggleExpandStats = (id: string) => {
    setExpandedStats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMerchandises = merchandises.filter((item) => {
    if (filterStatus === "OPEN") return item.status === "OPEN";
    if (filterStatus === "CLOSED") return item.status === "CLOSED";
    return true;
  });

  const totalOpenCount = merchandises.filter((m) => m.status === "OPEN").length;
  const totalSubmissions = merchandises.reduce((acc, m) => acc + (m.orders?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top Glass Navigation Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                단체복 수요조사
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  간단 신청
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">결제 없는 수요조사 전용 시스템</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminMode((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                isAdminMode
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {isAdminMode ? "관리자 모드 ON" : "관리자 모드"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Banner Card */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 p-6 text-white shadow-md">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Shirt className="h-3.5 w-3.5 text-emerald-300" /> 2026 Season Official Merchandise
            </div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              클럽 단체복 수요조사 참여하기
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
              원하시는 색상, 사이즈, 수량을 선택하여 부담 없이 신청해 주세요.
              제출된 데이터는 단체 제작 수량 발주 시 활용됩니다.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-center">
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
              <p className="text-[10px] text-emerald-200 font-medium">전체 등록 상품</p>
              <p className="text-lg font-black text-white">{merchandises.length}개</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
              <p className="text-[10px] text-emerald-200 font-medium">진행 중 수요조사</p>
              <p className="text-lg font-black text-lime-300">{totalOpenCount}건</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
              <p className="text-[10px] text-emerald-200 font-medium">총 누적 신청건</p>
              <p className="text-lg font-black text-white">{totalSubmissions}건</p>
            </div>
          </div>
        </section>

        {/* Filter and Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filterStatus === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              전체 ({merchandises.length})
            </button>
            <button
              onClick={() => setFilterStatus("OPEN")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filterStatus === "OPEN" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              수요조사 중 ({totalOpenCount})
            </button>
            <button
              onClick={() => setFilterStatus("CLOSED")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filterStatus === "CLOSED" ? "bg-slate-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              마감 ({merchandises.length - totalOpenCount})
            </button>
          </div>

          {isAdminMode && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <PlusCircle className="h-4 w-4" /> 신규 상품 등록
            </button>
          )}
        </div>

        {/* Merchandise Grid List */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">상품 목록을 불러오는 중입니다...</div>
        ) : filteredMerchandises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Shirt className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">등록된 수요조사 상품이 없습니다.</p>
            <p className="mt-1 text-xs text-slate-400">관리자 모드에서 새로운 단체복 상품을 등록해 보세요.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {filteredMerchandises.map((item) => {
              const ordersCount = item.orders?.length || 0;
              const totalQuantity = item.orders?.reduce((sum, o) => sum + o.quantity, 0) || 0;
              const isOpen = item.status === "OPEN";
              const isExpanded = !!expandedStats[item.id];

              // Calculate option breakdown stats
              const colorStats: Record<string, number> = {};
              const sizeStats: Record<string, number> = {};
              item.orders?.forEach((o) => {
                colorStats[o.selectedColor] = (colorStats[o.selectedColor] || 0) + o.quantity;
                sizeStats[o.selectedSize] = (sizeStats[o.selectedSize] || 0) + o.quantity;
              });

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                    isOpen ? "border-slate-200/80" : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="p-5">
                    {/* Top Status & Price Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          isOpen ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                        />
                        {isOpen ? "수요조사 진행 중" : "수요조사 마감"}
                      </span>

                      {isAdminMode && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleStatus(item)}
                            title={isOpen ? "마감하기" : "다시 열기"}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            {isOpen ? <Lock className="h-4 w-4 text-amber-600" /> : <Unlock className="h-4 w-4 text-emerald-600" />}
                          </button>
                          <button
                            onClick={() => deleteMerchandise(item.id)}
                            title="삭제하기"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Image & Product Info */}
                    <div className="mt-4 flex gap-4">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300">
                            <Shirt className="h-8 w-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{item.name}</h3>
                          {item.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="text-xs text-slate-400 font-medium">예상 가격</span>
                          <p className="text-lg font-black text-emerald-700 tracking-tight">
                            {item.price.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Colors & Sizes Chips */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-600 w-12 flex-shrink-0">색상:</span>
                        {item.colors.length > 0 ? (
                          item.colors.map((c) => (
                            <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">단일 색상</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-600 w-12 flex-shrink-0">사이즈:</span>
                        {item.sizes.length > 0 ? (
                          item.sizes.map((s) => (
                            <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">FREE</span>
                        )}
                      </div>
                    </div>

                    {/* Demand stats summary badge */}
                    <div className="mt-3 rounded-xl bg-slate-100/80 p-2.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Users className="h-4 w-4 text-emerald-600" /> 신청 참여 현황
                      </span>
                      <span>
                        <strong className="text-emerald-700">{ordersCount}명</strong> 참여 ({totalQuantity}개 신청)
                      </span>
                    </div>

                    {/* Expandable Demand Survey Roster / Breakdown for Admin */}
                    {isAdminMode && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleExpandStats(item.id)}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="h-4 w-4 text-slate-500" /> 옵션별 집계 및 신청자 명단
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 rounded-xl bg-slate-50 p-3 space-y-3 text-xs border border-slate-200">
                            <div>
                              <p className="font-bold text-slate-800 mb-1">🎨 색상별 신청 수량</p>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.keys(colorStats).length > 0 ? (
                                  Object.entries(colorStats).map(([color, qty]) => (
                                    <span key={color} className="bg-white border px-2 py-1 rounded-md font-medium text-slate-700">
                                      {color}: <strong>{qty}개</strong>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">신청 내역 없음</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="font-bold text-slate-800 mb-1">📏 사이즈별 신청 수량</p>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.keys(sizeStats).length > 0 ? (
                                  Object.entries(sizeStats).map(([sz, qty]) => (
                                    <span key={sz} className="bg-white border px-2 py-1 rounded-md font-medium text-slate-700">
                                      {sz}: <strong>{qty}개</strong>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">신청 내역 없음</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="font-bold text-slate-800 mb-1">📋 신청자 상세 리스트 ({ordersCount}건)</p>
                              {item.orders && item.orders.length > 0 ? (
                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                  {item.orders.map((o) => (
                                    <div
                                      key={o.id}
                                      className="flex items-center justify-between rounded-lg bg-white p-2 border text-[11px]"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-900">{o.userName || o.userId}</span>
                                        <span className="ml-2 text-slate-500">
                                          ({o.selectedColor} / {o.selectedSize} · {o.quantity}개)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => cancelOrder(o.id)}
                                        className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 text-[11px]">아직 신청자가 없습니다.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Button */}
                  <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3">
                    {isOpen ? (
                      <button
                        onClick={() => openApplyModal(item)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <Shirt className="h-4 w-4" /> 수요조사 신청하기
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                      >
                        <Lock className="h-4 w-4" /> 수요 조사가 마감되었습니다
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* User Submitted Applications Section */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> 나의 단체복 신청 내역
            </h3>
            <span className="text-xs text-slate-400 font-medium">총 {userOrders.length}건</span>
          </div>

          <div className="mt-4 space-y-3">
            {userOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                제출된 단체복 신청 내역이 없습니다.
              </div>
            ) : (
              userOrders.map((ord) => {
                const merchName = (ord as any).merchandise?.name || "단체복 상품";
                const isMerchOpen = (ord as any).merchandise?.status === "OPEN";

                return (
                  <div
                    key={ord.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{merchName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isMerchOpen ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isMerchOpen ? "조사 진행중" : "조사 마감됨"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        신청자: <strong className="text-slate-800">{ord.userName || ord.userId}</strong> · 색상:{" "}
                        <strong className="text-emerald-700">{ord.selectedColor}</strong> · 사이즈:{" "}
                        <strong className="text-emerald-700">{ord.selectedSize}</strong> · 수량:{" "}
                        <strong>{ord.quantity}개</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        신청일시: {new Date(ord.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </div>

                    <button
                      onClick={() => cancelOrder(ord.id)}
                      className="self-end sm:self-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      신청 취소
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Member Application Modal */}
      {showApplyModal && selectedMerch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shirt className="h-5 w-5 text-emerald-600" /> 단체복 수요조사 신청
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Product Card Summary */}
              <div className="rounded-xl bg-slate-50 p-3.5 flex gap-3 border">
                {selectedMerch.imageUrl && (
                  <img
                    src={selectedMerch.imageUrl}
                    alt={selectedMerch.name}
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedMerch.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedMerch.description}</p>
                  <p className="text-sm font-extrabold text-emerald-700 mt-1">
                    예상 가격: {selectedMerch.price.toLocaleString()}원
                  </p>
                </div>
              </div>

              {/* Applicant Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">신청자 성함 / 닉네임 *</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="예: 홍길동 (입금자명과 동일하게 입력)"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Color Selection Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">색상 선택 *</label>
                <div className="flex flex-wrap gap-2">
                  {selectedMerch.colors.length > 0 ? (
                    selectedMerch.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                          selectedColor === c
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {selectedColor === c && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        {c}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">단일 옵션</span>
                  )}
                </div>
              </div>

              {/* Size Selection Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">사이즈 선택 *</label>
                <div className="flex flex-wrap gap-2">
                  {selectedMerch.sizes.length > 0 ? (
                    selectedMerch.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                          selectedSize === s
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {selectedSize === s && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        {s}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">FREE</span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">수량 선택</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-extrabold text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="rounded-xl bg-emerald-50 p-3.5 flex items-center justify-between border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900">예상 총 금액</span>
                <span className="text-base font-black text-emerald-800">
                  {(selectedMerch.price * quantity).toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-6 py-3.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitApplication}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "신청 처리 중..." : "신청서 제출"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Merchandise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600" /> 관리자 - 신규 상품 등록
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateMerchandise} className="px-6 py-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">상품명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 봄 시즌 단체 카라티"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">상품 설명 및 안내사항</label>
                <textarea
                  rows={2}
                  placeholder="예: 기능성 쿨론 소재, 3월 중순 일괄 수령 예정"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">예상 가격 (원) *</label>
                <input
                  type="number"
                  required
                  placeholder="35000"
                  value={createForm.price}
                  onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">이미지 URL 또는 업로드</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="mt-2 text-xs text-slate-500"
                />
                {uploadPreview && (
                  <img src={uploadPreview} alt="preview" className="mt-2 h-20 w-20 rounded-xl object-cover border" />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  선택 가능 색상 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="화이트, 네이비, 블랙"
                  value={createForm.colors}
                  onChange={(e) => setCreateForm((p) => ({ ...p, colors: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  선택 가능 사이즈 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="95(M), 100(L), 105(XL)"
                  value={createForm.sizes}
                  onChange={(e) => setCreateForm((p) => ({ ...p, sizes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav clubId={clubId} />
    </div>
  );
}
