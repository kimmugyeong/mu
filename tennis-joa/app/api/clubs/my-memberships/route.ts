import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetAllClubMemberships } from "@/lib/migrateMembers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const shouldReset = searchParams.get("reset") === "true";

    // 리셋 요청이 포함된 경우 모든 소속 데이터 일괄 삭제
    if (shouldReset) {
      await resetAllClubMemberships();
    }

    if (!username) {
      return NextResponse.json({ username: null, joinedClubIds: [] });
    }

    // 해당 사용자가 실제로 가입한 클럽 목록 조회
    const memberships = await prisma.clubMember.findMany({
      where: {
        userName: username,
        status: "APPROVED",
      },
      select: {
        clubId: true,
        role: true,
        status: true,
      },
    });

    const joinedClubIds = memberships.map((m) => m.clubId);

    return NextResponse.json({
      username,
      joinedClubIds,
      memberships,
    });
  } catch (e: any) {
    console.error("GET my-memberships error:", e);
    return NextResponse.json({
      username: null,
      joinedClubIds: [],
      memberships: [],
    });
  }
}
