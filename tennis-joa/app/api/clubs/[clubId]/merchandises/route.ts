import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  try {
    const merchandises = await prisma.merchandise.findMany({
      where: { clubId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(merchandises);
  } catch (error) {
    console.error("GET merchandises error:", error);
    return NextResponse.json({ error: "Failed to fetch merchandises" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  try {
    const body = await request.json();
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ error: "상품명과 가격은 필수 입력 항목입니다." }, { status: 400 });
    }

    const merchandise = await prisma.merchandise.create({
      data: {
        clubId,
        name: body.name,
        description: body.description || null,
        price: Number(body.price),
        imageUrl: body.imageUrl || null,
        colors: Array.isArray(body.colors) ? body.colors : [],
        sizes: Array.isArray(body.sizes) ? body.sizes : [],
        status: body.status || "OPEN",
      },
      include: {
        orders: true,
      },
    });
    return NextResponse.json(merchandise);
  } catch (error) {
    console.error("POST merchandise error:", error);
    return NextResponse.json({ error: "Failed to create merchandise" }, { status: 500 });
  }
}
