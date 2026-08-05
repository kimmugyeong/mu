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

export function authenticateUser(email, password) {
  const users = getStoredUsers();
  return users.find((user) => user.email === email && user.password === password) || null;
}

export function validateSignupInput(values) {
  const errors = {};
  const normalizedEmail = values.email.trim().toLowerCase();

  if (!values.name.trim()) {
    errors.name = "이름을 입력해주세요.";
  }

  if (!values.email.trim()) {
    errors.email = "이메일을 입력해주세요.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "올바른 이메일 형식이 아닙니다.";
  } else {
    const existingUsers = getStoredUsers();
    const isDuplicate = existingUsers.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );

    if (isDuplicate) {
      errors.email = "이미 등록된 이메일입니다.";
    }
  }

  if (!values.password) {
    errors.password = "비밀번호를 입력해주세요.";
  } else if (values.password.length < 8) {
    errors.password = "비밀번호는 8자리 이상이어야 합니다.";
  }

  if (values.ntrp === "") {
    errors.ntrp = "실력 지수를 입력해주세요.";
  } else {
    const ntrp = Number(values.ntrp);
    if (Number.isNaN(ntrp) || ntrp < 1 || ntrp > 7) {
      errors.ntrp = "실력 지수는 1.0~7.0 사이여야 합니다.";
    }
  }

  return errors;
}
