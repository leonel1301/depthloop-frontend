export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  authProvider: "jwt" | "firebase";
  role?: "owner" | "member";
  language?: "es" | "en";
};

export type AuthBusiness = {
  id: string;
  name: string;
  activity: string;
  industry: string;
  country: string;
  companySize: string | null;
  legalName?: string | null;
  website?: string | null;
  city?: string | null;
  phone?: string | null;
  description?: string | null;
  logoUrl?: string | null;
};

export type AuthSession = {
  token: string;
  tokenType: string;
  user: AuthUser;
  business: AuthBusiness;
  expiresAt: string;
};

const KEY = "depthloop.session";

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed.user?.id || !parsed.business?.id) return null;
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "DL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
