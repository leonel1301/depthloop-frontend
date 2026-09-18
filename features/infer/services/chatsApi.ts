import { readSession } from "@/features/auth/services/sessionStore";
import type { InferThread } from "../models";
import { persistableMessages } from "./chatStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;
  return "No pudimos guardar el historial de chats.";
}

function asThread(row: InferThread): InferThread {
  return {
    id: row.id,
    title: row.title || "Nueva conversación",
    updatedAt: row.updatedAt || Date.now(),
    messages: persistableMessages(row.messages ?? []),
  };
}

export const chatsApi = {
  list: async (): Promise<InferThread[]> => {
    const token = readSession()?.token;
    if (!token) return [];
    const response = await fetch(`${API_URL}/api/chats`, { headers: authHeaders() });
    if (!response.ok) throw new Error(await readError(response));
    const rows = (await response.json()) as InferThread[];
    return rows.map(asThread);
  },
  upsert: async (thread: InferThread): Promise<InferThread> => {
    const token = readSession()?.token;
    if (!token) throw new Error("Inicia sesión para guardar el chat.");
    const payload = {
      id: thread.id,
      title: thread.title,
      updatedAt: thread.updatedAt,
      messages: persistableMessages(thread.messages),
    };
    const response = await fetch(`${API_URL}/api/chats`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readError(response));
    return asThread((await response.json()) as InferThread);
  },
  remove: async (threadId: string): Promise<void> => {
    const token = readSession()?.token;
    if (!token) return;
    const response = await fetch(`${API_URL}/api/chats/${encodeURIComponent(threadId)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!response.ok && response.status !== 204) throw new Error(await readError(response));
  },
};
