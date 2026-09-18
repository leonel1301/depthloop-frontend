import { readSession } from "@/features/auth/services/sessionStore";
import type { QuerySource } from "./workspaceStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export async function listRemoteSources(): Promise<QuerySource[]> {
  const token = readSession()?.token;
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/api/sources`, { headers: authHeaders() });
    if (!response.ok) return [];
    const rows = (await response.json()) as Array<QuerySource & { config?: QuerySource["config"] }>;
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      engine: row.engine,
      config: row.config,
    }));
  } catch {
    return [];
  }
}

export async function upsertRemoteSource(source: QuerySource) {
  const token = readSession()?.token;
  if (!token) return;
  await fetch(`${API_URL}/api/sources`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(source),
  }).catch(() => undefined);
}

export async function deleteRemoteSource(sourceId: string) {
  const token = readSession()?.token;
  if (!token) return;
  await fetch(`${API_URL}/api/sources/${encodeURIComponent(sourceId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).catch(() => undefined);
}
