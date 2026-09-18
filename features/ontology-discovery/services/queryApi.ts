import type { DbConnectionConfig, SchemaSnapshot } from "../models/ontology";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type QueryTable = {
  columns: string[];
  rows: Array<Array<string | number | boolean | null>>;
  rowCount: number;
  truncated: boolean;
};

export type InferStep = {
  index: number;
  title: string;
  reason: string;
  sql?: string | null;
  table: QueryTable;
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
  return "No pudimos ejecutar la consulta.";
}

export const queryApi = {
  run: async (connection: DbConnectionConfig, sql: string, businessId?: string): Promise<QueryTable> => {
    if (!connection.password) throw new Error("Falta la contraseña de la fuente. Vuelve a conectar.");
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/query/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
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
  introspect: async (connection: DbConnectionConfig, businessId?: string): Promise<SchemaSnapshot> => {
    if (!connection.password) throw new Error("Falta la contraseña de la fuente. Vuelve a conectar.");
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/query/introspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
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
    options?: { businessId?: string; history?: InferHistoryTurn[] },
  ): Promise<InferAskResponse> => {
    if (!connection.password) throw new Error("Falta la contraseña de la fuente. Vuelve a conectar.");
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/query/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: options?.businessId,
          question,
          connection: connectionPayload(connection),
          history: options?.history ?? [],
        }),
      });
    } catch {
      throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
    }
    if (!response.ok) throw new Error(await readError(response));
    return response.json() as Promise<InferAskResponse>;
  },
};
