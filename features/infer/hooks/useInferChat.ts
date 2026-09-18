"use client";

import { useEffect, useState } from "react";
import { queryApi, type InferHistoryTurn, type InferStep } from "@/features/ontology-discovery/services/queryApi";
import type { DbConnectionConfig } from "@/features/ontology-discovery/models/ontology";
import type { InferMessage, InferThread } from "../models";
import { chatsApi } from "../services/chatsApi";
import {
  clearLocalThreads,
  emptyThread,
  persistableMessages,
  readLocalThreads,
  titleFromMessages,
} from "../services/chatStore";

function nextId() {
  return globalThis.crypto?.randomUUID?.() ?? `m-${Date.now()}-${Math.random()}`;
}

async function persistThread(thread: InferThread) {
  if (!persistableMessages(thread.messages).length) return;
  await chatsApi.upsert(thread);
}

export function useInferChat() {
  const [threads, setThreads] = useState<InferThread[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let loaded = await chatsApi.list();
        if (!loaded.length) {
          const local = readLocalThreads();
          if (local.length) {
            loaded = [];
            for (const thread of local) {
              loaded.push(await chatsApi.upsert(thread));
            }
            clearLocalThreads();
          }
        } else {
          clearLocalThreads();
        }
        if (cancelled) return;
        const resolved = loaded.length ? loaded : [emptyThread()];
        setThreads(resolved);
        setActiveId(resolved[0].id);
      } catch {
        if (cancelled) return;
        const fallback = [emptyThread()];
        setThreads(fallback);
        setActiveId(fallback[0].id);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = threads.find((thread) => thread.id === activeId) ?? threads[0];
  const messages = active?.messages ?? [];

  const updateActive = (updater: (current: InferThread) => InferThread) => {
    setThreads((current) =>
      current.map((thread) => (thread.id === (active?.id ?? activeId) ? updater(thread) : thread)),
    );
  };

  const createChat = () => {
    const blank = threads.find((thread) => thread.messages.length === 0);
    if (blank) {
      setActiveId(blank.id);
      setError(null);
      return;
    }
    const next = emptyThread();
    setThreads((current) => [next, ...current]);
    setActiveId(next.id);
    setError(null);
  };

  const selectChat = (id: string) => {
    setActiveId(id);
    setError(null);
  };

  const removeChat = (id: string) => {
    void chatsApi.remove(id).catch(() => undefined);
    setThreads((current) => {
      const next = current.filter((thread) => thread.id !== id);
      const resolved = next.length ? next : [emptyThread()];
      if (id === activeId) setActiveId(resolved[0].id);
      return resolved;
    });
    setError(null);
  };

  const send = async (
    question: string,
    connection: DbConnectionConfig,
    businessId?: string,
  ) => {
    const user: InferMessage = { id: nextId(), role: "user", text: question };
    const pending: InferMessage = { id: nextId(), role: "assistant", text: "", pending: true };
    const history: InferHistoryTurn[] = persistableMessages(messages)
      .map((message) => ({ role: message.role, text: message.text }))
      .filter((turn) => turn.text.trim());
    setError(null);
    setLoading(true);
    updateActive((thread) => {
      const nextMessages = [...thread.messages, user, pending];
      return {
        ...thread,
        title: titleFromMessages(nextMessages),
        updatedAt: Date.now(),
        messages: nextMessages,
      };
    });
    try {
      const result = await queryApi.ask(connection, question, { businessId, history });
      const steps: InferStep[] = result.steps ?? [];
      let saved: InferThread | null = null;
      updateActive((thread) => {
        saved = {
          ...thread,
          updatedAt: Date.now(),
          messages: thread.messages.map((message) =>
            message.id === pending.id
              ? { ...message, pending: false, text: result.answer, steps }
              : message,
          ),
        };
        return saved;
      });
      if (saved) await persistThread(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos interpretar la pregunta.";
      setError(message);
      let saved: InferThread | null = null;
      updateActive((thread) => {
        saved = {
          ...thread,
          messages: thread.messages.filter((item) => item.id !== pending.id),
        };
        return saved;
      });
      if (saved) await persistThread(saved).catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  return {
    ready,
    threads,
    activeId: active?.id ?? "",
    messages,
    loading,
    error,
    send,
    createChat,
    selectChat,
    removeChat,
  };
}
