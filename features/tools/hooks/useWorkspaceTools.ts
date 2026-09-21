"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToolId } from "../models";
import { toolsApi } from "../services/toolsApi";

export function useWorkspaceTools() {
  const [selectedTools, setSelectedTools] = useState<ToolId[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void toolsApi.load()
      .then((selection) => {
        if (active) setSelectedTools(selection.selectedTools);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No pudimos cargar las herramientas.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (next: ToolId[]) => {
    setSaving(true);
    setError(null);
    try {
      const selection = await toolsApi.save(next);
      setSelectedTools(selection.selectedTools);
      return selection.selectedTools;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "No pudimos guardar las herramientas.";
      setError(message);
      throw cause;
    } finally {
      setSaving(false);
    }
  }, []);

  return { selectedTools, ready, saving, error, save };
}
