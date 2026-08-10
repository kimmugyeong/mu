export type AuthUser = {
  id?: string;
  name: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
};

/**
 * localStorage 세션에서 현재 로그인한 유저 정보를 안전하게 읽어옵니다.
 * 세션이 없을 경우 로그인 페이지 유도용 기본 세션을 반환하되, '김현수' 더미 이름으로 덮어씌우지 않습니다.
 */
export function getLoggedInUser(): AuthUser {
  if (typeof window === "undefined") {
    return { name: "회원", username: "user" };
  }

  try {
    const saved = localStorage.getItem("loggedInUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.name || parsed.username)) {
        return {
          id: parsed.id || "u_session",
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

  return { name: "회원", username: "user" };
}
