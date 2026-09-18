import type { InferMessage, InferThread } from "../models";

const CHATS_KEY = "depthloop.inferChats";

export function createThreadId() {
  return globalThis.crypto?.randomUUID?.() ?? `chat-${Date.now()}`;
}

export function emptyThread(): InferThread {
  return {
    id: createThreadId(),
    title: "Nueva conversación",
    updatedAt: Date.now(),
    messages: [],
  };
}

export function persistableMessages(messages: InferMessage[]): InferMessage[] {
  return messages
    .filter((message) => !message.pending)
    .map((message) => ({ ...message, pending: undefined }));
}

export function readLocalThreads(): InferThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<InferThread>[];
    return parsed
      .filter((item) => item && typeof item.id === "string")
      .map((item) => ({
        id: item.id as string,
        title: item.title || "Nueva conversación",
        updatedAt: item.updatedAt || Date.now(),
        messages: persistableMessages(item.messages ?? []),
      }))
      .filter((thread) => thread.messages.length > 0);
  } catch {
    return [];
  }
}

export function clearLocalThreads() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHATS_KEY);
}

export function titleFromMessages(messages: InferMessage[]) {
  const first = messages.find((message) => message.role === "user" && message.text.trim());
  if (!first) return "Nueva conversación";
  const text = first.text.trim();
  return text.length > 42 ? `${text.slice(0, 41)}…` : text;
}
