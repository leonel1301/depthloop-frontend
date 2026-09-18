import type { ConfirmationItem } from "../models/confirmation";
import type { ConnectedSource, DbConnectionConfig, OntologyDiscoveryResult } from "../models/ontology";

const WORKSPACE_KEY = "depthloop.workspace";
const SECRETS_KEY = "depthloop.querySecrets";

export type QuerySource = {
  id: string;
  kind: ConnectedSource["kind"];
  label: string;
  engine?: string;
  config: Omit<DbConnectionConfig, "password" | "apiKey">;
};

export type WorkspaceSnapshot = {
  businessId: string;
  ontology: OntologyDiscoveryResult | null;
  sources: ConnectedSource[];
  querySources: QuerySource[];
  confirmations: ConfirmationItem[];
};

type SecretMap = Record<string, { password?: string; apiKey?: string }>;

export function createBusinessId() {
  const bytes = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `NEG-${bytes.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function publicSource(source: ConnectedSource): ConnectedSource {
  if (!source.config) return source;
  const { password: _password, apiKey: _apiKey, ...config } = source.config;
  return { ...source, config };
}

export function readWorkspace(): WorkspaceSnapshot {
  const fallback: WorkspaceSnapshot = {
    businessId: createBusinessId(),
    ontology: null,
    sources: [],
    querySources: [],
    confirmations: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSnapshot>;
    return {
      businessId: parsed.businessId || fallback.businessId,
      ontology: parsed.ontology ?? null,
      sources: parsed.sources ?? [],
      querySources: parsed.querySources ?? [],
      confirmations: parsed.confirmations ?? [],
    };
  } catch {
    return fallback;
  }
}

export function writeWorkspace(snapshot: WorkspaceSnapshot) {
  if (typeof window === "undefined") return;
  const payload: WorkspaceSnapshot = {
    ...snapshot,
    sources: snapshot.sources.map(publicSource),
  };
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(payload));
}

export function bindWorkspaceToBusiness(businessId: string): WorkspaceSnapshot {
  const current = readWorkspace();
  if (current.businessId === businessId) return current;
  const owned = current.ontology?.businessId === businessId;
  const next: WorkspaceSnapshot = owned
    ? { ...current, businessId }
    : { businessId, ontology: null, sources: [], querySources: [], confirmations: [] };
  writeWorkspace(next);
  return next;
}

export function readSecrets(): SecretMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(SECRETS_KEY) || "{}") as SecretMap;
  } catch {
    return {};
  }
}

export function writeSecret(sourceId: string, secret: { password?: string; apiKey?: string }) {
  if (typeof window === "undefined") return;
  const next = { ...readSecrets(), [sourceId]: secret };
  sessionStorage.setItem(SECRETS_KEY, JSON.stringify(next));
}

export function clearSecret(sourceId: string) {
  if (typeof window === "undefined") return;
  const next = { ...readSecrets() };
  delete next[sourceId];
  sessionStorage.setItem(SECRETS_KEY, JSON.stringify(next));
}

export function connectionForQuery(source: QuerySource): DbConnectionConfig | null {
  const secret = readSecrets()[source.id];
  if (!secret?.password && source.kind === "database") return null;
  return {
    ...source.config,
    password: secret?.password,
    apiKey: secret?.apiKey,
  };
}
