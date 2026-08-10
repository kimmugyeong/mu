import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 클럽원 목록 조회
export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;

    const dbMembers = await prisma.clubMember.findMany({
      where: { clubId },
      orderBy: [
        { role: "asc" }, // OWNER -> MANAGER -> MEMBER
        { joinedAt: "asc" },
      ],
    });

    if (dbMembers.length > 0) {
      return NextResponse.json(dbMembers);
    }

    // 초기 시드 회원 목록 (데이터가 없을 시 자동 생성)
    const initialMembers = [
      { id: "cm1", clubId, userName: "김현수", role: "OWNER", status: "APPROVED", joinedAt: new Date("2026-01-15") },
      { id: "cm2", clubId, userName: "강지훈", role: "MANAGER", status: "APPROVED", joinedAt: new Date("2026-02-01") },
      { id: "cm3", clubId, userName: "박수진", role: "MEMBER", status: "APPROVED", joinedAt: new Date("2026-03-10") },
      { id: "cm4", clubId, userName: "이민재", role: "MEMBER", status: "APPROVED", joinedAt: new Date("2026-04-12") },
      { id: "cm5", clubId, userName: "정다운", role: "MEMBER", status: "APPROVED", joinedAt: new Date("2026-05-20") },
    ];

    // DB 시드 저장
    try {
      await prisma.clubMember.createMany({
        data: initialMembers.map((m) => ({
          clubId: m.clubId,
          userName: m.userName,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt,
        })),
        skipDuplicates: true,
      });
      const created = await prisma.clubMember.findMany({ where: { clubId } });
      return NextResponse.json(created);
    } catch {
      return NextResponse.json(initialMembers);
    }
  } catch (e: any) {
    console.error("GET Members error:", e);
    return NextResponse.json({ error: e.message || "회원 목록 조회 실패" }, { status: 500 });
  }
}

// POST: 클럽 가입 신청 -> 즉시 자동 승인 (Auto-Approved)
export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;
    const body = await request.json();

    if (!body.userName || !body.userName.trim()) {
      return NextResponse.json({ error: "가입할 회원 이름을 입력해 주세요." }, { status: 400 });
    }

    const userName = body.userName.trim();

    // 이미 가입된 회원이 존재하는지 확인
    const existing = await prisma.clubMember.findFirst({
      where: { clubId, userName },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 해당 클럽의 회원으로 가입되어 있습니다.", member: existing }, { status: 400 });
    }

    // 자동 승인(APPROVED) 상태로 클럽원 즉시 생성
    const newMember = await prisma.clubMember.create({
      data: {
        clubId,
        userName,
        userEmail: body.userEmail || null,
        role: body.role || "MEMBER",
        status: "APPROVED", // 자동 승인
        joinedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "클럽 가입이 자동 승인되었습니다!", member: newMember });
  } catch (e: any) {
    console.error("POST Member Join error:", e);
    return NextResponse.json({ error: e.message || "클럽 가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH: 관리자 권한 위임 / 변경 (MEMBER ↔ MANAGER)
export async function PATCH(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const { clubId } = await params;
    const body = await request.json();

    if (!body.memberId || !body.nextRole) {
      return NextResponse.json({ error: "회원 식별자와 변경할 역할(Role) 정보가 필요합니다." }, { status: 400 });
    }

    const updated = await prisma.clubMember.update({
      where: { id: body.memberId },
      data: { role: body.nextRole },
    });

    return NextResponse.json({ message: "클럽원 권한이 성공적으로 변경되었습니다.", member: updated });
  } catch (e: any) {
    console.error("PATCH Member Role error:", e);
    return NextResponse.json({ error: e.message || "권한 변경 실패" }, { status: 500 });
  }
}

// DELETE: 클럽원 강퇴/삭제
export async function DELETE(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  try {
    const body = await request.json();

    if (!body.memberId) {
      return NextResponse.json({ error: "강퇴할 회원 ID가 필요합니다." }, { status: 400 });
    }

    await prisma.clubMember.delete({
      where: { id: body.memberId },
    });

    return NextResponse.json({ message: "해당 회원이 클럽에서 강퇴/퇴출되었습니다." });
  } catch (e: any) {
    console.error("DELETE Member error:", e);
    return NextResponse.json({ error: e.message || "클럽원 강퇴 처리 실패" }, { status: 500 });
  }
}
