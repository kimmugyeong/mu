export type AuthUser = {
  id?: string;
  name: string;
  username: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
};

/**
 * localStorage 세션에서 현재 로그인한 유저의 프로필을 읽어옵니다.
 * 비로그인 유저인 경우 isAdmin: false, role: 'USER'인 비권한 객체를 반환합니다.
 */
export function getLoggedInUser(): AuthUser {
  if (typeof window === "undefined") {
    return { id: "", name: "방문자", username: "", role: "USER", isAdmin: false };
  }

  try {
    const saved = localStorage.getItem("loggedInUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.name || parsed.username)) {
        const actualName = parsed.name || parsed.username;
        const username = parsed.username || actualName;
        const role = parsed.role || (username === "admin" ? "admin" : "user");
        const isAdmin = Boolean(parsed.isAdmin || role === "admin" || username === "admin");
        return {
          id: parsed.id || username || "u_session",
          name: actualName,
          username,
          email: parsed.email || "",
          role,
          isAdmin,
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse loggedInUser session:", e);
  }

  return { id: "", name: "방문자", username: "", role: "USER", isAdmin: false };
}

/**
 * user.role(또는 user.isAdmin)과 id가 'admin'인 유저만 관리자 권한을 가졌는지 확인하는 유틸리티
 */
export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const hasAdminRole = user.role?.toLowerCase() === "admin" || user.isAdmin === true;
  const hasAdminId = user.id === "admin" || user.username === "admin" || user.id === "u_admin";
  return Boolean(hasAdminRole && hasAdminId);
}

