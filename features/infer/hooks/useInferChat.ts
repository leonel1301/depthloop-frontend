"use client";

import { useEffect, useState } from "react";
import { queryApi, type InferHistoryTurn, type InferStep } from "@/features/ontology-discovery/services/queryApi";
import type { DbConnectionConfig } from "@/features/ontology-discovery/models/ontology";
import type { InferMessage, InferThread } from "../models";
import {
  emptyThread,
  persistableMessages,
  readThreads,
  titleFromMessages,
  writeThreads,
} from "../services/chatStore";

function nextId() {
  return globalThis.crypto?.randomUUID?.() ?? `m-${Date.now()}-${Math.random()}`;
}

export function useInferChat() {
  const [threads, setThreads] = useState<InferThread[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readThreads();
    setThreads(stored);
    setActiveId(stored[0].id);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeThreads(threads);
  }, [ready, threads]);

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
      updateActive((thread) => ({
        ...thread,
        updatedAt: Date.now(),
        messages: thread.messages.map((message) =>
          message.id === pending.id
            ? { ...message, pending: false, text: result.answer, steps }
            : message,
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos interpretar la pregunta.";
      setError(message);
      updateActive((thread) => ({
        ...thread,
        messages: thread.messages.filter((item) => item.id !== pending.id),
      }));
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
