export type AuthUser = {
  id?: string;
  name: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
};

/**
 * localStorage 세션에서 현재 로그인한 유저의 프로필을 읽어옵니다.
 * Admin 계정이나 가입된 회원의 실제 성명(name / username)을 최우선으로 바인딩합니다.
 */
export function getLoggedInUser(): AuthUser {
  if (typeof window === "undefined") {
    return { id: "u_guest", name: "관리자", username: "admin", isAdmin: true };
  }

  try {
    const saved = localStorage.getItem("loggedInUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.name || parsed.username)) {
        const actualName = parsed.name || parsed.username;
        return {
          id: parsed.id || parsed.username || "u_session",
          name: actualName,
          username: parsed.username || actualName,
          email: parsed.email || "",
          isAdmin: Boolean(parsed.isAdmin || parsed.role === "ADMIN" || parsed.username === "admin"),
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse loggedInUser session:", e);
  }

  return { id: "u_admin", name: "관리자", username: "admin", isAdmin: true };
}
