const sessionKey = "firesale.session";

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
