import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const orders = await prisma.merchandiseOrder.findMany({
    where: { merchandise: { clubId } },
    include: { merchandise: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const body = await request.json();
  const order = await prisma.merchandiseOrder.create({
    data: {
      merchandiseId: body.merchandiseId,
      userId: body.userId ?? null,
      selectedColor: body.selectedColor ?? null,
      selectedSize: body.selectedSize ?? null,
      quantity: Number(body.quantity ?? 1),
      status: "PENDING",
    },
  });
  return NextResponse.json(order);
}
