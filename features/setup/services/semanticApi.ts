import { readSession } from "@/features/auth/services/sessionStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SemanticKind = "metric" | "rule" | "definition";
export type SemanticStatus = "draft" | "active" | "deprecated";

type SemanticBase = {
  kind: SemanticKind;
  key: string;
  name: string;
  description: string;
  conceptId?: string | null;
  owner?: string | null;
  status: SemanticStatus;
};

export type MetricSpec = SemanticBase & {
  kind: "metric";
  expression: string;
  aggregation: "sum" | "count" | "count_distinct" | "average" | "min" | "max" | "ratio" | "custom";
  filters: string[];
  dimensions: string[];
  unit?: string | null;
};

export type RuleSpec = SemanticBase & {
  kind: "rule";
  condition: string;
  outcome: string;
  severity: "info" | "warning" | "critical";
  exceptions: string[];
};

export type DefinitionSpec = SemanticBase & {
  kind: "definition";
  aliases: string[];
};

export type SemanticSpec = MetricSpec | RuleSpec | DefinitionSpec;

export type SemanticRecord = {
  id: string;
  businessId: string;
  document: SemanticSpec;
  createdAt: string;
  updatedAt: string;
};

export type SemanticConcept = {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  bindings: Array<{ sourceId: string; schema: string; table: string }>;
  fields: Array<{ id: string; name: string; semanticType: string }>;
};

export type ConceptResolution = {
  reference: string;
  matchedBy: "id" | "name" | "alias" | "field" | null;
  score: number;
  concept: SemanticConcept | null;
  objects: SemanticRecord[];
};

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  return typeof payload?.detail === "string" && payload.detail.trim()
    ? payload.detail
    : "No pudimos completar la operación semántica.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!readSession()?.token) throw new Error("Inicia sesión para gestionar el catálogo semántico.");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...init?.headers },
    });
  } catch {
    throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<T>;
}

export const semanticApi = {
  listObjects: () => request<SemanticRecord[]>("/api/semantic/objects"),
  listConcepts: () =>
    request<{ ontologyId: string | null; concepts: SemanticConcept[] }>("/api/semantic/concepts"),
  saveObject: (payload: SemanticSpec) =>
    request<SemanticRecord>("/api/semantic/objects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeObject: (id: string) =>
    request<void>(`/api/semantic/objects/${encodeURIComponent(id)}`, { method: "DELETE" }),
  resolve: (references: string[], sourceId?: string) =>
    request<{ ontologyId: string; resolutions: ConceptResolution[] }>("/api/semantic/resolve", {
      method: "POST",
      body: JSON.stringify({ references, sourceId }),
    }),
};
