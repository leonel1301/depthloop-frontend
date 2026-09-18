import type { AuthSession } from "./sessionStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  activity: string;
  industry: string;
  country: string;
  companySize?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type BusinessUpdatePayload = {
  name?: string;
  legalName?: string | null;
  activity?: string;
  industry?: string;
  country?: string;
  companySize?: string | null;
  website?: string | null;
  city?: string | null;
  phone?: string | null;
  description?: string | null;
  logoUrl?: string | null;
};

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : ""))
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  return "No pudimos completar la operación.";
}

async function request(path: string, init?: RequestInit): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
  }
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<AuthSession>;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: (token: string) =>
    request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  updateBusiness: (token: string, payload: BusinessUpdatePayload) =>
    request("/api/auth/business", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
};
