"use client";

import { useEffect, useState } from "react";
import type { ToolId, ToolRecommendation } from "../models";
import { toolsApi } from "../services/toolsApi";

const MIN_DRAFT_LENGTH = 8;
const DEBOUNCE_MS = 420;

export function useToolRecommendations(draft: string, availableTools: ToolId[], disabled = false) {
  const [recommendations, setRecommendations] = useState<ToolRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const availableKey = availableTools.join("|");

  useEffect(() => {
    const question = draft.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (disabled || question.length < MIN_DRAFT_LENGTH || !availableTools.length) {
        setRecommendations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      void toolsApi.recommend(question, availableTools, controller.signal)
        .then(setRecommendations)
        .catch((cause: unknown) => {
          if (!(cause instanceof DOMException && cause.name === "AbortError")) setRecommendations([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // availableKey intentionally provides a stable dependency for the ordered selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, availableKey, disabled]);

  return { recommendations, loading };
}
