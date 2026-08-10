import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { migrateExistingUsersToClubs } from "@/lib/migrateMembers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "hyunsoo";

    // 기존 유저 데이터 일괄 마이그레이션 트리거
    await migrateExistingUsersToClubs();

    // 해당 사용자가 가입된 클럽 목록 조회
    const memberships = await prisma.clubMember.findMany({
      where: {
        OR: [
          { userName: username },
          { userName: { contains: username } },
        ],
      },
      select: {
        clubId: true,
        role: true,
        status: true,
      },
    });

    const joinedClubIds = memberships.map((m) => m.clubId);

    // 기본 클럽 c1, c2가 없거나 미포함 시 호환성 유지
    if (joinedClubIds.length === 0) {
      joinedClubIds.push("c1", "c2");
    }

    return NextResponse.json({
      username,
      joinedClubIds: Array.from(new Set(joinedClubIds)),
      memberships,
    });
  } catch (e: any) {
    console.error("GET my-memberships error:", e);
    return NextResponse.json({
      username: "guest",
      joinedClubIds: ["c1", "c2"],
      memberships: [],
    });
  }
}
