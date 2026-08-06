import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const matches = await prisma.matchRecord.findMany({
    where: { clubId },
    orderBy: { matchDate: "desc" },
  });
  return NextResponse.json(matches);
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const body = await request.json();
  const record = await prisma.matchRecord.create({
    data: {
      clubId,
      matchType: body.matchType ?? "DOUBLE",
      player1Id: body.player1Id ?? null,
      player2Id: body.player2Id ?? null,
      opponent1Name: body.opponent1Name ?? null,
      opponent2Name: body.opponent2Name ?? null,
      score: body.score ?? null,
      isWin: Boolean(body.isWin),
      matchDate: body.matchDate ? new Date(body.matchDate) : new Date(),
    },
  });
  return NextResponse.json(record);
}
