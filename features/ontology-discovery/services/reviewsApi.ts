import { readSession } from "@/features/auth/services/sessionStore";
import type { ConfirmationItem } from "../models/confirmation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ReviewSnapshot = {
  ontologyId: string;
  items: ConfirmationItem[];
  updatedAt: number | null;
};

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;
  return "No pudimos guardar la revisión del mapa.";
}

function asItem(row: ConfirmationItem): ConfirmationItem | null {
  if (!row?.itemId || !row.entityId) return null;
  if (row.itemType !== "entity" && row.itemType !== "attribute" && row.itemType !== "relation") return null;
  if (row.status !== "pending" && row.status !== "confirmed" && row.status !== "rejected") return null;
  return {
    itemId: row.itemId,
    entityId: row.entityId,
    itemType: row.itemType,
    status: row.status,
    suggestion: {
      name: row.suggestion?.name || "",
      type: row.suggestion?.type || "",
      confidence: typeof row.suggestion?.confidence === "number" ? row.suggestion.confidence : 0,
      context: row.suggestion?.context,
      table: row.suggestion?.table,
      column: row.suggestion?.column,
    },
    corrections: row.corrections,
  };
}

export const reviewsApi = {
  list: async (ontologyId: string): Promise<ReviewSnapshot> => {
    const token = readSession()?.token;
    if (!token) return { ontologyId, items: [], updatedAt: null };
    const response = await fetch(`${API_URL}/api/reviews?ontologyId=${encodeURIComponent(ontologyId)}`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error(await readError(response));
    const row = (await response.json()) as ReviewSnapshot;
    return {
      ontologyId: row.ontologyId || ontologyId,
      items: (row.items ?? []).map(asItem).filter((item): item is ConfirmationItem => Boolean(item)),
      updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : null,
    };
  },
  save: async (ontologyId: string, items: ConfirmationItem[]): Promise<ReviewSnapshot> => {
    const token = readSession()?.token;
    if (!token) throw new Error("Inicia sesión para guardar la revisión.");
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ ontologyId, items }),
    });
    if (!response.ok) throw new Error(await readError(response));
    const row = (await response.json()) as ReviewSnapshot;
    return {
      ontologyId: row.ontologyId || ontologyId,
      items: (row.items ?? []).map(asItem).filter((item): item is ConfirmationItem => Boolean(item)),
      updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : null,
    };
  },
};
