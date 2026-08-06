import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const merchandises = await prisma.merchandise.findMany({ where: { clubId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(merchandises);
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const body = await request.json();
  const merchandise = await prisma.merchandise.create({
    data: {
      clubId,
      name: body.name,
      description: body.description,
      price: Number(body.price),
      imageUrl: body.imageUrl,
      sizes: body.sizes ?? [],
    },
  });
  return NextResponse.json(merchandise);
}
