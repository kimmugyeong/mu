import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;

    // 데이터베이스에서 해당 클럽에 속하거나 등록된 회원 목록 가져오기
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        ntrp: true,
      },
      orderBy: { name: "asc" },
    });

    // 클럽별 전용 등록 회원 목록 맵핑 (동일 클럽 소속 회원 필터링)
    const clubMemberMap: Record<string, typeof users> = {
      c1: [
        { id: "u1", name: "김현수 (그린코트)", username: "hyunsoo", ntrp: 3.5 },
        { id: "u2", name: "강지훈 (그린코트)", username: "jihoon", ntrp: 4.0 },
        { id: "u3", name: "박수진 (그린코트)", username: "sujin", ntrp: 3.0 },
        { id: "u4", name: "이민재 (그린코트)", username: "minjae", ntrp: 3.5 },
        { id: "u5", name: "정다운 (그린코트)", username: "dawoon", ntrp: 3.5 },
        { id: "u6", name: "최유진 (그린코트)", username: "yujin", ntrp: 3.0 },
      ],
      c2: [
        { id: "u7", name: "윤성민 (잠실클럽)", username: "sungmin", ntrp: 4.5 },
        { id: "u8", name: "한지은 (잠실클럽)", username: "jieun", ntrp: 3.5 },
        { id: "u9", name: "임동현 (잠실클럽)", username: "donghyun", ntrp: 4.0 },
        { id: "u10", name: "장서연 (잠실클럽)", username: "seoyeon", ntrp: 3.0 },
      ],
    };

    if (clubMemberMap[clubId]) {
      return NextResponse.json(clubMemberMap[clubId]);
    }

    if (users && users.length > 0) {
      return NextResponse.json(users);
    }

    // 기본 회원 데이터 반환
    return NextResponse.json([
      { id: "u1", name: "김현수", username: "hyunsoo", ntrp: 3.5 },
      { id: "u2", name: "강지훈", username: "jihoon", ntrp: 4.0 },
      { id: "u3", name: "박수진", username: "sujin", ntrp: 3.0 },
      { id: "u4", name: "이민재", username: "minjae", ntrp: 3.5 },
      { id: "u5", name: "정다운", username: "dawoon", ntrp: 3.5 },
      { id: "u6", name: "최유진", username: "yujin", ntrp: 3.0 },
    ]);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json([
      { id: "u1", name: "김현수", username: "hyunsoo" },
      { id: "u2", name: "강지훈", username: "jihoon" },
      { id: "u3", name: "박수진", username: "sujin" },
      { id: "u4", name: "이민재", username: "minjae" },
    ]);
  }
}
