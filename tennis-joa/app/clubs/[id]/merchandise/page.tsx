"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { ShoppingBag, PlusCircle, XCircle } from "lucide-react";

type Props = {
  params: { id: string };
};

type Merch = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  colors?: string[];
  sizes?: string[];
};

type Order = {
  id: string;
  merchandiseId: string;
  userId: string;
  selectedColor?: string;
  selectedSize?: string;
  quantity: number;
  status: string;
  createdAt: string;
};

export default function MerchandisePage({ params }: Props) {
  const clubId = params.id;
  const [merches, setMerches] = useState<Merch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Merch | null>(null);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);

  // Admin form
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", imageUrl: "", colors: "", sizes: "" });
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    loadMerches();
    loadOrders();
  }, [clubId]);

  async function loadMerches() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/merchandises`);
      if (!res.ok) return;
      const data = await res.json();
      setMerches(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch(`/api/clubs/${clubId}/orders`);
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data);
    } catch {}
  }

  function openBuyModal(item: Merch) {
    setSelected(item);
    setColor(item.colors && item.colors.length ? item.colors[0] : "");
    setSize(item.sizes && item.sizes.length ? item.sizes[0] : "");
    setQuantity(1);
    setShowModal(true);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result as string);
      setForm((p) => ({ ...p, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function createMerch(e?: React.FormEvent) {
    e?.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price || 0),
      imageUrl: form.imageUrl || null,
      colors: form.colors ? form.colors.split(",").map((s) => s.trim()).filter(Boolean) : [],
      sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };

    try {
      const res = await fetch(`/api/clubs/${clubId}/merchandises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setForm({ name: "", description: "", price: "", imageUrl: "", colors: "", sizes: "" });
        setUploadPreview(null);
        loadMerches();
        setIsAdminMode(false);
      } else {
        console.error("failed to create merch");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function placeOrder() {
    if (!selected) return;
    if (!size || !color) {
      alert("색상과 사이즈를 선택해주세요.");
      return;
    }

    const body = {
      merchandiseId: selected.id,
      selectedColor: color,
      selectedSize: size,
      quantity,
    };

    try {
      const res = await fetch(`/api/clubs/${clubId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        loadOrders();
        alert("구매 신청이 완료되었습니다.");
      } else {
        const r = await res.json();
        alert(r.error || "구매 신청에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b bg-white/60 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ShoppingBag className="h-5 w-5 text-emerald-600" /> 단체복
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAdminMode((v) => !v)} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{isAdminMode ? '관리자 모드' : '관리자 모드'}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">상품 목록</h2>
          <p className="text-sm text-slate-500">총 {merches.length}개</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {merches.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50">
                  {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300">No Image</div>}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{m.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900">{m.price.toLocaleString()}원</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openBuyModal(m)} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">구매 신청</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                <div>색상: {m.colors && m.colors.length ? m.colors.join(", ") : '단일'}</div>
                <div>사이즈: {m.sizes && m.sizes.length ? m.sizes.join(", ") : '단일'}</div>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-8">
          <h3 className="text-lg font-semibold">나의 주문 내역</h3>
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <div className="text-sm text-slate-500">주문 내역이 없습니다.</div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3">
                  <div>
                    <p className="font-semibold text-slate-900">상품: {o.merchandiseId}</p>
                    <p className="text-sm text-slate-500">옵션: {o.selectedColor} / {o.selectedSize} · 수량: {o.quantity}</p>
                  </div>
                  <div className="text-sm text-slate-500">{o.status}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {isAdminMode && (
          <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold">관리자 - 상품 등록</h3>
            <form className="mt-4 space-y-3" onSubmit={createMerch}>
              <div>
                <label className="text-sm text-slate-600">상품명</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-slate-600">설명</label>
                <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-slate-600">가격</label>
                <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} type="number" className="mt-1 w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-slate-600">이미지 URL 또는 업로드</label>
                <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="https://..." />
                <input type="file" accept="image/*" onChange={handleFileInput} className="mt-2" />
                {uploadPreview ? <img src={uploadPreview} alt="preview" className="mt-2 h-24 w-24 rounded-md object-cover" /> : null}
              </div>
              <div>
                <label className="text-sm text-slate-600">색상 (콤마로 구분)</label>
                <input value={form.colors} onChange={(e) => setForm((p) => ({ ...p, colors: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="White, Navy" />
              </div>
              <div>
                <label className="text-sm text-slate-600">사이즈 (콤마로 구분)</label>
                <input value={form.sizes} onChange={(e) => setForm((p) => ({ ...p, sizes: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="95, 100, 105" />
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">등록</button>
              </div>
            </form>
          </section>
        )}
      </main>

      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center">
          <div className="mx-4 mb-6 w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><XCircle className="h-6 w-6" /></button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm text-slate-600">색상</label>
                <select value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">선택</option>
                  {selected.colors && selected.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">사이즈</label>
                <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">선택</option>
                  {selected.sizes && selected.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">수량</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm">취소</button>
              <button onClick={placeOrder} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">구매 신청</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav clubId={clubId} />
    </div>
  );
}
