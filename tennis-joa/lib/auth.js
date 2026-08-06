export const STORAGE_KEY = "tennis-joa-users";

export function getStoredUsers() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUser(user) {
  const users = getStoredUsers();
  const nextUsers = [
    ...users,
    {
      ...user,
      createdAt: new Date().toISOString(),
    },
  ];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUsers));
  }

  return nextUsers;
}

export function authenticateUser(username, password) {
  const users = getStoredUsers();
  return users.find((user) => user.username === username && user.password === password) || null;
}

export function validateSignupInput(values) {
  const errors = {};
  const normalizedUsername = values.username.trim().toLowerCase();

  if (!values.name.trim()) {
    errors.name = "이름을 입력해주세요.";
  }

  if (!values.username.trim()) {
    errors.username = "아이디를 입력해주세요.";
  } else if (!/^[a-z0-9_]{4,20}$/i.test(values.username)) {
    errors.username = "아이디는 4~20자의 영문, 숫자, _만 사용할 수 있습니다.";
  } else {
    const existingUsers = getStoredUsers();
    const isDuplicate = existingUsers.some(
      (user) => user.username.toLowerCase() === normalizedUsername,
    );

    if (isDuplicate) {
      errors.username = "이미 사용 중인 아이디입니다.";
    }
  }

  if (!values.password) {
    errors.password = "비밀번호를 입력해주세요.";
  } else if (values.password.length < 8) {
    errors.password = "비밀번호는 8자리 이상이어야 합니다.";
  }

  return errors;
}
