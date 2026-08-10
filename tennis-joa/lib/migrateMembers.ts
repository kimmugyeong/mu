import { prisma } from "@/lib/prisma";

/**
 * 기존 등록된 모든 유저(User) 데이터를 기존 생성된 모든 클럽(Club)에 기본 소속(가입)된 상태로 
 * 일괄 마이그레이션 및 초기화하는 서버 사이드 유틸리티
 */
export async function migrateExistingUsersToClubs() {
  try {
    const users = await prisma.user.findMany();
    const clubs = await prisma.club.findMany();

    if (users.length === 0 || clubs.length === 0) {
      return { message: "마이그레이션할 유저 또는 클럽이 없습니다." };
    }

    const memberData: { clubId: string; userId: string; userName: string; role: string; status: string }[] = [];

    for (const club of clubs) {
      for (let i = 0; i < users.length; i += 1) {
        const user = users[i];
        const role = i === 0 ? "OWNER" : i === 1 ? "MANAGER" : "MEMBER";
        memberData.push({
          clubId: club.id,
          userId: user.id,
          userName: user.name || user.username,
          role,
          status: "APPROVED",
        });
      }
    }

    // 중복 무시 생성
    await prisma.clubMember.createMany({
      data: memberData,
      skipDuplicates: true,
    });

    console.log(`[Migration Complete] Total ${memberData.length} memberships migrated.`);
    return { success: true, count: memberData.length };
  } catch (e: any) {
    console.error("[Migration Error]:", e);
    return { success: false, error: e.message };
  }
}
