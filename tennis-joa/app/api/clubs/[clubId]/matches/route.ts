import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;
    const matches = await prisma.matchRecord.findMany({
      where: { clubId },
      orderBy: { matchDate: "desc" },
    });
    return NextResponse.json(matches);
  } catch (e: any) {
    console.error("GET Matches Error:", e);
    return NextResponse.json({ error: e.message || "전적을 불러오는 데 실패했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;
    const body = await request.json();

    // player1Id, player2Id 외래키 제약조건 안전화 처리
    let validP1Id: string | null = null;
    let validP2Id: string | null = null;

    if (body.player1Id) {
      const user = await prisma.user.findUnique({ where: { id: body.player1Id } }).catch(() => null);
      if (user) validP1Id = user.id;
    }
    if (body.player2Id) {
      const user = await prisma.user.findUnique({ where: { id: body.player2Id } }).catch(() => null);
      if (user) validP2Id = user.id;
    }

    // 선수 이름 저장 (player1Name/player2Name을 opponent1Name, opponent2Name처럼 텍스트로 보존)
    const player1NameStr = body.player1Name || body.player1Id || "플레이어1";
    const player2NameStr = body.player2Name || body.player2Id || "플레이어2";

    const record = await prisma.matchRecord.create({
      data: {
        clubId,
        matchType: body.matchType ?? "DOUBLE",
        player1Id: validP1Id,
        player2Id: validP2Id,
        opponent1Name: `${player1NameStr} & ${player2NameStr}`, // 우리팀 선수 이름 보존
        opponent2Name: `${body.opponent1Name ?? "상대1"} & ${body.opponent2Name ?? "상대2"}`, // 상대팀 선수 이름 보존
        score: body.score ?? "6-4",
        isWin: Boolean(body.isWin),
        matchDate: body.matchDate ? new Date(body.matchDate) : new Date(),
      },
    });

    return NextResponse.json(record);
  } catch (e: any) {
    console.error("POST Match Error:", e);
    return NextResponse.json(
      { error: e.message || "경기 전적 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
