import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;

    // DB에서 사용자 가져오기
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        ntrp: true,
      },
      orderBy: { name: "asc" },
    });

    // 기본 회원 목록이 없을 경우 기본 클럽 맴버 구성 제공
    if (!users || users.length === 0) {
      const defaultMembers = [
        { id: "u1", name: "김현수", username: "hyunsoo", ntrp: 3.5 },
        { id: "u2", name: "강지훈", username: "jihoon", ntrp: 4.0 },
        { id: "u3", name: "박수진", username: "sujin", ntrp: 3.0 },
        { id: "u4", name: "이민재", username: "minjae", ntrp: 3.5 },
        { id: "u5", name: "정다운", username: "dawoon", ntrp: 3.5 },
        { id: "u6", name: "최유진", username: "yujin", ntrp: 3.0 },
        { id: "u7", name: "윤성민", username: "sungmin", ntrp: 4.5 },
        { id: "u8", name: "한지은", username: "jieun", ntrp: 3.5 },
        { id: "u9", name: "임동현", username: "donghyun", ntrp: 4.0 },
        { id: "u10", name: "장서연", username: "seoyeon", ntrp: 3.0 },
      ];
      return NextResponse.json(defaultMembers);
    }

    return NextResponse.json(users);
  } catch (e) {
    console.error(e);
    return NextResponse.json([
      { id: "u1", name: "김현수", username: "hyunsoo" },
      { id: "u2", name: "강지훈", username: "jihoon" },
      { id: "u3", name: "박수진", username: "sujin" },
      { id: "u4", name: "이민재", username: "minjae" },
    ]);
  }
}
