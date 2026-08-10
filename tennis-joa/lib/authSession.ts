export type AuthUser = {
  id?: string;
  name: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
};

/**
 * localStorage 세션에서 현재 로그인한 유저 정보를 안전하게 읽어옵니다.
 * 세션 데이터가 유효할 경우 실제 회원 프로필을 반환하고,
 * 세션이 없을 경우에도 하드코딩 더미 닉네임(예: '김현수')으로 덮어씌우지 않고 안전 폴백 프로필을 반환합니다.
 */
export function getLoggedInUser(): AuthUser {
  if (typeof window === "undefined") {
    return { id: "u_guest", name: "회원", username: "user" };
  }

  try {
    const saved = localStorage.getItem("loggedInUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.name || parsed.username)) {
        return {
          id: parsed.id || parsed.username || "u_session",
          name: parsed.name || parsed.username,
          username: parsed.username || "user",
          email: parsed.email || "",
          isAdmin: Boolean(parsed.isAdmin),
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse loggedInUser session:", e);
  }

  return { id: "u_guest", name: "회원", username: "user" };
}
