import { prisma } from "@/lib/prisma";

/**
 * 기존 유저들의 모든 클럽 소속 데이터(ClubMember)를 일괄 삭제/초기화하는 역마이그레이션 유틸리티.
 * 모든 유저가 '클럽 미가입' 상태에서 신규로 시작하도록 조치합니다.
 */
export async function resetAllClubMemberships() {
  try {
    // 모든 클럽 소속 관계 데이터 일괄 삭제
    const deleted = await prisma.clubMember.deleteMany({});
    console.log(`[Reset Complete] Cleared ${deleted.count} club memberships.`);
    return { success: true, count: deleted.count };
  } catch (e: any) {
    console.error("[Reset Error]:", e);
    return { success: false, error: e.message };
  }
}
