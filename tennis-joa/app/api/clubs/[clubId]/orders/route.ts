import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const orders = await prisma.order.findMany({
    where: { clubId },
    include: { merchandise: true, user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const body = await request.json();
  const order = await prisma.order.create({
    data: {
      clubId,
      userId: body.userId,
      merchandiseId: body.merchandiseId,
      selectedSize: body.selectedSize,
      quantity: Number(body.quantity ?? 1),
      status: "PENDING",
    },
  });
  return NextResponse.json(order);
}
