import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  try {
    const orders = await prisma.merchandiseOrder.findMany({
      where: { merchandise: { clubId } },
      include: { merchandise: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const body = await request.json();
    const { merchandiseId, userId, userName, selectedColor, selectedSize, quantity } = body;

    if (!merchandiseId || !userId || !selectedColor || !selectedSize) {
      return NextResponse.json(
        { error: "상품, 사용자 ID, 색상, 사이즈는 필수 항목입니다." },
        { status: 400 }
      );
    }

    // Check merchandise status
    const merch = await prisma.merchandise.findUnique({
      where: { id: merchandiseId },
    });

    if (!merch) {
      return NextResponse.json({ error: "존재하지 않는 상품입니다." }, { status: 404 });
    }

    if (merch.status === "CLOSED") {
      return NextResponse.json(
        { error: "해당 상품의 수요조사가 이미 마감되었습니다." },
        { status: 400 }
      );
    }

    const order = await prisma.merchandiseOrder.create({
      data: {
        merchandiseId,
        userId: String(userId),
        userName: userName ? String(userName) : null,
        selectedColor: String(selectedColor),
        selectedSize: String(selectedSize),
        quantity: Number(quantity ?? 1),
      },
      include: {
        merchandise: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: "신청 접수 중 오류가 발생했습니다." }, { status: 500 });
  }
}
