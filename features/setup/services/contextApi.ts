import { readSession } from "@/features/auth/services/sessionStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type BusinessHoliday = {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
};

export type BusinessNote = {
  id: string;
  title: string;
  category: string;
  detail: string;
};

export type BusinessContext = {
  holidays: BusinessHoliday[];
  notes: BusinessNote[];
};

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return "No pudimos guardar el contexto del negocio.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readSession()?.token;
  if (!token) throw new Error("Inicia sesión para guardar el contexto.");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  } catch {
    throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<T>;
}

export const contextApi = {
  load: () => request<BusinessContext>("/api/business/context"),
  addHoliday: (payload: { name: string; date: string; recurring: boolean }) =>
    request<BusinessHoliday>("/api/business/context/holidays", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeHoliday: (id: string) =>
    request<void>(`/api/business/context/holidays/${encodeURIComponent(id)}`, { method: "DELETE" }),
  addNote: (payload: { title: string; category: string; detail: string }) =>
    request<BusinessNote>("/api/business/context/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeNote: (id: string) =>
    request<void>(`/api/business/context/notes/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
