import { readSession } from "@/features/auth/services/sessionStore";
import type { DbConnectionConfig, SchemaSnapshot } from "../models/ontology";
import type { ToolId } from "@/features/tools/models";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// The complete chat remains persisted, while inference only needs its latest context.
export const MAX_INFER_HISTORY_TURNS = 6;

export type QueryTable = {
  columns: string[];
  rows: Array<Array<string | number | boolean | null>>;
  rowCount: number;
  truncated: boolean;
};

export type PresentationSpec = {
  tool: ToolId;
  title?: string | null;
  dimensions: string[];
  measures: string[];
  label?: string | null;
  unit?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  origin?: string | null;
  destination?: string | null;
};

export type InferStep = {
  index: number;
  title: string;
  reason: string;
  sql?: string | null;
  table: QueryTable;
  presentation?: PresentationSpec | null;
  error?: string | null;
};

export type InferAskResponse = {
  answer: string;
  steps: InferStep[];
};

export type InferHistoryTurn = {
  role: "user" | "assistant";
  text: string;
};

function connectionPayload(connection: DbConnectionConfig) {
  return {
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    ssl: connection.ssl ?? true,
  };
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload?.detail)) {
    const messages = payload.detail
      .map((issue) => {
        if (!issue || typeof issue !== "object") return null;
        const message = "msg" in issue && typeof issue.msg === "string" ? issue.msg.trim() : "";
        if (!message) return null;
        const location = "loc" in issue && Array.isArray(issue.loc)
          ? issue.loc.filter((part: unknown) => part !== "body").join(" → ")
          : "";
        return location ? `${location}: ${message}` : message;
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length) return messages.join(" ");
  }
  return "No pudimos ejecutar la consulta.";
}

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  if (!token) throw new Error("Inicia sesión para consultar una fuente.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export const queryApi = {
  run: async (connection: DbConnectionConfig, sql: string, sourceId: string, businessId?: string): Promise<QueryTable> => {
    if (!connection.password) throw new Error("Falta la contraseña de la fuente. Vuelve a conectar.");
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/query/run`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          businessId,
          sourceId,
          connection: connectionPayload(connection),
          sql,
          maxRows: 50,
        }),
      });
    } catch {
      throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
    }
    if (!response.ok) throw new Error(await readError(response));
    return response.json() as Promise<QueryTable>;
  },
  introspect: async (connection: DbConnectionConfig, sourceId: string, businessId?: string): Promise<SchemaSnapshot> => {
    if (!connection.password) throw new Error("Falta la contraseña de la fuente. Vuelve a conectar.");
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/query/introspect`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          businessId,
          sourceId,
          connection: connectionPayload(connection),
        }),
      });
    } catch {
      throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
    }
    if (!response.ok) throw new Error(await readError(response));
    return response.json() as Promise<SchemaSnapshot>;
  },
  ask: async (
    connection: DbConnectionConfig,
    question: string,
    options: { sourceId: string; businessId?: string; history?: InferHistoryTurn[]; preferredTools?: ToolId[] },
  ): Promise<InferAskResponse> => {
    if (!connection.password) throw new Error("Falta la contraseña de la fuente. Vuelve a conectar.");
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/query/ask`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          businessId: options?.businessId,
          sourceId: options.sourceId,
          question,
          connection: connectionPayload(connection),
          preferredTools: options.preferredTools ?? [],
          history: (options?.history ?? [])
            .filter((turn) => turn.text.trim())
            .slice(-MAX_INFER_HISTORY_TURNS)
            .map((turn) => ({ ...turn, text: turn.text.trim().slice(0, 4_000) })),
        }),
      });
    } catch {
      throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
    }
    if (!response.ok) throw new Error(await readError(response));
    return response.json() as Promise<InferAskResponse>;
  },
};
