const sessionKey = "firesale.session";
const adminKeyStorageKey = "firesale.admin-key";

export type SessionUser = {
  id: string;
  username: string;
};

export function getSessionUser(): SessionUser {
  const stored = window.localStorage.getItem(sessionKey);
  if (stored) {
    return JSON.parse(stored) as SessionUser;
  }

  const generated = {
    id: `guest-${Math.random().toString(36).slice(2, 10)}`,
    username: "Guest Scout"
  };
  window.localStorage.setItem(sessionKey, JSON.stringify(generated));
  return generated;
}

export function updateSessionUsername(username: string) {
  const trimmed = username.trim();
  if (!trimmed) {
    return getSessionUser();
  }

  const nextUser = { ...getSessionUser(), username: trimmed };
  window.localStorage.setItem(sessionKey, JSON.stringify(nextUser));
  return nextUser;
}

export function getAdminKey() {
  return window.localStorage.getItem(adminKeyStorageKey) || "";
}

export function setAdminKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    window.localStorage.removeItem(adminKeyStorageKey);
    return "";
  }

  window.localStorage.setItem(adminKeyStorageKey, trimmed);
  return trimmed;
}

export function clearAdminKey() {
  window.localStorage.removeItem(adminKeyStorageKey);
}
